import { AppDataSource } from '../config/database';
import { Permission } from '../entities/auth/permission.entity';
import { RolePermission } from '../entities/auth/role-permission.entity';

async function revertStudentPermissions() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected for reverting permissions...');

        const permissionRepo = AppDataSource.getRepository(Permission);
        const rolePermissionRepo = AppDataSource.getRepository(RolePermission);

        const permissionsToDelete = [
            'student:read',
            'student:create',
            'student:update',
            'student:delete'
        ];

        for (const name of permissionsToDelete) {
            const permission = await permissionRepo.findOne({ where: { name } });
            if (permission) {
                console.log(`Found permission to delete: ${name} (ID: ${permission.id})`);

                // Delete associations first
                const deletedAssociations = await rolePermissionRepo.delete({ permissionId: permission.id });
                console.log(`Deleted ${deletedAssociations.affected} role associations for ${name}`);

                // Delete permission
                await permissionRepo.remove(permission);
                console.log(`Deleted permission: ${name}`);
            } else {
                console.log(`Permission ${name} not found.`);
            }
        }

        console.log('Reversion of student permissions completed.');

    } catch (error) {
        console.error('Error reverting student permissions:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

revertStudentPermissions();
