// src/controllers/auth-company.controller.ts
import { Request, Response } from 'express';
import { authCompanyService } from '../../services/auth/auth-company.service';

export const authCompanyController = {
  async registerCompany(req: Request, res: Response) {
    try {
      const result = await authCompanyService.registerCompany(req.body);
      
      return res.status(201).json({
        success: true,
        data: result,
        message: result.message
      });
      
    } catch (error) {
      console.error('Error en registro de compañía:', error);

      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          error: error.message || 'Error en el registro',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Error en el registro'
      });
    }
  },

  async checkEmail(req: Request, res: Response) {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Email es requerido'
        });
      }

      const exists = await authCompanyService.checkEmailExists(email);
      
      return res.json({
        success: true,
        data: { email, exists }
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error verificando email'
      });
    }
  },

  async checkCompanyRut(req: Request, res: Response) {
    try {
      const { rut } = req.query;
      
      if (!rut || typeof rut !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'RUT es requerido'
        });
      }

      const exists = await authCompanyService.checkCompanyRutExists(rut);
      
      return res.json({
        success: true,
        data: { rut, exists }
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error verificando RUT'
      });
    }
  }
};