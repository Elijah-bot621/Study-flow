import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkDatabaseConnection } from './db.ts';
import { ownersRouter } from './ownersRoutes.ts';
import { syllabusRouter } from './syllabusRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

// Trust first proxy hop (e.g. reverse proxy / load balancer)
app.set('trust proxy', 1);

// Disable Express fingerprint header
app.disable('x-powered-by');

// Cache-Control: no-store for all /api routes
app.use('/api', (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Body parsing with sensible limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const databaseStatus = await checkDatabaseConnection();
    res.json({
      status: 'ok',
      server: 'running',
      database: databaseStatus,
      time: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Error in /api/health handler:', err);
    res.json({
      status: 'ok',
      server: 'running',
      database: 'error',
      time: new Date().toISOString(),
    });
  }
});

// Owner registration and management endpoints
app.use('/api/owners', ownersRouter);

// Public syllabus endpoints
app.use('/api/syllabus', syllabusRouter);

// 404 handler for unknown /api/* routes (returns JSON, never HTML)
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API endpoint ${req.method} ${req.path} not found`,
  });
});

async function startServer() {
  if (!isProduction) {
    // In development: use Vite in middleware mode
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production: serve pre-built files from dist/ with SPA fallback
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Central error-handling middleware (returns generic JSON, logs server-side)
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  });

  app.listen(PORT, HOST, () => {
    console.log(
      `StudyFlow server running at http://${HOST}:${PORT} (mode: ${isProduction ? 'production' : 'development'})`
    );
  });
}

startServer().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
