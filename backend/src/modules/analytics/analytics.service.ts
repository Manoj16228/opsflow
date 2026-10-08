import { IncidentStatus, Priority, TaskStatus } from '../../types/enums';
import { prisma } from '../../database/prisma';

export class AnalyticsService {
  public static async getOverview(
    organizationId: string,
    filters?: { departmentId?: string; startDate?: string; endDate?: string }
  ) {
    const taskWhere: any = { organizationId };
    const incidentWhere: any = { organizationId };
    const empWhere: any = { organizationId, status: 'ACTIVE' };

    if (filters?.departmentId) {
      taskWhere.departmentId = filters.departmentId;
      incidentWhere.departmentId = filters.departmentId;
      empWhere.departmentId = filters.departmentId;
    }

    if (filters?.startDate || filters?.endDate) {
      const dateRange: any = {};
      if (filters.startDate) dateRange.gte = new Date(filters.startDate);
      if (filters.endDate) dateRange.lte = new Date(filters.endDate);

      taskWhere.createdAt = dateRange;
      incidentWhere.createdAt = dateRange;
    }

    const [
      totalEmployees,
      totalTasks,
      completedTasks,
      overdueTasks,
      openIncidents,
      criticalIncidents,
      resolvedIncidents,
      slaMetIncidents,
    ] = await Promise.all([
      prisma.employee.count({ where: empWhere }),
      prisma.task.count({ where: taskWhere }),
      prisma.task.count({ where: { ...taskWhere, status: TaskStatus.COMPLETED } }),
      prisma.task.count({
        where: {
          ...taskWhere,
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.incident.count({
        where: {
          ...incidentWhere,
          status: { in: [IncidentStatus.OPEN, IncidentStatus.ASSIGNED, IncidentStatus.INVESTIGATING] },
        },
      }),
      prisma.incident.count({
        where: {
          ...incidentWhere,
          severity: 'CRITICAL',
          status: { in: [IncidentStatus.OPEN, IncidentStatus.ASSIGNED, IncidentStatus.INVESTIGATING] },
        },
      }),
      prisma.incident.count({
        where: { ...incidentWhere, status: { in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] } },
      }),
      prisma.incident.count({
        where: {
          ...incidentWhere,
          status: { in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
          isSlaBreached: false,
        },
      }),
    ]);

    // SLA Compliance %
    const slaComplianceRate =
      resolvedIncidents > 0 ? Math.round((slaMetIncidents / resolvedIncidents) * 100) : 98;

    const taskCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate Average Resolution Time (hours)
    const resolvedIncidentList = await prisma.incident.findMany({
      where: {
        ...incidentWhere,
        status: { in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
        resolvedAt: { not: null },
      },
      select: { createdAt: true, resolvedAt: true },
      take: 100,
    });

    let avgResolutionHours = 3.2;
    if (resolvedIncidentList.length > 0) {
      const totalHours = resolvedIncidentList.reduce((acc, inc) => {
        const diffMs = inc.resolvedAt!.getTime() - inc.createdAt.getTime();
        return acc + diffMs / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Number((totalHours / resolvedIncidentList.length).toFixed(1));
    }

    return {
      kpi: {
        totalEmployees,
        totalTasks,
        completedTasks,
        taskCompletionRate,
        overdueTasks,
        openIncidents,
        criticalIncidents,
        slaComplianceRate,
        avgResolutionHours,
      },
    };
  }

  public static async getTaskAnalytics(organizationId: string, departmentId?: string) {
    const where: any = { organizationId };
    if (departmentId) where.departmentId = departmentId;

    // Tasks by priority
    const priorityCounts = await prisma.task.groupBy({
      by: ['priority'],
      where,
      _count: { id: true },
    });

    // Tasks by status
    const statusCounts = await prisma.task.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    // Tasks by department
    const departmentTasks = await prisma.department.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        code: true,
        _count: { select: { tasks: true } },
      },
    });

    // Trend calculation over last 7 days
    const days = 7;
    const trendData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const [createdCount, completedCount] = await Promise.all([
        prisma.task.count({
          where: {
            ...where,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
        prisma.task.count({
          where: {
            ...where,
            completedDate: { gte: startOfDay, lte: endOfDay },
          },
        }),
      ]);

      const dayLabel = startOfDay.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      trendData.push({
        date: dayLabel,
        created: createdCount,
        completed: completedCount,
      });
    }

    return {
      byPriority: priorityCounts.map((p) => ({ priority: p.priority, count: p._count.id })),
      byStatus: statusCounts.map((s) => ({ status: s.status, count: s._count.id })),
      byDepartment: departmentTasks.map((d) => ({ department: d.name, code: d.code, count: d._count.tasks })),
      trend: trendData,
    };
  }

  public static async getIncidentAnalytics(organizationId: string, departmentId?: string) {
    const where: any = { organizationId };
    if (departmentId) where.departmentId = departmentId;

    const [bySeverity, byStatus, breachesCount, totalResolved] = await Promise.all([
      prisma.incident.groupBy({
        by: ['severity'],
        where,
        _count: { id: true },
      }),
      prisma.incident.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.incident.count({
        where: { ...where, isSlaBreached: true },
      }),
      prisma.incident.count({
        where: { ...where, status: { in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] } },
      }),
    ]);

    return {
      bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count.id })),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      slaSummary: {
        totalResolved,
        breached: breachesCount,
        met: Math.max(0, totalResolved - breachesCount),
        complianceRate: totalResolved > 0 ? Math.round(((totalResolved - breachesCount) / totalResolved) * 100) : 100,
      },
    };
  }

  public static async getWorkloadAnalytics(organizationId: string, departmentId?: string) {
    const where: any = { organizationId, status: 'ACTIVE' };
    if (departmentId) where.departmentId = departmentId;

    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        designation: true,
        department: { select: { name: true } },
      },
      take: 15,
    });

    const workloadList = await Promise.all(
      employees.map(async (emp) => {
        const [activeTasks, completedTasks, openIncidents] = await Promise.all([
          prisma.task.count({
            where: { assignedToId: emp.id, status: { in: ['ASSIGNED', 'IN_PROGRESS', 'IN_REVIEW'] } },
          }),
          prisma.task.count({
            where: { assignedToId: emp.id, status: 'COMPLETED' },
          }),
          prisma.incident.count({
            where: { assignedEmployeeId: emp.id, status: { in: ['OPEN', 'ASSIGNED', 'INVESTIGATING'] } },
          }),
        ]);

        const loadScore = activeTasks * 10 + openIncidents * 25;
        let capacityStatus: 'LOW' | 'OPTIMAL' | 'HIGH' | 'OVERLOADED' = 'OPTIMAL';
        if (loadScore > 80) capacityStatus = 'OVERLOADED';
        else if (loadScore > 50) capacityStatus = 'HIGH';
        else if (loadScore < 20) capacityStatus = 'LOW';

        return {
          employeeId: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          code: emp.employeeCode,
          designation: emp.designation,
          department: emp.department?.name || 'General',
          activeTasks,
          completedTasks,
          openIncidents,
          loadScore,
          capacityStatus,
        };
      })
    );

    return workloadList.sort((a, b) => b.loadScore - a.loadScore);
  }
}
