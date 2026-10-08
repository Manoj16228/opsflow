import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { requestLogger } from './middleware/requestLogger';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { swaggerDocument } from './docs/swagger';
import healthRoutes from './routes/health.routes';

// Module routers (will be imported and mounted)
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import organizationRoutes from './modules/organizations/organization.routes';
import employeeRoutes from './modules/employees/employee.routes';
import departmentRoutes from './modules/departments/department.routes';
import taskRoutes from './modules/tasks/task.routes';
import incidentRoutes from './modules/incidents/incident.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import attachmentRoutes from './modules/attachments/attachment.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import auditRoutes from './modules/audit/audit.routes';
import copilotRoutes from './modules/copilot/copilot.routes';
import automationRoutes from './modules/automations/automation.routes';

export function createApp(): Express {
  const app = express();

  // Security & Header Protection
  app.use(
    helmet({
      contentSecurityPolicy: false, // Swagger UI compatibility
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!requestOrigin) return callback(null, true);
        if (
          requestOrigin === config.FRONTEND_URL ||
          requestOrigin.includes('localhost') ||
          requestOrigin.endsWith('.vercel.app') ||
          requestOrigin.endsWith('.onrender.com') ||
          requestOrigin.endsWith('.netlify.app')
        ) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive for portfolio showcase
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
    })
  );

  // Body Parsers & Request Logging
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestLogger);

  // Global Rate Limiting
  app.use(config.API_PREFIX, globalRateLimiter);

  // Static Local Uploads (if using local storage)
  app.use('/uploads', express.static(config.LOCAL_STORAGE_PATH));

  // Swagger Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Base API Router
  const apiRouter = express.Router();

  // Mount Domain Modules
  apiRouter.use('/', healthRoutes);
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/users', userRoutes);
  apiRouter.use('/organizations', organizationRoutes);
  apiRouter.use('/employees', employeeRoutes);
  apiRouter.use('/departments', departmentRoutes);
  apiRouter.use('/tasks', taskRoutes);
  apiRouter.use('/incidents', incidentRoutes);
  apiRouter.use('/notifications', notificationRoutes);
  apiRouter.use('/attachments', attachmentRoutes);
  apiRouter.use('/analytics', analyticsRoutes);
  apiRouter.use('/audit-logs', auditRoutes);
  apiRouter.use('/copilot', copilotRoutes);
  apiRouter.use('/automations', automationRoutes);

  app.use(config.API_PREFIX, apiRouter);

  // Root Route Handler - Developer Portal & Service Discovery
  app.get('/', (req, res) => {
    // If request accepts HTML (browser navigation), serve the Enterprise Developer Portal
    if (req.accepts('html')) {
      return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OpsFlow Core API | Enterprise Developer Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: rgba(17, 24, 39, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --accent-blue: #3b82f6;
      --accent-cyan: #06b6d4;
      --accent-emerald: #10b981;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.08) 0px, transparent 50%),
        radial-gradient(at 50% 50%, rgba(16, 185, 129, 0.05) 0px, transparent 50%);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.5rem;
    }
    .container {
      max-width: 900px;
      width: 100%;
    }
    .header {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      margin-bottom: 1.25rem;
      letter-spacing: 0.025em;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.75rem;
    }
    p.subtitle {
      color: var(--text-muted);
      font-size: 1.05rem;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 1rem;
      padding: 1.5rem;
      text-decoration: none;
      color: inherit;
      backdrop-filter: blur(16px);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }
    .card:hover {
      transform: translateY(-4px);
      border-color: rgba(59, 130, 246, 0.4);
      box-shadow: 0 12px 30px -10px rgba(59, 130, 246, 0.2);
    }
    .card-primary {
      border-color: rgba(59, 130, 246, 0.3);
      background: linear-gradient(180deg, rgba(30, 58, 138, 0.2) 0%, rgba(17, 24, 39, 0.8) 100%);
    }
    .card-icon {
      width: 42px;
      height: 42px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      margin-bottom: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .card-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.35rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .action-arrow {
      font-size: 1.1rem;
      opacity: 0.6;
      transition: transform 0.2s;
    }
    .card:hover .action-arrow {
      opacity: 1;
      transform: translateX(4px);
    }
    .terminal-box {
      background: #060911;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0.875rem;
      padding: 1.25rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #cbd5e1;
    }
    .terminal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      color: var(--text-muted);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .cmd {
      color: #38bdf8;
    }
    .footer {
      text-align: center;
      margin-top: 2rem;
      color: var(--text-muted);
      font-size: 0.8125rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">
        <span class="badge-dot"></span>
        API CORE ONLINE &bull; v2.4.0-LTS
      </div>
      <h1>NexusCloud OpsFlow API</h1>
      <p class="subtitle">Enterprise Task Orchestration, SRE War Rooms, Zero-Trust Access & Event-Driven Engine</p>
    </div>

    <div class="grid">
      <a href="/api-docs" class="card card-primary">
        <div class="card-icon" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa;">📘</div>
        <div class="card-title">
          Interactive API Docs
          <span class="action-arrow">&rarr;</span>
        </div>
        <div class="card-desc">Explore OpenAPI 3.0 specs, execute live queries, and view request/response schemas.</div>
      </a>

      <a href="http://localhost:3000" class="card">
        <div class="card-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">🖥️</div>
        <div class="card-title">
          OpsFlow Web App
          <span class="action-arrow">&rarr;</span>
        </div>
        <div class="card-desc">Access the React/Next.js dashboard, Kanban boards, Incident War Room, and AI Assistant.</div>
      </a>

      <a href="/api/v1/health" class="card">
        <div class="card-icon" style="background: rgba(6, 182, 212, 0.15); color: #22d3ee;">🩺</div>
        <div class="card-title">
          Health & Telemetry
          <span class="action-arrow">&rarr;</span>
        </div>
        <div class="card-desc">Real-time database latency, memory footprint, uptime telemetry, and system diagnostics.</div>
      </a>
    </div>

    <div class="terminal-box">
      <div class="terminal-header">
        <span>Quick Curl Probe</span>
        <span>Localhost:5001</span>
      </div>
      <div><span style="color:#64748b;">$</span> <span class="cmd">curl -s http://localhost:5001/api/v1/health | jq .</span></div>
    </div>

    <div class="footer">
      OpsFlow Core &bull; 100% Free &amp; Local &bull; Port 5001 (Backend) &bull; Port 3000 (Frontend)
    </div>
  </div>
</body>
</html>`);
    }

    // Default JSON Service Discovery Payload for curl/API clients
    return res.status(200).json({
      success: true,
      service: 'OpsFlow Core API Gateway',
      version: '2.4.0-lts',
      status: 'OPERATIONAL',
      environment: process.env.NODE_ENV || 'development',
      links: {
        documentation: '/api-docs',
        healthCheck: '/api/v1/health',
        tasks: '/api/v1/tasks',
        incidents: '/api/v1/incidents',
        automations: '/api/v1/automations',
        copilot: '/api/v1/copilot',
        frontendDashboard: 'http://localhost:3000',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Root health alias
  app.get('/health', (req, res) => res.redirect('/api/v1/health'));

  // 404 Route Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Cannot ${req.method} ${req.originalUrl}. Check /api-docs for valid endpoints.`,
      },
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
