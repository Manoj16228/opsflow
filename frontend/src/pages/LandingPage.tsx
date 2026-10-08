import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Clock,
  Users,
  CheckCircle2,
  Server,
  Activity,
  Lock,
  ChevronRight,
  Radio,
  Flame,
  Sparkles,
  Database,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-brand-500/10 via-sky-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <header className="border-b border-white/[0.08] bg-[#070b14]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-glow-sm font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              OPS<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-sky-300">FLOW</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#telemetry" className="hover:text-white transition-colors">Live Telemetry</a>
            <a href="#analytics" className="hover:text-white transition-colors">Power BI Analytics</a>
            <a href="#security" className="hover:text-white transition-colors">Multi-Tenancy & RBAC</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="text-xs font-semibold"
            >
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/login')}
              className="text-xs font-semibold shadow-glow-sm"
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Open Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-6 max-w-6xl mx-auto text-center z-10">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-glow-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Next-Gen Enterprise Operations & Analytics Platform</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight mb-6">
          Unify enterprise operations with <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-sky-300 to-indigo-400">
            real-time intelligent command.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Orchestrate tasks, mitigate incident outages, enforce SLA targets, and export dimensional star schemas directly into Power BI — with zero third-party lock-in.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            size="lg"
            onClick={() => navigate('/login')}
            className="shadow-glow-md px-8 py-3 text-sm font-bold"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Launch Enterprise Workspace
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/register')}
            className="border-slate-700 hover:border-brand-500/40 px-8 py-3 text-sm font-semibold"
          >
            Register Organization
          </Button>
        </div>

        {/* Live Interactive Telemetry Preview Frame */}
        <div className="relative rounded-3xl border border-white/[0.08] bg-[#0b1120]/80 p-3 sm:p-4 shadow-2xl shadow-black/80 ring-1 ring-white/10 backdrop-blur-2xl text-left">
          {/* Window Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-xs font-mono text-slate-400">opsflow.internal.cloud/dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">98.4% SLA Adherence</span>
            </div>
          </div>

          {/* Metric cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-2">
            <div className="bg-slate-950/80 border border-white/[0.06] rounded-2xl p-4">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                SLA Compliance
              </div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">98.4%</div>
              <div className="text-[10px] text-slate-400 mt-1">Across 60 production tasks</div>
            </div>

            <div className="bg-slate-950/80 border border-white/[0.06] rounded-2xl p-4">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Mean MTTR Time
              </div>
              <div className="text-2xl font-extrabold text-sky-400 mt-1">1.8 hrs</div>
              <div className="text-[10px] text-slate-400 mt-1">-28% vs last quarter</div>
            </div>

            <div className="bg-slate-950/80 border border-white/[0.06] rounded-2xl p-4">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Active Workforce
              </div>
              <div className="text-2xl font-extrabold text-purple-400 mt-1">142 Engineers</div>
              <div className="text-[10px] text-slate-400 mt-1">5 core engineering units</div>
            </div>

            <div className="bg-slate-950/80 border border-white/[0.06] rounded-2xl p-4">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                WebSockets Sync
              </div>
              <div className="text-2xl font-extrabold text-brand-400 mt-1">9ms</div>
              <div className="text-[10px] text-slate-400 mt-1">Zero packet drop</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            Built for mission-critical enterprise operations
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            From automated incident triage to multi-tenant isolation and Power BI star schemas, OpsFlow delivers uncompromising enterprise depth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-card glass-card-hover rounded-3xl p-7 border border-white/[0.08]">
            <div className="p-3 bg-brand-500/10 rounded-2xl w-fit text-brand-400 mb-5">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automated SLA Management</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamically computes target deadlines based on severity matrices (P1=1h, P2=4h, P3=12h, P4=48h) and alerts on-call responders before breaches occur.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card glass-card-hover rounded-3xl p-7 border border-white/[0.08]">
            <div className="p-3 bg-purple-500/10 rounded-2xl w-fit text-purple-400 mb-5">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Workload & Capacity Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time algorithm calculating active engineer capacity, workload distribution, and bottleneck detection across multi-tiered departments.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card glass-card-hover rounded-3xl p-7 border border-white/[0.08]">
            <div className="p-3 bg-emerald-500/10 rounded-2xl w-fit text-emerald-400 mb-5">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Power BI & Star Schema</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standalone Python ETL pipelines transforming transactional OLTP records into dimensional star schemas (fact_tasks, fact_incidents, dim_employee).
            </p>
          </div>
        </div>
      </section>

      {/* Security & Multi-Tenancy Showcase */}
      <section id="security" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <ShieldCheck className="w-3.5 h-3.5" /> Enterprise-Grade Security
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-6">
              Strict Multi-Tenancy & Tamper-Evident Audit Logs
            </h2>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Row-Level Tenant Isolation:</strong> Every record is scoped to its tenant organization at the database and middleware access layer.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Granular RBAC:</strong> Dedicated capabilities for Admin, Manager, and Employee roles with strict backend authorization.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Audit Log Trail:</strong> Immutable tracking of logins, role promotions, status transitions, and data changes with IP tracking.</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 font-mono text-xs text-slate-300 space-y-2 border border-white/[0.08] shadow-2xl">
            <div className="text-slate-500">// Audit Log Sample Telemetry Payload</div>
            <div className="text-sky-300">&#123;</div>
            <div className="pl-4"><span className="text-slate-400">"action":</span> <span className="text-emerald-400">"INCIDENT_STATUS_CHANGED"</span>,</div>
            <div className="pl-4"><span className="text-slate-400">"entity":</span> <span className="text-amber-300">"Incident"</span>,</div>
            <div className="pl-4"><span className="text-slate-400">"entityId":</span> <span className="text-purple-300">"INC-2001"</span>,</div>
            <div className="pl-4"><span className="text-slate-400">"oldStatus":</span> <span className="text-rose-400">"INVESTIGATING"</span>,</div>
            <div className="pl-4"><span className="text-slate-400">"newStatus":</span> <span className="text-emerald-400">"RESOLVED"</span>,</div>
            <div className="pl-4"><span className="text-slate-400">"isSlaBreached":</span> <span className="text-sky-300">false</span>,</div>
            <div className="pl-4"><span className="text-slate-400">"resolvedBy":</span> <span className="text-amber-300">"sarah.connor@nexuscloud.io"</span></div>
            <div className="text-sky-300">&#125;</div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="border-t border-white/[0.06] py-16 px-6 text-center bg-slate-950/60">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            Ready to experience enterprise operational excellence?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-8 max-w-lg mx-auto">
            Experience production-grade task tracking, incident response, and executive KPI intelligence in one cohesive workspace.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/login')}
            className="shadow-glow-md px-8 py-3 text-sm font-bold"
            icon={<ChevronRight className="w-4 h-4" />}
          >
            Open Dashboard Now
          </Button>
          <div className="mt-12 pt-8 border-t border-slate-900 text-xs text-slate-500 font-mono">
            © {new Date().getFullYear()} OpsFlow Enterprise Operations & Analytics Platform. Open Source & Zero Cloud Lock-In.
          </div>
        </div>
      </footer>
    </div>
  );
}
