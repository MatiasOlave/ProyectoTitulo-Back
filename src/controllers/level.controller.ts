import { Response } from 'express';
import { AuthRequest } from '../interfaces/auth/jwt.interface';
import { levelService } from '../services/students/level.service';

export const levelController = {
    async listLevels(req: AuthRequest, res: Response) {
        try {
            const levels = await levelService.listLevels(req.companyId!);
            return res.json({ success: true, levels });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};
