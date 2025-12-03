// src/interfaces/auth/jwt.interface.ts
import { Request } from "express";

export interface JwtPayload {
  userId: string;
  companyId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
  companyId?: string;
}