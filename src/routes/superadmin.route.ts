import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { AppDataSource } from '../config/database';
import { Company } from '../entities/companies/company.entity';

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

// GET all companies with student count
router.get('/companies', async (req: Request, res: Response) => {
    try {
        const companies = await AppDataSource.getRepository(Company)
            .createQueryBuilder('company')
            .leftJoinAndSelect('company.users', 'users')
            .leftJoin('students', 'student', 'student.company_id = company.id AND student.deleted_at IS NULL')
            .select([
                'company.id',
                'company.name',
                'company.rut',
                'company.email',
                'company.phone',
                'company.isActive',
                'company.createdAt'
            ])
            .addSelect('COUNT(DISTINCT student.id)', 'studentCount')
            .addSelect('COUNT(DISTINCT users.id)', 'userCount')
            .groupBy('company.id')
            .getRawAndEntities();

        const companiesWithCounts = companies.entities.map((company, index) => ({
            ...company,
            studentCount: parseInt(companies.raw[index].studentCount) || 0,
            userCount: parseInt(companies.raw[index].userCount) || 0
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
