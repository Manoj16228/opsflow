export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'ANALYST';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'BACKLOG' | 'ASSIGNED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'ASSIGNED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE'
  | 'INCIDENT_ASSIGNED'
  | 'INCIDENT_STATUS_CHANGED'
  | 'INCIDENT_SLA_BREACH'
  | 'SYSTEM_ALERT';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  organizationId: string;
  organizationName?: string;
  employeeId?: string;
  organization?: Organization;
  employeeProfile?: Employee;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  industry?: string | null;
  logoUrl?: string | null;
  plan: string;
  isActive: boolean;
  settings?: Record<string, any>;
  _count?: {
    users: number;
    employees: number;
    departments: number;
    tasks: number;
    incidents: number;
  };
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string | null;
  managerId?: string | null;
  employees?: Employee[];
  _count?: {
    employees: number;
    tasks: number;
    incidents: number;
  };
}

export interface Employee {
  id: string;
  organizationId: string;
  userId?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  designation: string;
  skills: string[];
  status: EmployeeStatus;
  avatarUrl?: string | null;
  joiningDate: string;
  department?: Department | null;
  manager?: Employee | null;
  directReports?: Employee[];
  activeWorkload?: {
    activeTasks: number;
    activeIncidents: number;
    totalActive: number;
  };
  performance?: {
    totalAssignedTasks: number;
    completedTasks: number;
    overdueTasks: number;
    taskCompletionRate: number;
    assignedIncidents: number;
    resolvedIncidents: number;
    slaComplianceRate: number;
  };
  recentTasks?: Task[];
  recentIncidents?: Incident[];
}

export interface Task {
  id: string;
  taskCode: string;
  organizationId: string;
  departmentId?: string | null;
  assignedToId?: string | null;
  createdById: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  estimatedHours?: number | null;
  actualHours?: number | null;
  startDate?: string | null;
  dueDate?: string | null;
  completedDate?: string | null;
  slaHours?: number | null;
  slaDeadline?: string | null;
  isSlaBreached: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  department?: Department | null;
  assignedTo?: Employee | null;
  createdBy?: Partial<User> | null;
  comments?: TaskComment[];
  histories?: TaskHistory[];
  _count?: {
    comments: number;
    histories: number;
  };
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    role: UserRole;
  };
}

export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Incident {
  id: string;
  incidentCode: string;
  organizationId: string;
  departmentId?: string | null;
  reportedById: string;
  assignedEmployeeId?: string | null;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  slaHours: number;
  slaDeadline?: string | null;
  isSlaBreached: boolean;
  resolvedAt?: string | null;
  closedAt?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  slaStatus?: 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'MET';
  remainingMinutes?: number | null;
  department?: Department | null;
  reportedBy?: Partial<User> | null;
  assignedEmployee?: Employee | null;
  comments?: IncidentComment[];
  histories?: IncidentHistory[];
  _count?: {
    comments: number;
    histories: number;
  };
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    role: UserRole;
  };
}

export interface IncidentHistory {
  id: string;
  incidentId: string;
  userId: string;
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  organizationId: string;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  } | null;
}

export interface DashboardOverview {
  kpi: {
    totalEmployees: number;
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
    overdueTasks: number;
    openIncidents: number;
    criticalIncidents: number;
    slaComplianceRate: number;
    avgResolutionHours: number;
  };
}
