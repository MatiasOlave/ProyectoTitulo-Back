// src/controllers/auth/user.controller.ts
import { Response } from 'express';
import { userService } from '../../services/auth/user.service';
import { AuthRequest } from '../../interfaces/auth/jwt.interface';
import {
    createUserSchema,
    updateUserSchema,
    changeRoleSchema,
    userFiltersSchema
} from '../../schemas/auth/user.schema';

export const userController = {
    /**
     * POST /api/users
     * Create a new user (DIRECTOR/ADMIN only)
     */
    async createUser(req: AuthRequest, res: Response) {
        try {
            // Validate request body
            const validatedData = createUserSchema.parse(req.body);

            const result = await userService.createUser(
                req.companyId!,
                validatedData.email,
                validatedData.password,
                validatedData.firstName,
                validatedData.lastName,
                validatedData.rut,
                validatedData.phone,
                validatedData.roleCodes,
                req.user!.userId,
                validatedData.avatarUrl
            );

            return res.status(201).json({
                success: true,
                message: 'Usuario creado correctamente',
                user: result
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    error: 'Datos inválidos',
                    details: error.errors
                });
            }

            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * GET /api/users
     * List users with filters
     */
    async listUsers(req: AuthRequest, res: Response) {
        try {
            // Validate query parameters
            const filters = userFiltersSchema.parse(req.query);

            console.log('[UserController] listUsers', {
                companyId: req.companyId,
                user: req.user?.id,
                filters
            });

            const result = await userService.listUsers(
                req.companyId!,
                filters
            );

            return res.json({
                success: true,
                ...result
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    error: 'Parámetros inválidos',
                    details: error.errors
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Error al obtener usuarios'
            });
        }
    },

    /**
     * GET /api/users/:id
     * Get user by ID
     */
    async getUserById(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            const user = await userService.getUserById(id, req.companyId!);

            return res.json({
                success: true,
                user
            });
        } catch (error: any) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * PUT /api/users/:id
     * Update user information
     */
    async updateUser(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            // Validate request body
            const validatedData = updateUserSchema.parse(req.body);

            const result = await userService.updateUser(
                id,
                req.companyId!,
                validatedData,
                req.user?.userId // Pass current user ID as assignedById
            );

            return res.json({
                success: true,
                message: 'Usuario actualizado correctamente',
                user: result
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    error: 'Datos inválidos',
                    details: error.errors
                });
            }

            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * DELETE /api/users/:id
     * Delete user (soft delete)
     */
    async deleteUser(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            const result = await userService.deleteUser(id, req.companyId!, req.user!.userId);

            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * PATCH /api/users/:id/role
     * Change user role
     */
    async changeUserRole(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            // Validate request body
            const validatedData = changeRoleSchema.parse(req.body);

            const result = await userService.changeUserRole(
                id,
                req.companyId!,
                validatedData.roleCode,
                req.user!.userId
            );

            return res.json(result);
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    error: 'Datos inválidos',
                    details: error.errors
                });
            }

            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * PATCH /api/users/:id/toggle-status
     * Toggle user active status
     */
    async toggleUserStatus(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            const result = await userService.toggleUserStatus(
                id,
                req.companyId!,
                req.user!.userId
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
     * GET /api/users/role-counts
     * Get role counts for critical roles (ADMIN, DIRECTOR)
     */
    async getRoleCounts(req: AuthRequest, res: Response) {
        try {
            const roleCounts = await userService.getRoleCounts(req.companyId!);

            return res.json({
                success: true,
                roleCounts
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                error: 'Error al obtener conteo de roles'
            });
        }
    }
};
