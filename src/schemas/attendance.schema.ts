import { z } from 'zod';

export const bulkAttendanceSchema = z.object({
    levelId: z.string().uuid(),
    classBookEntryId: z.string().uuid().optional(),
    date: z.string().transform((str) => {
        const [year, month, day] = str.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0);
    }),
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
    classBookEntryId: z.string().uuid().optional(),
    date: z.string().optional().transform((str) => {
        if (!str) return undefined;
        const [year, month, day] = str.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0);
    }),
    startDate: z.string().optional().transform((str) => {
        if (!str) return undefined;
        const [year, month, day] = str.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0);
    }),
    endDate: z.string().optional().transform((str) => {
        if (!str) return undefined;
        const [year, month, day] = str.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0);
    }),
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
});

export const resolveAlertSchema = z.object({
    actionTaken: z.string().optional(),
    notes: z.string().optional(),
});
