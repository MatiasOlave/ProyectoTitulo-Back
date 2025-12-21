import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth/jwt.interface';
import { routeService } from '../../services/transport/route.service';

// Helper to translate DB errors
const translateError = (error: any): string => {
    const msg = error.message || '';
    if (msg.includes("Field 'student_id' doesn't have a default value")) return 'Error interno: Una parada no tiene estudiante asignado.';
    if (msg.includes("Out of range value")) return 'Coordenadas fuera de rango permitido.';
    if (msg.includes("duplicate entry")) return 'Ya existe un registro con estos datos.';
    return msg; // Return original if no translation match
};

export const routeController = {
    async getRoutes(req: AuthRequest, res: Response) {
        try {
            const filters = {
                search: req.query.search as string,
                status: req.query.status as string,
                driverId: req.query.driverId as string,
                isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
            };
            const routes = await routeService.getRoutes(req.companyId!, filters);
            return res.json({ success: true, routes });
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ success: false, error: 'Error al cargar rutas' });
        }
    },

    async getRouteById(req: AuthRequest, res: Response) {
        try {
            const route = await routeService.getRouteById(req.params.id, req.companyId!);
            if (!route) return res.status(404).json({ success: false, error: 'Ruta no encontrada' });
            return res.json({ success: true, ...route });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: 'Error al cargar ruta' });
        }
    },

    async createRoute(req: AuthRequest, res: Response) {
        try {
            const route = await routeService.createRoute(req.body, req.companyId!, req.user!.userId);
            return res.status(201).json({ success: true, route });
        } catch (error: any) {
            console.error('Error creating route:', error);
            const translated = translateError(error);
            return res.status(400).json({ success: false, error: translated || 'Error al crear ruta' });
        }
    },

    async updateRoute(req: AuthRequest, res: Response) {
        try {
            const route = await routeService.updateRoute(req.params.id, req.body, req.companyId!);
            return res.json({ success: true, route });
        } catch (error: any) {
            console.error(error);
            const translated = translateError(error);
            return res.status(400).json({ success: false, error: translated || 'Error al actualizar ruta' });
        }
    },

    async deleteRoute(req: AuthRequest, res: Response) {
        try {
            await routeService.deleteRoute(req.params.id, req.companyId!);
            return res.json({ success: true, message: 'Ruta eliminada correctamente' });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async toggleStatus(req: AuthRequest, res: Response) {
        try {
            const route = await routeService.toggleStatus(req.params.id, req.companyId!);
            return res.json({ success: true, route });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    }
};
