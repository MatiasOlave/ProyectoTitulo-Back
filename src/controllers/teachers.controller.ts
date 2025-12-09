import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { getScopedRepository } from '../utils/scoped-repository';
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

        // Use Scoped Repository for Isolation
        const userRepository = getScopedRepository(User);
        const activityRepository = getScopedRepository(ActivityPlanning);
        const classBookRepository = getScopedRepository(ClassBookEntry);

        // 1. Get Teacher Basic Info
        // Note: scoped repository automatically handles companyId = req.companyId
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
        // For QueryBuilder we MUST manually add companyId check if we use raw `createQueryBuilder` on the repository
        // But getScopedRepository wrapper handles 'find' methods.
        // For createQueryBuilder on a scoped repo, we effectively access the underlying repo, so we must be careful.
        // SAFE APPROACH: Use the scoped repo instance which usually proxies this, BUT standard TypeORM Scoped repo might not fully wrap queryBuilder automatically in all setups.
        // Given existing docs, we should manually ensure companyId in QueryBuilder to be 100% safe or use find with relation.
        // Let's use the QueryBuilder from the underlying repository but ADD the companyId filter explicitly as per docs.

        const distinctLevels = await activityRepository['repository'].createQueryBuilder('ap')
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
        const { status } = req.query; // 'active', 'inactive', 'all'

        // Use Scoped Repository
        const userRepository = getScopedRepository(User);

        // 1. Build Query
        // Accessing the underlying repository for complex joins
        const queryBuilder = userRepository['repository'].createQueryBuilder('user')
            // Join user_roles
            .innerJoin('user.userRoles', 'userRole')
            // Join roles
            .innerJoin('userRole.role', 'role')
            // Filter by Company (CRITICAL for QueryBuilder)
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

        // 2. Apply Status Filter
        if (status === 'active') {
            queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
        } else if (status === 'inactive') {
            queryBuilder.andWhere('user.isActive = :isActive', { isActive: false });
        }
        // if status === 'all', do nothing (show all)

        // 3. ACL: Self-Exclusion Logic (If logged in as teacher, don't show self in list?? Or maybe yes?
        // Requirement said: "Solo pueden ver datos generales de sus colegas."
        // Usually "colleagues" implies others. Let's exclude self to be safe, or keep it.
        // Context: "Lista de Colegas". Usually excludes yourself or includes.
        // Let's exclude current user so it's strictly "Colleagues".
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
        // 1. Strict ACL
        if (isTeacherRole(req)) {
            res.status(403).json({ success: false, error: 'No tienes permiso para realizar esta acción' });
            return;
        }

        const { companyId } = req;
        const { firstName, lastName, email, rut, phone, password } = req.body;

        const userRepository = getScopedRepository(User);

        // Validation - Check email in this company (or globally if email logic dictates, but usually per company for collision check if tenancy allows same email in diff company?
        // User Service usually handles uniqueness. Standard is strict email uniqueness.
        // Let's check simply.
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            res.status(400).json({ success: false, error: 'El email ya está registrado' });
            return;
        }

        const passwordHash = await bcrypt.hash(password || rut, 10);

        // Create with scoped repository - automatically adds companyId
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

        // Assign TEACHER role
        // Use AppDataSource directly to allow finding System Roles (Global) that might not have company_id
        const roleRepository = AppDataSource.getRepository(Role); // Bypass scope for Role lookup

        const teacherRole = await roleRepository.findOne({
            where: [
                { code: 'TEACHER', companyId },
                { code: 'TEACHER', isSystemRole: true }
            ]
        });

        if (!teacherRole) {
            throw new Error("Rol 'TEACHER' no encontrado (ni en compañía ni como rol de sistema)");
        }

        const userRoleRepository = getScopedRepository(UserRole);
        const userRole = userRoleRepository.create({
            userId: newUser.id,
            roleId: teacherRole.id,
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
        // 1. Strict ACL
        if (isTeacherRole(req)) {
            res.status(403).json({ success: false, error: 'No tienes permisos' });
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
        // 1. Strict ACL
        if (isTeacherRole(req)) {
            res.status(403).json({ success: false, error: 'No tienes permisos' });
            return;
        }

        const { id } = req.params;

        const userRepository = getScopedRepository(User);
        const teacher = await userRepository.findOne({ where: { id } });

        if (!teacher) {
            res.status(404).json({ success: false, error: 'Profesor no encontrado' });
            return;
        }

        // Soft delete: Set isActive = false instead of deleting hard
        teacher.isActive = false;
        await userRepository.save(teacher);

        res.json({ success: true, message: 'Profesor desactivado correctamente' });

    } catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar profesor' });
    }
}
