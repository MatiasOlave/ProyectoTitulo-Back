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
    let accessToken = req.cookies[COOKIE_CONFIG.accessToken.name];

    // Fallback: Check Authorization Header (Bearer Token)
    if (!accessToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }
    }

    // DEBUG LOG
    // console.log('[AuthMiddleware] Cookies:', Object.keys(req.cookies)); 
    // console.log('[AuthMiddleware] Token found:', !!accessToken);

    if (!accessToken) {
      console.warn('[AuthMiddleware] Access denied: No token provided');
      res.status(401).json({
        success: false,
        error: 'Token de acceso requerido'
      });
      return;
    }

    const decoded = jwtService.verifyAccessToken(accessToken);

    // Normalize User Object to ensure consistency across controllers
    // Map 'userId' (App), 'sub' (JWT std) to 'id'
    const userPayload = {
      ...decoded,
      id: decoded.id || decoded.sub || decoded.userId,
      companyId: decoded.companyId
    };

    req.user = userPayload;
    req.companyId = decoded.companyId;

    if (!req.user.id || !req.user.companyId) {
      // Optional: fail if critical data missing, but let's allow partial flow for now
      // or log strict warning.
      console.warn('[AuthMiddleware] Token missing id or companyId', decoded);
    }

    next();
  } catch (error) {
    console.error('[AuthMiddleware] Token verification failed:', error);

    res.clearCookie(COOKIE_CONFIG.accessToken.name);
    res.clearCookie(COOKIE_CONFIG.refreshToken.name);

    res.status(401).json({
      success: false,
      error: 'Token inválido o expirado'
    });
  }
};
