import { cn } from '@/utils/cn';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'error';
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const dotClass = {
    active: 'status-dot-active',
    inactive: 'status-dot-inactive',
    error: 'status-dot-error',
  };

  const textClass = {
    active: 'text-emerald-400',
    inactive: 'text-amber-400',
    error: 'text-red-400',
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className={cn(dotClass[status], 'animate-pulse')} />
      <span className={cn('text-xs font-medium', textClass[status])}>{label}</span>
    </div>
  );
}
