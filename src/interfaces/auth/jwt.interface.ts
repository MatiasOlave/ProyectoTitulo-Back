// src/interfaces/auth/jwt.interface.ts
import { Request } from "express";

export interface JwtPayload {
  userId: string;
  companyId: string;
  email: string;
  roles: string[];
  permissions: string[];
  sub?: string; // Standard JWT uses sub for ID
  id?: string; // Custom/Legacy might use id
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
  companyId?: string;
}