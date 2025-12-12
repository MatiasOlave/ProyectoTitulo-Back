// src/middleware/auth/permission.middleware.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces/auth/jwt.interface';

// Middleware para verificar permisos
export const requirePermission = (requiredPermission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Autenticación requerida'
      });

      return;
    }

    if (!req.user.permissions.includes(requiredPermission)) {
      res.status(403).json({
        success: false,
        error: `Permiso requerido: ${requiredPermission}`
      });

      return;
    }

    next();
  };
};

// Middleware para verificar roles (Single)
export const requireRole = (requiredRole: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Autenticación requerida'
      });

      return;
    }

    // Normalize user roles
    const userRolesNormalized = req.user.roles.map((r: any) => {
      const roleName = typeof r === 'string' ? r : (r.name || r.code);
      return roleName ? roleName.toString().trim().toLowerCase() : '';
    });

    const requiredRoleNormalized = requiredRole.trim().toLowerCase();

    if (!userRolesNormalized.includes(requiredRoleNormalized)) {
      res.status(403).json({
        success: false,
        error: `Rol requerido: ${requiredRole}`
      });

      return;
    }

    next();
  };
};

// Middleware para verificar múltiples roles (Any of these)
export const requireAnyRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Autenticación requerida'
      });
      return;
    }

    // Normalize user roles: lowercase and trim
    // Handle specific cases where user.roles elements might be objects or strings
    const userRolesNormalized = req.user.roles.map((r: any) => {
      const roleName = typeof r === 'string' ? r : (r.name || r.code);
      return roleName ? roleName.toString().trim().toLowerCase() : '';
    });

    // Normalize allowed roles
    const allowedRolesNormalized = allowedRoles.map(r => r.trim().toLowerCase());

    const hasRole = allowedRolesNormalized.some(allowed => userRolesNormalized.includes(allowed));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: `Acceso denegado. Roles permitidos: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
};