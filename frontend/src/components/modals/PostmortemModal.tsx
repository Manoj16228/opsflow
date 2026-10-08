import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Flame,
  ShieldCheck,
  Printer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Building2,
  Calendar,
} from 'lucide-react';

interface PostmortemModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export function PostmortemModal({ isOpen, onClose, data }: PostmortemModalProps) {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SRE Incident Postmortem & RCA" maxWidth="xl">
      <div className="space-y-6 text-left print:p-0">
        {/* Document Header */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                DOCUMENT REF: RCA-{data.incidentId.slice(0, 8).toUpperCase()}
              </span>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{data.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={data.severity === 'CRITICAL' ? 'danger' : 'warning'}>{data.severity}</Badge>
              <Badge variant={data.metrics.slaStatus === 'SLA_MET' ? 'success' : 'danger'}>
                {data.metrics.slaStatus}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Department</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{data.department}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Lead SRE</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{data.leadInvestigator}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Time to Resolve</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {data.metrics.timeToResolveFormatted}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Impacted Users</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{data.metrics.impactedUsersEstimate}</span>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Executive Summary
          </h4>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/60 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
            {data.executiveSummary}
          </p>
        </div>

        {/* Root Cause & 5-Whys */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Root Cause & 5-Whys Analysis
          </h4>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Domain:</span>
              <span className="font-bold text-slate-900 dark:text-white">{data.rootCauseAnalysis.category}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 italic">
              {data.rootCauseAnalysis.technicalDescription}
            </p>
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono text-[11px]">
              {data.rootCauseAnalysis.fiveWhys.map((w: string, idx: number) => (
                <div key={idx} className="text-slate-700 dark:text-slate-300">
                  {w}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Remediation & Preventative Action Items
          </h4>
          <div className="space-y-2">
            {data.actionItems.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs gap-3"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">{item.action}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.owner}</span>
                  <Badge variant="purple" className="text-[9px]">
                    {item.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Governance Board Approved</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print / Export PDF
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
