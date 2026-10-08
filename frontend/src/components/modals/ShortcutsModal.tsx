import React from 'react';
import { Modal } from '../ui/Modal';
import { Keyboard, Command, Sparkles } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const shortcutGroups = [
    {
      category: 'Navigation',
      items: [
        { keys: ['G', 'D'], description: 'Go to Executive Dashboard' },
        { keys: ['G', 'T'], description: 'Go to Tasks Management' },
        { keys: ['G', 'I'], description: 'Go to Incident Triage' },
        { keys: ['G', 'E'], description: 'Go to Workforce & Employees' },
        { keys: ['G', 'A'], description: 'Go to Operational Analytics' },
        { keys: ['G', 'S'], description: 'Go to System Settings' },
      ],
    },
    {
      category: 'Actions & Tools',
      items: [
        { keys: ['⌘', 'K'], description: 'Open Global Command Spotlight' },
        { keys: ['C'], description: 'Open Quick-Create Dialog (Task / Incident)' },
        { keys: ['A'], description: 'Toggle AI Copilot & SRE Assistant' },
        { keys: ['?'], description: 'Open Keyboard Shortcuts Cheat Sheet' },
        { keys: ['ESC'], description: 'Close active drawer / modal' },
      ],
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enterprise Keyboard Shortcuts" maxWidth="md">
      <div className="space-y-6 text-left">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Linear/Vim-inspired hotkeys for high-velocity enterprise navigation.
        </p>

        <div className="space-y-5">
          {shortcutGroups.map((group) => (
            <div key={group.category} className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {group.category}
              </span>
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60">
                {group.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.description}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
