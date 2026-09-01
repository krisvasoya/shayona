import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import customerRoutes from './routes/customerRoutes';
import buyerRoutes from './routes/buyerRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import settingsRoutes from './routes/settingsRoutes';
import versionRoutes from './routes/versionRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Production-ready CORS setup
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// Render.com Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root API Info
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    app: 'Invoice Bill Maker API (Zero-Cost, No GST)',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API v1 Routes
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/buyers', buyerRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/shop', settingsRoutes);
app.use('/api/v1/version', versionRoutes);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV !== 'production') {
    console.error('Server Error:', message);
  }
  res.status(statusCode).json({ error: message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Production server running on port ${PORT}`);
  console.log(`🩺 Health check active on /health`);
});

export default app;
