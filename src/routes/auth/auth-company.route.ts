import { Router } from 'express';
import { authCompanyController } from '../../controllers/auth/auth-company.controller';

export const authCompanyRoutes = Router();

authCompanyRoutes.post('/register', authCompanyController.registerCompany);
authCompanyRoutes.get('/check-email', authCompanyController.checkEmail);
authCompanyRoutes.get('/check-company-rut', authCompanyController.checkCompanyRut);