import { initializeDatabase } from './config/database';
import { config } from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { authCompanyRoutes } from './routes/auth/auth-company.route';
import authRoutes from './routes/auth/auth.route';
import userRoutes from './routes/auth/user.route';
import roleRoutes from './routes/auth/role.route';
import studentRoutes from './routes/student.routes';
import levelRoutes from './routes/level.routes';
import { locationRoutes } from './routes/location.route';
import dashboardRoutes from './routes/dashboard.route';
import cookieParser from 'cookie-parser';
import teachersRoutes from './routes/teachers.route';
import transportRoutes from './routes/transport.routes';
import medicalRecordRoutes from './routes/medicalRecord.routes';

import medicalIncidentRoutes from './routes/medicalIncident.routes';
import guardianRoutes from './routes/students/guardian.routes';
import driverRoutes from './routes/driver.routes';
import classBookRoutes from './routes/classBook.route';
import attendanceRoutes from './routes/attendance.routes';
import vehicleRoutes from './routes/vehicle.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import inspectionRoutes from './routes/inspection.routes';

config();

const app = express();
const PORT = Number(process.env.PORT) || 5700;

// Middlewares básicos
app.use(cookieParser());
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://192.168.1.7:3001',  // Tu IP local
    'http://192.168.1.7:8081',  // Puerto típico de Expo
    'http://192.168.1.7:19006', // Otro puerto común de Expo
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Debug Middleware
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url} (Port: ${process.env.PORT})`);
  next();
});

// Rutas de salud
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({
    message: 'API Server Running',
    version: '1.0.0'
  });
});

import planningRoutes from './routes/planning.route';
import superadminRoutes from './routes/superadmin.route';

// API Routes
// SUPERADMIN Routes (Must be registered BEFORE companyContextMiddleware if we want them totally separate, 
// o al menos que el router maneje su propio bypass, pero aquí es seguro ponerlo antes o simplemente fuera del grupo protegido)
app.use('/api/superadmin', superadminRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/auth/company', authCompanyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/routes', transportRoutes);
app.use('/api/medical_records', medicalRecordRoutes);
app.use('/api/medical_incidents', medicalIncidentRoutes);
app.use('/api/guardians', guardianRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/class-book', classBookRoutes);
app.use('/api/plannings', planningRoutes);
import companyRoutes from './routes/company.route';
app.use('/api/companies', companyRoutes);
app.use('/api/attendance', attendanceRoutes);

import paymentRoutes from './routes/payment.routes';
app.use('/api/payments', paymentRoutes);

// Static files (Images)
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling basic
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something broke!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const startServer = async () => {
  await initializeDatabase();

  // Start Background Tasks
  const { startDocumentMonitor } = require('./tasks/document-monitor.task');
  startDocumentMonitor();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📡 Local: http://localhost:${PORT}`);
    console.log(`📡 Network: http://192.168.1.7:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

if (require.main === module) {
  startServer();
}

export default app;