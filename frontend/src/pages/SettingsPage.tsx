import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, Building, ShieldCheck, Key, Save } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Organization } from '../types';

export function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: organization, isLoading } = useQuery<Organization>({
    queryKey: ['organization-current'],
    queryFn: async () => (await api.get('/organizations/current')).data.data,
  });

  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [industry, setIndustry] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (organization) {
      setName(organization.name);
      setDomain(organization.domain || '');
      setIndustry(organization.industry || '');
    }
  }, [organization]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.patch('/organizations/current', { name, domain, industry });
      showToast('Organization settings updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['organization-current'] });
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-400" /> Organization Settings & Platform Config
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage multi-tenant configuration, corporate branding, and SLA parameters.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Information */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tenant Identity & Branding</CardTitle>
              <CardDescription>Primary organization details and SSO domain bindings</CardDescription>
            </div>
            <Badge variant="purple" className="font-mono text-xs">
              {organization?.plan || 'ENTERPRISE'}
            </Badge>
          </CardHeader>

          <div className="space-y-4">
            <Input
              label="Organization Legal / Brand Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={user?.role !== 'ADMIN'}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Primary Domain"
                placeholder="company.io"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={user?.role !== 'ADMIN'}
              />

              <Input
                label="Industry Classification"
                placeholder="Cloud Infrastructure & SaaS"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                disabled={user?.role !== 'ADMIN'}
              />
            </div>
          </div>
        </Card>

        {/* SLA Policy Defaults */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Default Service Level Agreements (SLA)</CardTitle>
              <CardDescription>Automated countdown threshold targets based on severity</CardDescription>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </CardHeader>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <span className="text-rose-400 font-bold block">P1 Critical</span>
              <span className="text-lg font-bold text-white mt-1 block">1 Hour</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <span className="text-orange-400 font-bold block">P2 High</span>
              <span className="text-lg font-bold text-white mt-1 block">4 Hours</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <span className="text-amber-400 font-bold block">P3 Medium</span>
              <span className="text-lg font-bold text-white mt-1 block">12 Hours</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <span className="text-emerald-400 font-bold block">P4 Low</span>
              <span className="text-lg font-bold text-white mt-1 block">48 Hours</span>
            </div>
          </div>
        </Card>

        {/* Automated Admin Email Alert Settings */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Automated Admin Email Alert Delivery</CardTitle>
              <CardDescription>Instant notification pipeline for alerts, task additions, and major security changes</CardDescription>
            </div>
            <Badge variant="blue" className="font-mono text-xs">
              mozework11@gmail.com
            </Badge>
          </CardHeader>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-200">Designated Admin Recipient Email</div>
                <div className="text-slate-400 font-mono text-[11px] mt-0.5">mozework11@gmail.com</div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AUTOMATED DISPATCH ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-sky-400 font-bold block mb-1">📋 Task Events</span>
                <p className="text-slate-400 text-[11px]">Auto-alerts on task creation, status changes, assignments, and completions.</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-rose-400 font-bold block mb-1">🚨 SRE Incidents &amp; Alerts</span>
                <p className="text-slate-400 text-[11px]">Instant alerts for SEV-1 to SEV-4 outages, SLA breach warnings, and war rooms.</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-purple-400 font-bold block mb-1">🛡️ Major Security Events</span>
                <p className="text-slate-400 text-[11px]">Dispatches for 2FA toggles, role modifications, session revocations, and automations.</p>
              </div>
            </div>
          </div>
        </Card>

        {user?.role === 'ADMIN' && (
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
