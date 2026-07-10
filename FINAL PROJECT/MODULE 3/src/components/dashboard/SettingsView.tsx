import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, Save, Key, Languages, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import type { Settings } from '@/types/settings';

interface SettingsViewProps {
  settings: Settings;
  onSave: (updates: Partial<Settings>) => Promise<void>;
  onBack: () => void;
}

export function SettingsView({ settings, onSave, onBack }: SettingsViewProps) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Dynamic model state
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  // Automatically fetch models if API key exists
  useEffect(() => {
    if (settings.apiKey) {
      fetchModels(settings.apiKey);
    }
  }, []);

  const fetchModels = async (key: string) => {
    if (!key) return;
    setFetchingModels(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      const data = await response.json();
      if (data.models) {
        // Filter models that support generateContent
        const validModels = data.models
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace('models/', '')); // the API returns "models/gemini-1.5-flash"
        
        setAvailableModels(validModels);
      }
    } catch (err) {
      console.error('Failed to fetch models', err);
    } finally {
      setFetchingModels(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ apiKey });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      
      // Also trigger a fetch of models when they manually save the key
      fetchModels(apiKey);
    } catch {
      console.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
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

      <div className="px-4 pt-1 pb-4 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-white mb-1">Settings</h2>
          <p className="text-[10px] text-slate-500">Configure your AI assistant</p>
        </div>

        {/* API Key Section */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            Gemini API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="input-field pr-10"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Translation Language */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
            <Languages className="w-3.5 h-3.5 text-indigo-400" />
            Translation Target
          </label>
          <select
            value={settings.language}
            onChange={(e) => onSave({ language: e.target.value as Settings['language'] })}
            className="input-field appearance-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="es">Spanish (Español)</option>
            <option value="fr">French (Français)</option>
            <option value="de">German (Deutsch)</option>
            <option value="hi">Hindi (हिन्दी)</option>
            <option value="ja">Japanese (日本語)</option>
            <option value="zh">Chinese (中文)</option>
          </select>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">AI Model</label>
            <button 
              onClick={() => fetchModels(apiKey)}
              disabled={fetchingModels || !apiKey}
              className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${fetchingModels ? 'animate-spin' : ''}`} />
              Fetch Models
            </button>
          </div>
          <select
            value={settings.model}
            onChange={(e) => onSave({ model: e.target.value as Settings['model'] })}
            className="input-field appearance-none cursor-pointer"
          >
            {availableModels.length > 0 ? (
              availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))
            ) : (
              <option value={settings.model}>{settings.model}</option>
            )}
          </select>
        </div>

        {/* Summary Length */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300">Summary Length</label>
          <select
            value={settings.summaryLength}
            onChange={(e) => onSave({ summaryLength: e.target.value as Settings['summaryLength'] })}
            className="input-field appearance-none cursor-pointer"
          >
            <option value="brief">Brief</option>
            <option value="standard">Standard</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>

        {/* History Retention */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300">History Retention</label>
          <select
            value={settings.historyRetentionDays}
            onChange={(e) => onSave({ historyRetentionDays: Number(e.target.value) })}
            className="input-field appearance-none cursor-pointer"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>

        {/* Save API Key */}
        <Button
          variant="primary"
          onClick={handleSave}
          loading={saving}
          icon={<Save className="w-4 h-4" />}
          className="w-full"
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
