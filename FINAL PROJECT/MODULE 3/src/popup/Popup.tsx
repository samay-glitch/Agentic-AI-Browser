import { useState, useEffect, useCallback } from 'react';
import { Home, Link2, History, Settings, BarChart3 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { TabBar } from '@/components/layout/TabBar';
import type { Tab } from '@/components/layout/TabBar';
import {
  DashboardView,
  UrlInputView,
  SettingsView,
  SummaryView,
  JobView,
  HistoryView,
  CompareView,
  CompareResultView,
} from '@/components/dashboard';
import { SkeletonLoader, ErrorMessage } from '@/components/ui';
import { useSettings } from '@/hooks/useSettings';
import { useHistory } from '@/hooks/useHistory';
import type { Summary, JobAnalysis } from '@/types/summary';
import type { CompareResult } from '@/services/ai/gemini';

type View =
  | 'dashboard'
  | 'url-input'
  | 'settings'
  | 'history'
  | 'summary'
  | 'job'
  | 'compare'
  | 'compare-result';

const TABS: Tab[] = [
  { id: 'dashboard', label: 'Home', icon: <Home className="w-3.5 h-3.5" /> },
  { id: 'url-input', label: 'URL', icon: <Link2 className="w-3.5 h-3.5" /> },
  { id: 'compare', label: 'Compare', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: 'history', label: 'History', icon: <History className="w-3.5 h-3.5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
];

const DETAIL_VIEWS: View[] = ['summary', 'job', 'compare-result'];

const Popup = () => {
  const [view, setView] = useState<View>('dashboard');
  const { settings, updateSettings } = useSettings();
  const { history, deleteEntry, clearAll, search, refresh: refreshHistory } = useHistory();
  const [hasApiKey, setHasApiKey] = useState(false);

  // Loading & State
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('AI is analysing...');
  const [error, setError] = useState<string | null>(null);
  const [currentSummary, setCurrentSummary] = useState<Summary | null>(null);
  const [currentJob, setCurrentJob] = useState<JobAnalysis | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareSummaries, setCompareSummaries] = useState<Summary[]>([]);

  useEffect(() => {
    setHasApiKey(!!settings.apiKey && settings.apiKey.length > 0);
  }, [settings.apiKey]);

  // ─── Summarise Current Page ──────────────────────────────
  const handleSummarisePage = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingMessage('Extracting page content...');
      setError(null);

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error('No active tab found');

      const extractResponse = await new Promise<any>((resolve) => {
        chrome.tabs.sendMessage(tab.id!, { action: 'EXTRACT_PAGE_CONTENT' }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: 'Cannot extract content from this page. Try refreshing or use the URL feature.' });
          } else {
            resolve(response);
          }
        });
      });

      if (!extractResponse.success) throw new Error(extractResponse.error);

      setLoadingMessage('AI is summarising the page...');

      const summarizeResponse = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: 'SUMMARIZE_CONTENT',
            payload: {
              content: extractResponse.data.textContent || extractResponse.data.content,
              title: extractResponse.data.title,
              url: tab.url,
              source: 'current-page',
            },
          },
          (response) => resolve(response)
        );
      });

      if (!summarizeResponse.success) throw new Error(summarizeResponse.error);

      setCurrentSummary(summarizeResponse.data);
      setView('summary');
      refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [refreshHistory]);

  // ─── Summarise URL ───────────────────────────────────────
  const handleSummariseUrl = useCallback(async (url: string) => {
    try {
      setLoading(true);
      setLoadingMessage(url.toLowerCase().endsWith('.pdf')
        ? 'Extracting PDF content...'
        : 'Fetching and summarising URL...'
      );
      setError(null);

      const summarizeResponse = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'SUMMARIZE_URL', payload: { url } },
          (response) => resolve(response)
        );
      });

      if (!summarizeResponse.success) throw new Error(summarizeResponse.error);

      setCurrentSummary(summarizeResponse.data);
      setView('summary');
      refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to summarise URL');
    } finally {
      setLoading(false);
    }
  }, [refreshHistory]);

  // ─── Analyse Job ─────────────────────────────────────────
  const handleAnalyseJob = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingMessage('Extracting job description...');
      setError(null);

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error('No active tab found');

      const extractResponse = await new Promise<any>((resolve) => {
        chrome.tabs.sendMessage(tab.id!, { action: 'EXTRACT_PAGE_CONTENT' }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: 'Cannot extract content. Try refreshing.' });
          } else {
            resolve(response);
          }
        });
      });

      if (!extractResponse.success) throw new Error(extractResponse.error);

      setLoadingMessage('AI is analysing the job description...');

      const analyzeResponse = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: 'ANALYZE_JOB',
            payload: {
              content: extractResponse.data.textContent || extractResponse.data.content,
              title: extractResponse.data.title,
              url: tab.url,
            },
          },
          (response) => resolve(response)
        );
      });

      if (!analyzeResponse.success) throw new Error(analyzeResponse.error);

      setCurrentJob(analyzeResponse.data);
      setView('job');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyse job description');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Compare Pages ───────────────────────────────────────
  const handleCompare = useCallback(async (urls: string[]) => {
    try {
      setLoading(true);
      setLoadingMessage(`Fetching ${urls.length} pages...`);
      setError(null);

      // 1. Extract content from all URLs via offscreen
      const pages: { content: string; title: string; url: string }[] = [];

      for (let i = 0; i < urls.length; i++) {
        setLoadingMessage(`Extracting page ${i + 1} of ${urls.length}...`);

        const extractResponse = await new Promise<any>((resolve) => {
          chrome.runtime.sendMessage(
            { action: 'SUMMARIZE_URL', payload: { url: urls[i] } },
            (response) => resolve(response)
          );
        });

        // We actually need raw content, but let's reuse the SUMMARIZE_URL path
        // which already does extraction + summarization. Instead, let's collect summaries.
        if (extractResponse.success) {
          const summary = extractResponse.data as Summary;
          pages.push({
            content: summary.tldr + '\n' + summary.keyTakeaways.join('\n'),
            title: summary.metadata.title,
            url: urls[i],
          });
          // Keep individual summaries for the result view
          setCompareSummaries((prev) => [...prev, summary]);
        }
      }

      if (pages.length < 2) {
        throw new Error('Could not extract content from enough pages. Please check your URLs.');
      }

      setLoadingMessage('AI is comparing pages...');

      // 2. Ask AI to compare
      const compareResponse = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'COMPARE_PAGES', payload: { pages } },
          (response) => resolve(response)
        );
      });

      if (!compareResponse.success) throw new Error(compareResponse.error);

      setCompareResult(compareResponse.data);
      setView('compare-result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare pages');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Translate & Summarise ───────────────────────────────
  const handleTranslateSummarise = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingMessage('Extracting page content for translation...');
      setError(null);

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error('No active tab found');

      const extractResponse = await new Promise<any>((resolve) => {
        chrome.tabs.sendMessage(tab.id!, { action: 'EXTRACT_PAGE_CONTENT' }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: 'Cannot extract content from this page. Try refreshing.' });
          } else {
            resolve(response);
          }
        });
      });

      if (!extractResponse.success) throw new Error(extractResponse.error);

      setLoadingMessage('AI is translating and summarising...');

      const languageMap: Record<string, string> = {
        en: 'English',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        hi: 'Hindi',
        ja: 'Japanese',
        zh: 'Chinese',
      };
      const targetLanguageName = languageMap[settings.language] || 'English';

      const summarizeResponse = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: 'TRANSLATE_SUMMARIZE',
            payload: {
              content: extractResponse.data.textContent || extractResponse.data.content,
              title: extractResponse.data.title,
              url: tab.url,
              targetLanguage: targetLanguageName,
              source: 'current-page',
            },
          },
          (response) => resolve(response)
        );
      });

      if (!summarizeResponse.success) throw new Error(summarizeResponse.error);

      setCurrentSummary(summarizeResponse.data);
      setView('summary');
      refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to translate and summarise');
    } finally {
      setLoading(false);
    }
  }, [settings.language, refreshHistory]);

  // ─── Render Views ────────────────────────────────────────
  const renderView = () => {
    if (loading) {
      return (
        <div className="flex-1 flex flex-col justify-center items-center px-6">
          <SkeletonLoader lines={5} />
          <p className="text-center text-xs text-slate-400 animate-pulse mt-4">
            {loadingMessage}
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <ErrorMessage
          message={error}
          onRetry={() => {
            setError(null);
            setView('dashboard');
          }}
        />
      );
    }

    switch (view) {
      case 'dashboard':
        return (
          <DashboardView
            hasApiKey={hasApiKey}
            recentHistory={history}
            onSummarisePage={handleSummarisePage}
            onSummariseUrl={() => setView('url-input')}
            onAnalyseJob={handleAnalyseJob}
            onTranslateSummarise={handleTranslateSummarise}
            onHistoryClick={() => setView('history')}
            onSettingsClick={() => setView('settings')}
          />
        );

      case 'url-input':
        return (
          <UrlInputView
            onSubmit={handleSummariseUrl}
            onBack={() => setView('dashboard')}
          />
        );

      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onSave={updateSettings}
            onBack={() => setView('dashboard')}
          />
        );

      case 'summary':
        if (!currentSummary) return null;
        return (
          <SummaryView
            summary={currentSummary}
            onBack={() => {
              setView('dashboard');
              setCurrentSummary(null);
            }}
          />
        );

      case 'job':
        if (!currentJob) return null;
        return (
          <JobView
            job={currentJob}
            onBack={() => {
              setView('dashboard');
              setCurrentJob(null);
            }}
          />
        );

      case 'history':
        return (
          <HistoryView
            history={history}
            onBack={() => setView('dashboard')}
            onDelete={async (id) => {
              await deleteEntry(id);
            }}
            onClearAll={async () => {
              await clearAll();
            }}
            onSearch={search}
          />
        );

      case 'compare':
        return (
          <CompareView
            onCompare={handleCompare}
            onBack={() => setView('dashboard')}
            loading={loading}
          />
        );

      case 'compare-result':
        if (!compareResult) return null;
        return (
          <CompareResultView
            summaries={compareSummaries}
            onBack={() => {
              setView('dashboard');
              setCompareResult(null);
              setCompareSummaries([]);
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-[400px] bg-slate-950 text-white overflow-hidden">
      <Header
        hasApiKey={hasApiKey}
        onSettingsClick={() => setView('settings')}
      />
      {!DETAIL_VIEWS.includes(view) && (
        <TabBar
          tabs={TABS}
          activeTab={view}
          onTabChange={(id) => setView(id as View)}
        />
      )}
      {renderView()}
    </div>
  );
};

export default Popup;
