import { AppDataSource } from '../config/database';
import { ActivityPlanning } from '../entities/academic/activity-planning.entity';
import { PlanningReview } from '../entities/academic/planning-review.entity';
import { User } from '../entities/auth/user.entity';

export class PlanningService {
    private planningRepo = AppDataSource.getRepository(ActivityPlanning);
    private reviewRepo = AppDataSource.getRepository(PlanningReview);
    private userRepo = AppDataSource.getRepository(User);

    async create(companyId: string, teacherId: string, data: any) {
        // Find user to associate
        const teacher = await this.userRepo.findOneBy({ id: teacherId });
        if (!teacher) throw new Error('Teacher not found');

        const planning = this.planningRepo.create({
            ...data,
            companyId,
            teacherId,
            status: 'draft',
            academicYear: new Date().getFullYear().toString(), // Default to current year if not provided
            coreLearningAreas: data.coreLearningAreas || [],
            activities: data.activities || [],
            revisionNumber: 1,
            isTemplate: data.isTemplate || false,
            templateName: data.templateName || (data.isTemplate ? data.title : null)
        });

        return await this.planningRepo.save(planning);
    }

    async findAll(companyId: string, filters: any = {}) {
        const query = this.planningRepo.createQueryBuilder('planning')
            .leftJoinAndSelect('planning.teacher', 'teacher')
            .leftJoinAndSelect('planning.level', 'level')
            .where('planning.companyId = :companyId', { companyId });

        if (filters.status) {
            query.andWhere('planning.status = :status', { status: filters.status });
        }

        if (filters.levelId) {
            query.andWhere('planning.levelId = :levelId', { levelId: filters.levelId });
        }

        if (filters.teacherId) {
            query.andWhere('planning.teacherId = :teacherId', { teacherId: filters.teacherId });
        }

        // Order by most recent
        query.orderBy('planning.created_at', 'DESC');

        return await query.getMany();
    }

    async findById(id: string, companyId: string) {
        const planning = await this.planningRepo.findOne({
            where: { id, companyId },
            relations: ['teacher', 'level', 'reviews', 'reviews.reviewer']
        });

        if (!planning) throw new Error('Planning not found');

        // Increment view count
        planning.views += 1;
        planning.lastViewedAt = new Date();
        await this.planningRepo.save(planning);

        return planning;
    }

    async update(id: string, companyId: string, userId: string, data: any) {
        const planning = await this.findById(id, companyId);

        // Only allow update if draft or rejected
        if (!['draft', 'rejected', 'request_changes'].includes(planning.status)) {
            throw new Error('Solo se pueden editar planificaciones en borrador o rechazadas');
        }

        // Verify ownership
        if (planning.teacherId !== userId) {
            throw new Error('No tienes permiso para editar esta planificación');
        }

        // If it was rejected, increment revision number on update
        if (planning.status === 'rejected' || planning.status === 'request_changes') {
            planning.revisionNumber += 1;
            planning.status = 'draft'; // Reset to draft on edit
        }

        Object.assign(planning, data);
        return await this.planningRepo.save(planning);
    }

    async submit(id: string, companyId: string, userId: string) {
        const planning = await this.findById(id, companyId);

        if (planning.status !== 'draft') {
            throw new Error('Solo se pueden enviar planificaciones en borrador');
        }

        if (planning.teacherId !== userId) {
            throw new Error('No tienes permiso para enviar esta planificación');
        }

        planning.status = 'submitted';
        planning.submittedAt = new Date();

        return await this.planningRepo.save(planning);
    }

    async review(id: string, companyId: string, reviewerId: string, action: string, feedback?: string) {
        const planning = await this.findById(id, companyId);

        if (planning.status !== 'submitted') {
            throw new Error('Esta planificación no está pendiente de revisión');
        }

        const review = this.reviewRepo.create({
            planning: planning,
            reviewer: { id: reviewerId } as any,
            action,
            feedback: feedback || ''
        });
        await this.reviewRepo.save(review);

        // Update planning status
        if (action === 'approve') {
            planning.status = 'approved';
            planning.approvedAt = new Date();
            planning.approvedById = reviewerId;
        } else if (action === 'reject') {
            planning.status = 'rejected';
        } else if (action === 'request_changes') {
            planning.status = 'request_changes';
        }

        planning.reviewedAt = new Date();
        planning.reviewedById = reviewerId;
        planning.feedback = feedback || '';

        return await this.planningRepo.save(planning);
    }

    async delete(id: string, companyId: string) {
        const planning = await this.findById(id, companyId);
        return await this.planningRepo.softRemove(planning);
    }

    async duplicate(id: string, companyId: string, userId: string) {
        const original = await this.findById(id, companyId);

        const newPlanning = this.planningRepo.create({
            ...original,
            id: undefined, // Create new ID
            title: `${original.title} (Copia)`,
            teacherId: userId, // Assign to current user
            status: 'draft',
            createdAt: undefined,
            updatedAt: undefined,
            submittedAt: null as any,
            reviewedAt: null as any,
            approvedAt: null as any,
            reviews: [],
            revisionNumber: 1,
            views: 0
        });

        return await this.planningRepo.save(newPlanning);
    }
    async attachFiles(id: string, companyId: string, files: Express.Multer.File[]) {
        const planning = await this.findById(id, companyId);

        // Ensure attachments is array
        const currentAttachments = Array.isArray(planning.attachments) ? planning.attachments : [];

        const newAttachments = files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
            uploadedAt: new Date()
        }));

        planning.attachments = [...currentAttachments, ...newAttachments];
        return await this.planningRepo.save(planning);
    }

    async findActivePlanning(companyId: string, teacherId: string | null, levelId: string, date: string | Date) {
        // Calculate date buffer: allow finding planning checking 1 day before start
        // e.g. User is on 25th, Planning starts 26th. 
        // We want 26th <= (25th + 1 day).

        const dateStr = date instanceof Date
            ? date.toISOString().split('T')[0]
            : date;

        const dateObj = new Date(dateStr);
        // Add 1 day safely using UTC
        dateObj.setUTCDate(dateObj.getUTCDate() + 1);
        const bufferDateStr = dateObj.toISOString().split('T')[0];

        // Find an APPROVED planning that covers the given date (with buffer)
        const query = this.planningRepo.createQueryBuilder('planning')
            .where('planning.companyId = :companyId', { companyId })
            .andWhere('planning.levelId = :levelId', { levelId })
            .andWhere('planning.status = :status', { status: 'approved' })
            .andWhere('planning.startDate <= :bufferDate', { bufferDate: bufferDateStr })
            .andWhere('planning.endDate >= :date', { date: dateStr });

        if (teacherId) {
            query.andWhere('planning.teacherId = :teacherId', { teacherId });
        }

        query.orderBy('planning.startDate', 'DESC');

        return await query.getOne();
    }
}

export const planningService = new PlanningService();
