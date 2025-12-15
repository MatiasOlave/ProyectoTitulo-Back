import { Request, Response } from 'express';
import { driverService } from '../../services/transport/driver.service';
import { CreateDriverDto } from '../../dtos/transport/driver.dto';

export class DriverController {
    async getDrivers(req: Request, res: Response) {
        try {
            // Extract query parameters
            const filters = {
                q: req.query.q,
                status: req.query.status,
                vehicleId: req.query.vehicleId,
                hasAlerts: req.query.hasAlerts,
                licenseStatus: req.query.licenseStatus
            };

            const drivers = await driverService.findAll(filters);
            return res.json(drivers);
        } catch (error) {
            console.error('Error fetching drivers:', error);
            return res.status(500).json({ message: 'Error al obtener conductores' });
        }
    }

    async createDriver(req: Request, res: Response) {
        try {
            const data: CreateDriverDto = req.body;
            // Assuming req.user is populated by Auth Middleware
            const createdById = (req as any).user?.id;

            if (!createdById) {
                return res.status(401).json({ message: 'Usuario no autenticado' });
            }

            const driver = await driverService.create(data, createdById);
            return res.status(201).json(driver);
        } catch (error: any) {
            console.error('Error creating driver:', error);
            return res.status(400).json({ message: error.message || 'Error al crear conductor' });
        }
    }

    async getDriver(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const driver = await driverService.findOne(id);
            return res.json(driver);
        } catch (error: any) {
            console.error('Error getting driver:', error);
            if (error.message === 'Conductor no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message || 'Error al obtener conductor' });
        }
    }

    async deleteDriver(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await driverService.delete(id);
            return res.status(200).json({ message: 'Conductor dado de baja exitosamente' });
        } catch (error: any) {
            console.error('Error deleting driver:', error);
            if (error.message === 'Conductor no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message || 'Error al dar de baja conductor' });
        }
    }

    // --- Document Endpoints ---

