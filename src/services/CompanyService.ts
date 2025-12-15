import { AppDataSource } from '../config/database';
import { Company } from '../entities/companies/company.entity';
import { CreateCompanyInput } from '../schemas/company.schema';
import { Student } from '../entities/students/student.entity';
import { User } from '../entities/auth/user.entity';
import { Route } from '../entities/transport/route.entity';
import { AttendanceAlert } from '../entities/attendance/attendance-alert.entity';
import { DriverDocumentAlert } from '../entities/transport/driver-document-alert.entity';
import { ClassBookEntry } from '../entities/academic/class-book-entry.entity';

export class CompanyService {
    private companyRepository = AppDataSource.getRepository(Company);

    async create(data: CreateCompanyInput): Promise<Company> {
        console.log('[CompanyService] create called with data:', JSON.stringify(data, null, 2));

        const existingCompany = await this.companyRepository.findOne({
            where: [{ rut: data.rut }, { email: data.email }],
        });

        if (existingCompany) {
            console.log('[CompanyService] Company already exists:', existingCompany.rut);
            throw new Error('Company with this RUT or Email already exists');
        }

        const company = this.companyRepository.create(data);
        const savedCompany = await this.companyRepository.save(company);
        console.log('[CompanyService] Company saved successfully:', savedCompany.id);
        return savedCompany;
    }

    async findAll(): Promise<Company[]> {
        return await this.companyRepository.createQueryBuilder('company')
            .leftJoinAndSelect('company.city', 'city')
            .orderBy('company.createdAt', 'DESC')
            .getMany();
    }

    async findById(id: string): Promise<Company | null> {
        return await this.companyRepository.createQueryBuilder('company')
            .leftJoinAndSelect('company.city', 'city')
            .leftJoinAndSelect('city.region', 'region')
            .leftJoinAndSelect('region.country', 'country')
            .leftJoinAndSelect('company.subscriptions', 'subscriptions')
            .leftJoinAndSelect('subscriptions.subscriptionPlan', 'plan')
            .where('company.id = :id', { id })
            .getOne();
    }

    async update(id: string, data: Partial<CreateCompanyInput>): Promise<Company | null> {
        const company = await this.findById(id);
        if (!company) {
            return null;
        }

        if (data.cityId) {
            // TypeORM fix: If 'city' relation is loaded, modifying 'cityId' via merge is ignored.
            // We must explicitly update the relation object or clear it.
            // Casting to any to avoid fetching the full City entity just for the reference
            company.city = { id: data.cityId } as any;
        }

        this.companyRepository.merge(company, data);
        return await this.companyRepository.save(company);
    }

    async getStatistics(companyId: string) {
        let activeStudents = 0;
        try {
            activeStudents = await AppDataSource.getRepository(Student)
                .createQueryBuilder('student')
                .where('student.companyId = :companyId', { companyId })
                .andWhere('student.status = :status', { status: 'active' })
                .getCount();
        } catch (e: any) {
            console.error('Error fetching activeStudents:', e);
            throw new Error('Error fetching activeStudents: ' + e.message);
        }

        let activeUsers = 0;
        try {
            activeUsers = await AppDataSource.getRepository(User)
                .createQueryBuilder('user')
                .where('user.companyId = :companyId', { companyId })
                .andWhere('user.isActive = :isActive', { isActive: true })
                .getCount();
        } catch (e: any) {
            console.error('Error fetching activeUsers:', e);
            throw new Error('Error fetching activeUsers: ' + e.message);
        }

        let activeRoutes = 0;
        try {
            activeRoutes = await AppDataSource.getRepository(Route)
                .createQueryBuilder('route')
                .where('route.companyId = :companyId', { companyId })
                .andWhere('route.status = :status', { status: 'active' })
                .getCount();
        } catch (e: any) {
            console.error('Error fetching activeRoutes:', e);
            throw new Error('Error fetching activeRoutes: ' + e.message);
        }

        let totalAlerts = 0;
        try {
            const pendingAttendanceAlerts = await AppDataSource.getRepository(AttendanceAlert)
                .createQueryBuilder('alert')
                .where('alert.companyId = :companyId', { companyId })
                .andWhere('alert.status = :status', { status: 'active' })
                .getCount();

            const pendingDocAlerts = await AppDataSource.getRepository(DriverDocumentAlert)
                .createQueryBuilder('alert')
                .where('alert.companyId = :companyId', { companyId })
                .andWhere('alert.isActive = :isActive', { isActive: true })
                .andWhere('alert.resolved = :resolved', { resolved: false })
                .getCount();

            totalAlerts = pendingAttendanceAlerts + pendingDocAlerts;
        } catch (e: any) {
            console.error('Error fetching alerts:', e);
            throw new Error('Error fetching alerts: ' + e.message);
        }

        let levelOccupation: any[] = [];
        try {
            levelOccupation = await AppDataSource.getRepository(Student)
                .createQueryBuilder('student')
                .leftJoin('student.level', 'level')
                .select('level.name', 'levelName')
                .addSelect('COUNT(student.id)', 'count')
                .where('student.companyId = :companyId', { companyId })
                .andWhere('student.status = :status', { status: 'active' })
                .andWhere('student.levelId IS NOT NULL')
                .groupBy('level.name')
                .getRawMany();
        } catch (e: any) {
            console.error('Error fetching levelOccupation:', e);
            throw new Error('Error fetching levelOccupation: ' + e.message);
        }

        let averageAttendance = 0;
        try {
            const attendanceStats = await AppDataSource.getRepository(ClassBookEntry)
                .createQueryBuilder('entry')
                .select('AVG(entry.attendancePercentage)', 'averageAttendance')
                .where('entry.companyId = :companyId', { companyId })
                .getRawOne();

            const avg = attendanceStats ? parseFloat(attendanceStats.averageAttendance || '0') : 0;
            averageAttendance = Math.round(avg * 10) / 10;
        } catch (e: any) {
            console.error('Error fetching attendanceStats:', e);
            throw new Error('Error fetching attendanceStats: ' + e.message);
        }

        return {
            activeStudents,
            activeUsers,
            activeRoutes,
            totalAlerts,
            levelOccupation: levelOccupation.map(l => ({ name: l.levelName, count: parseInt(l.count) })),
            averageAttendance
        };
    }

    async softDelete(id: string): Promise<boolean> {
        return await AppDataSource.transaction(async transactionalEntityManager => {
            const company = await transactionalEntityManager.findOne(Company, { where: { id } });
            if (!company) {
                return false;
            }

            // 1. Soft Delete Company (updates deletedAt)
            await transactionalEntityManager.softDelete(Company, id);

            // 2. Disable Users (Prevent access)
            await transactionalEntityManager.update(User,
                { companyId: id },
                { isActive: false }
            );

            return true;
        });
    }
}
