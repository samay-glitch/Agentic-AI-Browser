import { ArrowLeft, ExternalLink, Copy } from 'lucide-react';
import type { Summary } from '@/types/summary';

interface CompareResultViewProps {
  summaries: Summary[];
  onBack: () => void;
}

const METRIC_ROWS: {
  label: string;
  getValue: (s: Summary) => string;
}[] = [
  {
    label: 'TL;DR',
    getValue: (s) => s.tldr,
  },
  {
    label: 'Key Takeaways',
    getValue: (s) => `${s.keyTakeaways.length} point${s.keyTakeaways.length !== 1 ? 's' : ''}`,
  },
  {
    label: 'Action Items',
    getValue: (s) =>
      `${s.actionItems.length} item${s.actionItems.length !== 1 ? 's' : ''}`,
  },
  {
    label: 'Sentiment',
    getValue: (s) => s.metadata.sentiment || '—',
  },
  {
    label: 'Complexity',
    getValue: (s) => s.metadata.complexity || s.readingInsights.difficulty,
  },
  {
    label: 'Reading Time',
    getValue: (s) =>
      `${s.readingInsights.readingTimeMinutes} min${s.readingInsights.readingTimeMinutes !== 1 ? 's' : ''}`,
  },
  {
    label: 'Category',
    getValue: (s) => s.metadata.category || '—',
  },
];

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.substring(0, maxLength)}…` : text;
}

export function CompareResultView({ summaries, onBack }: CompareResultViewProps) {
  const handleCopyAll = async () => {
    const text = summaries
      .map(
        (s, i) =>
          `--- Page ${i + 1}: ${s.metadata.title} ---\n` +
          `URL: ${s.metadata.url}\n` +
          `TL;DR: ${s.tldr}\n` +
          `Key Takeaways: ${s.keyTakeaways.join('; ')}\n` +
          `Action Items: ${s.actionItems.join('; ')}\n` +
          `Sentiment: ${s.metadata.sentiment}\n` +
          `Complexity: ${s.metadata.complexity}\n` +
          `Reading Time: ${s.readingInsights.readingTimeMinutes} min\n` +
          `Tags: ${s.tags.join(', ')}`
      )
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API may not be available in all contexts
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.06] bg-slate-900/50">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <h2 className="text-sm font-semibold text-white">
          Comparison ({summaries.length} pages)
        </h2>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10"
          title="Copy all summaries"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable Comparison Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-auto p-3">
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `140px repeat(${summaries.length}, minmax(200px, 1fr))`,
            minWidth: summaries.length > 3 ? `${140 + summaries.length * 220}px` : undefined,
          }}
        >
          {/* Column Headers */}
          <div className="sticky left-0 bg-slate-950 z-10" /> {/* Empty corner cell */}
          {summaries.map((summary, idx) => (
            <div
              key={summary.id}
              className="glass-panel p-3 bg-gradient-to-b from-white/[0.04] to-transparent"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-600 font-medium mb-1">
                    Page {idx + 1}
                  </p>
                  <h3 className="text-xs font-semibold text-white leading-tight truncate" title={summary.metadata.title}>
                    {truncate(summary.metadata.title, 40)}
                  </h3>
                </div>
                {summary.metadata.url && (
                  <a
                    href={summary.metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-slate-500 hover:text-indigo-400 rounded hover:bg-white/[0.06] transition-colors flex-shrink-0 mt-1"
                    title="Open page"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}

          {/* Metric Rows */}
          {METRIC_ROWS.map((metric) => (
            <>
              {/* Row Label */}
              <div
                key={`label-${metric.label}`}
                className="sticky left-0 bg-slate-950 z-10 flex items-center pr-2"
              >
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {metric.label}
                </span>
              </div>

              {/* Row Values */}
              {summaries.map((summary) => (
                <div
                  key={`${metric.label}-${summary.id}`}
                  className="glass-panel p-2.5"
                >
                  <p
                    className={`text-[11px] leading-relaxed ${
                      metric.label === 'TL;DR'
                        ? 'text-slate-300'
                        : 'text-slate-400 font-medium'
                    }`}
                  >
                    {metric.getValue(summary)}
                  </p>
                </div>
              ))}
            </>
          ))}

          {/* Tags Row */}
          <div className="sticky left-0 bg-slate-950 z-10 flex items-center pr-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Tags
            </span>
          </div>
          {summaries.map((summary) => (
            <div
              key={`tags-${summary.id}`}
              className="glass-panel p-2.5"
            >
              <div className="flex flex-wrap gap-1">
                {summary.tags.slice(0, 4).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-[9px] text-slate-400"
                  >
                    #{tag}
                  </span>
                ))}
                {summary.tags.length > 4 && (
                  <span className="text-[9px] text-slate-600 self-center">
                    +{summary.tags.length - 4}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
