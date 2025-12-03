// src/controllers/auth/role.controller.ts
import { Response } from 'express';
import { roleService } from '../../services/auth/role.service';
import { AuthRequest } from '../../interfaces/auth/jwt.interface';
import {
    createRoleSchema,
    updateRolePermissionsSchema
} from '../../schemas/auth/role.schema';

export const roleController = {
    /**
     * GET /api/roles
     * List all available roles
     */
    async listRoles(req: AuthRequest, res: Response) {
        try {
            const roles = await roleService.listRoles(req.companyId!);

            return res.json({
                success: true,
                roles
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                error: 'Error al obtener roles'
            });
        }
    },

    /**
     * POST /api/roles
     * Create a custom role
     */
    async createRole(req: AuthRequest, res: Response) {
        try {
            // Validate request body
            const validatedData = createRoleSchema.parse(req.body);

            const result = await roleService.createRole(
                validatedData.name,
                validatedData.code,
                validatedData.description,
                validatedData.permissionIds,
                req.companyId!
            );

            return res.status(201).json({
                success: true,
                message: 'Rol creado correctamente',
                role: result
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
     * PUT /api/roles/:id
     * Update role permissions
     */
    async updateRolePermissions(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            // Validate request body
            const validatedData = updateRolePermissionsSchema.parse(req.body);

            const result = await roleService.updateRolePermissions(
                id,
                validatedData.permissionIds,
                req.companyId!
            );

            return res.json({
                success: true,
                message: 'Permisos actualizados correctamente',
                role: result
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
    }
};
