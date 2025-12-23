import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { AppDataSource } from '../config/database';
import { Company } from '../entities/companies/company.entity';
import { User } from '../entities/auth/user.entity';
import { BillingPeriod } from '../entities/companies/billing-periods.entity';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware as any);


// Check superadmin permission
router.use((req: any, res: Response, next: any) => {
    const allowedEmails = (process.env.SUPERADMIN_EMAILS || '').split(',').map(e => e.trim());

    if (!req.user?.email || !allowedEmails.includes(req.user.email)) {
        return res.status(403).json({ message: 'Acceso denegado: Solo Superadmin' });
    }

    next();
});

// GET dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const companyRepo = AppDataSource.getRepository(Company);
        const userRepo = AppDataSource.getRepository(User);
        const billingRepo = AppDataSource.getRepository(BillingPeriod);

        // 1. Total Companies
        const totalCompanies = await companyRepo.count();

        // 2. Active Companies
        const activeCompanies = await companyRepo.count({ where: { isActive: true } });

        // 3. Total Users
        const totalUsers = await userRepo.count();

        // 4. Total Revenue (sum of paid billing periods)
        const revenueResult = await billingRepo
            .createQueryBuilder('billing')
            .select('SUM(billing.total_amount)', 'total')
            .where('billing.status = :status', { status: 'paid' })
            .getRawOne();

        const totalRevenue = parseFloat(revenueResult?.total || '0');

        res.json({
            companies: {
                total: totalCompanies,
                active: activeCompanies
            },
            users: {
                total: totalUsers
            },
            revenue: {
                total: totalRevenue
            }
        });
    } catch (error) {
        console.error('[Superadmin] Error fetching stats:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
});

// GET all companies with student count
router.get('/companies', async (req: Request, res: Response) => {
    try {
        const companies = await AppDataSource.getRepository(Company)
            .createQueryBuilder('company')
            .leftJoinAndSelect('company.users', 'users')
            .leftJoin('students', 'student', 'student.company_id = company.id AND student.deleted_at IS NULL')
            .leftJoin('company.city', 'city')
            .leftJoin('company.subscriptions', 'subscription')
            .leftJoin('subscription.billingPeriods', 'billing', 'billing.status IN (:...debtStatuses)', { debtStatuses: ['pending', 'overdue'] })
            .select([
                'company.id',
                'company.name',
                'company.legalName',
                'company.rut',
                'company.email',
                'company.phone',
                'company.address',
                'company.isActive',
                'company.createdAt',
                'city.name'
            ])
            .addSelect('COUNT(DISTINCT student.id)', 'studentCount')
            .addSelect('COUNT(DISTINCT users.id)', 'userCount')
            .addSelect('SUM(billing.total_amount)', 'totalDebt')
            .groupBy('company.id')
            .getRawAndEntities();

        const companiesWithCounts = companies.entities.map((company, index) => ({
            ...company,
            cityName: companies.raw[index].city_name,
            studentCount: parseInt(companies.raw[index].studentCount) || 0,
            userCount: parseInt(companies.raw[index].userCount) || 0,
            totalDebt: parseInt(companies.raw[index].totalDebt) || 0
        }));

        res.json(companiesWithCounts);
    } catch (error) {
        console.error('[Superadmin] Error fetching companies:', error);
        res.status(500).json({ message: 'Error al obtener jardines', error: (error as Error).message });
    }
});

// PATCH - Toggle company active status
router.patch('/companies/:id/toggle-status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const companyRepo = AppDataSource.getRepository(Company);

        const company = await companyRepo.findOne({ where: { id } });
        if (!company) {
            return res.status(404).json({ message: 'Jardín no encontrado' });
        }

        company.isActive = !company.isActive;
        await companyRepo.save(company);

        res.json({ message: 'Estado actualizado', company });
    } catch (error) {
        console.error('[Superadmin] Error toggling company status:', error);
        res.status(500).json({ message: 'Error al cambiar estado' });
    }
});

export default router;
