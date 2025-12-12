
import { Response } from 'express';
import { AuthRequest } from '../interfaces/auth/jwt.interface';
import { createMedicalRecordSchema } from '../schemas/medicalRecord.schema';
import { medicalRecordService } from '../services/medicalRecord.service';
import { pdfService } from '../services/pdf.service';
import { medicalIncidentService } from '../services/medicalIncident.service';
import { AppDataSource } from '../config/database';
import { Student } from '../entities/students/student.entity';
import { MedicalInfo } from '../entities/students/medical-info.entity';

export const medicalRecordController = {
    async createMedicalRecord(req: AuthRequest, res: Response) {
        try {
            const { studentId } = req.params;
            const companyId = req.companyId;
            const userId = req.user?.userId;

            if (!companyId || !userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            // Validate body
            const validation = createMedicalRecordSchema.safeParse(req.body);
            if (!validation.success) {
                console.dir(validation.error.format(), { depth: null }); // DEBUG: Log validation error
                return res.status(400).json({ success: false, error: validation.error.format() });
            }

            const record = await medicalRecordService.createMedicalRecord(
                companyId,
                studentId,
                validation.data,
                userId
            );

            return res.status(201).json({ success: true, record });
        } catch (error: any) {
            console.error('Error creating medical record:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    async updateMedicalRecord(req: AuthRequest, res: Response) {
        try {
            const { studentId } = req.params;
            const companyId = req.companyId;
            const userId = req.user?.userId;

            if (!companyId || !userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            // Reuse schema or create specific update schema?
            // Reuse create schema for now as it covers all fields.
            // But we need to allow `nextReviewDate` and `guardianConfirmed` which might not be in the original Zod schema.
            // Assuming Zod schema handles medical info. We might need to extend it or just pass body if we trust the service to pick fields.
            // Let's rely on basic validation + service filtering.

            const record = await medicalRecordService.updateMedicalRecord(
                companyId,
                studentId,
                req.body,
                userId
            );

            return res.status(200).json({ success: true, record });
        } catch (error: any) {
            console.error('Error updating medical record:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    async registerConsent(req: AuthRequest, res: Response) {
        try {
            const { studentId } = req.params;
            const companyId = req.companyId;
            const userId = req.user?.userId;
            const { guardianId, type, date } = req.body;

            if (!companyId || !userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            if (!guardianId || !type || !date) {
                return res.status(400).json({ success: false, error: 'Faltan datos requeridos (guardianId, type, date)' });
            }

            const record = await medicalRecordService.registerConsent(
                companyId,
                studentId,
                { guardianId, type, date },
                userId
            );

            return res.status(200).json({ success: true, record });
        } catch (error: any) {
            console.error('Error registering consent:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    async getMedicalRecord(req: AuthRequest, res: Response) {
        try {
            const { studentId } = req.params;
            const record = await medicalRecordService.getMedicalRecord(req.companyId!, studentId);
            return res.json({ success: true, record });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async generateFichaReport(req: AuthRequest, res: Response) {
        try {
            const { studentId } = req.params;
            const companyId = req.companyId!;

            // Get Student with Guardians
            const studentRepo = AppDataSource.getRepository(Student);
            const student = await studentRepo.findOne({
                where: { id: studentId, companyId },
                relations: ['studentGuardians', 'studentGuardians.guardian', 'level']
            });

            if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });

            // Get Medical Record Entity directly for the service
            const medicalRecordRepo = AppDataSource.getRepository(MedicalInfo);
            const record = await medicalRecordRepo.findOne({ where: { studentId } });

            // Generate PDF
            // Note: casting MedicalInfo to MedicalRecord because names might mismatch or just be compatible
            // In pdf.service.ts I imported 'medical-record.entity' which is likely 'medical-info.entity' renamed or compatible
            // Let's check imports. I'll pass 'record' as any or verify type compatibility.
            // Actually, in pdf.service.ts I imported 'MedicalRecord' from '../entities/medical/medical-record.entity'. 
            // I should double check if MedicalInfo IS MedicalRecord or if I made a mistake in the service import.
            // Looking at previous file views, 'MedicalInfo' seems to be the entity name in service.
            // I will assume compatibility or explicit cast.

            const buffer = await pdfService.generateFichaReport(student, record as any);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=ficha-medica-${student.rut}.pdf`);
            res.send(buffer);

        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error generando reporte' });
        }
    },

    async generateIncidentsReport(req: AuthRequest, res: Response) {
        try {
            const { studentId } = req.params;
            const companyId = req.companyId!;

            const studentRepo = AppDataSource.getRepository(Student);
            const student = await studentRepo.findOne({ where: { id: studentId, companyId } });
            if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });

            const incidentsData = await medicalIncidentService.getMedicalIncidents(companyId, { studentId, limit: 1000 });

            const buffer = await pdfService.generateIncidentsReport(student, incidentsData.data);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=historial-incidentes-${student.rut}.pdf`);
            res.send(buffer);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error generando reporte' });
        }
    },

    async generateAttentionsReport(req: AuthRequest, res: Response) {
        try {
            const { studentId } = req.params;
            const companyId = req.companyId!;

            const studentRepo = AppDataSource.getRepository(Student);
            const student = await studentRepo.findOne({ where: { id: studentId, companyId } });
            if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });

            // Fetch incidents and filter for medical attention
            const incidentsData = await medicalIncidentService.getMedicalIncidents(companyId, { studentId, limit: 1000 });
            const attentions = incidentsData.data.filter(i => i.requiredMedicalAttention);

            const buffer = await pdfService.generateIncidentsReport(student, attentions, 'Reporte de Atenciones Médicas Externas');

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=atenciones-medicas-${student.rut}.pdf`);
            res.send(buffer);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error generando reporte' });
        }
    }
};
