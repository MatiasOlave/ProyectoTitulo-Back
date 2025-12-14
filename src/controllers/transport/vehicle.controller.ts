import { Request, Response } from 'express';
import { vehicleService } from '../../services/transport/vehicles.service';
import { vehicleAlertsService } from '../../services/transport/vehicle-alerts.service';
import { inspectionService } from '../../services/transport/inspection.service';
import { CreateVehicleDto } from '../../dtos/transport/vehicle.dto';

export class VehicleController {

    async getInspections(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const inspections = await inspectionService.findAll(id);
            res.json(inspections);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getAlerts(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const companyId = (req as any).companyId; // Ensure middleware sets this, or extract from user
            // Actually companyContextMiddleware sets a global context, but good to pass explicitly if service needs.
            // Service uses getCompanyId() likely?
            // Let's check alert service: uses `getAlerts(vehicleId, companyId)`.
            // Wait, alert service signature I wrote: `getAlerts(vehicleId, companyId)`.
            // So pass companyId or use getCompanyId() inside service?
            // I wrote: `const vehicle = await this.vehicleRepo.findOne({ where: { id: vehicleId, companyId } });`
            // and signature: `async getAlerts(vehicleId: string, companyId: string)`
            // So controller must pass it. `getCompanyId()` is available here too or use context.
            // Import getCompanyId or rely on req?
            // Safer: `getCompanyId()`
            const { getCompanyId } = require('../../utils/context');
            const cid = getCompanyId();

            const alerts = await vehicleAlertsService.getAlerts(id, cid);
            res.json(alerts);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getVehicles(req: Request, res: Response) {
        if (!vehicleService) {
            console.error('CRITICAL: vehicleService is undefined');
            return res.status(500).json({ message: 'Internal Server Error: Service not initialized' });
        }
        try {
            const { search, status, capacity, driverId, routeId, alerts } = req.query;

            const filters = {
                search: search as string,
                status: status as string,
                capacity: capacity ? parseInt(capacity as string) : undefined,
                driverId: driverId as string,
                routeId: routeId as string,
                alerts: alerts === 'true'
            };

            const vehicles = await vehicleService.findAll(filters);
            return res.json(vehicles);
        } catch (error: any) {
            console.error('Error fetching vehicles:', error);
            return res.status(500).json({ message: error.message || 'Error al obtener vehículos' });
        }
    }

    async createVehicle(req: Request, res: Response) {
        try {
            const data: CreateVehicleDto = req.body;
            // Assuming req.user is populated by Auth Middleware

            const vehicle = await vehicleService.create(data);
            return res.status(201).json(vehicle);
        } catch (error: any) {
            console.error('Error creating vehicle:', error);
            if (error.message.includes('Ya existe')) {
                return res.status(409).json({ message: error.message });
            }
            return res.status(400).json({ message: error.message || 'Error al registrar vehículo' });
        }
    }

    async getVehicle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const vehicle = await vehicleService.findOne(id);
            return res.json(vehicle);
        } catch (error: any) {
            console.error('Error getting vehicle:', error);
            if (error.message === 'Vehículo no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message || 'Error al obtener vehículo' });
        }
    }

    async updateMileage(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { mileage } = req.body;
            const userId = (req as any).user?.id || 'system';

            if (!mileage) {
                res.status(400).json({ message: 'Se requiere el nuevo kilometraje' });
                return;
            }

            const vehicle = await vehicleService.updateMileage(id, parseInt(mileage), userId);
            res.json(vehicle);
        } catch (error: any) {
            console.error('Error updating mileage:', error);
            if (error.message.includes('mayor al actual')) {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json({ message: error.message || 'Error interno' });
        }
    }

    async updateVehicle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data: CreateVehicleDto = req.body;
            const updatedVehicle = await vehicleService.update(id, data);
            return res.json(updatedVehicle);
        } catch (error: any) {
            console.error('Error updating vehicle:', error);
            if (error.message.includes('Ya existe')) {
                return res.status(409).json({ message: error.message });
            }
            if (error.message === 'Vehículo no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message || 'Error al actualizar vehículo' });
        }
    }

    async deleteVehicle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await vehicleService.softDelete(id);
            return res.status(204).send();
        } catch (error: any) {
            console.error('Error deleting vehicle:', error);
            if (error.message === 'Vehículo no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message || 'Error al dar de baja el vehículo' });
        }
    }
}

export const vehicleController = new VehicleController();
