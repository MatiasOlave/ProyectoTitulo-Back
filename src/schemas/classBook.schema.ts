import { z } from 'zod';

export const createClassBookEntrySchema = z.object({
    date: z.string().transform((str) => {
        // Create date at noon to avoid timezone shifting issues on save
        // Input: "YYYY-MM-DD"
        const [year, month, day] = str.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0);
    }),
    levelId: z.string().uuid(),
    activitiesPerformed: z.string().min(1, { message: 'Las actividades realizadas son obligatorias' }),
    coreLearningAreas: z.any().optional(),
    resourcesUsed: z.string().min(1, { message: 'Los recursos utilizados son obligatorios' }),
    teachingMethodology: z.string().optional(),
    learningEnvironment: z.string().optional(),
    achievements: z.string().optional(),
    challenges: z.string().optional(),
    incidents: z.string().optional(),
    specialActivities: z.string().optional(),
    familyCommunications: z.string().optional(),
});

export const updateClassBookEntrySchema = createClassBookEntrySchema.partial();

export const classBookFiltersSchema = z.object({
    date: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    levelId: z.string().optional(),
    teacherId: z.string().optional(),
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('10').transform(Number),
    bookId: z.string().optional(), // Added bookId
});

export const createClassBookSchema = z.object({
    levelId: z.string().uuid({ message: 'El nivel es requerido' }),
    headTeacherId: z.string().uuid({ message: 'El profesor jefe es requerido' }),
});

export const createObservationSchema = z.object({
    studentId: z.string().uuid(),
    observation: z.string().min(1),
    category: z.string().default('general'),
    isPositive: z.boolean().default(true),
    requiresFollowUp: z.boolean().default(false),
    isSharedWithGuardian: z.boolean().default(false),
    developmentArea: z.string().optional(),
    coreLearning: z.string().optional(),
    achievementLevel: z.string().optional(),
    suggestedActions: z.string().optional(),
});

export type CreateClassBookEntryDTO = z.infer<typeof createClassBookEntrySchema>;
export type UpdateClassBookEntryDTO = z.infer<typeof updateClassBookEntrySchema>;
export type ClassBookFiltersDTO = z.infer<typeof classBookFiltersSchema>;
export type CreateObservationDTO = z.infer<typeof createObservationSchema>;
export type CreateClassBookDTO = z.infer<typeof createClassBookSchema>;
