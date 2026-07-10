import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon: ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-white/[0.06] overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap',
            activeTab === tab.id
              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
              : 'text-slate-400 hover:text-slate-300 hover:bg-white/[0.04] border border-transparent'
          )}
        >
          <span className="w-3.5 h-3.5 flex items-center justify-center">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
