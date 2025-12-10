import { Response } from 'express';
import { AuthRequest } from '../interfaces/auth/jwt.interface';
import { levelService } from '../services/students/level.service';

export const levelController = {
    async listLevels(req: AuthRequest, res: Response) {
        try {
            const filters = req.query;
            const levels = await levelService.listLevels(req.companyId!, filters);
            return res.json({ success: true, levels });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    async createLevel(req: AuthRequest, res: Response) {
        try {
            const level = await levelService.createLevel(req.companyId!, req.body);
            return res.status(201).json({ success: true, level });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async deleteLevel(req: AuthRequest, res: Response) {
        try {
            await levelService.deleteLevel(req.companyId!, req.params.id);
            return res.json({ success: true, message: 'Nivel eliminado correctamente' });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async assignStudent(req: AuthRequest, res: Response) {
        try {
            const { studentId } = req.body;
            if (!studentId) return res.status(400).json({ success: false, error: 'studentId es requerido' });

            await levelService.assignStudent(req.companyId!, req.params.levelId, studentId);
            return res.json({ success: true, message: 'Estudiante asignado correctamente' });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async getStudentsByLevel(req: AuthRequest, res: Response) {
        try {
            const students = await levelService.getStudentsByLevel(req.companyId!, req.params.levelId);
            return res.json({ success: true, students });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async updateLevel(req: AuthRequest, res: Response) {
        try {
            const level = await levelService.updateLevel(req.companyId!, req.params.id, req.body);
            return res.json({ success: true, level });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async getLevelDetails(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const level = await levelService.getLevelDetails(req.companyId!, id);
            return res.json({ success: true, level });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};
