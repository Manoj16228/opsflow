import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Building,
  Mail,
  Phone,
  CheckSquare,
  AlertTriangle,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { EmptyState, Skeleton, ErrorState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Employee, Department } from '../types';

export function EmployeesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    departmentId: '',
    skills: '',
  });

  // Load Departments
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data.data,
  });

  // Load Employees
  const {
    data: employeeResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employees', search, departmentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (departmentId) params.append('departmentId', departmentId);
      params.append('limit', '50');

      return (await api.get(`/employees?${params.toString()}`)).data;
    },
  });

  const employees: Employee[] = employeeResponse?.data || [];

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const skillsArray = newEmployee.skills
        ? newEmployee.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      await api.post('/employees', {
        ...newEmployee,
        skills: skillsArray,
        departmentId: newEmployee.departmentId || null,
      });

      showToast('Employee created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      setIsAddModalOpen(false);
      setNewEmployee({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        designation: '',
        departmentId: '',
        skills: '',
      });
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to add employee', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" /> Employee Directory & Workforce
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage organizational staff roster, skills attribution, and live workload capacity.
          </p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <Button onClick={() => setIsAddModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Add Employee
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees by name, designation, or employee code..."
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          options={[
            { label: 'All Departments', value: '' },
            ...departments.map((d) => ({ label: d.name, value: d.id })),
          ]}
        />
      </div>

      {/* Content Grid */}
      {error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description="No staff records matched the active filter criteria."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <Card
              key={emp.id}
              hoverEffect
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="cursor-pointer transition-all border border-slate-800 hover:border-slate-700 bg-slate-900/80 p-5 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {emp.avatarUrl ? (
                      <img
                        src={emp.avatarUrl}
                        alt={emp.firstName}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-brand-400">
                        {emp.firstName[0]}
                        {emp.lastName[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-sm text-slate-100 group-hover:text-white transition-colors">
                        {emp.firstName} {emp.lastName}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {emp.employeeCode} • {emp.designation}
                      </span>
                    </div>
                  </div>

                  <Badge variant={emp.status === 'ACTIVE' ? 'success' : 'warning'} className="text-[10px]">
                    {emp.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 my-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.department?.name || 'Operations'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                </div>

                {emp.skills && emp.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {emp.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 text-slate-400 border border-slate-800 font-mono"
                      >
                        {skill}
                      </span>
                    ))}
                    {emp.skills.length > 3 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{emp.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Workload Indicator Footer */}
              <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 flex items-center gap-1">
                    <CheckSquare className="w-3 h-3 text-brand-400" />
                    {emp.activeWorkload?.activeTasks || 0} tasks
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    {emp.activeWorkload?.activeIncidents || 0} inc
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 transition-colors" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Employee"
        description="Register a team member in the organizational hierarchy."
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              placeholder="Elena"
              value={newEmployee.firstName}
              onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
            />
            <Input
              label="Last Name"
              required
              placeholder="Rostova"
              value={newEmployee.lastName}
              onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
            />
          </div>

          <Input
            label="Corporate Email"
            type="email"
            required
            placeholder="elena.rostova@company.io"
            value={newEmployee.email}
            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              placeholder="+1 (555) 0192"
              value={newEmployee.phone}
              onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
            />
            <Input
              label="Job Designation"
              required
              placeholder="Lead DevOps Architect"
              value={newEmployee.designation}
              onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
            />
          </div>

          <Select
            label="Department"
            value={newEmployee.departmentId}
            onChange={(e) => setNewEmployee({ ...newEmployee, departmentId: e.target.value })}
            options={[
              { label: 'Select Department...', value: '' },
              ...departments.map((d) => ({ label: d.name, value: d.id })),
            ]}
          />

          <Input
            label="Skills & Competencies (comma separated)"
            placeholder="Kubernetes, Terraform, Incident Response, PostgreSQL"
            value={newEmployee.skills}
            onChange={(e) => setNewEmployee({ ...newEmployee, skills: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
