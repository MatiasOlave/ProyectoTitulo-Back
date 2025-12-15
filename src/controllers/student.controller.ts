import { Response } from 'express';
import { AuthRequest } from '../interfaces/auth/jwt.interface';
import { studentService } from '../services/students/student.service';
import { createStudentSchema, updateStudentSchema, studentFiltersSchema } from '../schemas/student.schema';

export const studentController = {
    async createStudent(req: AuthRequest, res: Response) {
        try {
            const validatedData = createStudentSchema.parse(req.body);
            const student = await studentService.createStudent(req.companyId!, validatedData);
            return res.status(201).json({
                success: true,
                message: 'Estudiante matriculado correctamente',
                student
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({ success: false, error: 'Datos inválidos', details: error.errors });
            }
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async listStudents(req: AuthRequest, res: Response) {
        try {
            const filters = studentFiltersSchema.parse(req.query);
            const result = await studentService.listStudents(req.companyId!, filters);
            return res.json({ success: true, ...result });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    async getStudentById(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const student = await studentService.getStudentById(id, req.companyId);
            return res.json({ success: true, student });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "¡DEBUG! Error interno en el servidor:",
                error: error.message,
                detail: error.detail || error.stack
            });
        }
    },

    async getStudentProfile(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const profile = await studentService.getStudentProfile(id);
            return res.json({ success: true, profile });
        } catch (error: any) {
            return res.status(404).json({ success: false, error: error.message });
        }
    },

    async getStudentGuardians(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const data = await studentService.getStudentGuardians(id);
            return res.json({ success: true, data });
        } catch (error: any) {
            return res.status(404).json({ success: false, error: error.message });
        }
    },

    async getStudentObservations(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const observations = await studentService.getStudentObservations(id);
            return res.json({ success: true, observations });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: 'Error al obtener observaciones', details: error.message });
        }
    },

    async updateStudent(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const validatedData = updateStudentSchema.parse(req.body);
            const student = await studentService.updateStudent(id, validatedData);
            return res.json({ success: true, message: 'Estudiante actualizado', student });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({ success: false, error: 'Datos inválidos', details: error.errors });
            }
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async deleteStudent(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { retirementDate, retirementReason } = req.body; // Expect body for soft delete

            let result;
            if (retirementDate && retirementReason) {
                result = await studentService.deleteStudent(id, { date: retirementDate, reason: retirementReason });
            } else {
                // Fallback or just call without data (hard delete)
                result = await studentService.deleteStudent(id);
            }
            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    // Quick Actions
    async recordAttendance(req: AuthRequest, res: Response) {
        // Stub
        return res.json({ success: true, message: 'Asistencia registrada (Stub)' });
    },

    async recordMedicalIncident(req: AuthRequest, res: Response) {
        // Stub
        return res.json({ success: true, message: 'Incidente médico registrado (Stub)' });
    },

    async addObservation(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const observation = await studentService.addObservation(req.user?.id!, id, req.body);
            return res.json({ success: true, observation });
        } catch (error: any) {
            console.error('Error adding observation:', error);
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async getClassBook(req: AuthRequest, res: Response) {
        // Stub
        return res.json({ success: true, message: 'Libro de clases (Stub)' });
    },

    async getMedicalRecord(req: AuthRequest, res: Response) {
        // Stub
        return res.json({ success: true, message: 'Ficha médica (Stub)' });
    },

    async downloadMedicalPdf(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const doc = await studentService.generateMedicalPdf(id);

            const filename = `ficha-medica-${id}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            doc.pipe(res);
            doc.end();
        } catch (error: any) {
            console.error('Error generating PDF:', error);
            // Handle error (cannot enable json response if headers sent, but usually safe here before pipe)
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: 'Error al generar PDF' });
            }
        }
    },

    // Emergency Contacts
    async addContact(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const result = await studentService.addEmergencyContact(id, req.body);
            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async updateContact(req: AuthRequest, res: Response) {
        try {
            const { id, contactId } = req.params;
            const result = await studentService.updateEmergencyContact(id, contactId, req.body);
            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async deleteContact(req: AuthRequest, res: Response) {
        try {
            const { id, contactId } = req.params;
            await studentService.deleteEmergencyContact(id, contactId);
            return res.json({ success: true, message: 'Contacto desactivado' });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    }
};
