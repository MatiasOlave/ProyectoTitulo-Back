import { z } from 'zod';

export const bulkAttendanceSchema = z.object({
    levelId: z.string().uuid(),
    date: z.string().transform((str) => new Date(str)),
    students: z.array(
        z.object({
            studentId: z.string().uuid(),
            status: z.enum(['present', 'absent', 'late', 'excused']),
            checkInTime: z.string().optional().nullable(),
            checkOutTime: z.string().optional().nullable(),
            lateMinutes: z.number().int().optional().nullable(),
            absenceReason: z.string().optional().nullable(),
            observations: z.string().optional().nullable(),
            justificationDocumentUrl: z.string().url().optional().nullable(),
        })
    )
});

export const updateAttendanceSchema = z.object({
    status: z.enum(['present', 'absent', 'late', 'excused']).optional(),
    checkInTime: z.string().optional().nullable(),
    checkOutTime: z.string().optional().nullable(),
    lateMinutes: z.number().int().optional().nullable(),
    absenceReason: z.string().optional().nullable(),
    observations: z.string().optional().nullable(),
    justificationDocumentUrl: z.string().url().optional().nullable(),
});

export const attendanceFiltersSchema = z.object({
    studentId: z.string().uuid().optional(),
    levelId: z.string().uuid().optional(),
    startDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
    endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
});

export const resolveAlertSchema = z.object({
    actionTaken: z.string().optional(),
    notes: z.string().optional(),
});
