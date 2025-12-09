// src/services/auth/user.service.ts
import bcrypt from 'bcryptjs';
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
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        rut: string,
        phone: string,
        roleCode: string,
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

        // Find the role
        const role = await roleRepo.findOne({
            where: { code: roleCode }
        });

        if (!role) {
            throw new Error('Rol no encontrado');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user (companyId is set automatically by scoped repository)
        const user = userRepo.create({
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

        // Assign role
        const userRole = userRoleRepo.create({
            userId: user.id,
            roleId: role.id,
            assignedById: createdById,
            assignedAt: new Date()
        });

        await userRoleRepo.save(userRole);

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            rut: user.rut,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            role: {
                id: role.id,
                name: role.name,
                code: role.code
            }
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
        }
    ) {
        const userRepo = getScopedRepository(User);

        const user = await userRepo.findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        // If updating RUT, check it's not already in use
        if (updates.rut && updates.rut !== user.rut) {
            const existingRut = await userRepo.findOne({
                where: { rut: updates.rut }
            });

            if (existingRut) {
                throw new Error('El RUT ya está registrado en esta empresa');
            }
        }

        // Apply updates
        Object.assign(user, updates);
        await userRepo.save(user);

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            rut: user.rut,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive
        };
    },

    /**
     * Deactivate user (soft delete)
     */
    async deactivateUser(userId: string, companyId: string) {
        const userRepo = getScopedRepository(User);

        const user = await userRepo.findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        if (!user.isActive) {
            throw new Error('El usuario ya está desactivado');
        }

        user.isActive = false;
        await userRepo.save(user);

        return {
            success: true,
            message: 'Usuario desactivado correctamente'
        };
    },

    /**
     * Toggle user active status
     */
    async toggleUserStatus(userId: string, companyId: string) {
        const userRepo = getScopedRepository(User);

        const user = await userRepo.findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new Error('Usuario no encontrado');
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
        const userRole = userRoleRepo.create({
            userId: user.id,
            roleId: newRole.id,
            assignedById,
            assignedAt: new Date()
        });

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
