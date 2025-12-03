import { Response, NextFunction } from "express";
import { AuthRequest } from "../../interfaces/auth/jwt.interface";

export const companyIsolationMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {

  if (!req.companyId) {
    res.status(403).json({
      success: false,
      error: 'Acceso denegado - Sin compañía asociada'
    });
    return;
  }

  // Si la ruta tiene :companyId, validar coincidencia
  if (req.params.companyId && req.params.companyId !== req.companyId) {
    res.status(403).json({
      success: false,
      error: 'Acceso denegado - No tienes permisos para esta compañía'
    });
    return;
  }

  next();
};
