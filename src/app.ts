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

config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(cookieParser());
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/company', authCompanyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/teachers', teachersRoutes);

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
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

export default app;