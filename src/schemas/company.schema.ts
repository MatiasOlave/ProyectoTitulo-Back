import { z } from 'zod';

export const createCompanySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    legalName: z.string().min(1, 'Legal Name is required'),
    rut: z.string().min(1, 'RUT is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    address: z.string().optional(),
    cityId: z.string().uuid('Invalid City ID'),
    logoUrl: z.string().optional(),
    isActive: z.boolean().optional().default(true),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
