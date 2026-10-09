import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Layers,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Shield,
  Sparkles,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Settings2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { getApiBaseUrl, setApiBaseUrl } from '../lib/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline' | 'unknown'>('unknown');
  const [serverPingMs, setServerPingMs] = useState<number | null>(null);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const currentApiUrl = getApiBaseUrl();

  const probeBackend = async (targetUrl?: string) => {
    const url = targetUrl || currentApiUrl;
    setServerStatus('checking');
    const start = performance.now();
    try {
      // Test the health endpoint
      const cleanBase = url.replace(/\/+$/, '');
      const healthUrl = cleanBase.endsWith('/api/v1') ? `${cleanBase}/health` : `${cleanBase}/api/v1/health`;
      const res = await axios.get(healthUrl, { timeout: 7000 });
      const elapsed = Math.round(performance.now() - start);
      setServerPingMs(elapsed);
      if (res.status === 200 || res.data?.status === 'HEALTHY' || res.data?.status === 'OPERATIONAL' || res.data?.success) {
        setServerStatus('online');
      } else {
        setServerStatus('online');
      }
    } catch (err: any) {
      // Try root as fallback
      try {
        const rootUrl = url.replace(/\/api\/v1\/?$/, '');
        await axios.get(rootUrl, { timeout: 5000 });
        const elapsed = Math.round(performance.now() - start);
        setServerPingMs(elapsed);
        setServerStatus('online');
      } catch (rootErr) {
        setServerStatus('offline');
        setServerPingMs(null);
      }
    }
  };

  useEffect(() => {
    setCustomUrlInput(localStorage.getItem('opsflow_api_url') || '');
    probeBackend();
  }, []);

  const handleSaveServerUrl = () => {
    if (customUrlInput.trim()) {
      setApiBaseUrl(customUrlInput.trim());
      showToast('Backend API URL saved!', 'success');
      probeBackend(customUrlInput.trim());
    } else {
      setApiBaseUrl('');
      showToast('Reset to default backend URL', 'info');
      probeBackend();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(email, password);
      showToast('Welcome back to OpsFlow!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      const status = err.response?.status;
      const backendMsg = err.response?.data?.error?.message;

      if (status === 404) {
        setErrorMessage(
          `Cannot reach authentication endpoint at [${currentApiUrl}]. If running on Netlify/Vercel, make sure you configure your live Render Backend URL below.`
        );
        setShowServerConfig(true);
        showToast('Backend endpoint not found (404). Check API URL.', 'error');
      } else if (!err.response || err.message === 'Network Error') {
        setErrorMessage(
          `Unable to connect to backend server (${currentApiUrl}). Render free tier instances may take 30-50s to wake up on first request. Please wait a moment or verify your URL.`
        );
        setShowServerConfig(true);
        showToast('Network error: Server might be waking up or offline.', 'warning');
      } else {
        setErrorMessage(backendMsg || 'Invalid email or password. Please try again.');
        showToast(backendMsg || 'Authentication failed. Please check credentials.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center py-12 px-6 lg:px-8 relative selection:bg-brand-500 selection:text-white overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div
          className="inline-flex items-center gap-3 cursor-pointer mb-6"
          onClick={() => navigate('/')}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-glow-md font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            OPS<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-sky-300">FLOW</span>
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Sign in to your enterprise workspace
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          Enter credentials or click any instant demo role below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-card rounded-3xl py-8 px-6 sm:px-10 border border-white/[0.08] shadow-2xl space-y-6">
          {/* Error Banner if any */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold block mb-0.5">Authentication Issue</span>
                {errorMessage}
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Work Email"
              type="email"
              required
              placeholder="name@company.io"
              leftIcon={<Mail className="w-4 h-4 text-brand-400" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-brand-400" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-brand-500 mr-2"
                />
                Remember me
              </label>
              <a href="#" className="text-brand-400 hover:underline">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full mt-3 shadow-glow-sm font-bold text-sm"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to OpsFlow
            </Button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="pt-2 border-t border-white/[0.06]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-brand-400" />
              <span>One-Click Instant Demo Roles</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin@nexuscloud.io')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center group ${
                  email === 'admin@nexuscloud.io'
                    ? 'border-purple-500 bg-purple-500/15 ring-1 ring-purple-500'
                    : 'border-slate-800/90 hover:border-purple-500/50 hover:bg-purple-500/10'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-slate-200">Admin</span>
                <span className="text-[10px] text-slate-400">Alex Chen</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoCredentials('sarah.connor@nexuscloud.io')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center group ${
                  email === 'sarah.connor@nexuscloud.io'
                    ? 'border-brand-500 bg-brand-500/15 ring-1 ring-brand-500'
                    : 'border-slate-800/90 hover:border-brand-500/50 hover:bg-brand-500/10'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-slate-200">Manager</span>
                <span className="text-[10px] text-slate-400">Sarah C.</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoCredentials('marcus.vance@nexuscloud.io')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center group ${
                  email === 'marcus.vance@nexuscloud.io'
                    ? 'border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500'
                    : 'border-slate-800/90 hover:border-emerald-500/50 hover:bg-emerald-500/10'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-slate-200">Employee</span>
                <span className="text-[10px] text-slate-400">Marcus V.</span>
              </button>
            </div>
          </div>

          {/* Backend Connection Status & Switcher */}
          <div className="pt-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowServerConfig(!showServerConfig)}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                <Server className="w-3.5 h-3.5 text-brand-400" />
                <span>Backend API:</span>
                <span className="font-mono text-[10px] text-slate-300 max-w-[140px] truncate">
                  {currentApiUrl}
                </span>
                {showServerConfig ? (
                  <ChevronUp className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                )}
              </button>

              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    serverStatus === 'online'
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                      : serverStatus === 'checking'
                      ? 'bg-amber-400 animate-pulse'
                      : serverStatus === 'offline'
                      ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                      : 'bg-slate-500'
                  }`}
                />
                <span className="text-[10px] font-medium text-slate-400">
                  {serverStatus === 'online' && `Online ${serverPingMs ? `(${serverPingMs}ms)` : ''}`}
                  {serverStatus === 'checking' && 'Checking...'}
                  {serverStatus === 'offline' && 'Offline / Unreachable'}
                  {serverStatus === 'unknown' && 'Unknown'}
                </span>
                <button
                  type="button"
                  title="Check Server Status"
                  onClick={() => probeBackend()}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${serverStatus === 'checking' ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Collapsible Backend URL Configuration */}
            {showServerConfig && (
              <div className="mt-3 p-3.5 rounded-2xl bg-slate-900/90 border border-white/[0.08] space-y-2.5 text-xs animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                  <span>Configure Render Backend URL</span>
                  <Settings2 className="w-3.5 h-3.5 text-brand-400" />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  If your backend is deployed on Render (e.g. <span className="text-sky-300 font-mono">https://opsflow-api-xxxx.onrender.com</span>), paste its URL here to connect directly.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://your-backend.onrender.com"
                    className="flex-1 px-2.5 py-1.5 rounded-xl bg-black/40 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <Button size="sm" onClick={handleSaveServerUrl}>
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Need a dedicated enterprise tenant?{' '}
          <Link to="/register" className="text-brand-400 font-semibold hover:underline">
            Register your company
          </Link>
        </p>
      </div>
    </div>
  );
}

