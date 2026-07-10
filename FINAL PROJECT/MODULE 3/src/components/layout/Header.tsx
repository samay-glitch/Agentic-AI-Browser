import { Sparkles, Settings, Zap } from 'lucide-react';
import { StatusBadge } from '@/components/ui';

interface HeaderProps {
  hasApiKey: boolean;
  onSettingsClick: () => void;
}

export function Header({ hasApiKey, onSettingsClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
            Agentic AI
            <Zap className="w-3 h-3 text-amber-400" />
          </h1>
          <p className="text-[10px] text-slate-500 font-medium">Page Summariser</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge
          status={hasApiKey ? 'active' : 'inactive'}
          label={hasApiKey ? 'Ready' : 'No API Key'}
        />
        <button
          onClick={onSettingsClick}
          className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
