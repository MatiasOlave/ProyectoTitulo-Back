import { Response, NextFunction } from 'express';
import { jwtService } from '../../services/auth/jwt.service';
import { AuthRequest } from '../../interfaces/auth/jwt.interface';
import { COOKIE_CONFIG } from '../../config/jwt.config';

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {

  try {
    const accessToken = req.cookies[COOKIE_CONFIG.accessToken.name];

    if (!accessToken) {
      res.status(401).json({ 
        success: false, 
        error: 'Token de acceso requerido' 
      });
      return;
    }

    const decoded = jwtService.verifyAccessToken(accessToken);

    req.user = decoded;
    req.companyId = decoded.companyId;

    next();
  } catch {

    res.clearCookie(COOKIE_CONFIG.accessToken.name);
    res.clearCookie(COOKIE_CONFIG.refreshToken.name);
    
    res.status(401).json({ 
      success: false, 
      error: 'Token inválido o expirado' 
    });
  }
};
