import { z } from 'zod';

// Schema for creating a new student
// Based on Student entity fields: firstName, lastName, rut, birthDate, gender, address, enrollmentDate
// Schema for creating a new student - Moved below
// export const createStudentSchema = ...

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
    enrollmentNumber: z.string().optional(),
    routeId: z.string().optional().nullable().or(z.literal('')) // New field for route assignment
});

// Schema for student filters
export const studentFiltersSchema = z.object({
    search: z.string().optional(),
    name: z.string().optional(),
    rut: z.string().optional(),
    status: z.string().optional(),
    levelId: z.string().optional(),
    age_min: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    age_max: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    enrollment_year: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10)
});

// Emergency Contact Schema
const emergencyContactSchema = z.object({
    name: z.string().min(2, 'Nombre de contacto requerido'),
    phone: z.string().min(8, 'Teléfono de contacto requerido'),
    relationship: z.string().min(2, 'Parentesco requerido'),
    email: z.string().email().optional().or(z.literal('')),
});

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
    levelId: z.string().uuid('ID de nivel inválido'), // Required

    // Optional fields
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    photoUrl: z.string().url().optional().or(z.literal('')),
    cityId: z.string().uuid().optional().or(z.literal('')),
    enrollmentNumber: z.string().optional().or(z.literal('')), // Optional, auto-generated if missing

    // Transport
    routeId: z.string().uuid().optional().nullable().or(z.literal('')),

    // Emergency Contacts (Required Min 1)
    emergencyContacts: z.array(emergencyContactSchema).min(1, 'Debe ingresar al menos un contacto de emergencia')
});
