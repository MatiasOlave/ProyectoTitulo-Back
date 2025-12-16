// src/services/auth/user.service.ts
import bcrypt from 'bcryptjs';
import { In } from 'typeorm';
import { getScopedRepository } from '../../utils/scoped-repository';
import { User } from '../../entities/auth/user.entity';
import { Role } from '../../entities/auth/role.entity';
import { UserRole } from '../../entities/auth/user-role.entity';

export const userService = {
    /**
     * Create a new user
     * Only creates basic user data - role-specific data handled separately
     */
    async createUser(
        companyId: string,
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        rut: string,
        phone: string,
        roleCodes: string[],
        createdById: string,
        avatarUrl?: string
    ) {
        const userRepo = getScopedRepository(User);
        const roleRepo = getScopedRepository(Role);
        const userRoleRepo = getScopedRepository(UserRole);

        // Check if user already exists
        const existingUser = await userRepo.findOne({
            where: { email }
        });

        if (existingUser) {
            throw new Error('El correo electrónico ya está registrado');
        }

        // Check if RUT already exists in this company
        const existingRut = await userRepo.findOne({
            where: { rut }
        });

        if (existingRut) {
            throw new Error('El RUT ya está registrado en esta empresa');
        }

        // Find all roles using the In operator
        const roles = await roleRepo.find({
            where: { code: In(roleCodes) }
        });

        if (roles.length !== roleCodes.length) {
            throw new Error('Uno o más roles no fueron encontrados');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user with companyId
        const user = userRepo.create({
            companyId,
            email,
            passwordHash,
            firstName,
            lastName,
            rut,
            phone,
            avatarUrl,
            isActive: true,
            emailVerified: false
        });

        await userRepo.save(user);

        // Assign all roles
        const userRoles = roles.map(role => {
            const userRole = new UserRole();
            // Assign Relations
            userRole.user = user;
            userRole.role = role;
            // Assign IDs explicitly to ensure persistence
            userRole.userId = user.id;
            userRole.roleId = role.id;
            userRole.companyId = companyId;
            userRole.assignedById = createdById;

            userRole.assignedAt = new Date();

            return userRole;
        });

        await userRoleRepo['repository'].save(userRoles);

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            rut: user.rut,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            roles: roles.map(role => ({
                id: role.id,
                name: role.name,
                code: role.code
            }))
        };
    },

    /**
     * List users with filters and pagination
     */
    async listUsers(
        companyId: string,
        filters: {
            search?: string;
            roleCode?: string;
            isActive?: boolean;
            page?: number;
            limit?: number;
        }
    ) {
        const { search, roleCode, isActive, page = 1, limit = 10 } = filters;
        const userRepo = getScopedRepository(User);

        // Note: For complex queries with joins, we need to use createQueryBuilder
        // and manually add the companyId filter
        const queryBuilder = userRepo['repository']
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.userRoles', 'userRole')
            .leftJoinAndSelect('userRole.role', 'role')
            .where('user.companyId = :companyId', { companyId });

        // Apply search filter
        if (search) {
            queryBuilder.andWhere(
                '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search OR user.rut LIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Apply role filter
        if (roleCode) {
            queryBuilder.andWhere('role.code = :roleCode', { roleCode });
        }

        // Filter out soft-deleted users
        queryBuilder.andWhere('user.deletedAt IS NULL');

        // Apply active status filter
        if (isActive !== undefined) {
            queryBuilder.andWhere('user.isActive = :isActive', { isActive });
        }

        // Apply pagination
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        // Order by creation date
        queryBuilder.orderBy('user.createdAt', 'DESC');

        const [users, total] = await queryBuilder.getManyAndCount();

        return {
            users: users.map((user: any) => ({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                rut: user.rut,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
                isActive: user.isActive,
                emailVerified: user.emailVerified,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt,
                roles: user.userRoles ? user.userRoles.map((ur: any) => ({
                    id: ur.role.id,
                    name: ur.role.name,
                    code: ur.role.code
                })) : []
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    /**
     * Get user by ID
     */
    async getUserById(userId: string, companyId: string) {
        const userRepo = getScopedRepository(User);

        const user = await userRepo['repository'].findOne({
            where: { id: userId, companyId },
            relations: ['userRoles', 'userRoles.role', 'company']
        });

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            rut: user.rut,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            company: {
                id: user.company.id,
                name: user.company.name
            },
            roles: user.userRoles.map((ur: any) => ({
                id: ur.role.id,
                name: ur.role.name,
                code: ur.role.code,
                assignedAt: ur.assignedAt
            }))
        };
    },

    /**
     * Update user information
     */
    async updateUser(
        userId: string,
        companyId: string,
        updates: {
            firstName?: string;
            lastName?: string;
            rut?: string;
            phone?: string;
            avatarUrl?: string | null;
            roleCodes?: string[];
        },
        assignedById?: string
    ) {
        const userRepo = getScopedRepository(User);
        const roleRepo = getScopedRepository(Role);
        const userRoleRepo = getScopedRepository(UserRole);

        const user = await userRepo['repository'].findOne({
            where: { id: userId, companyId },
            relations: ['userRoles']
        });

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        // ... (RUT validation code remains the same)

        // If updating RUT, check it's not already in use
        if (updates.rut && updates.rut !== user.rut) {
            const existingRut = await userRepo.findOne({
                where: { rut: updates.rut }
            });

            if (existingRut) {
                throw new Error('El RUT ya está registrado en esta empresa');
            }
        }

        // Handle role updates if provided
        let updatedRoles = null;
        if (updates.roleCodes && updates.roleCodes.length > 0) {
            // Find all new roles
            const roles = await roleRepo.find({
                where: { code: In(updates.roleCodes) }
            });

            if (roles.length !== updates.roleCodes.length) {
                throw new Error('Uno o más roles no fueron encontrados');
            }

            // Remove existing roles using QueryBuilder to avoid constraint issues
            if (user.userRoles.length > 0) {
                await userRoleRepo['repository']
                    .createQueryBuilder()
                    .delete()
                    .from(UserRole)
                    .where('userId = :userId', { userId: user.id })
                    .execute();
            }

            // Assign new roles
            // We use the 'user' relation explicitly to ensure TypeORM maps the foreign key correctly
            const newUserRoles = roles.map(role => {
                const userRole = new UserRole();
                userRole.user = user;
                userRole.role = role;

                // Explicitly set IDs
                userRole.userId = user.id;
                userRole.roleId = role.id;
                userRole.companyId = companyId;
                userRole.assignedById = assignedById || userId;

                userRole.assignedAt = new Date();

                return userRole;
            });

            await userRoleRepo['repository'].save(newUserRoles);

            updatedRoles = roles.map(role => ({
                id: role.id,
                name: role.name,
                code: role.code
            }));
        }

        // Apply basic user updates (excluding roleCodes)
        const { roleCodes, ...userUpdates } = updates;
        Object.assign(user, userUpdates);

        // Use update() instead of save() to avoid TypeORM trying to manage relations 
        // (which causes "Column user_id cannot be null" error due to 'delete' cascade logic conflicting with manual role management)
        await userRepo['repository'].update(user.id, {
            ...userUpdates,
            updatedAt: new Date()
        });

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            rut: user.rut,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            ...(updatedRoles && { roles: updatedRoles })
        };
    },

    /**
     * Delete user (soft delete)
     */
    async deleteUser(userId: string, companyId: string, currentUserId: string) {
        const userRepo = getScopedRepository(User);
        const roleRepo = getScopedRepository(Role);
        const userRoleRepo = getScopedRepository(UserRole);

        // Prevent self-deletion
        if (userId === currentUserId) {
            throw new Error('No puedes eliminar tu propio usuario');
        }

        const user = await userRepo['repository'].findOne({
            where: { id: userId, companyId },
            relations: ['userRoles', 'userRoles.role']
        });

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        // Check if user is a DIRECTOR
        const isDirector = user.userRoles.some(
            (ur: any) => ur.role.code === 'DIRECTOR'
        );

        if (isDirector) {
            // Count active DIRECTOR users
            const directorRole = await roleRepo.findOne({
                where: { code: 'DIRECTOR' }
            });

            if (directorRole) {
                const activeDirectorCount = await userRepo['repository']
                    .createQueryBuilder('user')
                    .leftJoin('user.userRoles', 'userRole')
                    .where('user.companyId = :companyId', { companyId })
                    .andWhere('userRole.roleId = :roleId', { roleId: directorRole.id })
                    .andWhere('user.isActive = :isActive', { isActive: true })
                    .andWhere('user.deletedAt IS NULL')
                    .getCount();

                if (activeDirectorCount <= 1) {
                    throw new Error('No se puede eliminar al último director activo del sistema');
                }
            }
        }

        // Perform soft delete on user roles
        await userRoleRepo.softDelete({ userId: userId });

        // Perform soft delete - this will set deleted_at timestamp
        await userRepo.softDelete({ id: userId });

        return {
            success: true,
            message: 'Usuario eliminado correctamente'
        };
    },

    /**
     * Toggle user active status
     */
    async toggleUserStatus(userId: string, companyId: string, currentUserId: string) {
        const userRepo = getScopedRepository(User);
        const roleRepo = getScopedRepository(Role);

        // Prevent self-deactivation
        if (userId === currentUserId) {
            throw new Error('No puedes desactivar tu propio usuario');
        }

        const user = await userRepo['repository'].findOne({
            where: { id: userId },
            relations: ['userRoles', 'userRoles.role']
        });

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        // Check if user is a DIRECTOR and is being deactivated
        const isDirector = user.userRoles.some(
            (ur: any) => ur.role.code === 'DIRECTOR'
        );

        if (isDirector && user.isActive) {
            // Count active DIRECTOR users
            const directorRole = await roleRepo.findOne({
                where: { code: 'DIRECTOR' }
            });

            if (directorRole) {
                const activeDirectorCount = await userRepo['repository']
                    .createQueryBuilder('user')
                    .leftJoin('user.userRoles', 'userRole')
                    .where('user.companyId = :companyId', { companyId })
                    .andWhere('userRole.roleId = :roleId', { roleId: directorRole.id })
                    .andWhere('user.isActive = :isActive', { isActive: true })
                    .andWhere('user.deletedAt IS NULL')
                    .getCount();

                if (activeDirectorCount <= 1) {
                    throw new Error('No se puede desactivar al último director activo del sistema');
                }
            }
        }

        user.isActive = !user.isActive;
        await userRepo.save(user);

        return {
            success: true,
            message: `Usuario ${user.isActive ? 'activado' : 'desactivado'} correctamente`,
            isActive: user.isActive
        };
    },

    /**
     * Change user role
     */
    async changeUserRole(
        userId: string,
        companyId: string,
        newRoleCode: string,
        assignedById: string
    ) {
        const userRepo = getScopedRepository(User);
        const roleRepo = getScopedRepository(Role);
        const userRoleRepo = getScopedRepository(UserRole);

        const user = await userRepo['repository'].findOne({
            where: { id: userId, companyId },
            relations: ['userRoles']
        });

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        // Prevent self-role change
        if (userId === assignedById) {
            throw new Error('No puedes modificar tu propio rol');
        }

        // Find the new role
        const newRole = await roleRepo.findOne({
            where: { code: newRoleCode }
        });

        if (!newRole) {
            throw new Error('Rol no encontrado');
        }

        // Remove existing roles
        if (user.userRoles.length > 0) {
            await userRoleRepo['repository'].remove(user.userRoles);
        }

        // Assign new role
        const userRole = new UserRole();
        userRole.user = user;
        userRole.role = newRole;

        // Explicitly set IDs
        userRole.userId = user.id;
        userRole.roleId = newRole.id;
        userRole.companyId = companyId;
        userRole.assignedById = assignedById;

        userRole.assignedAt = new Date();

        await userRoleRepo.save(userRole);

        return {
            success: true,
            message: 'Rol actualizado correctamente',
            role: {
                id: newRole.id,
                name: newRole.name,
                code: newRole.code
            }
        };
    }
};
