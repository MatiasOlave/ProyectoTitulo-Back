import { z } from 'zod';

export const companySchema = z.object({
    name: z
          .string()
          .min(2, 'Nombre debe tener al menos 2 caracteres'),
    legalName: z
          .string()
          .min(2, 'Razón social debe tener al menos 2 caracteres'),
    rut: z
          .string()
          .min(8, 'RUT debe tener al menos 8 caracteres'),
    email: z
          .string()
          .email('Email inválido'),
    phone: z
          .string()
          .optional(),
    address: z
          .string()
          .optional(),
    cityId: z
          .string()
          .uuid('ID de ciudad inválido'),
});

export const directorSchema = z.object({
    firstName: z
          .string()
          .min(2, 'Nombre debe tener al menos 2 caracteres'),
    lastName: z
          .string()
          .min(2, 'Apellido debe tener al menos 2 caracteres'),
    email: z
          .string()
          .email('Email inválido'),
    password: z
          .string()
          .min(6, 'Contraseña debe tener al menos 6 caracteres'),
    rut: z
          .string()
          .min(8, 'RUT debe tener al menos 8 caracteres'),
    phone: z
          .string()
          .optional(),
});


export const registerCompanySchema = z.object({
    company: companySchema,
    director: directorSchema
})