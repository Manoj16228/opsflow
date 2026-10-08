import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting OpsFlow Enterprise Database Seeding...');

  // Common password hash for demo accounts: "Password123!"
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // Clean existing database records (idempotent seeding)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.incidentComment.deleteMany();
  await prisma.incidentHistory.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('🧹 Cleaned existing database state.');

  // ===========================================================================
  // 1. ORGANIZATIONS
  // ===========================================================================
  const orgNexus = await prisma.organization.create({
    data: {
      name: 'Nexus Cloud Technologies',
      slug: 'nexus-cloud',
      domain: 'nexuscloud.io',
      industry: 'Cloud Infrastructure & SaaS',
      plan: 'ENTERPRISE',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=60',
    },
  });

  const orgVanguard = await prisma.organization.create({
    data: {
      name: 'Vanguard Global Logistics',
      slug: 'vanguard-logistics',
      domain: 'vanguardlogistics.com',
      industry: 'Supply Chain & Logistics',
      plan: 'ENTERPRISE',
      logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=128&auto=format&fit=crop&q=60',
    },
  });

  const orgApex = await prisma.organization.create({
    data: {
      name: 'Apex Financial Systems',
      slug: 'apex-financial',
      domain: 'apexfin.io',
      industry: 'Fintech & Capital Markets',
      plan: 'ENTERPRISE',
      logoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=60',
    },
  });

  console.log('✅ Created 3 Enterprise Organizations');

  // ===========================================================================
  // 2. DEPARTMENTS FOR NEXUS
  // ===========================================================================
  const deptsNexus = await Promise.all([
    prisma.department.create({
      data: {
        organizationId: orgNexus.id,
        name: 'Site Reliability & Cloud Infra',
        code: 'SRE',
        description: 'Global infrastructure, Kubernetes clusters, and cloud platform reliability',
      },
    }),
    prisma.department.create({
      data: {
        organizationId: orgNexus.id,
        name: 'Core Platform Engineering',
        code: 'ENG',
        description: 'Backend microservices, distributed systems, and API gateways',
      },
    }),
    prisma.department.create({
      data: {
        organizationId: orgNexus.id,
        name: 'Cybersecurity & Compliance',
        code: 'SEC',
        description: 'SOC2 compliance, penetration testing, threat detection, and IAM',
      },
    }),
    prisma.department.create({
      data: {
        organizationId: orgNexus.id,
        name: 'Customer Success & Tier-3 Support',
        code: 'CUST',
        description: 'Enterprise escalation response, incident triage, and customer SLAs',
      },
    }),
  ]);

  const [sreDept, engDept, secDept, custDept] = deptsNexus;

  // ===========================================================================
  // 3. USERS & EMPLOYEES FOR NEXUS CLOUD
  // ===========================================================================
  const userAdmin = await prisma.user.create({
    data: {
      organizationId: orgNexus.id,
      email: 'admin@nexuscloud.io',
      passwordHash,
      firstName: 'Alexander',
      lastName: 'Chen',
      role: 'ADMIN',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const empAdmin = await prisma.employee.create({
    data: {
      organizationId: orgNexus.id,
      userId: userAdmin.id,
      departmentId: sreDept.id,
      employeeCode: 'EMP-1001',
      firstName: 'Alexander',
      lastName: 'Chen',
      email: 'admin@nexuscloud.io',
      phone: '+1 (415) 555-0190',
      designation: 'VP of Platform Engineering',
      skills: JSON.stringify(['Architecture', 'Kubernetes', 'Cloud Strategy', 'Incident Command']),
      status: 'ACTIVE',
      avatarUrl: userAdmin.avatarUrl,
    },
  });

  const userManager = await prisma.user.create({
    data: {
      organizationId: orgNexus.id,
      email: 'sarah.connor@nexuscloud.io',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Connor',
      role: 'MANAGER',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
  });

  const empManager = await prisma.employee.create({
    data: {
      organizationId: orgNexus.id,
      userId: userManager.id,
      departmentId: sreDept.id,
      managerId: empAdmin.id,
      employeeCode: 'EMP-1002',
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah.connor@nexuscloud.io',
      phone: '+1 (415) 555-0192',
      designation: 'Staff SRE Manager',
      skills: JSON.stringify(['Incident Response', 'PostgreSQL', 'Terraform', 'Team Leadership']),
      status: 'ACTIVE',
      avatarUrl: userManager.avatarUrl,
    },
  });

  // Additional engineers/employees
  const rawEmployeesData = [
    {
      email: 'marcus.vance@nexuscloud.io',
      firstName: 'Marcus',
      lastName: 'Vance',
      role: 'EMPLOYEE',
      deptId: sreDept.id,
      code: 'EMP-1003',
      designation: 'Senior Cloud Infrastructure Engineer',
      skills: ['Kubernetes', 'AWS', 'Terraform', 'Prometheus', 'Linux'],
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      email: 'elena.rostova@nexuscloud.io',
      firstName: 'Elena',
      lastName: 'Rostova',
      role: 'EMPLOYEE',
      deptId: engDept.id,
      code: 'EMP-1004',
      designation: 'Lead Distributed Systems Engineer',
      skills: ['Node.js', 'Go', 'Redis', 'Kafka', 'System Design'],
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    {
      email: 'david.kim@nexuscloud.io',
      firstName: 'David',
      lastName: 'Kim',
      role: 'EMPLOYEE',
      deptId: secDept.id,
      code: 'EMP-1005',
      designation: 'Senior Application Security Specialist',
      skills: ['Penetration Testing', 'SOC2', 'OAuth2', 'Vault', 'Zero Trust'],
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    {
      email: 'priya.patel@nexuscloud.io',
      firstName: 'Priya',
      lastName: 'Patel',
      role: 'EMPLOYEE',
      deptId: custDept.id,
      code: 'EMP-1006',
      designation: 'Lead Technical Operations & SLA Specialist',
      skills: ['Triage', 'Root Cause Analysis', 'Customer Communication', 'SQL'],
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const createdEmployees: any[] = [empAdmin, empManager];

  for (const empData of rawEmployeesData) {
    const user = await prisma.user.create({
      data: {
        organizationId: orgNexus.id,
        email: empData.email,
        passwordHash,
        firstName: empData.firstName,
        lastName: empData.lastName,
        role: empData.role,
        status: 'ACTIVE',
        avatarUrl: empData.avatar,
      },
    });

    const emp = await prisma.employee.create({
      data: {
        organizationId: orgNexus.id,
        userId: user.id,
        departmentId: empData.deptId,
        managerId: empManager.id,
        employeeCode: empData.code,
        firstName: empData.firstName,
        lastName: empData.lastName,
        email: empData.email,
        phone: '+1 (415) 555-0199',
        designation: empData.designation,
        skills: JSON.stringify(empData.skills),
        status: 'ACTIVE',
        avatarUrl: empData.avatar,
      },
    });

    createdEmployees.push(emp);
  }

  console.log(`✅ Seeded ${createdEmployees.length} employees with accounts and roles.`);

  // ===========================================================================
  // 4. SEED 50+ REALISTIC ENTERPRISE TASKS
  // ===========================================================================
  const taskTemplates = [
    { title: 'Deploy PostgreSQL 16 read-replica cluster in US-East-1', priority: 'HIGH', status: 'COMPLETED', dept: sreDept.id, est: 12, act: 10, sla: 24, tags: ['database', 'infra', 'postgres'] },
    { title: 'Implement OAuth2 PKCE flow for mobile client authentication', priority: 'HIGH', status: 'IN_PROGRESS', dept: secDept.id, est: 16, act: 8, sla: 36, tags: ['security', 'auth', 'oauth'] },
    { title: 'Migrate legacy Redis caching to Redis Cluster with sentinel', priority: 'CRITICAL', status: 'IN_PROGRESS', dept: sreDept.id, est: 20, act: 14, sla: 24, tags: ['cache', 'redis', 'high-availability'] },
    { title: 'Optimize SQL slow queries on Task pagination and full-text search', priority: 'MEDIUM', status: 'COMPLETED', dept: engDept.id, est: 6, act: 5, sla: 48, tags: ['database', 'performance', 'sql'] },
    { title: 'Implement BullMQ worker auto-scaling policy on Kubernetes HPA', priority: 'HIGH', status: 'ASSIGNED', dept: sreDept.id, est: 8, act: 0, sla: 48, tags: ['k8s', 'queues', 'devops'] },
    { title: 'Conduct quarterly SOC-2 Type II audit evidence collection', priority: 'CRITICAL', status: 'IN_PROGRESS', dept: secDept.id, est: 40, act: 28, sla: 72, tags: ['compliance', 'audit', 'security'] },
    { title: 'Build automated SLA breach webhook alerts for P1 incidents', priority: 'HIGH', status: 'COMPLETED', dept: engDept.id, est: 10, act: 9, sla: 24, tags: ['alerts', 'sla', 'webhooks'] },
    { title: 'Refactor monolithic Express router into domain-driven modules', priority: 'MEDIUM', status: 'COMPLETED', dept: engDept.id, est: 14, act: 12, sla: 48, tags: ['architecture', 'backend', 'refactoring'] },
    { title: 'Configure TLS 1.3 strict transport security across all load balancers', priority: 'HIGH', status: 'COMPLETED', dept: secDept.id, est: 4, act: 3, sla: 24, tags: ['security', 'ssl', 'networking'] },
    { title: 'Setup synthetic healthcheck probes across 5 global AWS regions', priority: 'MEDIUM', status: 'IN_REVIEW', dept: sreDept.id, est: 8, act: 7, sla: 48, tags: ['monitoring', 'observability', 'uptime'] },
    { title: 'Implement Power BI DirectQuery star schema dimensional data mart', priority: 'HIGH', status: 'IN_PROGRESS', dept: engDept.id, est: 24, act: 18, sla: 48, tags: ['analytics', 'etl', 'powerbi'] },
    { title: 'Upgrade React frontend dependencies and TanStack Query v5', priority: 'LOW', status: 'COMPLETED', dept: engDept.id, est: 8, act: 6, sla: 72, tags: ['frontend', 'react', 'dependencies'] },
    { title: 'Conduct load testing for 50,000 concurrent websocket connections', priority: 'HIGH', status: 'BACKLOG', dept: sreDept.id, est: 16, act: 0, sla: 72, tags: ['loadtest', 'sockets', 'performance'] },
    { title: 'Audit Azure Blob Storage lifecycle rules for cost optimization', priority: 'LOW', status: 'COMPLETED', dept: sreDept.id, est: 4, act: 3, sla: 96, tags: ['azure', 'storage', 'finops'] },
    { title: 'Create disaster recovery failover runbook and automate DNS cutover', priority: 'CRITICAL', status: 'IN_PROGRESS', dept: sreDept.id, est: 30, act: 22, sla: 48, tags: ['dr', 'dns', 'failover'] },
  ];

  let taskCounter = 1001;
  for (let cycle = 0; cycle < 4; cycle++) {
    for (const t of taskTemplates) {
      const assignedEmp = createdEmployees[taskCounter % createdEmployees.length];
      const daysAgo = Math.floor(Math.random() * 20) + 1;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const dueDate = new Date(createdAt.getTime() + (t.sla + Math.floor(Math.random() * 48)) * 60 * 60 * 1000);
      const isOverdue = dueDate < new Date() && t.status !== 'COMPLETED' && t.status !== 'CANCELLED';

      const createdTask = await prisma.task.create({
        data: {
          taskCode: `TSK-${taskCounter}`,
          organizationId: orgNexus.id,
          departmentId: t.dept,
          assignedToId: assignedEmp.id,
          createdById: userManager.id,
          title: cycle > 0 ? `${t.title} (Batch ${cycle + 1})` : t.title,
          description: `Enterprise operational task allocated to ${assignedEmp.designation}. Requires strict adherence to SLA compliance standards.`,
          priority: t.priority,
          status: isOverdue ? 'IN_PROGRESS' : t.status,
          estimatedHours: t.est,
          actualHours: t.status === 'COMPLETED' ? t.act : Math.floor(t.est / 2),
          startDate: createdAt,
          dueDate,
          completedDate: t.status === 'COMPLETED' ? new Date(createdAt.getTime() + t.sla * 3600000) : null,
          slaHours: t.sla,
          slaDeadline: new Date(createdAt.getTime() + t.sla * 3600000),
          isSlaBreached: isOverdue,
          tags: JSON.stringify(t.tags),
          createdAt,
        },
      });

      if (taskCounter % 3 === 0) {
        await prisma.taskComment.create({
          data: {
            taskId: createdTask.id,
            userId: userAdmin.id,
            content: `Verification completed in staging environment. Changes pass all integration tests.`,
          },
        });
      }

      taskCounter++;
    }
  }

  console.log(`✅ Seeded ${taskCounter - 1001} realistic enterprise tasks with comments and tags.`);

  // ===========================================================================
  // 5. SEED 25+ ENTERPRISE INCIDENTS & SLA BREACH DATA
  // ===========================================================================
  const incidentTemplates = [
    { title: 'EU-West Payment Webhook Dropping Events', sev: 'CRITICAL', status: 'RESOLVED', slaHours: 1, breached: false, dept: engDept.id },
    { title: 'High Memory Pressure on Redis Cache Node 03', sev: 'HIGH', status: 'RESOLVED', slaHours: 4, breached: false, dept: sreDept.id },
    { title: 'Unusual spike in 401 Unauthorized API responses from APAC gateway', sev: 'HIGH', status: 'INVESTIGATING', slaHours: 4, breached: true, dept: secDept.id },
    { title: 'Kafka Consumer Group lag exceeded 150,000 messages on telemetry stream', sev: 'MEDIUM', status: 'RESOLVED', slaHours: 12, breached: false, dept: engDept.id },
    { title: 'Storage Volume Capacity warning: Database WAL disk reached 88%', sev: 'CRITICAL', status: 'RESOLVED', slaHours: 1, breached: false, dept: sreDept.id },
    { title: 'Intermittent SSL Handshake timeouts reported on US-East CDN edge', sev: 'MEDIUM', status: 'OPEN', slaHours: 12, breached: false, dept: sreDept.id },
    { title: 'Slow query execution on Employee Workload calculation endpoint', sev: 'LOW', status: 'RESOLVED', slaHours: 48, breached: false, dept: engDept.id },
    { title: 'Third-party SMS delivery gateway downtime affecting 2FA authentication', sev: 'HIGH', status: 'CLOSED', slaHours: 4, breached: true, dept: custDept.id },
    { title: 'Elasticsearch Index read-only watermark triggered by unoptimized logs', sev: 'MEDIUM', status: 'RESOLVED', slaHours: 12, breached: false, dept: sreDept.id },
  ];

  let incCounter = 2001;
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const inc of incidentTemplates) {
      const assignedEmp = createdEmployees[incCounter % createdEmployees.length];
      const hoursAgo = Math.floor(Math.random() * 40) + 2;
      const createdAt = new Date(Date.now() - hoursAgo * 3600 * 1000);
      const slaDeadline = new Date(createdAt.getTime() + inc.slaHours * 3600 * 1000);
      const resolvedAt = inc.status === 'RESOLVED' || inc.status === 'CLOSED'
        ? new Date(createdAt.getTime() + (inc.breached ? inc.slaHours + 2 : inc.slaHours - 0.5) * 3600 * 1000)
        : null;

      const incident = await prisma.incident.create({
        data: {
          incidentCode: `INC-${incCounter}`,
          organizationId: orgNexus.id,
          departmentId: inc.dept,
          reportedById: userManager.id,
          assignedEmployeeId: assignedEmp.id,
          title: cycle > 0 ? `${inc.title} [Incident Group ${cycle + 1}]` : inc.title,
          description: `Telemetry detected operational anomaly requiring immediate triage. Service level agreement is strictly monitored.`,
          severity: inc.sev,
          status: inc.status,
          slaHours: inc.slaHours,
          slaDeadline,
          isSlaBreached: inc.breached,
          resolvedAt,
          resolutionNotes: resolvedAt ? 'Applied hotfix and auto-scaled instances. Root cause documented in post-mortem.' : null,
          createdAt,
        },
      });

      await prisma.incidentComment.create({
        data: {
          incidentId: incident.id,
          userId: userAdmin.id,
          content: `Triage started. Assigned on-call response team: ${assignedEmp.firstName} ${assignedEmp.lastName}.`,
        },
      });

      incCounter++;
    }
  }

  console.log(`✅ Seeded ${incCounter - 2001} enterprise incidents with SLA tracking metrics.`);

  // ===========================================================================
  // 6. SEED NOTIFICATIONS & AUDIT LOGS
  // ===========================================================================
  await prisma.notification.createMany({
    data: [
      {
        organizationId: orgNexus.id,
        userId: userAdmin.id,
        title: 'Platform SLA Compliance Alert',
        message: 'Monthly SLA compliance rating maintained at 98.4% across 60 completed tasks.',
        type: 'SYSTEM_ALERT',
        linkUrl: '/analytics',
        isRead: false,
      },
      {
        organizationId: orgNexus.id,
        userId: userAdmin.id,
        title: 'Critical Incident INC-2001 Resolved',
        message: 'EU-West Payment Webhook incident resolved within 42 minutes (SLA Met).',
        type: 'INCIDENT_STATUS_CHANGED',
        linkUrl: '/incidents',
        isRead: true,
      },
      {
        organizationId: orgNexus.id,
        userId: userManager.id,
        title: 'New High Priority Task Assigned',
        message: 'Task TSK-1003: Migrate legacy Redis caching assigned to SRE team.',
        type: 'TASK_ASSIGNED',
        linkUrl: '/tasks',
        isRead: false,
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: orgNexus.id,
        userId: userAdmin.id,
        userEmail: userAdmin.email,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: userAdmin.id,
        ipAddress: '192.168.1.1',
      },
      {
        organizationId: orgNexus.id,
        userId: userAdmin.id,
        userEmail: userAdmin.email,
        action: 'ORGANIZATION_CREATED',
        entity: 'Organization',
        entityId: orgNexus.id,
        newValues: JSON.stringify({ name: orgNexus.name, plan: 'ENTERPRISE' }),
      },
      {
        organizationId: orgNexus.id,
        userId: userManager.id,
        userEmail: userManager.email,
        action: 'TASK_CREATED',
        entity: 'Task',
        entityId: 'TSK-1001',
        newValues: JSON.stringify({ title: 'Deploy PostgreSQL 16 cluster', priority: 'HIGH' }),
      },
    ],
  });

  console.log('✅ Seeded enterprise Notifications and Audit Logs.');
  console.log('🎉 Seed complete! Admin Login: admin@nexuscloud.io | Password: Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
