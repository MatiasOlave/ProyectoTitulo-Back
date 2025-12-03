// src/services/auth/jwt.service.ts
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../../config/jwt.config';
import { JwtPayload } from '../../interfaces/auth/jwt.interface';

export const jwtService = {

    // Generar token de acceso
    generateAccessToken(payload: Omit<JwtPayload, 'exp' | 'iat'>): string {
        return jwt.sign(payload, JWT_CONFIG.secret, {
            expiresIn: JWT_CONFIG.expiresIn,
        });
    },

    // Generar refresh token
    generateRefreshToken(payload: { userId: string; companyId: string }): string {
        return jwt.sign(payload, JWT_CONFIG.refreshSecret, {
            expiresIn: JWT_CONFIG.refreshExpiresIn,
        });
    },

    // Verificar token de acceso
    verifyAccessToken(token: string): JwtPayload {
        return jwt.verify(token, JWT_CONFIG.secret) as JwtPayload;
    },

    // Verificar refresh token
    verifyRefreshToken(token: string): { userId: string; companyId: string } {
        return jwt.verify(token, JWT_CONFIG.refreshSecret) as { userId: string; companyId: string };
    },

    // Decodificar token sin verificar (útil para logs)
    decodeToken(token: string): JwtPayload | null {
        try {
            return jwt.decode(token) as JwtPayload;
        } catch {
            return null;
        }
    }
};