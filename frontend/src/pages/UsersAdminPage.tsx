import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, UserPlus, Search, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { EmptyState, Skeleton, ErrorState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import { formatDateTime } from '../lib/utils';
import { User, UserRole } from '../types';

export function UsersAdminPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'EMPLOYEE' as UserRole,
  });

  const {
    data: userResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      return (await api.get(`/users?${params.toString()}`)).data;
    },
  });

  const users: User[] = userResponse?.data || [];

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await api.patch(`/users/${userId}`, { role: newRole });
      showToast('User role updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to update role', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/users', newUser);
      showToast('User account provisioned successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsInviteModalOpen(false);
      setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE' });
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to create user', 'error');
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
            <ShieldAlert className="w-6 h-6 text-purple-400" /> Identity & Access Management (IAM)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage user authorization, assign enterprise roles (Admin, Manager, Employee), and monitor logins.
          </p>
        </div>

        <Button onClick={() => setIsInviteModalOpen(true)} icon={<UserPlus className="w-4 h-4" />}>
          Provision User
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={[
            { label: 'All Roles', value: '' },
            { label: 'ADMIN', value: 'ADMIN' },
            { label: 'MANAGER', value: 'MANAGER' },
            { label: 'EMPLOYEE', value: 'EMPLOYEE' },
            { label: 'ANALYST', value: 'ANALYST' },
          ]}
        />
      </div>

      {/* User Table */}
      {error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <Card className="p-0 overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-4 text-right">Role Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-brand-400">
                          {u.firstName[0]}
                          {u.lastName[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          u.role === 'ADMIN' ? 'purple' : u.role === 'MANAGER' ? 'info' : 'default'
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never logged in'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="ANALYST">ANALYST</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Provision User Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Provision New User Account"
        description="Create credentials and grant role privileges to an organization member."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              value={newUser.firstName}
              onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
            />
            <Input
              label="Last Name"
              required
              value={newUser.lastName}
              onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            required
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />

          <Input
            label="Temporary Password"
            type="password"
            required
            placeholder="Min 8 characters"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />

          <Select
            label="Role & Access Level"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
            options={[
              { label: 'EMPLOYEE (Assigned Tasks & Incident Reporting)', value: 'EMPLOYEE' },
              { label: 'MANAGER (Team Allocation & Incident Triage)', value: 'MANAGER' },
              { label: 'ADMIN (Full Tenant Management & RBAC)', value: 'ADMIN' },
              { label: 'ANALYST (Read-Only Analytics)', value: 'ANALYST' },
            ]}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
