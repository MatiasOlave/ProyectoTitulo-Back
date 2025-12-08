import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/auth/user.entity';
import { UserRole } from '../entities/auth/user-role.entity';
import { Role } from '../entities/auth/role.entity';
import { ActivityPlanning } from '../entities/academic/activity-planning.entity';
import { ClassBookEntry } from '../entities/academic/class-book-entry.entity';
import { AuthRequest } from '../interfaces/auth/jwt.interface';
import bcrypt from 'bcryptjs';

const isTeacherRole = (req: AuthRequest): boolean => {
    const roles = req.user?.roles || [];
    // Check if roles contains 'TEACHER' code
    // req.user.roles comes from JwtPayload which usually has mapped roles
    // We handle both object with code or string
    return roles.some((r: any) => {
        const code = typeof r === 'string' ? r : r.code;
        return code === 'TEACHER';
    });
};

export const getTeacherDetails = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { companyId } = req;

        const userRepository = AppDataSource.getRepository(User);
        const activityRepository = AppDataSource.getRepository(ActivityPlanning);
        const classBookRepository = AppDataSource.getRepository(ClassBookEntry);

        // 1. Get Teacher Basic Info
        const teacher = await userRepository.findOne({
            where: { id, companyId },
            relations: ['userRoles', 'userRoles.role'] // simple relation load
        });

        if (!teacher) {
            res.status(404).json({ success: false, error: 'Profesor no encontrado' });
            return;
        }

        // 2. Aggregate Stats using QueryBuilder for performance
        // Count Activity Plannings
        const planningCount = await activityRepository.count({
            where: { teacherId: id, companyId }
        });

        // Count Class Book Entries
        const classBookCount = await classBookRepository.count({
            where: { teacherId: id, companyId }
        });

        // 3. Get Distinct Levels Taught (from Activity Plannings)
        // We join to Level entity to get names
        const distinctLevels = await activityRepository.createQueryBuilder('ap')
            .innerJoin('ap.level', 'level')
            .where('ap.teacherId = :id', { id })
            .andWhere('ap.companyId = :companyId', { companyId })
            .select('DISTINCT level.name', 'name')
            .getRawMany();

        const levelsTaught = distinctLevels.map(l => l.name);

        res.json({
            success: true,
            data: {
                ...teacher,
                stats: {
                    planningCount,
                    classBookCount,
                    levelsTaught
                }
            }
        });

    } catch (error) {
        console.error('Error fetching teacher details:', error);
        res.status(500).json({ success: false, error: 'Error al obtener detalles del profesor' });
    }
};

export const getTeachers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { companyId, user } = req;
        const userRepository = AppDataSource.getRepository(User); // Use AppDataSource

        // 1. Build Query using explicit JOINs as per Schema
        const queryBuilder = userRepository.createQueryBuilder('user')
            // Join user_roles
            .innerJoin('user.userRoles', 'userRole')
            // Join roles
            .innerJoin('userRole.role', 'role')
            // Filter by Company
            .where('user.companyId = :companyId', { companyId })
            // Filter by Role Code 'TEACHER'
            .andWhere('role.code = :roleCode', { roleCode: 'TEACHER' })
            // Select specific fields
            .select([
                'user.id',
                'user.firstName',
                'user.lastName',
                'user.email',
                'user.phone',
                'user.rut',
                'user.isActive',
                'user.avatarUrl'
            ]);

        // 2. ACL: Self-Exclusion Logic
        if (isTeacherRole(req) && user?.userId) {
            queryBuilder.andWhere('user.id != :currentUserId', { currentUserId: user.userId });
        }

        const teachers = await queryBuilder.getMany();

        res.json({
            success: true,
            data: teachers
        });

    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al obtener profesores'
        });
    }
};

export const createTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // 1. Strict ACL
        if (isTeacherRole(req)) {
            res.status(403).json({ success: false, error: 'No tienes permiso para realizar esta acción' });
            return;
        }

        const { companyId } = req;
        const { firstName, lastName, email, rut, phone, password } = req.body;

        const userRepository = AppDataSource.getRepository(User); // Use AppDataSource

        // Validation
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            res.status(400).json({ success: false, error: 'El email ya está registrado' });
            return;
        }

        const passwordHash = await bcrypt.hash(password || rut, 10);

        const newUser = userRepository.create({ // Use .create() from repository
            firstName,
            lastName,
            email,
            rut,
            phone,
            companyId: companyId!,
            passwordHash,
            isActive: true
        });

        await userRepository.save(newUser);

        // Assign TEACHER role
        const roleRepository = AppDataSource.getRepository(Role); // Use AppDataSource
        const teacherRole = await roleRepository.findOne({ where: { code: 'TEACHER', companyId } });

        if (!teacherRole) {
            throw new Error("Rol 'TEACHER' no encontrado para esta compañía");
        }

        const userRoleRepository = AppDataSource.getRepository(UserRole); // Use AppDataSource
        const userRole = userRoleRepository.create({
            user: newUser,
            role: teacherRole,
            companyId: companyId!,
            assignedAt: new Date(),
            assignedById: req.user!.userId
        });

        await userRoleRepository.save(userRole);

        res.status(201).json({
            success: true,
            data: {
                id: newUser.id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Error creating teacher:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al crear profesor'
        });
    }
};

export const updateTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // 1. Strict ACL
        if (isTeacherRole(req)) {
            res.status(403).json({ success: false, error: 'No tienes permisos' });
            return;
        }

        const { id } = req.params;
        const { firstName, lastName, email, rut, phone, isActive } = req.body;

        const userRepository = AppDataSource.getRepository(User); // Use AppDataSource
        const teacher = await userRepository.findOne({ where: { id, companyId: req.companyId } });

        if (!teacher) {
            res.status(404).json({ success: false, error: 'Profesor no encontrado' });
            return;
        }

        teacher.firstName = firstName || teacher.firstName;
        teacher.lastName = lastName || teacher.lastName;
        teacher.email = email || teacher.email;
        teacher.rut = rut || teacher.rut;
        teacher.phone = phone || teacher.phone;
        if (isActive !== undefined) teacher.isActive = isActive;

        await userRepository.save(teacher);

        res.json({ success: true, data: teacher });

    } catch (error) {
        console.error('Error updating teacher:', error);
        res.status(500).json({ success: false, error: 'Error al actualizar profesor' });
    }
};

export const deleteTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // 1. Strict ACL
        if (isTeacherRole(req)) {
            res.status(403).json({ success: false, error: 'No tienes permisos' });
            return;
        }

        const { id } = req.params;

        const userRepository = AppDataSource.getRepository(User); // Use AppDataSource
        const teacher = await userRepository.findOne({ where: { id, companyId: req.companyId } });

        if (!teacher) {
            res.status(404).json({ success: false, error: 'Profesor no encontrado' });
            return;
        }

        await userRepository.delete(id);

        res.json({ success: true, message: 'Profesor eliminado correctamente' });

    } catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar profesor' });
    }
}
