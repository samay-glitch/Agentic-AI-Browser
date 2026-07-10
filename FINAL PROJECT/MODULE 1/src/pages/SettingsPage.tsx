import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Key } from 'lucide-react';

export function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['gemini_api_key'], (result) => {
      if (result['gemini_api_key']) {
        setApiKey(result['gemini_api_key']);
      }
    });
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    chrome.storage.local.set({ gemini_api_key: apiKey }, () => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          Gemini AI Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-base mb-1">
            Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-text-base placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-text-muted mt-2">
            Your API key is stored securely in your browser's local storage and is never sent anywhere except directly to Google's Gemini API.
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {saved ? "Saved!" : (isSaving ? "Saving..." : "Save Settings")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
