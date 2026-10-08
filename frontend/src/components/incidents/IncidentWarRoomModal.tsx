import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import {
  Flame,
  Radio,
  Users,
  Send,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { playChime } from '../../lib/audioAlerts';

interface IncidentWarRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: any;
}

export function IncidentWarRoomModal({ isOpen, onClose, incident }: IncidentWarRoomModalProps) {
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'mitigation'>('timeline');
  const [newEventText, setNewEventText] = useState('');
  const [sharedNotes, setSharedNotes] = useState(
    `# INCIDENT WAR ROOM LOG: ${incident?.title || 'Active Outage'}\n\n## Immediate Focus\n- [x] Isolate failing upstream pods\n- [ ] Deploy traffic throttling policy\n- [ ] Verify database connection pool threshold`
  );

  const [timelineEvents, setTimelineEvents] = useState([
    {
      id: '1',
      time: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: 'Monitoring System',
      event: `Automated alert triggered: High error rate (5xx) detected on ${incident?.title || 'API Gateway'}`,
      type: 'ALERT',
    },
    {
      id: '2',
      time: new Date(Date.now() - 2700000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: 'On-Call Lead',
      event: 'War Room established; incident severity locked to P1 Critical.',
      type: 'COMMUNICATION',
    },
    {
      id: '3',
      time: new Date(Date.now() - 1200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: 'DevOps Engineer',
      event: 'Applied cache circuit-breaker to mitigate database connection saturation.',
      type: 'MITIGATION',
    },
  ]);

  const [mitigations, setMitigations] = useState([
    { id: '1', text: 'Drain traffic from affected region/node pool', completed: true },
    { id: '2', text: 'Enable Redis query cache fallback mode', completed: true },
    { id: '3', text: 'Scale horizontal pod autoscalers (HPA) to max replicas', completed: false },
    { id: '4', text: 'Verify customer impact resolution and post public status update', completed: false },
  ]);

  const handleAddTimelineEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventText.trim()) return;

    const newEvt = {
      id: String(Date.now()),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: 'Sarah Connor (SRE)',
      event: newEventText.trim(),
      type: 'UPDATE',
    };

    setTimelineEvents((prev) => [newEvt, ...prev]);
    setNewEventText('');
    playChime('notification');

    // Broadcast over socket if available
    if (socket) {
      socket.emit('incident:warroom_event', { incidentId: incident?.id, event: newEvt });
    }
  };

  const toggleMitigation = (id: string) => {
    setMitigations((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  if (!incident) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Live Incident War Room" maxWidth="2xl">
      <div className="space-y-5 text-left">
        {/* War Room Live Telemetry Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-brand-500/10 border border-rose-200 dark:border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-glow-rose shrink-0 animate-pulse">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                  {incident.incidentCode}
                </span>
                <Badge variant="danger" dot>LIVE WAR ROOM</Badge>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{incident.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {['SC', 'MV', 'AL'].map((initials, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-sky-400 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                >
                  {initials}
                </div>
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 font-mono">
              3 SREs Active
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {[
            { id: 'timeline', label: `Live Timeline (${timelineEvents.length})`, icon: Clock },
            { id: 'mitigation', label: 'Mitigation Checklist', icon: CheckCircle2 },
            { id: 'notes', label: 'Collaborative Notes', icon: Sparkles },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === t.id
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'timeline' && (
          <div className="space-y-3.5">
            {/* Add event input */}
            <form onSubmit={handleAddTimelineEvent} className="flex gap-2">
              <input
                type="text"
                placeholder="Log real-time milestone (e.g. Service restart completed, traffic normalized)..."
                value={newEventText}
                onChange={(e) => setNewEventText(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button type="submit" size="sm" variant="danger" disabled={!newEventText.trim()}>
                <Send className="w-3.5 h-3.5" /> Post Event
              </Button>
            </form>

            {/* Timeline Stream */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {timelineEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {evt.time}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{evt.author}</span>
                      <Badge variant="default" className="text-[9px] py-0 px-1 font-mono">
                        {evt.type}
                      </Badge>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{evt.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'mitigation' && (
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Emergency Runbook & Mitigation Checklist
            </span>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {mitigations.map((m) => (
                <div
                  key={m.id}
                  onClick={() => toggleMitigation(m.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    m.completed
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                        m.completed
                          ? 'bg-emerald-500 text-white'
                          : 'border-2 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {m.completed && '✓'}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        m.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-200'
                      }`}
                    >
                      {m.text}
                    </span>
                  </div>
                  <Badge variant={m.completed ? 'success' : 'warning'}>
                    {m.completed ? 'VERIFIED' : 'PENDING'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Live Collaborative Markdown Scratchpad
            </span>
            <textarea
              rows={8}
              value={sharedNotes}
              onChange={(e) => setSharedNotes(e.target.value)}
              className="w-full font-mono text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 font-mono">WebSocket Sync Active</span>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close War Room
          </Button>
        </div>
      </div>
    </Modal>
  );
}
