import { z } from 'zod';

const coreLearningAreaSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    objectives: z.array(z.string()).optional(),
});

const activitySchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    description: z.string(),
    duration: z.string().optional(),
    resources: z.array(z.string()).optional(),
});

export const createPlanningSchema = z.object({
    title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
    planningType: z.enum(['weekly', 'monthly', 'project', 'unit']),
    startDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Fecha de inicio inválida" }),
    endDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Fecha de fin inválida" }),
    levelId: z.string().uuid('ID de nivel inválido'),

    objectives: z.string().min(1, 'Los objetivos son requeridos'),
    coreLearningAreas: z.array(coreLearningAreaSchema).optional(),
    activities: z.array(activitySchema).optional(),
    resources: z.string().min(1, 'Los recursos son requeridos'),
    evaluationCriteria: z.string().min(1, 'Criterios de evaluación son requeridos'),
    expectedOutcomes: z.string().min(1, 'Resultados esperados son requeridos'),

    adaptations: z.string().optional(),
    studentContext: z.string().optional(),
    isTemplate: z.boolean().optional(),
    templateName: z.string().optional(),
});

export const updatePlanningSchema = createPlanningSchema.partial().extend({
    status: z.enum(['draft', 'submitted', 'approved', 'rejected']).optional()
});

export const reviewPlanningSchema = z.object({
    action: z.enum(['approve', 'reject', 'request_changes']),
    feedback: z.string().optional(),
});
