import { Response } from 'express';
import { AuthRequest } from '../../interfaces/auth/jwt.interface';
import { guardianService } from '../../services/students/guardian.service';

export const guardianController = {
    // ==========================================
    // CRUD OPERATIONS
    // ==========================================

    async create(req: AuthRequest, res: Response) {
        try {
            const guardian = await guardianService.createGuardian(
                req.body,
                req.user?.companyId!
            );
            res.status(201).json({
                success: true,
                data: guardian
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    async list(req: AuthRequest, res: Response) {
        try {
            const { search, isPrimary, page, limit } = req.query;

            const result = await guardianService.listGuardians(
                req.user?.companyId!,
                {
                    search: search as string,
                    isPrimary: isPrimary ? isPrimary === 'true' : undefined,
                    page: page ? Number(page) : 1,
                    limit: limit ? Number(limit) : 10
                }
            );

            res.json({
                success: true,
                data: result.guardians,
                pagination: result.pagination
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    async getById(req: AuthRequest, res: Response) {
        try {
            const guardian = await guardianService.getGuardianById(
                req.params.id,
                req.user?.companyId!
            );

            res.json({
                success: true,
                data: guardian
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    async update(req: AuthRequest, res: Response) {
        try {
            const guardian = await guardianService.updateGuardian(
                req.params.id,
                req.user?.companyId!,
                req.body
            );

            res.json({
                success: true,
                data: guardian
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    async delete(req: AuthRequest, res: Response) {
        try {
            const result = await guardianService.deleteGuardian(
                req.params.id,
                req.user?.companyId!,
                req.user?.userId!
            );

            res.json(result);
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // ==========================================
    // STUDENT LINKAGE
    // ==========================================

    async linkStudent(req: AuthRequest, res: Response) {
        try {
            const { studentId, ...linkData } = req.body;

            const link = await guardianService.linkStudentToGuardian(
                req.params.id, // guardianId
                studentId,
                linkData,
                req.user?.companyId!,
                req.user?.userId!
            );

            res.status(201).json({
                success: true,
                data: link
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    async updateLink(req: AuthRequest, res: Response) {
        try {
            const link = await guardianService.updateStudentGuardianLink(
                req.params.linkId,
                req.body,
                req.user?.companyId!
            );

            res.json({
                success: true,
                data: link
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    async unlinkStudent(req: AuthRequest, res: Response) {
        try {
            const result = await guardianService.unlinkStudentFromGuardian(
                req.params.linkId,
                req.user?.companyId!
            );

            res.json(result);
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    async getGuardianStudents(req: AuthRequest, res: Response) {
        try {
            const students = await guardianService.getGuardianStudents(
                req.params.id,
                req.user?.companyId!
            );

            res.json({
                success: true,
                data: students
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // ==========================================
    // INVITATION & USER CREATION
    // ==========================================

    async sendInvitation(req: AuthRequest, res: Response) {
        try {
            const result = await guardianService.inviteGuardian(
                req.params.id,
                req.user?.companyId!
            );

            res.json(result);
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Public endpoint - no auth required
    async validateInvitation(req: AuthRequest, res: Response) {
        try {
            const result = await guardianService.validateInvitationToken(
                req.params.token
            );

            res.json(result);
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Public endpoint - no auth required
    async acceptInvitation(req: AuthRequest, res: Response) {
        try {
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña es requerida'
                });
            }

            const result = await guardianService.acceptInvitation(
                req.params.token,
                password
            );

            res.json(result);
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // ==========================================
    // CONSENT MANAGEMENT
    // ==========================================

    async updateConsents(req: AuthRequest, res: Response) {
        try {
            const guardian = await guardianService.updateConsents(
                req.params.id,
                req.user?.companyId!,
                req.body
            );

            res.json({
                success: true,
                data: guardian
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // ==========================================
    // PERMISSION MANAGEMENT
    // ==========================================

    async updatePermissions(req: AuthRequest, res: Response) {
        try {
            const guardian = await guardianService.updatePermissions(
                req.params.id,
                req.user?.companyId!,
                req.body
            );

            res.json({
                success: true,
                data: guardian
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};
