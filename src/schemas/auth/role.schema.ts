import { z } from 'zod';

// Schema for creating a custom role
export const createRoleSchema = z.object({
    name: z
        .string()
        .min(2, 'Nombre debe tener al menos 2 caracteres'),
    code: z
        .string()
        .min(2, 'Código debe tener al menos 2 caracteres')
        .regex(/^[a-z_]+$/, 'Código debe contener solo letras minúsculas y guiones bajos'),
    description: z
        .string()
        .min(10, 'Descripción debe tener al menos 10 caracteres'),
    permissionIds: z
        .array(z.string().uuid('ID de permiso inválido'))
        .min(1, 'Debe asignar al menos un permiso')
});

// Schema for updating role permissions
export const updateRolePermissionsSchema = z.object({
    permissionIds: z
        .array(z.string().uuid('ID de permiso inválido'))
        .min(1, 'Debe asignar al menos un permiso')
});
