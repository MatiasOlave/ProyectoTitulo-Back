import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth/jwt.interface';
import { routeService } from '../../services/transport/route.service';

export const routeController = {
    async getRoutes(req: AuthRequest, res: Response) {
        try {
            const routes = await routeService.getRoutes(req.companyId!);
            return res.json({ success: true, routes });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: 'Error al cargar rutas' });
        }
    }
};
