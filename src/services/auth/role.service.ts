// src/services/auth/role.service.ts
import { getScopedRepository } from '../../utils/scoped-repository';
import { Role } from '../../entities/auth/role.entity';
import { Permission } from '../../entities/auth/permission.entity';
import { RolePermission } from '../../entities/auth/role-permission.entity';
import { AppDataSource } from '../../config/database';
import { In } from 'typeorm';

export const roleService = {
    /**
     * List all available roles for the company
     * Includes both system roles and custom roles
     */
    async listRoles(companyId: string) {
        const roleRepo = getScopedRepository(Role);

        const roles = await roleRepo['repository'].find({
            where: { companyId },
            relations: ['rolePermissions', 'rolePermissions.permission'],
            order: { isSystemRole: 'DESC', name: 'ASC' }
        });

        return roles.map(role => ({
            id: role.id,
            name: role.name,
            code: role.code,
            description: role.description,
            isSystemRole: role.isSystemRole,
            permissions: role.rolePermissions.map((rp: any) => ({
                id: rp.permission.id,
                name: rp.permission.name,
                description: rp.permission.description
            })),
            createdAt: role.createdAt
        }));
    },

    /**
     * Create a custom role with specified permissions
     */
    async createRole(
        name: string,
        code: string,
        description: string,
        permissionIds: string[],
        companyId: string
    ) {
        const roleRepo = getScopedRepository(Role);
        const rolePermissionRepo = getScopedRepository(RolePermission);
        // Permission is a shared entity without companyId, use regular repository
        const permissionRepo = AppDataSource.getRepository(Permission);

        // Check if role code already exists in this company
        const existingRole = await roleRepo.findOne({
            where: { code }
        });

        if (existingRole) {
            throw new Error('Ya existe un rol con este código');
        }

        // Verify all permissions exist
        const permissions = await permissionRepo.find({
            where: { id: In(permissionIds) }
        });

        if (permissions.length !== permissionIds.length) {
            throw new Error('Uno o más permisos no son válidos');
        }

        // Create the role (companyId is set automatically by scoped repository)
        const role = roleRepo.create({
            name,
            code,
            description,
            isSystemRole: false
        });

        await roleRepo.save(role);

        // Assign permissions
        const rolePermissions = permissionIds.map(permissionId =>
            rolePermissionRepo.create({
                roleId: role.id,
                permissionId
            })
        );

        await rolePermissionRepo['repository'].save(rolePermissions);

        // Fetch the created role with permissions
        const createdRole = await roleRepo['repository'].findOne({
            where: { id: role.id, companyId },
            relations: ['rolePermissions', 'rolePermissions.permission']
        });

        return {
            id: createdRole!.id,
            name: createdRole!.name,
            code: createdRole!.code,
            description: createdRole!.description,
            isSystemRole: createdRole!.isSystemRole,
            permissions: createdRole!.rolePermissions.map((rp: any) => ({
                id: rp.permission.id,
                name: rp.permission.name,
                description: rp.permission.description
            }))
        };
    },

    /**
     * Update permissions for a custom role
     * System roles cannot be modified
     */
    async updateRolePermissions(
        roleId: string,
        permissionIds: string[],
        companyId: string
    ) {
        const roleRepo = getScopedRepository(Role);
        const rolePermissionRepo = getScopedRepository(RolePermission);
        // Permission is a shared entity without companyId, use regular repository
        const permissionRepo = AppDataSource.getRepository(Permission);

        // Find the role
        const role = await roleRepo['repository'].findOne({
            where: { id: roleId, companyId },
            relations: ['rolePermissions']
        });

        if (!role) {
            throw new Error('Rol no encontrado');
        }

        if (role.isSystemRole) {
            throw new Error('No se pueden modificar los roles del sistema');
        }

        // Verify all permissions exist
        const permissions = await permissionRepo.find({
            where: { id: In(permissionIds) }
        });

        if (permissions.length !== permissionIds.length) {
            throw new Error('Uno o más permisos no son válidos');
        }

        // Remove existing permissions
        if (role.rolePermissions.length > 0) {
            await rolePermissionRepo['repository'].remove(role.rolePermissions);
        }

        // Assign new permissions
        const rolePermissions = permissionIds.map(permissionId =>
            rolePermissionRepo.create({
                roleId: role.id,
                permissionId
            })
        );

        await rolePermissionRepo['repository'].save(rolePermissions);

        // Fetch updated role with permissions
        const updatedRole = await roleRepo['repository'].findOne({
            where: { id: roleId, companyId },
            relations: ['rolePermissions', 'rolePermissions.permission']
        });

        return {
            id: updatedRole!.id,
            name: updatedRole!.name,
            code: updatedRole!.code,
            description: updatedRole!.description,
            isSystemRole: updatedRole!.isSystemRole,
            permissions: updatedRole!.rolePermissions.map((rp: any) => ({
                id: rp.permission.id,
                name: rp.permission.name,
                description: rp.permission.description
            }))
        };
    }
};
