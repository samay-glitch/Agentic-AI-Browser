import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, ArrowRight, BarChart3 } from 'lucide-react';
import { isValidUrl, sanitizeUrl } from '@/utils/url';
import { Button } from '@/components/ui';

interface CompareViewProps {
  onCompare: (urls: string[]) => void;
  onBack: () => void;
  loading?: boolean;
}

const MIN_URLS = 2;
const MAX_URLS = 5;

export function CompareView({ onCompare, onBack, loading = false }: CompareViewProps) {
  const [urls, setUrls] = useState<string[]>(() => {
    const saved = localStorage.getItem('compareDraftUrls');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return ['', ''];
  });

  const updateUrl = (index: number, value: string) => {
    setUrls((prev) => {
      const next = [...prev];
      next[index] = value;
      localStorage.setItem('compareDraftUrls', JSON.stringify(next));
      return next;
    });
  };

  const addUrl = () => {
    if (urls.length < MAX_URLS) {
      setUrls((prev) => {
        const next = [...prev, ''];
        localStorage.setItem('compareDraftUrls', JSON.stringify(next));
        return next;
      });
    }
  };

  const removeUrl = (index: number) => {
    if (urls.length > MIN_URLS) {
      setUrls((prev) => {
        const next = prev.filter((_, i) => i !== index);
        localStorage.setItem('compareDraftUrls', JSON.stringify(next));
        return next;
      });
    }
  };

  const getValidUrls = (): string[] =>
    urls
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
      .map(sanitizeUrl)
      .filter(isValidUrl);

  const validUrls = getValidUrls();
  const canSubmit = validUrls.length >= MIN_URLS;

  const handleSubmit = () => {
    if (canSubmit) {
      onCompare(validUrls);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Back button */}
      <div className="px-3 pt-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div className="px-4 pt-2 pb-4 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Compare Pages</h2>
            <p className="text-[10px] text-slate-500">
              Enter 2-5 URLs to compare side by side
            </p>
          </div>
        </div>

        {/* URL Inputs */}
        <div className="mt-4 space-y-2.5">
          {urls.map((url, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-600">
                  {index + 1}.
                </span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  placeholder={`https://example.com/page-${index + 1}`}
                  className="input-field pl-8"
                />
              </div>
              {urls.length > MIN_URLS && (
                <button
                  onClick={() => removeUrl(index)}
                  className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 flex-shrink-0"
                  title="Remove URL"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {/* Add URL Button */}
          {urls.length < MAX_URLS && (
            <button
              onClick={addUrl}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 bg-white/[0.02] hover:bg-white/[0.05] border border-dashed border-white/[0.08] hover:border-white/[0.16] transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5" />
              Add URL ({urls.length}/{MAX_URLS})
            </button>
          )}

          {/* Validation Hint */}
          <p className="text-[10px] text-slate-600 text-center">
            {validUrls.length} of {urls.filter((u) => u.trim()).length || urls.length} URLs
            valid
            {validUrls.length < MIN_URLS && ' — need at least 2 valid URLs'}
          </p>

          {/* Submit */}
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
            icon={<ArrowRight className="w-4 h-4" />}
            className="w-full"
          >
            Compare {validUrls.length > 0 ? `(${validUrls.length})` : ''}
          </Button>
        </div>

        {/* Supported Sources */}
        <div className="mt-6">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-2">
            Supported Sources
          </p>
          <div className="flex flex-wrap gap-1.5">
            {['Blogs', 'Documentation', 'Wikipedia', 'News', 'Research Papers', 'Company Sites'].map(
              (tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
