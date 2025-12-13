import { Response } from 'express';
import { AuthRequest } from '../interfaces/auth/jwt.interface';
import { planningService } from '../services/planning.service';
import { createPlanningSchema, updatePlanningSchema, reviewPlanningSchema } from '../schemas/planning.schema';

export const planningController = {
    async create(req: AuthRequest, res: Response) {
        try {
            const data = createPlanningSchema.parse(req.body);
            const planning = await planningService.create(req.companyId!, req.user!.userId, data);
            return res.status(201).json({ success: true, planning });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async getAll(req: AuthRequest, res: Response) {
        try {
            const filters = req.query;
            const plannings = await planningService.findAll(req.companyId!, filters);
            return res.json({ success: true, data: plannings });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    async getById(req: AuthRequest, res: Response) {
        try {
            const planning = await planningService.findById(req.params.id, req.companyId!);
            return res.json({ success: true, planning });
        } catch (error: any) {
            return res.status(404).json({ success: false, error: error.message });
        }
    },

    async update(req: AuthRequest, res: Response) {
        try {
            const data = updatePlanningSchema.parse(req.body);
            const planning = await planningService.update(req.params.id, req.companyId!, req.user!.userId, data);
            return res.json({ success: true, planning });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async submit(req: AuthRequest, res: Response) {
        try {
            const planning = await planningService.submit(req.params.id, req.companyId!, req.user!.userId);
            return res.json({ success: true, planning });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async review(req: AuthRequest, res: Response) {
        try {
            const { action, feedback } = reviewPlanningSchema.parse(req.body);
            const planning = await planningService.review(req.params.id, req.companyId!, req.user!.userId, action, feedback);
            return res.json({ success: true, planning });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async delete(req: AuthRequest, res: Response) {
        try {
            await planningService.delete(req.params.id, req.companyId!);
            return res.json({ success: true, message: 'Planificación eliminada' });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async duplicate(req: AuthRequest, res: Response) {
        try {
            const planning = await planningService.duplicate(req.params.id, req.companyId!, req.user!.userId);
            return res.status(201).json({ success: true, planning });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async uploadFiles(req: AuthRequest, res: Response) {
        try {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
            // Handle both array and fields format (middleware uses .fields)
            let fileList: Express.Multer.File[] = [];

            if (Array.isArray(files)) {
                fileList = files;
            } else if (files && typeof files === 'object') {
                // Flatten all files from all fields
                Object.values(files).forEach(arr => fileList.push(...arr));
            }

            if (!fileList || fileList.length === 0) {
                return res.status(400).json({ success: false, error: 'No se subieron archivos' });
            }

            const planning = await planningService.attachFiles(req.params.id, req.companyId!, fileList);
            return res.json({ success: true, planning });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    },

    async getActive(req: AuthRequest, res: Response) {
        try {
            const { levelId, date, teacherId } = req.query;

            if (!levelId || !date) {
                return res.status(400).json({ success: false, error: 'Faltan parámetros levelId o date' });
            }

            // Use provided teacherId or default to current user (for teachers creating their own entries)
            const targetTeacherId = (teacherId as string) || req.user!.userId;
            const targetDate = new Date(date as string);

            const planning = await planningService.findActivePlanning(
                req.companyId!,
                targetTeacherId,
                levelId as string,
                targetDate
            );

            return res.json({ success: true, planning });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: error.message });
        }
    }
};
