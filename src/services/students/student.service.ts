import { getScopedRepository } from '../../utils/scoped-repository';
import { Student } from '../../entities/students/student.entity';
import { Brackets } from 'typeorm';

export const studentService = {
    /**
     * Create a new student
     */
    async createStudent(
        data: {
            firstName: string;
            lastName: string;
            rut: string;
            birthDate: Date;
            gender: string;
            address: string;
            enrollmentDate: Date;
            photoUrl?: string;
            levelId?: string;
            cityId?: string;
        }
    ) {
        const studentRepo = getScopedRepository(Student);

        // Check if RUT already exists in this company
        const existingStudent = await studentRepo.findOne({
            where: { rut: data.rut }
        });

        if (existingStudent) {
            throw new Error('El estudiante con este RUT ya existe en la institución');
        }

        const student = studentRepo.create(data);
        return await studentRepo.save(student);
    },

    /**
     * List students with filters
     */
    async listStudents(
        companyId: string,
        filters: {
            search?: string;
            status?: string;
            levelId?: string;
            page?: number;
            limit?: number;
        }
    ) {
        const { search, status, levelId, page = 1, limit = 10 } = filters;
        const studentRepo = getScopedRepository(Student);

        const queryBuilder = studentRepo['repository']
            .createQueryBuilder('student')
            .leftJoinAndSelect('student.level', 'level')
            .where('student.companyId = :companyId', { companyId });

        if (search) {
            queryBuilder.andWhere(
                new Brackets(qb => {
                    qb.where('student.firstName ILIKE :search', { search: `%${search}%` })
                        .orWhere('student.lastName ILIKE :search', { search: `%${search}%` })
                        .orWhere('student.rut ILIKE :search', { search: `%${search}%` })
                        .orWhere('student.enrollmentNumber ILIKE :search', { search: `%${search}%` });
                })
            );
        }

        if (status) {
            queryBuilder.andWhere('student.status = :status', { status });
        }

        if (levelId) {
            queryBuilder.andWhere('student.levelId = :levelId', { levelId });
        }

        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);
        queryBuilder.orderBy('student.createdAt', 'DESC');

        const [students, total] = await queryBuilder.getManyAndCount();

        return {
            students,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    /**
     * Get student by ID
     */
    async getStudentById(id: string) {
        const studentRepo = getScopedRepository(Student);

        const student = await studentRepo.findOne({
            where: { id },
            relations: ['level', 'city', 'studentGuardians', 'studentGuardians.guardian']
        });

        if (!student) {
            throw new Error('Estudiante no encontrado');
        }

        return student;
    },

    /**
     * Update student
     */
    async updateStudent(id: string, updates: any) {
        const studentRepo = getScopedRepository(Student);

        const student = await studentRepo.findOne({ where: { id } });

        if (!student) {
            throw new Error('Estudiante no encontrado');
        }

        if (updates.rut && updates.rut !== student.rut) {
            const existing = await studentRepo.findOne({ where: { rut: updates.rut } });
            if (existing && existing.id !== id) throw new Error('Ya existe otro estudiante con ese RUT');
        }

        Object.assign(student, updates);
        return await studentRepo.save(student);
    },

    /**
     * Delete (deactivate) student
     */
    async deleteStudent(id: string) {
        const studentRepo = getScopedRepository(Student);
        const student = await studentRepo.findOne({ where: { id } });

        if (!student) {
            throw new Error('Estudiante no encontrado');
        }

        // Hard delete as requested by user ("borrar sus datos")
        await studentRepo.remove(student);

        return { success: true, message: 'Estudiante eliminado correctamente' };
    }
};
