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

// Middleware para verificar roles
export const requireRole = (requiredRole: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Autenticación requerida'
      });

      return;
    }

    if (!req.user.roles.includes(requiredRole)) {
      res.status(403).json({
        success: false,
        error: `Rol requerido: ${requiredRole}`
      });

      return;
    }

    next();
  };
};