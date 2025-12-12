import { Request, Response } from 'express';
import { medicalIncidentService } from '../services/medicalIncident.service';

export const medicalIncidentController = {
    createMedicalIncident: async (req: Request, res: Response) => {
        try {
            const { studentId } = req.params;
            const companyId = (req as any).user.companyId;
            const userId = (req as any).user.userId;

            // req.body contains text fields
            // req.files contains file arrays
            const result = await medicalIncidentService.createMedicalIncident(
                companyId,
                studentId,
                req.body,
                req.files,
                userId
            );

            res.status(201).json(result);
        } catch (error: any) {
            console.error('Error creating medical incident:', error);
            res.status(500).json({ message: error.message || 'Error interno del servidor' });
        }
    },

    getMedicalIncidents: async (req: Request, res: Response) => {
        try {
            const companyId = (req as any).user.companyId;
            const {
                studentId,
                incidentType,
                severity,
                dateStart,
                dateEnd,
                page = 1,
                limit = 10
            } = req.query;

            const offset = (Number(page) - 1) * Number(limit);

            const result = await medicalIncidentService.getMedicalIncidents(companyId, {
                studentId: studentId as string,
                incidentType: incidentType as string,
                severity: severity as string,
                dateStart: dateStart as string,
                dateEnd: dateEnd as string,
                limit: Number(limit),
                offset
            });

            res.json(result);
        } catch (error: any) {
            console.error('Error fetching incidents:', error);
            res.status(500).json({ message: error.message || 'Error al obtener historial' });
        }
    },

    resolveIncident: async (req: Request, res: Response) => {
        try {
            const companyId = (req as any).user.companyId;
            const userId = (req as any).user.userId;
            const { incidentId } = req.params;
            const data = req.body;

            const result = await medicalIncidentService.resolveIncident(
                companyId,
                incidentId,
                data,
                userId
            );

            res.json(result);
        } catch (error: any) {
            console.error('Error resolving incident:', error);
            res.status(500).json({ message: error.message || 'Error al actualizar incidente' });
        }
    }
};
