import { useState } from 'react';
import { ArrowLeft, BookOpen, Clock, Tag, Zap, Copy, Download, Mail, Check, AlertTriangle } from 'lucide-react';
import type { Summary } from '@/types/summary';
import {
  summaryToMarkdown,
  summaryToPlainText,
  copyToClipboard,
  downloadAsFile,
  openEmailWithSummary,
} from '@/utils/export';

interface SummaryViewProps {
  summary: Summary;
  onBack: () => void;
}

export function SummaryView({ summary, onBack }: SummaryViewProps) {
  const { metadata, readingInsights } = summary;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = summaryToPlainText(summary);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const md = summaryToMarkdown(summary);
    const safeName = metadata.title.replace(/[^a-z0-9]/gi, '_').slice(0, 50);
    downloadAsFile(md, `${safeName}_summary.md`);
  };

  const handleEmail = () => {
    openEmailWithSummary(summary);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
      {/* Header Actions */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.06] bg-slate-900/50">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
            title="Download as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleEmail}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
            title="Email summary"
          >
            <Mail className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Title & Meta */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white leading-tight text-balance">
            {metadata.title}
          </h2>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="tag flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
              <Clock className="w-3 h-3" />
              {readingInsights.readingTimeMinutes} min read
            </span>
            <span className="tag flex items-center gap-1 bg-amber-500/20 text-amber-300 border-amber-500/30">
              <Zap className="w-3 h-3" />
              {readingInsights.difficulty}
            </span>
            {metadata.category !== 'Unknown' && (
              <span className="tag flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                <BookOpen className="w-3 h-3" />
                {metadata.category}
              </span>
            )}
            {metadata.sentiment && metadata.sentiment !== 'Neutral' && (
              <span className={`tag flex items-center gap-1 ${
                metadata.sentiment === 'Positive'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {metadata.sentiment}
              </span>
            )}
          </div>
        </div>

        {/* TL;DR Section */}
        <div className="glass-panel p-4 bg-indigo-500/5 border-indigo-500/20">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            TL;DR
          </h3>
          <p className="text-sm text-slate-200 leading-relaxed">
            {summary.tldr}
          </p>
        </div>

        {/* Key Takeaways */}
        {summary.keyTakeaways.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Key Takeaways
            </h3>
            <ul className="space-y-2">
              {summary.keyTakeaways.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-indigo-400 font-bold mt-0.5">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {summary.actionItems && summary.actionItems.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Action Items
            </h3>
            <div className="glass-panel bg-amber-500/5 border-amber-500/10 p-3">
              <ul className="space-y-2">
                {summary.actionItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-amber-400 font-bold mt-0.5">→</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Technologies */}
        {summary.technologies && summary.technologies.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Technologies
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {summary.technologies.map((tech, idx) => (
                <span key={idx} className="px-2 py-1 rounded-md bg-violet-500/15 text-violet-300 text-[11px] font-medium border border-violet-500/20">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {summary.tags && summary.tags.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {summary.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-1 rounded border border-white/10 bg-white/5 text-[10px] text-slate-300">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
