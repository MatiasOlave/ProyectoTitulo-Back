import { getScopedRepository } from '../../utils/scoped-repository';
import { Level } from '../../entities/students/level.entity';
import { Student } from '../../entities/students/student.entity';

export const levelService = {
    async listLevels(companyId: string, filters?: any) {
        const levelRepo = getScopedRepository(Level);
        const { name_or_code, academic_year, status, age_min, age_max } = filters || {};

        // Use query builder to handle filters dynamically
        const query = levelRepo['repository'].createQueryBuilder('level')
            .where('level.companyId = :companyId', { companyId });

        if (name_or_code) {
            query.andWhere(
                '(level.name LIKE :search OR level.code LIKE :search)',
                { search: `%${name_or_code}%` }
            );
        }

        if (academic_year) {
            query.andWhere('level.academicYear = :academicYear', { academicYear: academic_year });
        }

        if (status && status !== 'all') {
            // Ensure boolean comparison
            const isActive = status === 'active';
            query.andWhere('level.isActive = :isActive', { isActive });
        }

        if (age_min) {
            query.andWhere('level.minAgeMonths >= :ageMin', { ageMin: Number(age_min) });
        }

        if (age_max) {
            query.andWhere('level.maxAgeMonths <= :ageMax', { ageMax: Number(age_max) });
        }

        query.orderBy('level.displayOrder', 'ASC')
            .addOrderBy('level.name', 'ASC');

        const levels = await query.getMany();
        return levels;
    },

    // Simple getById if needed later
    async getLevelById(id: string) {
        const levelRepo = getScopedRepository(Level);
        const level = await levelRepo.findOne({ where: { id }, withDeleted: true });
        if (!level) throw new Error('Curso no encontrado');
        return level;
    },


    async updateLevel(companyId: string, id: string, data: Partial<Level>) {
        const levelRepo = getScopedRepository(Level);

        const level = await levelRepo.findOne({ where: { id } });
        if (!level) throw new Error('Nivel no encontrado');

        // Check code uniqueness if code is changing
        if (data.code && data.code !== level.code) {
            const existing = await levelRepo.findOne({ where: { code: data.code } });
            if (existing) throw new Error('El código del nivel ya existe');
        }

        // Validate logical constraints
        if (data.minAgeMonths !== undefined && data.maxAgeMonths !== undefined) {
            if (data.minAgeMonths > data.maxAgeMonths) {
                throw new Error('La edad mínima no puede ser mayor a la edad máxima');
            }
        } else if (data.minAgeMonths !== undefined && data.minAgeMonths > level.maxAgeMonths) {
            throw new Error('La edad mínima no puede ser mayor a la edad máxima actual');
        } else if (data.maxAgeMonths !== undefined && level.minAgeMonths > data.maxAgeMonths) {
            throw new Error('La edad mínima actual no puede ser mayor a la nueva edad máxima');
        }

        Object.assign(level, data);
        return await levelRepo.save(level);
    },

    async deleteLevel(companyId: string, id: string) {
        const levelRepo = getScopedRepository(Level);

        const level = await levelRepo.findOne({
            where: { id },
            relations: ['students']
        });

        if (!level) throw new Error('Nivel no encontrado');

        // Validate if there are active students
        const activeStudents = level.students?.filter(s => s.status === 'active') || [];
        if (activeStudents.length > 0) {
            throw new Error(`No se puede eliminar el nivel porque tiene ${activeStudents.length} estudiantes activos inscritos.`);
        }

        return await levelRepo.softRemove(level);
    },

    async getLevelDetails(companyId: string, id: string) {
        console.log(`[DEBUG] getLevelDetails - ID: ${id}, Company: ${companyId}`);
        const levelRepo = getScopedRepository(Level);

        const level = await levelRepo.findOne({
            where: { id },
            relations: [
                'students', // To list students
                'activityPlannings',
                'activityPlannings.teacher', // To list teachers
            ],
            withDeleted: true
        });

        if (!level) throw new Error('Nivel no encontrado');

        // Filter active students if not filtered by relation query (TypeORM relation filters are tricky without QueryBuilder)
        // Ideally we use QueryBuilder but relation load is easier for "Details".
        // Let's filter in memory or explicit query.
        // Assuming 'students' relation returns all.
        const activeStudents = level.students?.filter(s => s.status === 'active') || [];

        // Calculate stats
        const enrolledCount = activeStudents.length;
        const capacity = level.capacity;
        const availableSpots = Math.max(0, capacity - enrolledCount);
        const occupancyPercentage = capacity > 0 ? Math.round((enrolledCount / capacity) * 100) : 0;

        // Extract unique teachers from plannings
        const teacherMap = new Map();
        level.activityPlannings?.forEach(p => {
            if (p.teacher) {
                teacherMap.set(p.teacher.id, {
                    id: p.teacher.id,
                    firstName: p.teacher.firstName,
                    lastName: p.teacher.lastName,
                    email: p.teacher.email, // helpful for display
                    avatarUrl: p.teacher.avatarUrl
                });
            }
        });
        const teachers = Array.from(teacherMap.values());

        return {
            ...level,
            students: activeStudents, // Override with active only or just return all? Requirement: "Estudiantes inscritos actualmente"
            stats: {
                enrolledCount,
                availableSpots,
                occupancyPercentage
            },
            teachers
        };
    },

    async createLevel(companyId: string, data: any) {
        const levelRepo = getScopedRepository(Level);

        // Validate required fields
        if (!data.name || !data.code || !data.academicYear) {
            throw new Error('Nombre, Código y Año Académico son obligatorios.');
        }

        if (data.minAgeMonths === undefined || data.maxAgeMonths === undefined || !data.capacity) {
            throw new Error('Rangos de edad y capacidad son obligatorios.');
        }

        if (data.minAgeMonths > data.maxAgeMonths) {
            throw new Error('La edad mínima no puede ser mayor a la edad máxima.');
        }

        // Validate unique code in company
        const existing = await levelRepo.findOne({ where: { code: data.code } });
        if (existing) {
            throw new Error(`El código del nivel '${data.code}' ya existe en la institución.`);
        }

        const newLevel = levelRepo.create(data);
        // Explicitly set companyId to ensure isolation works even if context is missing
        (newLevel as any).companyId = companyId;
        // Default isActive to true if not specified
        if (newLevel.isActive === undefined) {
            newLevel.isActive = true;
        }
        return await levelRepo.save(newLevel);
    },

    async assignStudent(companyId: string, levelId: string, studentId: string) {
        const levelRepo = getScopedRepository(Level);
        const level = await levelRepo.findOne({
            where: { id: levelId },
            relations: ['students']
        });

        if (!level) throw new Error('Nivel no encontrado');

        // Check Capacity
        const activeStudents = level.students?.filter(s => s.status === 'active') || [];
        if (activeStudents.length >= level.capacity) {
            throw new Error(`El nivel ha alcanzado su capacidad máxima (${level.capacity}).`);
        }

        // Fetch Student
        const studentRepo = getScopedRepository(Student);
        const student = await studentRepo.findOne({ where: { id: studentId } });

        if (!student) throw new Error('Estudiante no encontrado');
        if (student.status !== 'active') throw new Error('El estudiante no está activo.');

        // Validate Age (Months)
        const birthDate = new Date(student.birthDate);
        const today = new Date();

        let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
        months -= birthDate.getMonth();
        months += today.getMonth();

        // Adjust if day of month hasn't occurred yet
        if (today.getDate() < birthDate.getDate()) {
            months--;
        }

        if (months < level.minAgeMonths || months > level.maxAgeMonths) {
            throw new Error(`La edad del estudiante (${months} meses) no cumple con el rango del nivel (${level.minAgeMonths}-${level.maxAgeMonths} meses).`);
        }

        // Assign proper Level relation
        student.level = level;
        return await studentRepo.save(student);
    },

    async getStudentsByLevel(companyId: string, levelId: string) {
        const studentRepo = getScopedRepository(Student);

        const students = await studentRepo.find({
            where: { levelId, status: 'active' },
            relations: ['attendances']
        });

        const today = new Date();

        return students.map((student: any) => {
            // Calculate Age
            const birthDate = new Date(student.birthDate);
            let ageYears = today.getFullYear() - birthDate.getFullYear();
            let ageMonths = today.getMonth() - birthDate.getMonth();
            if (ageMonths < 0 || (ageMonths === 0 && today.getDate() < birthDate.getDate())) {
                ageYears--;
                ageMonths += 12;
            }
            // Logic for months adjustment if day hasn't passed
            if (today.getDate() < birthDate.getDate()) {
                ageMonths--; // This might make it -1 if not careful, but previous block handles years decrement.
                // Actually standard years/months calculation:
                // simple approximation for display:
            }
            // Let's stick to simple years for display or precise months? 
            // The prompt says "Calculo de Edad Actual".
            // Let's do Years and Months string.

            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                // ageYears already decremented
            }

            // Attendance Summary
            const total = student.attendances.length;
            const present = student.attendances.filter((a: any) => a.status === 'present').length;
            const absent = student.attendances.filter((a: any) => a.status === 'absent').length;
            const late = student.attendances.filter((a: any) => a.status === 'late').length;

            const attendancePercentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0; // Late counts as present-ish? usually late is present.
            // Requirement says "Resumen de Asistencia". I will return percentage and counts.

            return {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                rut: student.rut,
                photoUrl: student.photoUrl,
                age: ageYears, // Return number
                ageLabel: `${ageYears} años`, // Return string
                attendance: {
                    total,
                    present,
                    absent,
                    late,
                    percentage: attendancePercentage
                }
            };
        });
    }
};
