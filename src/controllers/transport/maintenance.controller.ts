import { Request, Response } from 'express';
import { maintenanceService } from '../../services/transport/maintenance.service';
import { CreateMaintenanceDto, MaintenanceQueryDto } from '../../dtos/transport/maintenance.dto';

export class MaintenanceController {

    async getMaintenances(req: Request, res: Response): Promise<void> {
        try {
            const query: MaintenanceQueryDto = {
                vehicleId: req.query.vehicleId as string,
                maintenanceType: req.query.maintenanceType as string,
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
            };

            const maintenances = await maintenanceService.findAll(query);
            res.json(maintenances);
        } catch (error: any) {
            console.error('Error fetching maintenances:', error);
            res.status(500).json({ message: error.message || 'Error interno del servidor' });
        }
    }

    async createMaintenance(req: Request, res: Response): Promise<void> {
        try {
            // req.user check handled by authMiddleware
            const userId = (req as any).user.id;
            const data: CreateMaintenanceDto = req.body;

            // Basic validation provided by DTO interface structure at typescript level, 
            // but for runtime we assume payload is correct or add manual checks.
            // Zod or class-validator is ideal but sticking to pattern seen in other controllers.

            if (!data.vehicleId || !data.serviceDate || !data.totalCost) {
                res.status(400).json({ message: 'Faltan campos obligatorios' });
                return;
            }

            const maintenance = await maintenanceService.create(data, userId);
            res.status(201).json(maintenance);
        } catch (error: any) {
            console.error('Error creating maintenance:', error);
            res.status(500).json({ message: error.message || 'Error interno del servidor' });
        }
    }
}

export const maintenanceController = new MaintenanceController();
