import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100">
      <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-xl shadow-brand-600/30 font-bold mb-6">
        <Layers className="w-7 h-7" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">404</h1>
      <h2 className="text-lg font-semibold text-slate-300 mb-2">Page Not Found</h2>
      <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
        The resource or route you requested does not exist in the OpsFlow platform workspace.
      </p>
      <Button onClick={() => navigate('/dashboard')} icon={<ArrowLeft className="w-4 h-4" />}>
        Return to Dashboard
      </Button>
    </div>
  );
}
