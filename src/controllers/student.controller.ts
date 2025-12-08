import { Response } from 'express';
import { AuthRequest } from '../interfaces/auth/jwt.interface';
import { studentService } from '../services/students/student.service';
import { createStudentSchema, updateStudentSchema, studentFiltersSchema } from '../schemas/student.schema';

export const studentController = {
    async createStudent(req: AuthRequest, res: Response) {
        try {
            const validatedData = createStudentSchema.parse(req.body);
            const student = await studentService.createStudent(validatedData);
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
            const student = await studentService.getStudentById(id);
            return res.json({ success: true, student });
        } catch (error: any) {
            return res.status(404).json({ success: false, error: error.message });
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
            const result = await studentService.deleteStudent(id);
            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    }
};
