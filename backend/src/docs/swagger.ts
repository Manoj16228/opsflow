export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'OpsFlow Enterprise REST API',
    version: '1.0.0',
    description:
      'Enterprise Operations Management & Analytics Platform REST API specifications, covering Authentication, Multi-tenant Organizations, Employees, Departments, SLA-driven Tasks, Incidents, Real-time Notifications, File Storage, and Operational Analytics.',
    contact: {
      name: 'OpsFlow Engineering Team',
      email: 'engineering@opsflow.io',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Primary API Gateway (v1)',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token.',
      },
    },
    schemas: {
      StandardSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          meta: { type: 'object' },
          message: { type: 'string' },
        },
      },
      StandardErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid request payload provided.' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      LoginDto: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'alex.chen@nexuscorp.io' },
          password: { type: 'string', format: 'password', example: 'Password123!' },
        },
      },
      RegisterDto: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName', 'organizationName'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@acme-corp.io' },
          password: { type: 'string', example: 'Password123!' },
          firstName: { type: 'string', example: 'Sarah' },
          lastName: { type: 'string', example: 'Jenkins' },
          organizationName: { type: 'string', example: 'Acme Operations Ltd' },
        },
      },
      TaskDto: {
        type: 'object',
        required: ['title', 'description', 'priority'],
        properties: {
          title: { type: 'string', example: 'Deploy PostgreSQL 16 cluster upgrade' },
          description: { type: 'string', example: 'Execute rolling upgrade with minimal downtime' },
          departmentId: { type: 'string', format: 'uuid' },
          assignedToId: { type: 'string', format: 'uuid' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], example: 'HIGH' },
          status: { type: 'string', enum: ['BACKLOG', 'ASSIGNED', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'], example: 'IN_PROGRESS' },
          estimatedHours: { type: 'number', example: 8 },
          dueDate: { type: 'string', format: 'date-time' },
          slaHours: { type: 'number', example: 24 },
          tags: { type: 'array', items: { type: 'string' }, example: ['infra', 'db', 'upgrade'] },
        },
      },
      IncidentDto: {
        type: 'object',
        required: ['title', 'description', 'severity'],
        properties: {
          title: { type: 'string', example: 'High latency on Payment Processing Gateway' },
          description: { type: 'string', example: 'P99 latency spiked past 3500ms in EU-West-1' },
          severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], example: 'CRITICAL' },
          status: { type: 'string', enum: ['OPEN', 'ASSIGNED', 'INVESTIGATING', 'RESOLVED', 'CLOSED'], example: 'INVESTIGATING' },
          departmentId: { type: 'string', format: 'uuid' },
          assignedEmployeeId: { type: 'string', format: 'uuid' },
          slaHours: { type: 'number', example: 2 },
        },
      },
      EmployeeDto: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'designation'],
        properties: {
          firstName: { type: 'string', example: 'Elena' },
          lastName: { type: 'string', example: 'Rostova' },
          email: { type: 'string', format: 'email', example: 'elena.rostova@nexuscorp.io' },
          phone: { type: 'string', example: '+1-555-0199' },
          departmentId: { type: 'string', format: 'uuid' },
          designation: { type: 'string', example: 'Lead DevOps Architect' },
          skills: { type: 'array', items: { type: 'string' }, example: ['Kubernetes', 'Terraform', 'Go'] },
          status: { type: 'string', enum: ['ACTIVE', 'ON_LEAVE', 'TERMINATED'], example: 'ACTIVE' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'System and database health check endpoint',
        responses: {
          '200': {
            description: 'System healthy',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/StandardSuccessResponse' } } },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a new tenant organization and Admin account',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterDto' } } },
        },
        responses: {
          '201': { description: 'Registration successful' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user credentials and obtain JWT tokens',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginDto' } } },
        },
        responses: {
          '200': { description: 'Authentication successful' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh expired access token with valid refresh token',
        responses: {
          '200': { description: 'Tokens refreshed' },
        },
      },
    },
    '/auth/me': {
      get: {
        security: [{ BearerAuth: [] }],
        summary: 'Get current authenticated user profile & tenant context',
        responses: {
          '200': { description: 'Current profile' },
        },
      },
    },
    '/tasks': {
      get: {
        security: [{ BearerAuth: [] }],
        summary: 'List and filter tasks for the tenant organization',
        responses: { '200': { description: 'Tasks list' } },
      },
      post: {
        security: [{ BearerAuth: [] }],
        summary: 'Create a new task with SLA configuration',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskDto' } } },
        },
        responses: { '201': { description: 'Task created' } },
      },
    },
    '/incidents': {
      get: {
        security: [{ BearerAuth: [] }],
        summary: 'List and filter incidents with SLA metrics',
        responses: { '200': { description: 'Incidents list' } },
      },
      post: {
        security: [{ BearerAuth: [] }],
        summary: 'Report a new incident',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/IncidentDto' } } },
        },
        responses: { '201': { description: 'Incident created' } },
      },
    },
    '/employees': {
      get: {
        security: [{ BearerAuth: [] }],
        summary: 'List employees with department and workload metrics',
        responses: { '200': { description: 'Employee roster' } },
      },
    },
    '/analytics/overview': {
      get: {
        security: [{ BearerAuth: [] }],
        summary: 'Get executive KPI cards and operational summaries',
        responses: { '200': { description: 'Overview metrics' } },
      },
    },
    '/audit-logs': {
      get: {
        security: [{ BearerAuth: [] }],
        summary: 'Query immutable tenant audit logs with filter & pagination',
        responses: { '200': { description: 'Audit log entries' } },
      },
    },
  },
};
