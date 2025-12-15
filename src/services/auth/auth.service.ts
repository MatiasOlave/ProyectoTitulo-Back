// src/services/auth/auth.service.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { jwtService } from './jwt.service';
import { AppDataSource } from '../../config/database';
import { User } from '../../entities/auth/user.entity';
import { UserRole } from '../../entities/auth/user-role.entity';
import { RolePermission } from '../../entities/auth/role-permission.entity';
import { JwtPayload } from '../../interfaces/auth/jwt.interface';
import { In, Not } from 'typeorm';
import { COOKIE_CONFIG } from '../../config/jwt.config';
import { Invitation } from '../../entities/auth/invitation.entity';
import { Student } from '../../entities/students/student.entity';
import { Role } from '../../entities/auth/role.entity';
import { emailService } from '../email.service';
import crypto from 'crypto';

const userRepository = AppDataSource.getRepository(User);
const userRoleRepository = AppDataSource.getRepository(UserRole);
const rolePermissionRepository = AppDataSource.getRepository(RolePermission);
const invitationRepository = AppDataSource.getRepository(Invitation);
const studentRepository = AppDataSource.getRepository(Student);
const roleRepository = AppDataSource.getRepository(Role);

export const authService = {

  async login(email: string, password: string, res: Response) {

    const user = await userRepository.findOne({
      where: { email, isActive: true },
      relations: ['company']
    });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    const userRoles = await userRoleRepository.find({
      where: { user: { id: user.id } },
      relations: ['role']
    });

    const roleIds = userRoles.map(ur => ur.roleId);
    const rolePermissions = await rolePermissionRepository.find({
      where: { roleId: In(roleIds) },
      relations: ['permission']
    });

    const permissions = rolePermissions.map(rp => rp.permission.name);
    const roles = userRoles.map(ur => ur.role.code);

    // Generar tokens
    const payload: Omit<JwtPayload, 'exp' | 'iat'> = {
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      roles,
      permissions,
    };

    const accessToken = jwtService.generateAccessToken(payload);
    const refreshToken = jwtService.generateRefreshToken({
      userId: user.id,
      companyId: user.companyId,
    });

    res.cookie(
      COOKIE_CONFIG.accessToken.name,
      accessToken,
      COOKIE_CONFIG.accessToken.options
    );

    res.cookie(
      COOKIE_CONFIG.refreshToken.name,
      refreshToken,
      COOKIE_CONFIG.refreshToken.options
    )

    // Actualizar último login
    user.lastLoginAt = new Date();
    await userRepository.save(user);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: {
          id: user.company.id,
          name: user.company.name,
        },
        roles: userRoles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          code: ur.role.code
        })),
        permissions,
      },
    };
  },


  async refreshToken(req: Request, res: Response) {
    try {

      const refreshToken = req.cookies[COOKIE_CONFIG.refreshToken.name];

      if (!refreshToken) {
        throw new Error('Token de actualización requerido');
      }

      const decoded = jwtService.verifyRefreshToken(refreshToken);

      // Buscar usuario actualizado
      const user = await userRepository.findOne({
        where: { id: decoded.userId, isActive: true },
        relations: ['company']
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Regenerar tokens
      const userRoles = await userRoleRepository.find({
        where: { user: { id: user.id } },
        relations: ['role']
      });

      const roleIds = userRoles.map(ur => ur.roleId);
      const rolePermissions = await rolePermissionRepository.find({
        where: { roleId: In(roleIds) },
        relations: ['permission']
      });

      const permissions = rolePermissions.map(rp => rp.permission.name);
      const roles = userRoles.map(ur => ur.role.code);

      const payload: Omit<JwtPayload, 'exp' | 'iat'> = {
        userId: user.id,
        companyId: user.companyId,
        email: user.email,
        roles,
        permissions,
      };

      const newAccessToken = jwtService.generateAccessToken(payload);
      const newRefreshToken = jwtService.generateRefreshToken({
        userId: user.id,
        companyId: user.companyId,
      });

      res.cookie(
        COOKIE_CONFIG.accessToken.name,
        newAccessToken,
        COOKIE_CONFIG.accessToken.options
      );

      res.cookie(
        COOKIE_CONFIG.refreshToken.name,
        newRefreshToken,
        COOKIE_CONFIG.refreshToken.options
      );

      return { success: true };
    } catch (error) {
      this.logout(res)
      throw new Error('Sesión expirada');
    }
  },

  async logout(res: Response) {
    res.clearCookie(COOKIE_CONFIG.accessToken.name, {
      path: COOKIE_CONFIG.accessToken.options.path,
    });
    res.clearCookie(COOKIE_CONFIG.refreshToken.name, {
      path: COOKIE_CONFIG.refreshToken.options.path,
    });
  },

  async verifyAuth(req: Request) {
    try {
      const accessToken = req.cookies[COOKIE_CONFIG.accessToken.name];

      if (!accessToken) {
        return { authenticated: false };
      }

      const payload = jwtService.verifyAccessToken(accessToken);

      // Fetch full user data to ensure we have up-to-date info
      const user = await userRepository.findOne({
        where: { id: payload.userId },
        relations: ['company']
      });

      if (!user) {
        return { authenticated: false };
      }

      const userRoles = await userRoleRepository.find({
        where: { user: { id: user.id } },
        relations: ['role']
      });

      const roleIds = userRoles.map(ur => ur.roleId);
      const rolePermissions = await rolePermissionRepository.find({
        where: { roleId: In(roleIds) },
        relations: ['permission']
      });

      const permissions = rolePermissions.map(rp => rp.permission.name);
      const roles = userRoles.map(ur => ur.role.code);

      return {
        authenticated: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          company: {
            id: user.company.id,
            name: user.company.name,
          },
          roles: userRoles.map(ur => ({
            id: ur.role.id,
            name: ur.role.name,
            code: ur.role.code
          })),
          permissions,
        }
      };
    } catch {
      return { authenticated: false };
    }
  },

  async getUserFromToken(token: string) {
    const payload = jwtService.verifyAccessToken(token);
    return payload;
  },

  async inviteGuardian(email: string, firstName: string, lastName: string, studentId: string, invitedById: string, companyId: string) {
    // Verificar si el usuario ya existe
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('El usuario ya está registrado en el sistema');
    }

    // Verificar si ya existe una invitación pendiente
    const existingInvitation = await invitationRepository.findOne({
      where: { email, status: 'pending' }
    });

    if (existingInvitation) {
      throw new Error('Ya existe una invitación pendiente para este correo');
    }

    const student = await studentRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new Error('Estudiante no encontrado');
    }

    const guardianRole = await roleRepository.findOne({ where: { code: 'apoderado' } });
    if (!guardianRole) {
      throw new Error('Rol de apoderado no configurado en el sistema');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48 horas de validez

    const invitation = invitationRepository.create({
      email,
      firstName,
      lastName,
      studentId,
      companyId,
      roleId: guardianRole.id,
      invitedById,
      token,
      expiresAt,
      invitedAt: new Date(),
      status: 'pending'
    });

    await invitationRepository.save(invitation);

    await emailService.sendGuardianInvitation(email, token, `${student.firstName} ${student.lastName}`);

    return { success: true, message: 'Invitación enviada correctamente' };
  },

  async validateInvite(token: string) {
    const invitation = await invitationRepository.findOne({
      where: { token },
      relations: ['student', 'company', 'role']
    });

    if (!invitation) {
      throw new Error('Invitación inválida');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Esta invitación ya ha sido utilizada o no es válida');
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitationRepository.save(invitation);
      throw new Error('La invitación ha expirado');
    }

    return {
      isValid: true,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      studentName: `${invitation.student.firstName} ${invitation.student.lastName}`,
      companyName: invitation.company.name,
      role: invitation.role.name
    };
  },

  async requestPasswordReset(email: string) {
    const user = await userRepository.findOne({ where: { email, isActive: true } });

    // For security, do not reveal if user exists or not, but strictly speaking for this project we might want to throw error if not found to be helpful. 
    // However, the standard practice is to return success even if email not found (silently fail).
    // But to follow the pattern of other methods here, I will check.
    if (!user) {
      throw new Error('No existe una cuenta activa con este correo electrónico');
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    user.passwordResetToken = token;
    user.passwordResetExpires = expiresAt;

    await userRepository.save(user);

    await emailService.sendPasswordResetEmail(user.email, token, user.firstName);

    return { success: true, message: 'Correo de recuperación enviado' };
  },

  async resetPassword(token: string, newPassword: string) {
    const user = await userRepository.findOne({
      where: { passwordResetToken: token }
    });

    if (!user) {
      throw new Error('Token inválido o expirado');
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new Error('El token ha expirado. Por favor solicite uno nuevo.');
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;

    // Clear token
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await userRepository.save(user);

    return { success: true, message: 'Contraseña actualizada correctamente' };
  }
};