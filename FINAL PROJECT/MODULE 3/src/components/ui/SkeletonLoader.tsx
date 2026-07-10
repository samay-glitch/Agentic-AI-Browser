import { cn } from '@/utils/cn';

interface SkeletonProps {
  lines?: number;
  className?: string;
}

export function SkeletonLoader({ lines = 3, className }: SkeletonProps) {
  return (
    <div className={cn('space-y-3 p-4', className)}>
      <div className="skeleton h-5 w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3"
          style={{ width: `${85 - i * 10}%`, animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}
