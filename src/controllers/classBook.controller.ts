import { Response } from 'express';
import { AuthRequest } from '../interfaces/auth/jwt.interface';
import { classBookService } from '../services/classBook.service';
import { createClassBookEntrySchema, updateClassBookEntrySchema, createObservationSchema, classBookFiltersSchema } from '../schemas/classBook.schema';

export const classBookController = {
    async createEntry(req: AuthRequest, res: Response) {
        try {
            const data = createClassBookEntrySchema.parse(req.body);
            const entry = await classBookService.createEntry(req.companyId!, req.user!.userId, data);
            return res.status(201).json({ success: true, entry });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async updateEntry(req: AuthRequest, res: Response) {
        try {
            const data = updateClassBookEntrySchema.parse(req.body);
            const entry = await classBookService.updateEntry(req.params.id, req.companyId!, data);
            return res.json({ success: true, entry });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async listEntries(req: AuthRequest, res: Response) {
        try {
            const filters = classBookFiltersSchema.parse(req.query);
            // Assuming roles are available in req.user or similar. If not, service defaults to strict mode or passed manually.
            const roles = req.user?.roles || [];
            const entries = await classBookService.listEntries(req.companyId!, req.user!.userId, roles, filters);
            return res.json({ success: true, data: entries });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    async getEntryById(req: AuthRequest, res: Response) {
        try {
            const entry = await classBookService.getEntryById(req.params.id, req.companyId!);
            return res.json({ success: true, entry });
        } catch (error: any) {
            return res.status(404).json({ success: false, error: error.message });
        }
    },

    async addObservation(req: AuthRequest, res: Response) {
        try {
            const data = createObservationSchema.parse(req.body);
            const obs = await classBookService.addObservation(req.params.id, req.companyId!, data);
            return res.status(201).json({ success: true, observation: obs });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async lockEntry(req: AuthRequest, res: Response) {
        try {
            await classBookService.lockEntry(req.params.id, req.companyId!, req.user!.userId);
            return res.json({ success: true, message: 'Entrada bloqueada correctamente' });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async exportPDF(req: AuthRequest, res: Response) {
        try {
            const buffer = await classBookService.generatePDF(req.params.id, req.companyId!);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=libro-clases-${req.params.id}.pdf`);
            return res.send(buffer);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    async reviewEntry(req: AuthRequest, res: Response) {
        try {
            // reviewNotes is expected in body
            const { notes } = req.body;
            const entry = await classBookService.reviewEntry(req.params.id, req.companyId!, req.user!.userId, notes);
            return res.json({ success: true, entry });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async uploadFiles(req: AuthRequest, res: Response) {
        try {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            // Process files if needed or just update the entry with paths
            // Service needs a method to update file paths
            // For now, let's assume we just want to save the paths in the JSON columns

            // We need to implement addFiles in service or use updateEntry logic?
            // Let's use specific method: attachFiles

            const photos = files['photos']?.map(f => f.path) || [];
            const documents = files['documents']?.map(f => f.path) || [];

            // Let's implement attachFiles in service.

            const entry = await classBookService.attachFiles(req.params.id, req.companyId!, photos, documents);
            return res.json({ success: true, entry });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async deleteEntry(req: AuthRequest, res: Response) {
        try {
            await classBookService.deleteEntry(req.params.id, req.companyId!);
            return res.json({ success: true, message: 'Entrada eliminada correctamente' });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    // --- Books ---

    async createBook(req: AuthRequest, res: Response) {
        try {
            const { createClassBookSchema } = require('../schemas/classBook.schema'); // lazy load to ensure updated schema
            const data = createClassBookSchema.parse(req.body);
            const book = await classBookService.createBook(req.companyId!, data.levelId, data.headTeacherId, req.user!.userId);
            return res.status(201).json({ success: true, book });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async listBooks(req: AuthRequest, res: Response) {
        try {
            const roles = req.user?.roles || [];
            const books = await classBookService.listBooks(req.companyId!, req.user!.userId, roles);
            return res.json({ success: true, books });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    async getBookById(req: AuthRequest, res: Response) {
        try {
            const book = await classBookService.getBookById(req.params.id, req.companyId!);
            return res.json({ success: true, book });
        } catch (error: any) {
            return res.status(404).json({ success: false, error: error.message });
        }
    }
};

