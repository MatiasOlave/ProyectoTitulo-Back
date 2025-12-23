// src/controllers/auth/auth.controller.ts
import { Request, Response } from 'express';
import { authService } from '../../services/auth/auth.service';
import { COOKIE_CONFIG } from '../../config/jwt.config';

export const authController = {
    /**
     * POST /api/auth/login
     * Login con cookies
     */
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            const result = await authService.login(email, password, res);

            return res.json({
                success: true,
                user: result.user,
                token: result.token,
                message: 'Login exitoso'
            });
        } catch (error: any) {
            return res.status(401).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * POST /api/auth/refresh
     * Refresh token con cookies
     */
    async refreshToken(req: Request, res: Response) {
        try {
            await authService.refreshToken(req, res);

            return res.json({
                success: true,
                message: 'Tokens actualizados'
            });
        } catch (error: any) {
            return res.status(401).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * POST /api/auth/logout
     * Logout con cookies
     */
    async logout(_req: Request, res: Response) {
        try {
            await authService.logout(res);

            return res.json({
                success: true,
                message: 'Logout exitoso'
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                error: 'Error durante logout'
            });
        }
    },

    /**
     * GET /api/auth/verify
     * Verificar autenticación desde cookies
     */
    async verifyAuth(req: Request, res: Response) {
        try {
            const authResult = await authService.verifyAuth(req);
            return res.json(authResult);
        } catch (error: any) {
            return res.json({ authenticated: false });
        }
    },

    /**
     * POST /api/auth/invite-guardian
     * Invitar apoderado
     */
    async inviteGuardian(req: Request, res: Response) {
        try {
            const { email, firstName, lastName, studentId, invitedById, companyId } = req.body;
            const result = await authService.inviteGuardian(
                email,
                firstName,
                lastName,
                studentId,
                invitedById,
                companyId
            );

            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/auth/validate-invite/:token
     * Validar invitación
     */
    async validateInvite(req: Request, res: Response) {
        try {
            const { token } = req.params;
            const result = await authService.validateInvite(token);

            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/auth/debug-cookies
     * Debug cookies (solo desarrollo)
     */
    debugCookies(req: Request, res: Response) {
        return res.json({
            cookies: req.cookies,
            accessToken: !!req.cookies[COOKIE_CONFIG.accessToken.name],
            refreshToken: !!req.cookies[COOKIE_CONFIG.refreshToken.name]
        });
    },

    /**
     * POST /api/auth/forgot-password
     * Solicitud de recuperación de contraseña
     */
    async requestPasswordReset(req: Request, res: Response) {
        try {
            const { email } = req.body;
            const result = await authService.requestPasswordReset(email);
            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * POST /api/auth/reset-password
     * Restablecimiento de contraseña
     */
    async resetPassword(req: Request, res: Response) {
        try {
            const { token, newPassword } = req.body;
            const result = await authService.resetPassword(token, newPassword);
            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
};
