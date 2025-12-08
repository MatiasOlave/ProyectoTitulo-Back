import { z } from 'zod';

// Schema for creating a new student
// Based on Student entity fields: firstName, lastName, rut, birthDate, gender, address, enrollmentDate
export const createStudentSchema = z.object({
    firstName: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
    lastName: z.string().min(2, 'Apellido debe tener al menos 2 caracteres'),
    rut: z.string().min(8, 'RUT debe tener al menos 8 caracteres'),
    birthDate: z.string().transform((str) => new Date(str)), // Expecting ISO string or similar
    gender: z.string().min(1, 'Género es requerido'),
    address: z.string().min(5, 'Dirección debe tener al menos 5 caracteres'),
    enrollmentDate: z.string().transform((str) => new Date(str)),
    // Optional fields initially or handled later
    email: z.string().email().optional(), // If student has email
    phone: z.string().optional(),
    photoUrl: z.string().url().optional(),
    levelId: z.string().uuid().optional(),
    cityId: z.string().uuid().optional(),
});

// Schema for updating a student
export const updateStudentSchema = z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    rut: z.string().min(8).optional(),
    birthDate: z.string().transform((str) => new Date(str)).optional(),
    gender: z.string().min(1).optional(),
    address: z.string().min(5).optional(),
    enrollmentDate: z.string().transform((str) => new Date(str)).optional(),
    status: z.string().optional(),
    photoUrl: z.string().url().optional().or(z.literal('')).nullable(),
    levelId: z.string().uuid().optional().nullable().or(z.literal('')),
    cityId: z.string().uuid().optional().nullable().or(z.literal('')),
    withdrawalDate: z.string().transform((str) => str ? new Date(str) : null).optional().nullable().or(z.literal('')),
    withdrawalReason: z.string().optional().nullable(),
});

// Schema for student filters
export const studentFiltersSchema = z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    levelId: z.string().optional(),
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10)
});
