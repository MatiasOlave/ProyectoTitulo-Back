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

            // Determine Target Teacher ID
            let targetTeacherId: string | null = null;

            if (teacherId) {
                targetTeacherId = teacherId as string;
            } else {
                // If no teacherId provided in query:
                // - If Admin/Director: Search GLOBALLY for that level/date (targetTeacherId = null)
                // - If Teacher: Search only THEIR planning (targetTeacherId = userId)

                // We need to check roles. Req.user has roles.
                // Assuming roles is string[] based on JWT payload usually having simplified roles
                // Error indicated roles is string[]

                const hasPrivilegedRole = req.user!.roles.some(r => ['ADMIN', 'DIRECTOR'].includes(typeof r === 'string' ? r : (r as any).code));

                if (hasPrivilegedRole) {
                    targetTeacherId = null; // Search all
                } else {
                    targetTeacherId = req.user!.userId; // Search own
                }
            }

            // Pass date as string to avoid timezone parsing issues
            const targetDate = date as string;

            const planning = await planningService.findActivePlanning(
                req.companyId!,
                targetTeacherId,
                levelId as string,
                targetDate
            );

            return res.json({ success: true, planning });
        } catch (error: any) {
            console.error('[DEBUG-PLANNING] Error:', error);
            return res.status(400).json({ success: false, error: error.message });
        }
    }
};
