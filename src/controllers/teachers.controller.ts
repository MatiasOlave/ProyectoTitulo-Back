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
import { userService } from '../services/auth/user.service';

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
        // 1. Strict ACL: Only ADMIN or DIRECTOR
        if (!isAdminOrDirector(req)) {
            res.status(403).json({ success: false, error: 'No tienes permisos para crear profesores. Se requiere rol ADMIN o DIRECTOR.' });
            return;
        }

        const { firstName, lastName, email, rut, phone, password, avatarUrl } = req.body;

        // Use userService to create the user, ensuring TEACHER role
        // We pass ['TEACHER'] as roleCodes
        const result = await userService.createUser(
            req.companyId!,
            email,
            password || rut, // Default password is RUT if not provided
            firstName,
            lastName,
            rut,
            phone,
            ['TEACHER'], // Force TEACHER role
            req.user!.userId,
            avatarUrl
        );

        res.status(201).json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Error creating teacher:', error);
        // Handle standard errors from service
        if (error.message === 'El correo electrónico ya está registrado' || error.message.includes('RUT')) {
            res.status(400).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error interno al crear profesor'
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

        // Check if RUT already exists in this company (if changing)
        if (rut && rut !== teacher.rut) {
            const existingRut = await userRepository.findOne({
                where: { rut }
            });

            if (existingRut) {
                res.status(400).json({ success: false, error: 'El RUT ya está registrado en esta empresa' });
                return;
            }
        }

        // Prepare updates object
        const updates: any = { updatedAt: new Date() }; // Force timestamp update
        if (firstName !== undefined) updates.firstName = firstName;
        if (lastName !== undefined) updates.lastName = lastName;
        if (email !== undefined) updates.email = email;
        if (rut !== undefined) updates.rut = rut;
        if (phone !== undefined) updates.phone = phone;
        if (isActive !== undefined) updates.isActive = isActive;

        // Use direct update like in user.service.ts to avoid relation issues with .save()
        await userRepository['repository'].update(id, updates);

        // Fetch updated entity to return
        const updatedTeacher = await userRepository.findOne({ where: { id } });

        res.json({ success: true, data: updatedTeacher });

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
