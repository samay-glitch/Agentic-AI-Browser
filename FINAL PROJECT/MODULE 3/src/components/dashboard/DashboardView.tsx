import {
  FileText,
  Link2,
  Briefcase,
  BookOpen,
  Clock,
  ArrowRight,
  Languages,
} from 'lucide-react';
import { ActionCard } from './ActionCard';
import { formatDate } from '@/utils/time';
import type { HistoryEntry } from '@/types/summary';

interface DashboardViewProps {
  hasApiKey: boolean;
  recentHistory: HistoryEntry[];
  onSummarisePage: () => void;
  onSummariseUrl: () => void;
  onAnalyseJob: () => void;
  onTranslateSummarise: () => void;
  onHistoryClick: () => void;
  onSettingsClick: () => void;
}

export function DashboardView({
  hasApiKey,
  recentHistory,
  onSummarisePage,
  onSummariseUrl,
  onAnalyseJob,
  onTranslateSummarise,
  onHistoryClick,
  onSettingsClick,
}: DashboardViewProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* API Key Warning */}
      {!hasApiKey && (
        <div className="mx-3 mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-300 font-medium mb-1">API Key Required</p>
          <p className="text-[11px] text-amber-300/70 leading-relaxed">
            Add your Gemini API key in{' '}
            <button onClick={onSettingsClick} className="underline hover:text-amber-200 transition-colors">
              Settings
            </button>{' '}
            to start using AI features.
          </p>
        </div>
      )}

      {/* Action Cards */}
      <div className="p-3 space-y-2">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1 mb-2">
          Quick Actions
        </p>

        <ActionCard
          icon={<FileText className="w-5 h-5 text-white" />}
          title="Summarise This Page"
          description="Extract and summarise the current tab's content"
          onClick={onSummarisePage}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          disabled={!hasApiKey}
        />

        <ActionCard
          icon={<Link2 className="w-5 h-5 text-white" />}
          title="Summarise Any URL"
          description="Paste a URL — articles, docs, blogs, or PDFs"
          onClick={onSummariseUrl}
          gradient="bg-gradient-to-br from-violet-500 to-purple-500"
          disabled={!hasApiKey}
        />

        <ActionCard
          icon={<Briefcase className="w-5 h-5 text-white" />}
          title="Analyse Job Description"
          description="Extract skills, requirements, and interview prep"
          onClick={onAnalyseJob}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          disabled={!hasApiKey}
        />

        <ActionCard
          icon={<Languages className="w-5 h-5 text-white" />}
          title="Translate + Summarise"
          description="Summarise foreign-language pages into your language"
          onClick={onTranslateSummarise}
          gradient="bg-gradient-to-br from-rose-500 to-pink-500"
          disabled={!hasApiKey}
        />
      </div>

      {/* Recent Activity */}
      {recentHistory.length > 0 && (
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Recent
            </p>
            <button
              onClick={onHistoryClick}
              className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1">
            {recentHistory.slice(0, 3).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.02] transition-all duration-200 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-md bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                  {entry.source === 'job-description' ? (
                    <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                  ) : entry.source === 'pdf' ? (
                    <FileText className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-300 truncate">
                    {entry.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-2.5 h-2.5 text-slate-600" />
                    <span className="text-[10px] text-slate-600">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
