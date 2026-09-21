import express from 'express';
import cors from 'cors';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import customersRoutes from './modules/customers/customers.routes.js';
import creditsRoutes from './modules/credits/credits.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import activityRoutes from './modules/activity/activity.routes.js';

// Middleware imports
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ─── Global Middleware ───────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: "Dagi's Credit Tracker API is running!", timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/customers', customersRoutes); // /api/customers/...
app.use('/api', creditsRoutes);             // /api/customers/:id/credits + /api/credits/:id
app.use('/api', paymentsRoutes);            // /api/customers/:id/payments + /api/payments/:id
app.use('/api', activityRoutes);            // /api/activity/... + /api/dashboard/...

// ─── 404 Handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ────────────────────────────────────────
app.use(errorHandler);

export default app;
