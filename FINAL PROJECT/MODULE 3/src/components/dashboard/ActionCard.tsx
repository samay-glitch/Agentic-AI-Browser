import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

interface ActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  gradient: string;
  disabled?: boolean;
}

export function ActionCard({
  icon,
  title,
  description,
  onClick,
  gradient,
  disabled = false,
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left group',
        disabled
          ? 'opacity-40 cursor-not-allowed border-white/[0.04] bg-white/[0.01]'
          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] active:scale-[0.98]'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg transition-transform duration-200',
          !disabled && 'group-hover:scale-105',
          gradient
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-200 mb-0.5">{title}</h3>
        <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}
