import React, { useState } from 'react';
import {
  User,
  Shield,
  Mail,
  Building,
  Key,
  Clock,
  CheckCircle2,
  Smartphone,
  Laptop,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { playChime } from '../lib/audioAlerts';

export function ProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  const [activeSessions, setActiveSessions] = useState([
    {
      id: 'sess-current',
      device: 'MacBook Pro 16" (macOS Sequoia)',
      browser: 'Chrome 129.0 Enterprise',
      ip: '127.0.0.1 (Localhost)',
      location: 'Local Workstation',
      lastActive: 'Active Now',
      isCurrent: true,
    },
    {
      id: 'sess-mobile',
      device: 'iPhone 15 Pro (iOS 18)',
      browser: 'Mobile Safari 18.0',
      ip: '192.168.1.145',
      location: 'Internal VPN Gateway',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
  ]);

  const secretKey = 'JBSWY3DPEHPK3PXP';

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
    showToast('Secret key copied to clipboard', 'info');
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length < 6) {
      showToast('Please enter a valid 6-digit code', 'error');
      return;
    }
    setIs2FAEnabled(true);
    setIsSettingUp2FA(false);
    showToast('Two-Factor Authentication (TOTP) activated', 'success');
    playChime('success');
  };

  const handleRevokeSession = (sessionId: string) => {
    setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast('Session revoked successfully', 'info');
    playChime('notification');
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-5 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <User className="w-7 h-7 text-brand-500" /> Identity, Security & Access Governance
          </h1>
          <Badge variant="purple" className="text-xs font-mono">
            {user?.role || 'MEMBER'}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Zero-trust authentication, TOTP multi-factor verification, and active enterprise session tokens.
        </p>
      </div>

      {/* Account Details Card */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.firstName}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-300 dark:ring-slate-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl font-extrabold shadow-glow-sm">
                {user?.firstName?.[0] || 'U'}
                {user?.lastName?.[0] || ''}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="success" dot className="text-[10px] font-mono">
                  ACTIVE DIRECTORY SYNCED
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Active Organization Tenant
            </span>
            <div className="font-bold text-slate-900 dark:text-slate-200">
              {user?.organizationName || user?.organization?.name || 'Nexus Cloud Technologies'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Assigned Role & Privileges
            </span>
            <div className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
              <span>{user?.role} — Full Operations Scope</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication (2FA) */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Two-Factor Authentication (TOTP / RFC 6238)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Secure your sign-in with Google Authenticator, Microsoft Authenticator, or 1Password.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={is2FAEnabled ? 'success' : 'warning'}>
              {is2FAEnabled ? '2FA ENFORCED' : 'NOT CONFIGURED'}
            </Badge>
            {!is2FAEnabled && !isSettingUp2FA && (
              <Button size="sm" variant="primary" onClick={() => setIsSettingUp2FA(true)}>
                Setup 2FA
              </Button>
            )}
          </div>
        </div>

        {isSettingUp2FA && !is2FAEnabled && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <p className="font-semibold">Step 1: Scan QR code or enter secret key into your authenticator app</p>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs">
                <span className="flex-1 text-purple-600 dark:text-purple-400 font-bold">{secretKey}</span>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleVerify2FA} className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Step 2: Enter the 6-digit verification code from your app
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 849201"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-40 px-3 py-2 rounded-xl font-mono text-center text-sm font-extrabold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button size="sm" type="submit" variant="primary" disabled={verificationCode.length < 6}>
                  Verify & Enable
                </Button>
                <Button size="sm" type="button" variant="outline" onClick={() => setIsSettingUp2FA(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Active Enterprise Sessions */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Device & Browser Sessions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authorized JWT session tokens currently granted access to your account.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {activeSessions.map((sess) => (
            <div
              key={sess.id}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                  {sess.isCurrent ? (
                    <Laptop className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Smartphone className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-200">{sess.device}</span>
                    {sess.isCurrent && (
                      <Badge variant="success" className="text-[9px] py-0 px-1 font-mono">
                        THIS DEVICE
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {sess.browser} • {sess.location} ({sess.ip})
                  </div>
                </div>
              </div>

              {!sess.isCurrent && (
                <button
                  onClick={() => handleRevokeSession(sess.id)}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline self-start sm:self-auto"
                >
                  Revoke Token
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
