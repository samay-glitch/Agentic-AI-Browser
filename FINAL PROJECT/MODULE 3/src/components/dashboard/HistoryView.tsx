import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Trash2,
  ExternalLink,
  Clock,
  FileText,
  Link2,
  Briefcase,
  X,
} from 'lucide-react';
import type { HistoryEntry } from '@/types/summary';
import { formatDate } from '@/utils/time';

interface HistoryViewProps {
  history: HistoryEntry[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onSearch: (query: string) => HistoryEntry[];
}

type SourceFilter = 'all' | HistoryEntry['source'];

const SOURCE_ICON_MAP: Record<HistoryEntry['source'], React.ElementType> = {
  'current-page': FileText,
  url: Link2,
  pdf: FileText,
  'job-description': Briefcase,
};

const SOURCE_BADGE_COLORS: Record<HistoryEntry['source'], string> = {
  'current-page': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  url: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  pdf: 'bg-red-500/20 text-red-300 border-red-500/30',
  'job-description': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const SOURCE_LABELS: Record<HistoryEntry['source'], string> = {
  'current-page': 'Page',
  url: 'URL',
  pdf: 'PDF',
  'job-description': 'Job',
};

const FILTER_CHIPS: { label: string; value: SourceFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Page', value: 'current-page' },
  { label: 'URL', value: 'url' },
  { label: 'PDF', value: 'pdf' },
  { label: 'Job', value: 'job-description' },
];

export function HistoryView({
  history,
  onBack,
  onDelete,
  onClearAll,
  onSearch,
}: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>(history);
  const [activeFilter, setActiveFilter] = useState<SourceFilter>('all');

  // Update filtered results when search query or filter changes
  useEffect(() => {
    let results = searchQuery.trim()
      ? onSearch(searchQuery)
      : history;

    if (activeFilter !== 'all') {
      results = results.filter((entry) => entry.source === activeFilter);
    }

    setFilteredHistory(results);
  }, [searchQuery, activeFilter, history, onSearch]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const truncate = (text: string, maxLength: number) =>
    text.length > maxLength ? `${text.substring(0, maxLength)}…` : text;

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
        <h2 className="text-sm font-semibold text-white">History</h2>
        <div className="w-12" /> {/* Spacer for centering */}
      </div>

      {/* Search Bar */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            className="input-field pl-9 pr-8"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Source Filter Chips */}
      <div className="px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setActiveFilter(chip.value)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all duration-200 whitespace-nowrap ${
                activeFilter === chip.value
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-white/[0.03] text-slate-500 border-white/[0.06] hover:border-white/[0.12] hover:text-slate-400'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-3 space-y-2">
        {history.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">No history yet</p>
            <p className="text-[11px] text-slate-600 mt-1 max-w-[200px]">
              Your summarised pages, URLs, and job analyses will appear here
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          /* No Search Results */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">No results found</p>
            <p className="text-[11px] text-slate-600 mt-1 max-w-[200px]">
              Try a different search term or filter
            </p>
          </div>
        ) : (
          /* History Cards */
          filteredHistory.map((entry) => {
            const SourceIcon = SOURCE_ICON_MAP[entry.source];
            return (
              <div
                key={entry.id}
                className="glass-panel p-3 group hover:border-white/[0.12] transition-all duration-200"
              >
                <div className="flex items-start gap-2.5">
                  {/* Source Icon */}
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <SourceIcon className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-semibold text-slate-200 truncate leading-tight">
                        {entry.title}
                      </h3>
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {entry.url && (
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-500 hover:text-indigo-400 rounded hover:bg-white/[0.06] transition-colors"
                            title="Open link"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          onClick={() => onDelete(entry.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-white/[0.06] transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Truncated Summary */}
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                      {truncate(entry.summary, 80)}
                    </p>

                    {/* Meta Row */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {/* Source Badge */}
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${SOURCE_BADGE_COLORS[entry.source]}`}
                      >
                        {SOURCE_LABELS[entry.source]}
                      </span>

                      {/* Date */}
                      <span className="flex items-center gap-1 text-[10px] text-slate-600">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDate(entry.createdAt)}
                      </span>

                      {/* Tags */}
                      {entry.tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded border border-white/[0.06] bg-white/[0.03] text-[9px] text-slate-500"
                        >
                          #{tag}
                        </span>
                      ))}
                      {entry.tags.length > 2 && (
                        <span className="text-[9px] text-slate-600">
                          +{entry.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Clear All Button */}
      {history.length > 0 && (
        <div className="px-3 pb-3 pt-1 border-t border-white/[0.06]">
          <button
            onClick={onClearAll}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-red-400/80 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all duration-200"
          >
            <Trash2 className="w-3 h-3" />
            Clear All History
          </button>
        </div>
      )}
    </div>
  );
}
