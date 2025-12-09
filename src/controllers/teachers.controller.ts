import { Request, Response } from 'express';
import { getScopedRepository } from '../utils/scoped-repository';
import { AppDataSource } from '../config/database'; // Kept for transactions if needed, but mostly scoped
import { User } from '../entities/auth/user.entity';
import { UserRole } from '../entities/auth/user-role.entity';
import { Role } from '../entities/auth/role.entity';
import { ActivityPlanning } from '../entities/academic/activity-planning.entity';
import { ClassBookEntry } from '../entities/academic/class-book-entry.entity';
import { AuthRequest } from '../interfaces/auth/jwt.interface';
import bcrypt from 'bcryptjs';

const isAdminOrDirector = (req: AuthRequest): boolean => {
    const roles = req.user?.roles || [];
    return roles.some((r: any) => {
        const code = (typeof r === 'string' ? r : r.code)?.toUpperCase();
        return code === 'ADMIN' || code === 'DIRECTOR';
    });
};

const isTeacherRole = (req: AuthRequest): boolean => {
    const roles = req.user?.roles || [];
    return roles.some((r: any) => {
        const code = typeof r === 'string' ? r : r.code;
        return code === 'TEACHER';
    });
};

const hasTeacherModuleAccess = (req: AuthRequest): boolean => {
    const roles = req.user?.roles || [];
    return roles.some((r: any) => {
        const code = (typeof r === 'string' ? r : r.code)?.toUpperCase();
        return ['ADMIN', 'DIRECTOR', 'TEACHER'].includes(code);
    });
};

export const getTeacherDetails = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!hasTeacherModuleAccess(req)) {
            res.status(403).json({ success: false, error: 'Acceso denegado. Rol no autorizado.' });
            return;
        }

        const { id } = req.params;
        const { companyId } = req;

        // Use Scoped Repository for Isolation
        const userRepository = getScopedRepository(User);
        const activityRepository = getScopedRepository(ActivityPlanning);
        const classBookRepository = getScopedRepository(ClassBookEntry);

        // 1. Get Teacher Basic Info
        const teacher = await userRepository.findOne({
            where: { id },
            relations: ['userRoles', 'userRoles.role']
        });

        if (!teacher) {
            res.status(404).json({ success: false, error: 'Profesor no encontrado' });
            return;
        }

        // 2. Aggregate Stats
        const planningCount = await activityRepository.count({
            where: { teacherId: id }
        });

        const classBookCount = await classBookRepository.count({
            where: { teacherId: id }
        });

        // 3. Get Distinct Levels Taught
        const distinctLevels = await activityRepository['repository'].createQueryBuilder('ap')
            .innerJoin('ap.level', 'level')
            .where('ap.teacherId = :id', { id })
            .andWhere('ap.companyId = :companyId', { companyId })
            .select('DISTINCT level.name', 'name')
            .getRawMany();

        const levelsTaught = distinctLevels.map((l: any) => l.name);

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
        if (!hasTeacherModuleAccess(req)) {
            res.status(403).json({ success: false, error: 'Acceso denegado. Rol no autorizado.' });
            return;
        }

        const { companyId, user } = req;
        const { status } = req.query;
        const userRepository = getScopedRepository(User);

        // Build Query - ScopedRepository guarantees companyId filter
        const queryBuilder = userRepository['repository'].createQueryBuilder('user')
            .innerJoin('user.userRoles', 'userRole')
            .innerJoin('userRole.role', 'role')
            .where('user.companyId = :companyId', { companyId })
            .andWhere('role.code = :roleCode', { roleCode: 'TEACHER' })
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

        // Status Filter
        if (status === 'active') {
            queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
        } else if (status === 'inactive') {
            queryBuilder.andWhere('user.isActive = :isActive', { isActive: false });
        }

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

/**
 * @deprecated This endpoint is no longer used by the Teachers Module (Create functionality removed).
 * Retained for compatibility or future global registration needs.
 */
export const createTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (isTeacherRole(req)) {
            res.status(403).json({ success: false, error: 'No tienes permiso para realizar esta acción' });
            return;
        }

        const { firstName, lastName, email, rut, phone, password } = req.body;
        const userRepository = getScopedRepository(User);

        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            res.status(400).json({ success: false, error: 'El email ya está registrado' });
            return;
        }

        const passwordHash = await bcrypt.hash(password || rut, 10);

        const newUser = userRepository.create({
            firstName,
            lastName,
            email,
            rut,
            phone,
            passwordHash,
            isActive: true
        });

        await userRepository.save(newUser);

        const roleRepository = AppDataSource.getRepository(Role);
        const teacherRole = await roleRepository.findOne({
            where: [
                { code: 'TEACHER', companyId: req.companyId },
                { code: 'TEACHER', isSystemRole: true }
            ]
        });

        if (!teacherRole) {
            throw new Error("Rol 'TEACHER' no encontrado");
        }

        const userRoleRepository = getScopedRepository(UserRole);
        const userRole = userRoleRepository.create({
            userId: newUser.id,
            roleId: teacherRole.id, // Direct ID assignment
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
            error: error instanceof Error ? error.message : 'Error interno al crear profesor'
        });
    }
};

export const updateTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // 1. Strict ACL: Only ADMIN or DIRECTOR
        if (!isAdminOrDirector(req)) {
            res.status(403).json({ success: false, error: 'No tienes permisos para editar. Se requiere rol ADMIN o DIRECTOR.' });
            return;
        }

        const { id } = req.params;
        const { firstName, lastName, email, rut, phone, isActive } = req.body;

        const userRepository = getScopedRepository(User);
        const teacher = await userRepository.findOne({ where: { id } });

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
        // 1. Strict ACL: Only ADMIN or DIRECTOR
        if (!isAdminOrDirector(req)) {
            res.status(403).json({ success: false, error: 'No tienes permisos para eliminar. Se requiere rol ADMIN o DIRECTOR.' });
            return;
        }

        const { id } = req.params;
        const userRepository = getScopedRepository(User);
        const teacher = await userRepository.findOne({ where: { id } });

        if (!teacher) {
            res.status(404).json({ success: false, error: 'Profesor no encontrado' });
            return;
        }

        // Soft Delete
        teacher.isActive = false;
        await userRepository.save(teacher);

        res.json({ success: true, message: 'Profesor desactivado correctamente' });

    } catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar profesor' });
    }
};
