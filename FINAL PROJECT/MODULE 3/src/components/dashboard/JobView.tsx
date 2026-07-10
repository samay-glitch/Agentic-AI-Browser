import { useState } from 'react';
import { ArrowLeft, Building2, MapPin, Briefcase, DollarSign, CheckCircle2, AlertCircle, Copy, Download, Check } from 'lucide-react';
import type { JobAnalysis } from '@/types/summary';
import { jobToMarkdown, copyToClipboard, downloadAsFile } from '@/utils/export';

interface JobViewProps {
  job: JobAnalysis;
  onBack: () => void;
}

export function JobView({ job, onBack }: JobViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const md = jobToMarkdown(job);
    const ok = await copyToClipboard(md);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const md = jobToMarkdown(job);
    const safeName = `${job.company}_${job.role}`.replace(/[^a-z0-9]/gi, '_').slice(0, 50);
    downloadAsFile(md, `${safeName}_analysis.md`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
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
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">{job.role}</h2>
            <div className="flex items-center gap-2 mt-2 text-indigo-400 font-medium">
              <Building2 className="w-4 h-4" />
              {job.company}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {job.location && (
              <span className="tag bg-white/5 text-slate-300 border-white/10">
                <MapPin className="w-3 h-3 mr-1" />
                {job.location}
              </span>
            )}
            {job.employmentType && (
              <span className="tag bg-white/5 text-slate-300 border-white/10">
                <Briefcase className="w-3 h-3 mr-1" />
                {job.employmentType}
              </span>
            )}
            {job.salary && (
              <span className="tag bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                <DollarSign className="w-3 h-3 mr-1" />
                {job.salary}
              </span>
            )}
          </div>
        </div>

        {/* TLDR */}
        {job.tldr && (
          <div className="glass-panel p-4 bg-indigo-500/5 border-indigo-500/20">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Role Overview</h3>
            <p className="text-sm text-slate-200 leading-relaxed">{job.tldr}</p>
          </div>
        )}

        {/* Difficulty Score */}
        {job.difficultyScore != null && (
          <div className="glass-panel p-3 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Difficulty</span>
              <span className="text-sm font-bold text-white">{job.difficultyScore}/100</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${job.difficultyScore}%`,
                  background: job.difficultyScore > 70
                    ? 'linear-gradient(90deg, #f97316, #ef4444)'
                    : job.difficultyScore > 40
                    ? 'linear-gradient(90deg, #eab308, #f97316)'
                    : 'linear-gradient(90deg, #22c55e, #eab308)',
                }}
              />
            </div>
          </div>
        )}

        {/* Skills */}
        {(job.requiredSkills?.length > 0 || job.preferredSkills?.length > 0) && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skills</h3>
            {job.requiredSkills?.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Required</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((skill, idx) => (
                    <span key={`req-${idx}`} className="px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {job.preferredSkills?.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Nice to Have</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.preferredSkills.map((skill, idx) => (
                    <span key={`pref-${idx}`} className="px-2 py-1 rounded-md bg-white/5 text-slate-400 text-xs border border-white/10">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resume Keywords */}
        {job.resumeKeywords?.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              ATS Keywords to Include
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {job.resumeKeywords.map((kw, idx) => (
                <span key={idx} className="px-2 py-1 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-[11px] font-medium">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interview Topics */}
        {job.interviewTopics?.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              Likely Interview Topics
            </h3>
            <ul className="space-y-2 glass-panel p-3 bg-amber-500/5 border-amber-500/10">
              {job.interviewTopics.map((topic, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-amber-400 font-bold mt-0.5">•</span>
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
