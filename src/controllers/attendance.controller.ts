import { Response } from 'express';
import { AuthRequest } from '../interfaces/auth/jwt.interface';
import { attendanceService } from '../services/attendance.service';
import { bulkAttendanceSchema, updateAttendanceSchema, attendanceFiltersSchema, resolveAlertSchema } from '../schemas/attendance.schema';

export const attendanceController = {
    async bulkRegister(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const companyId = req.companyId;
            if (!userId || !companyId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const validatedData = bulkAttendanceSchema.parse(req.body);
            const result = await attendanceService.bulkRegister(companyId, userId, validatedData);
            return res.status(201).json({ success: true, count: result.length, message: 'Asistencia registrada correctamente' });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({ success: false, error: 'Datos inválidos', details: error.errors });
            }
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async updateAttendance(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const companyId = req.companyId;
            if (!userId || !companyId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const { id } = req.params;
            const validatedData = updateAttendanceSchema.parse(req.body);
            const result = await attendanceService.updateAttendance(companyId, userId, id, validatedData);
            return res.json({ success: true, data: result });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async lockAttendance(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const companyId = req.companyId;
            if (!userId || !companyId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const { levelId, date } = req.body;
            if (!levelId || !date) return res.status(400).json({ success: false, error: 'levelId y date son requeridos' });

            const result = await attendanceService.lockAttendance(companyId, userId, levelId, date);
            return res.json({ success: true, message: `Se bloquearon ${result.count} registros` });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async getAttendance(req: AuthRequest, res: Response) {
        try {
            const companyId = req.companyId;
            if (!companyId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const filters = attendanceFiltersSchema.parse(req.query);
            const result = await attendanceService.getAttendance(companyId, filters);
            return res.json({ success: true, ...result });
        } catch (error: any) {
            console.error('[AttendanceController] Error getting attendance:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    async getAlerts(req: AuthRequest, res: Response) {
        try {
            const companyId = req.companyId;
            if (!companyId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const alerts = await attendanceService.getAlerts(companyId);
            return res.json({ success: true, data: alerts });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    async resolveAlert(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const companyId = req.companyId;
            if (!userId || !companyId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const { id } = req.params;
            const validatedData = resolveAlertSchema.parse(req.body);
            const result = await attendanceService.resolveAlert(companyId, userId, id, validatedData);
            return res.json({ success: true, message: 'Alerta resuelta', data: result });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async exportReport(req: AuthRequest, res: Response) {
        try {
            const companyId = req.companyId;
            if (!companyId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const filters = attendanceFiltersSchema.parse(req.query);
            const data = await attendanceService.exportAttendanceReport(companyId, filters);

            const format = req.query.format as string;
            if (format === 'pdf') {
                const { pdfService } = require('../services/pdf.service');
                return pdfService.generateAttendanceReport(res, data, `Reporte ${filters.startDate || ''}`);
            }

            return res.json({ success: true, data });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    async upload(req: AuthRequest, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No se subió ningún archivo' });
            }
            // Logic to construct URL - ideally this should be a full URL if serving static, or relative
            // For now returning the path relative to server root
            const fileUrl = `/uploads/attendance/${req.file.filename}`;
            return res.json({ success: true, url: fileUrl });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    async notify(req: AuthRequest, res: Response) {
        try {
            const companyId = req.companyId;
            const { id } = req.params; // alertId
            const { message } = req.body;
            if (!companyId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            await attendanceService.sendManualNotification(companyId, id, message || 'Notificación de alerta de asistencia.');
            return res.json({ success: true });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};
