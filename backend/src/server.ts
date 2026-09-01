import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import customerRoutes from './routes/customerRoutes';
import buyerRoutes from './routes/buyerRoutes';
import invoiceRoutes from './routes/invoiceRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// Health Check
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    app: 'Invoice Bill Maker API (Zero-Cost, No GST)',
    version: '1.0.0',
    increment: 1,
    time: new Date().toISOString(),
  });
});

// API v1 Routes
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/buyers', buyerRoutes);
app.use('/api/v1/invoices', invoiceRoutes);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
  console.log(`📡 Ready to accept requests on /api/v1/customers, /api/v1/buyers, /api/v1/invoices`);
});

export default app;
