import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back to OpsFlow!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Authentication failed. Please check credentials.', 'error');
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
        <div className="glass-card rounded-3xl py-8 px-6 sm:px-10 border border-white/[0.08] shadow-2xl">
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
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
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
