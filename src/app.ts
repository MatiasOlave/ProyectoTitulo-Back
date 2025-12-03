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
import { locationRoutes } from './routes/location.route';
import { companyContextMiddleware } from './middlewares/company-context.middleware';
import cookieParser from 'cookie-parser';

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

// Company context middleware (will extract companyId from authenticated user)
// Note: This should be applied AFTER auth middleware when you implement it
app.use(companyContextMiddleware);

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
app.use('/api/locations', locationRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Manejo global de errores
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', error);

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON in request body'
    });
  }

  return res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// Inicializar servidor
const startServer = async () => {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Manejo graceful de shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();