import { Request, Response } from 'express';
import { inspectionService } from '../../services/transport/inspection.service';
import { CreateInspectionDto, ApproveInspectionDto } from '../../dtos/transport/inspection.dto';

export class InspectionController {

    async create(req: Request, res: Response): Promise<void> {
        try {
            const data: CreateInspectionDto = req.body;
            // validation manually or Zod
            if (!data.vehicleId || !data.driverId || !data.inspectionDate) {
                res.status(400).json({ message: 'Faltan campos obligatorios' });
                return;
            }

            const result = await inspectionService.create(data);
            res.status(201).json(result);
        } catch (error: any) {
            console.error('Error creating inspection:', error);
            res.status(500).json({ message: error.message || 'Error interno' });
        }
    }

    async getInspections(req: Request, res: Response): Promise<void> {
        try {
            const vehicleId = req.query.vehicleId as string;
            if (!vehicleId) {
                res.status(400).json({ message: 'Vehicle ID required' });
                return;
            }
            const result = await inspectionService.findAll(vehicleId);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message || 'Error interno' });
        }
    }

    async getInspection(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const result = await inspectionService.findOne(id);
            if (!result) {
                res.status(404).json({ message: 'Inspección no encontrada' });
                return;
            }
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message || 'Error interno' });
        }
    }

    async approve(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const userId = (req as any).user.id;
            const data: ApproveInspectionDto = req.body;

            const result = await inspectionService.approve(id, data, userId);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message || 'Error interno' });
        }
    }
}

export const inspectionController = new InspectionController();
