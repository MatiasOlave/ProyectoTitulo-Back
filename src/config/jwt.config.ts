// src/config/jwt.config.ts
import { config } from 'dotenv';
import { SignOptions } from 'jsonwebtoken';
import { toDotPath } from 'zod/v4/core';

config();

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets no definidos en variables de entorno');
}

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  expiresIn: '24h' as SignOptions['expiresIn'],
  refreshExpiresIn: '7d' as SignOptions['expiresIn'],
};

export const COOKIE_CONFIG = {
  accessToken: {
    name: 'access_token',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
      path: '/',
    }
  },
  refreshToken: {
    name: 'refresh_token',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias en milisegundos
      path: '/api/auth/refresh-token',
    }
  }
}