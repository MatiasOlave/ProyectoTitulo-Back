import { z } from 'zod';

// Schema for creating a new user
export const createUserSchema = z.object({
    email: z
        .string()
        .email('Email inválido'),
    password: z
        .string()
        .min(6, 'Contraseña debe tener al menos 6 caracteres'),
    firstName: z
        .string()
        .min(2, 'Nombre debe tener al menos 2 caracteres'),
    lastName: z
        .string()
        .min(2, 'Apellido debe tener al menos 2 caracteres'),
    rut: z
        .string()
        .min(8, 'RUT debe tener al menos 8 caracteres'),
    phone: z
        .string()
        .min(8, 'Teléfono debe tener al menos 8 caracteres'),
    roleCode: z
        .string()
        .min(1, 'Rol es requerido'),
    avatarUrl: z
        .string()
        .url('URL de avatar inválida')
        .optional()
});

// Schema for updating a user
export const updateUserSchema = z.object({
    firstName: z
        .string()
        .min(2, 'Nombre debe tener al menos 2 caracteres')
        .optional(),
    lastName: z
        .string()
        .min(2, 'Apellido debe tener al menos 2 caracteres')
        .optional(),
    rut: z
        .string()
        .min(8, 'RUT debe tener al menos 8 caracteres')
        .optional(),
    phone: z
        .string()
        .min(8, 'Teléfono debe tener al menos 8 caracteres')
        .optional(),
    avatarUrl: z
        .string()
        .url('URL de avatar inválida')
        .optional()
        .nullable()
});

// Schema for changing user role
export const changeRoleSchema = z.object({
    roleCode: z
        .string()
        .min(1, 'Rol es requerido')
});

// Schema for user filters (query parameters)
export const userFiltersSchema = z.object({
    search: z
        .string()
        .optional(),
    roleCode: z
        .string()
        .optional(),
    isActive: z
        .enum(['true', 'false'])
        .optional()
        .transform(val => val === undefined ? undefined : val === 'true'),
    page: z
        .string()
        .optional()
        .transform(val => val ? parseInt(val, 10) : 1),
    limit: z
        .string()
        .optional()
        .transform(val => val ? parseInt(val, 10) : 10)
});
