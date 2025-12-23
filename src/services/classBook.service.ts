import { AppDataSource } from '../config/database';
import { ClassBookEntry } from '../entities/academic/class-book-entry.entity';
import { StudentObservation } from '../entities/academic/student-observation.entity';
import { Attendance } from '../entities/attendance/attendance.entity';
import { CreateClassBookEntryDTO, ClassBookFiltersDTO, CreateObservationDTO, UpdateClassBookEntryDTO } from '../schemas/classBook.schema';
import { User } from '../entities/auth/user.entity';
import { FindOptionsWhere, Between, IsNull } from 'typeorm';
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
        // Validate Level Ownership
        const Level = (await import('../entities/students/level.entity')).Level;
        const levelRepo = AppDataSource.getRepository(Level);
        const level = await levelRepo.findOne({ where: { id: data.levelId, companyId } });
        if (!level) throw new Error('Nivel no encontrado o no pertenece a la compañía');

        // Calculate Attendance Summary Automatically
        const attendanceRepo = this.getAttendanceRepository();
        const startOfDay = new Date(data.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(data.date);
        endOfDay.setHours(23, 59, 59, 999);

        const attendances: Attendance[] = []; // Strict isolation: New entries start empty.
        // Legacy fetching removed to prevent linking to unrelated attendance records.

        const totalStudents = attendances.length; // Or fetch from Level capacity/enrollment
        const studentsPresent = attendances.filter(a => a.status === 'present' || a.status === 'late').length;
        const studentsAbsent = attendances.filter(a => a.status === 'absent').length;
        const studentsLate = attendances.filter(a => a.status === 'late').length;
        const studentsJustified = attendances.filter(a => a.status === 'excused').length;
        const percentage = totalStudents > 0 ? (studentsPresent / totalStudents) * 100 : 0;

        // Try to fetch active planning to auto-fill data if not provided
        let planningData: any = {};
        try {
            // Import dynamically to avoid circular dependency if any, or just use imported service
            const planning = await import('./planning.service').then(m => m.planningService.findActivePlanning(companyId, teacherId, data.levelId, new Date(data.date)));

            if (planning) {
                // Auto-fill logic
                if (!data.activitiesPerformed && planning.activities) {
                    // Extract activities descriptions
                    const activitiesList = Array.isArray(planning.activities)
                        ? planning.activities.map((a: any) => `- ${a.description || a.name}`).join('\n')
                        : '';
                    planningData.activitiesPerformed = `[Planificación: ${planning.title}]\n${activitiesList}`;
                }

                if (!data.coreLearningAreas && planning.coreLearningAreas) {
                    planningData.coreLearningAreas = planning.coreLearningAreas;
                }

                if (!data.resourcesUsed && planning.resources) {
                    planningData.resourcesUsed = Array.isArray(planning.resources) ? planning.resources.join(', ') : planning.resources;
                }

                // If specific objectives exist, maybe append to achievements or general observations?
                if (!data.achievements && planning.objectives) {
                    planningData.achievements = `Objetivos Planificados:\n${planning.objectives}`;
                }
            }
        } catch (e) {
            console.warn('[ClassBook] Failed to fetch active planning', e);
        }

        const repository = this.getRepository();
        const entry = repository.create({
            companyId,
            teacherId,
            levelId: data.levelId,
            date: data.date,
            activitiesPerformed: data.activitiesPerformed || planningData.activitiesPerformed || '',
            resourcesUsed: data.resourcesUsed || planningData.resourcesUsed || '',
            teachingMethodology: data.teachingMethodology || '',
            learningEnvironment: data.learningEnvironment || '',
            achievements: data.achievements || planningData.achievements || '',
            challenges: data.challenges || '',
            incidents: data.incidents || '',
            specialActivities: data.specialActivities || '',
            coreLearningAreas: data.coreLearningAreas || planningData.coreLearningAreas || null,
            status: 'draft',
            academicYear: new Date().getFullYear().toString(),
            totalStudents: totalStudents > 0 ? totalStudents : 0, // Fallback
            studentsPresent,
            studentsAbsent,
            studentsLate,
            studentsJustified,
            attendancePercentage: parseFloat(percentage.toFixed(2))
        });

        // Link to ClassBook if exists
        try {
            const ClassBook = (await import('../entities/academic/class-books.entity')).ClassBook;
            const bookRepo = AppDataSource.getRepository(ClassBook);
            const book = await bookRepo.findOne({
                where: {
                    companyId,
                    levelId: data.levelId,
                    status: 'active'
                }
            });
            if (book) {
                entry.classBook = book;
                entry.classBookId = book.id;
            }
        } catch (e) { /* ignore if fails, maintain compatibility */ }


        return await repository.save(entry);
    },

    async updateEntry(id: string, companyId: string, data: UpdateClassBookEntryDTO) {
        const repo = this.getRepository();
        const entry = await repo.findOne({ where: { id, companyId } });
        if (!entry) throw new Error('Entrada no encontrada');
        if (entry.isLocked) throw new Error('La entrada está bloqueada y no se puede editar');

        // Sync Attendance Stats
        try {
            const attendanceRepo = this.getAttendanceRepository();

            // 1. Strict Match
            let attendances = await attendanceRepo.find({
                where: { companyId, classBookEntryId: id }
            });

            // 2. Fallback Legacy Match (Orphans)
            if (attendances.length === 0) {
                const dateStr = entry.date instanceof Date
                    ? entry.date.toISOString().split('T')[0]
                    : String(entry.date).substring(0, 10);

                attendances = await attendanceRepo.find({
                    where: {
                        companyId,
                        levelId: entry.levelId,
                        date: dateStr as any,
                        classBookEntryId: IsNull()
                    }
                });
            }

            if (attendances.length > 0) {
                const totalStudents = attendances.length;
                const studentsPresent = attendances.filter(a => a.status === 'present' || a.status === 'late').length;
                const studentsAbsent = attendances.filter(a => a.status === 'absent').length;
                const studentsLate = attendances.filter(a => a.status === 'late').length;
                const studentsJustified = attendances.filter(a => a.status === 'excused').length;
                const percentage = totalStudents > 0 ? (studentsPresent / totalStudents) * 100 : 0;

                entry.totalStudents = totalStudents;
                entry.studentsPresent = studentsPresent;
                entry.studentsAbsent = studentsAbsent;
                entry.studentsLate = studentsLate;
                entry.studentsJustified = studentsJustified;
                entry.attendancePercentage = parseFloat(percentage.toFixed(2));
            }
        } catch (e) {
            console.warn('[ClassBook] Failed to sync attendance stats on update', e);
        }

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

        // New filter by Book ID
        if ((filters as any).bookId) {
            queryBuilder.andWhere('entry.class_book_id = :bookId', { bookId: (filters as any).bookId });
        }

        return await queryBuilder
            .orderBy('entry.date', 'DESC')
            .addOrderBy('entry.created_at', 'DESC')
            .getMany();
    },

    async getEntryById(id: string, companyId: string) {
        const repo = this.getRepository();
        const entry = await repo.findOne({
            where: { id, companyId },
            relations: ['level', 'teacher', 'studentObservations', 'studentObservations.student', 'classBook']
        });
        if (!entry) throw new Error('Entrada no encontrada');

        // Sync with live Attendance data
        try {
            const attendanceRepo = this.getAttendanceRepository();

            // 1. Strict Match
            let attendances = await attendanceRepo.find({
                where: { companyId, classBookEntryId: id }
            });

            // 2. Fallback Legacy Match (Orphans)
            if (attendances.length === 0) {
                const dateStr = entry.date instanceof Date
                    ? entry.date.toISOString().split('T')[0]
                    : String(entry.date).substring(0, 10);

                attendances = await attendanceRepo.find({
                    where: {
                        companyId,
                        levelId: entry.levelId,
                        date: dateStr as any,
                        classBookEntryId: IsNull()
                    }
                });
            }

            if (attendances.length > 0) {
                const totalStudents = attendances.length;
                const studentsPresent = attendances.filter(a => a.status === 'present' || a.status === 'late').length;
                const studentsAbsent = attendances.filter(a => a.status === 'absent').length;
                const studentsLate = attendances.filter(a => a.status === 'late').length;
                const studentsJustified = attendances.filter(a => a.status === 'excused').length;
                const percentage = totalStudents > 0 ? (studentsPresent / totalStudents) * 100 : 0;

                // Update entry with live stats
                entry.totalStudents = totalStudents;
                entry.studentsPresent = studentsPresent;
                entry.studentsAbsent = studentsAbsent;
                entry.studentsLate = studentsLate;
                entry.studentsJustified = studentsJustified;
                entry.attendancePercentage = parseFloat(percentage.toFixed(2));

                await repo.save(entry);
                // console.log('[ClassBook] Synced attendance stats', { id, percentage });
            }
        } catch (error) {
            console.warn('[ClassBook] Failed to sync attendance stats', error);
        }

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

        // Sync Attendance Stats before locking
        try {
            const attendanceRepo = this.getAttendanceRepository();

            // 1. Strict Match
            let attendances = await attendanceRepo.find({
                where: { companyId, classBookEntryId: id }
            });

            // 2. Fallback Legacy Match (Orphans)
            if (attendances.length === 0) {
                const dateStr = entry.date instanceof Date
                    ? entry.date.toISOString().split('T')[0]
                    : String(entry.date).substring(0, 10);

                attendances = await attendanceRepo.find({
                    where: {
                        companyId,
                        levelId: entry.levelId,
                        date: dateStr as any,
                        classBookEntryId: IsNull()
                    }
                });
            }

            if (attendances.length > 0) {
                const totalStudents = attendances.length;
                const studentsPresent = attendances.filter(a => a.status === 'present' || a.status === 'late').length;
                const studentsAbsent = attendances.filter(a => a.status === 'absent').length;
                const studentsLate = attendances.filter(a => a.status === 'late').length;
                const studentsJustified = attendances.filter(a => a.status === 'excused').length;
                const percentage = totalStudents > 0 ? (studentsPresent / totalStudents) * 100 : 0;

                entry.totalStudents = totalStudents;
                entry.studentsPresent = studentsPresent;
                entry.studentsAbsent = studentsAbsent;
                entry.studentsLate = studentsLate;
                entry.studentsJustified = studentsJustified;
                entry.attendancePercentage = parseFloat(percentage.toFixed(2));
            }
        } catch (e) {
            console.warn('[ClassBook] Failed to sync attendance stats on lock', e);
        }

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
    },

    async deleteEntry(id: string, companyId: string) {
        const repo = this.getRepository();
        const entry = await repo.findOne({ where: { id, companyId } });
        if (!entry) throw new Error('Entrada no encontrada');
        if (entry.isLocked) throw new Error('No se puede eliminar una entrada bloqueada');

        await repo.softRemove(entry);
    },

    // --- Class Book Management ---

    async getBookRepository() {
        const ClassBook = (await import('../entities/academic/class-books.entity')).ClassBook;
        return AppDataSource.getRepository(ClassBook);
    },

    async createBook(companyId: string, levelId: string, headTeacherId: string, createdById: string) {
        // Enforce Unique Book per Level for current Year? 
        // For simplicity, let's just check if active book exists for this level
        const ClassBook = (await import('../entities/academic/class-books.entity')).ClassBook;
        const repo = AppDataSource.getRepository(ClassBook);

        // Validate Level Ownership
        const Level = (await import('../entities/students/level.entity')).Level;
        const levelRepo = AppDataSource.getRepository(Level);
        const level = await levelRepo.findOne({ where: { id: levelId, companyId } });
        if (!level) throw new Error('Nivel no encontrado o no pertenece a la compañía');

        const existing = await repo.findOne({
            where: {
                companyId,
                levelId,
                status: 'active'
            }
        });

        if (existing) {
            throw new Error('Ya existe un libro de clases activo para este nivel.');
        }

        const book = repo.create({
            companyId,
            levelId,
            headTeacherId,
            createdById,
            status: 'active',
            academicYear: new Date().getFullYear().toString(),
            openedAt: new Date(),
            name: 'Libro de Clases' // Default name, can be updated based on Level name if needed
        });

        return await repo.save(book);
    },

    async listBooks(companyId: string, userId: string, roles: string[]) {
        const ClassBook = (await import('../entities/academic/class-books.entity')).ClassBook;
        const repo = AppDataSource.getRepository(ClassBook);

        const qb = repo.createQueryBuilder('book')
            .leftJoinAndSelect('book.level', 'level')
            .leftJoinAndSelect('book.headTeacher', 'headTeacher')
            .where('book.company_id = :companyId', { companyId });

        // If not Admin/Director, restrict to own books
        const canSeeAll = roles.includes('ADMIN') || roles.includes('DIRECTOR');
        if (!canSeeAll) {
            qb.andWhere('book.head_teacher_id = :userId', { userId });
        }

        qb.orderBy('level.name', 'ASC');

        const books = await qb.getMany();

        // Enrich with entry counts or latest activity if needed?
        // For now preventing N+1 queries by just returning books
        return books;
    },

    async getBookById(id: string, companyId: string) {
        const ClassBook = (await import('../entities/academic/class-books.entity')).ClassBook;
        const repo = AppDataSource.getRepository(ClassBook);

        const book = await repo.findOne({
            where: { id, companyId },
            relations: ['level', 'headTeacher']
        });

        if (!book) throw new Error('Libro de clases no encontrado');
        return book;
    },
    async updateBook(id: string, companyId: string, data: { headTeacherId: string }) {
        const ClassBook = (await import('../entities/academic/class-books.entity')).ClassBook;
        const repo = AppDataSource.getRepository(ClassBook);

        const book = await repo.findOne({ where: { id, companyId } });
        if (!book) throw new Error('Libro de clases no encontrado');

        if (data.headTeacherId) {
            book.headTeacherId = data.headTeacherId;
        }

        return await repo.save(book);
    },

    async deleteBook(id: string, companyId: string) {
        const ClassBook = (await import('../entities/academic/class-books.entity')).ClassBook;
        const repo = AppDataSource.getRepository(ClassBook);

        const book = await repo.findOne({ where: { id, companyId } });
        if (!book) throw new Error('Libro de clases no encontrado');

        return await repo.softRemove(book);
    }
};

