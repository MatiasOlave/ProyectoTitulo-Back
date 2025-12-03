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
                validatedData.email,
                validatedData.password,
                validatedData.firstName,
                validatedData.lastName,
                validatedData.rut,
                validatedData.phone,
                validatedData.roleCode,
                req.companyId!,
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
                validatedData
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
     * Deactivate user (soft delete)
     */
    async deactivateUser(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            const result = await userService.deactivateUser(id, req.companyId!);

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
    }
};
