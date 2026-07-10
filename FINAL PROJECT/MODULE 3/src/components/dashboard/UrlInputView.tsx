import { useState } from 'react';
import { ArrowLeft, Link2, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { isValidUrl, sanitizeUrl } from '@/utils/url';

interface UrlInputViewProps {
  onSubmit: (url: string) => void;
  onBack: () => void;
  loading?: boolean;
}

export function UrlInputView({ onSubmit, onBack, loading = false }: UrlInputViewProps) {
  const [url, setUrl] = useState(() => localStorage.getItem('draftUrl') || '');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const sanitized = sanitizeUrl(url);
    if (!isValidUrl(sanitized)) {
      setError('Please enter a valid URL (e.g. https://example.com)');
      return;
    }
    setError('');
    onSubmit(sanitized);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim()) {
      handleSubmit();
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

      {/* Input Section */}
      <div className="px-4 pt-2 pb-4 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Link2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Summarise URL</h2>
            <p className="text-[10px] text-slate-500">Paste any article, blog, or documentation URL</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                const newUrl = e.target.value;
                setUrl(newUrl);
                localStorage.setItem('draftUrl', newUrl);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com/article..."
              className="input-field"
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-1.5 mt-2 text-red-400">
                <AlertCircle className="w-3 h-3" />
                <span className="text-[11px]">{error}</span>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!url.trim()}
            loading={loading}
            icon={<ArrowRight className="w-4 h-4" />}
            className="w-full"
          >
            Summarise
          </Button>
        </div>

        {/* Supported Sites */}
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
