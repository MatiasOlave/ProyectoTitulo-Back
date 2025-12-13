import { AppDataSource } from '../config/database';
import { ClassBookEntry } from '../entities/academic/class-book-entry.entity';
import { StudentObservation } from '../entities/academic/student-observation.entity';
import { Attendance } from '../entities/attendance/attendance.entity';
import { CreateClassBookEntryDTO, ClassBookFiltersDTO, CreateObservationDTO, UpdateClassBookEntryDTO } from '../schemas/classBook.schema';
import { User } from '../entities/auth/user.entity';
import { FindOptionsWhere, Between } from 'typeorm';
import { pdfService } from './pdf.service';

export const classBookService = {
    getRepository() {
        return AppDataSource.getRepository(ClassBookEntry);
    },

    getObservationRepository() {
        return AppDataSource.getRepository(StudentObservation);
    },

    getAttendanceRepository() {
        return AppDataSource.getRepository(Attendance);
    },

    async createEntry(companyId: string, teacherId: string, data: CreateClassBookEntryDTO) {
        // Calculate Attendance Summary Automatically
        const attendanceRepo = this.getAttendanceRepository();
        const startOfDay = new Date(data.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(data.date);
        endOfDay.setHours(23, 59, 59, 999);

        const attendances = await attendanceRepo.find({
            where: {
                companyId,
                levelId: data.levelId,
                date: data.date as any // Or filter by range if needed depending on DB type
                // Typically date column is date type, so exact match might generic issue. 
                // Better to use range or exact string if standard. Assuming date object works or string matches.
            }
        });

        const totalStudents = attendances.length; // Or fetch from Level capacity/enrollment
        const studentsPresent = attendances.filter(a => a.status === 'present' || a.status === 'late').length;
        const studentsAbsent = attendances.filter(a => a.status === 'absent').length;
        const studentsLate = attendances.filter(a => a.status === 'late').length;
        const percentage = totalStudents > 0 ? (studentsPresent / totalStudents) * 100 : 0;

        const repository = this.getRepository();
        const entry = repository.create({
            companyId,
            teacherId,
            levelId: data.levelId,
            date: data.date,
            activitiesPerformed: data.activitiesPerformed,
            resourcesUsed: data.resourcesUsed,
            teachingMethodology: data.teachingMethodology || '',
            learningEnvironment: data.learningEnvironment || '',
            achievements: data.achievements || '',
            challenges: data.challenges || '',
            incidents: data.incidents || '',
            specialActivities: data.specialActivities || '',
            coreLearningAreas: data.coreLearningAreas || null,
            status: 'draft',
            academicYear: new Date().getFullYear().toString(),
            totalStudents: totalStudents > 0 ? totalStudents : 0, // Fallback
            studentsPresent,
            studentsAbsent,
            studentsLate,
            attendancePercentage: parseFloat(percentage.toFixed(2))
        });

        return await repository.save(entry);
    },

    async updateEntry(id: string, companyId: string, data: UpdateClassBookEntryDTO) {
        const repo = this.getRepository();
        const entry = await repo.findOne({ where: { id, companyId } });
        if (!entry) throw new Error('Entrada no encontrada');
        if (entry.isLocked) throw new Error('La entrada está bloqueada y no se puede editar');

        repo.merge(entry, data);
        return await repo.save(entry);
    },

    async listEntries(companyId: string, userId: string, userRoles: string[], filters: ClassBookFiltersDTO) {
        const queryBuilder = this.getRepository().createQueryBuilder('entry')
            .leftJoinAndSelect('entry.level', 'level')
            .leftJoinAndSelect('entry.teacher', 'teacher')
            .where('entry.company_id = :companyId', { companyId });

        // Role Logic: Admin/Director can see all. Teacher sees own.
        const isAdminOrDirector = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');
        if (!isAdminOrDirector) {
            queryBuilder.andWhere('entry.teacher_id = :userId', { userId });
        } else if (filters.teacherId) {
            queryBuilder.andWhere('entry.teacher_id = :teacherId', { teacherId: filters.teacherId });
        }

        if (filters.startDate && filters.endDate) {
            queryBuilder.andWhere('entry.date BETWEEN :startDate AND :endDate', {
                startDate: filters.startDate,
                endDate: filters.endDate
            });
        }

        if (filters.levelId) {
            queryBuilder.andWhere('entry.level_id = :levelId', { levelId: filters.levelId });
        }

        return await queryBuilder
            .orderBy('entry.date', 'DESC')
            .addOrderBy('entry.created_at', 'DESC')
            .getMany();
    },

    async getEntryById(id: string, companyId: string) {
        const entry = await this.getRepository().findOne({
            where: { id, companyId },
            relations: ['level', 'teacher', 'studentObservations', 'studentObservations.student']
        });
        if (!entry) throw new Error('Entrada no encontrada');
        return entry;
    },

    async addObservation(entryId: string, companyId: string, data: CreateObservationDTO) {
        const entry = await this.getEntryById(entryId, companyId);
        if (entry.isLocked) throw new Error('Entrada bloqueada');

        const obsRepo = this.getObservationRepository();
        const observation = obsRepo.create({
            classBookEntry: entry,
            studentId: data.studentId,
            observation: data.observation,
            category: data.category,
            isPositive: data.isPositive,
            requiresFollowUp: data.requiresFollowUp,
            isSharedWithGuardian: data.isSharedWithGuardian,
            sharedAt: data.isSharedWithGuardian ? new Date() : undefined
        } as any);

        return await obsRepo.save(observation);
    },

    async lockEntry(id: string, companyId: string, userId: string) {
        const repo = this.getRepository();
        const entry = await repo.findOne({ where: { id, companyId } });
        if (!entry) throw new Error('Entrada no encontrada');

        entry.isLocked = true;
        entry.lockedAt = new Date();
        entry.lockedById = userId;
        entry.status = 'locked';

        return await repo.save(entry);
    },

    async reviewEntry(id: string, companyId: string, reviewerId: string, notes: string) {
        const repo = this.getRepository();
        const entry = await repo.findOne({ where: { id, companyId } });
        if (!entry) throw new Error('Entrada no encontrada');

        entry.reviewedAt = new Date();
        entry.reviewedById = reviewerId;
        entry.reviewNotes = notes;

        return await repo.save(entry);
    },

    async generatePDF(id: string, companyId: string) {
        const entry = await this.getEntryById(id, companyId);
        return pdfService.generateClassBookSummary(entry);
    },
    async attachFiles(id: string, companyId: string, photos: string[], documents: string[]) {
        const repo = this.getRepository();
        const entry = await repo.findOne({ where: { id, companyId } });
        if (!entry) throw new Error('Entrada no encontrada');

        const currentPhotos = Array.isArray(entry.photos) ? entry.photos : [];
        const currentDocuments = Array.isArray(entry.documents) ? entry.documents : [];

        entry.photos = [...currentPhotos, ...photos];
        entry.documents = [...currentDocuments, ...documents];

        return await repo.save(entry);
    }
};
