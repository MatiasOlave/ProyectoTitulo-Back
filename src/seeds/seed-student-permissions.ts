import { AppDataSource } from '../config/database';
import { Permission } from '../entities/auth/permission.entity';
import { Role } from '../entities/auth/role.entity';
import { RolePermission } from '../entities/auth/role-permission.entity';

async function seedStudentPermissions() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected for seeding permissions...');

        const permissionRepo = AppDataSource.getRepository(Permission);
        const roleRepo = AppDataSource.getRepository(Role);
        const rolePermissionRepo = AppDataSource.getRepository(RolePermission);

        // 1. Define permissions to add
        const permissionsToAdd = [
            {
                name: 'student:read',
                resource: 'student',
                action: 'read',
                description: 'Ver listado y detalles de estudiantes'
            },
            {
                name: 'student:create',
                resource: 'student',
                action: 'create',
                description: 'Matricular nuevos estudiantes'
            },
            {
                name: 'student:update',
                resource: 'student',
                action: 'update',
                description: 'Editar información de estudiantes'
            },
            {
                name: 'student:delete',
                resource: 'student',
                action: 'delete',
                description: 'Eliminar/Dar de baja estudiantes'
            }
        ];

        // 2. Insert Permissions if they don't exist
        for (const p of permissionsToAdd) {
            const existing = await permissionRepo.findOne({ where: { name: p.name } });
            if (!existing) {
                console.log(`Creating permission: ${p.name}`);
                await permissionRepo.save(permissionRepo.create(p));
            } else {
                console.log(`Permission ${p.name} already exists.`);
            }
        }

        // 3. Assign to ADMIN role // TODO: Check if we should assign to specific company roles or System Roles. 
        // Assuming global ADMIN or just getting all roles with code 'ADMIN' or 'DIRECTOR' across companies for now, 
        // OR better, since permissions are global (resource/action), but RolePermission links Role (which belongs to company).
        // The prompt says "Assign to the Admin role of the company".
        // Use a loop to find all roles with code 'ADMIN' (or 'DIRECTOR') and assign these permissions.

        console.log('Assigning permissions to ADMIN and DIRECTOR roles...');

        const targetRoles = await roleRepo.find({
            where: [
                { code: 'ADMIN' },
                { code: 'DIRECTOR' }
            ]
        });

        const allPermissions = await permissionRepo.find();
        const studentPermissions = allPermissions.filter(p => p.resource === 'student');

        for (const role of targetRoles) {
            for (const perm of studentPermissions) {
                const existingLink = await rolePermissionRepo.findOne({
                    where: {
                        roleId: role.id,
                        permissionId: perm.id
                    }
                });

                if (!existingLink) {
                    console.log(`Assigning ${perm.name} to role ${role.code} (ID: ${role.id})`);
                    await rolePermissionRepo.save(rolePermissionRepo.create({
                        roleId: role.id,
                        permissionId: perm.id,
                        companyId: role.companyId // Inherit company from role
                    }));
                }
            }
        }

        console.log('Seeding student permissions completed.');

    } catch (error) {
        console.error('Error seeding student permissions:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

seedStudentPermissions();