    async uploadDocument(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const file = req.file;
            const data = req.body;
            // Assuming req.user is populated
            const uploadedById = (req as any).user?.id || (req as any).user?.sub; // Adjust based on user entity

            if (!file) return res.status(400).json({ message: 'No se ha subido ningún archivo' });
            if (!uploadedById) return res.status(401).json({ message: 'Usuario no autenticado' });

            const document = await driverService.uploadDocument(id, file, data, uploadedById);
            return res.status(201).json(document);
        } catch (error: any) {
            console.error('Error uploading document:', error);
            return res.status(500).json({ message: error.message || 'Error al subir documento' });
        }
    }

    async getDocuments(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const documents = await driverService.getDocuments(id);
            return res.json(documents);
        } catch (error: any) {
            console.error('Error getting documents:', error);
            return res.status(500).json({ message: error.message || 'Error al obtener documentos' });
        }
    }

    async verifyDocument(req: Request, res: Response) {
        try {
            const { docId } = req.params; // Make sure route uses :docId
            const { notes } = req.body;
            const verifierId = (req as any).user?.id;

            if (!verifierId) return res.status(401).json({ message: 'Usuario no autenticado' });

            const document = await driverService.verifyDocument(docId, verifierId, notes);
            return res.json(document);
        } catch (error: any) {
            console.error('Error verifying document:', error);
            return res.status(500).json({ message: error.message || 'Error al verificar documento' });
        }
    }

    async deleteDocument(req: Request, res: Response) {
        try {
            const { docId } = req.params;
            await driverService.deleteDocument(docId);
            return res.status(200).json({ message: 'Documento eliminado correctamente' });
        } catch (error: any) {
            console.error('Error deleting document:', error);
            return res.status(500).json({ message: error.message || 'Error al eliminar documento' });
        }
    }

    // --- Alert Management Endpoints ---

    async getAlerts(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || (req as any).user?.sub;
            if (!userId) return res.status(401).json({ message: 'Usuario no autenticado' });

            const alerts = await driverService.getAlerts(userId);
            return res.json(alerts);
        } catch (error: any) {
            console.error('Error getting alerts:', error);
            return res.status(500).json({ message: error.message || 'Error al obtener alertas' });
        }
    }

    async acknowledgeAlert(req: Request, res: Response) {
        try {
            const { alertId } = req.params;
            const userId = (req as any).user?.id || (req as any).user?.sub;
            if (!userId) return res.status(401).json({ message: 'Usuario no autenticado' });

            const alert = await driverService.acknowledgeAlert(alertId, userId);
            return res.json(alert);
        } catch (error: any) {
            console.error('Error acknowledging alert:', error);
            return res.status(500).json({ message: error.message || 'Error al reconocer alerta' });
        }
    }

    async resolveAlert(req: Request, res: Response) {
        try {
            const { alertId } = req.params;
            const userId = (req as any).user?.id || (req as any).user?.sub;
            if (!userId) return res.status(401).json({ message: 'Usuario no autenticado' });

            const alert = await driverService.resolveAlert(alertId, userId);
            return res.json(alert);
        } catch (error: any) {
            console.error('Error resolving alert:', error);
            return res.status(500).json({ message: error.message || 'Error al resolver alerta' });
        }
    }

    async updateDriver(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const driverId = req.params.id;
            const data = req.body;
            const updatedDriver = await driverService.update(driverId, data, userId);
            return res.json(updatedDriver);
        } catch (error: any) {
            console.error('Error updating driver:', error);
            return res.status(500).json({ message: error.message || 'Error al actualizar conductor' });
        }
    }

    async suspendDriver(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { reason, startDate, endDate } = req.body;
            const userId = (req as any).user?.id || (req as any).user?.sub;

            if (!userId) return res.status(401).json({ message: 'Usuario no autenticado' });
            if (!reason || !startDate || !endDate) return res.status(400).json({ message: 'Faltan datos de suspensión' });

            const driver = await driverService.suspendDriver(id, { reason, startDate, endDate }, userId);
            return res.json(driver);
        } catch (error: any) {
            console.error('Error suspending driver:', error);
            if (error.message === 'Conductor no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message || 'Error al suspender conductor' });
        }
    }

    async terminateDriver(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { terminationDate } = req.body;

            if (!terminationDate) {
                return res.status(400).json({ message: 'Fecha de terminación requerida' });
            }

            await driverService.terminateDriver(id, terminationDate);
            return res.status(200).json({ message: 'Chofer dado de baja exitosamente' });
        } catch (error: any) {
            console.error('Error terminating driver:', error);
            if (error.message === 'Conductor no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message || 'Error al dar de baja conductor' });
        }
    }

    // --- Vehicle Assignment Endpoints ---

    async listAvailableVehicles(req: Request, res: Response) {
        try {
            const vehicles = await driverService.getAvailableVehicles();
            return res.json(vehicles);
        } catch (error: any) {
            console.error('Error getting available vehicles:', error);
            return res.status(500).json({ message: error.message || 'Error al obtener vehículos disponibles' });
        }
    }

    async assignVehicle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { vehicleId, isPrimary, assignmentDate } = req.body;
            const assignedById = (req as any).user?.id || (req as any).user?.sub;

            if (!assignedById) return res.status(401).json({ message: 'Usuario no autenticado' });
            if (!vehicleId || !assignmentDate) return res.status(400).json({ message: 'Datos incompletos para asignación' });

            const assignment = await driverService.assignVehicle(id, { vehicleId, isPrimary, assignmentDate }, assignedById);
            return res.status(201).json(assignment);
        } catch (error: any) {
            console.error('Error assigning vehicle:', error);
            if (error.message.includes('no encontrado') || error.message.includes('ya tiene asignado')) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message || 'Error al asignar vehículo' });
        }
    }

    async unassignVehicle(req: Request, res: Response) {
        try {
            const { assignmentId } = req.params;
            const { unassignmentDate, reason } = req.body;
            const unassignedById = (req as any).user?.id || (req as any).user?.sub;

            if (!unassignedById) return res.status(401).json({ message: 'Usuario no autenticado' });
            if (!unassignmentDate || !reason) return res.status(400).json({ message: 'Fecha y motivo requeridos' });

            const assignment = await driverService.unassignVehicle(assignmentId, { unassignmentDate, reason }, unassignedById);
            return res.json(assignment);
        } catch (error: any) {
            console.error('Error unassigning vehicle:', error);
            return res.status(500).json({ message: error.message || 'Error al desasignar vehículo' });
        }
    }
}

export const driverController = new DriverController();
