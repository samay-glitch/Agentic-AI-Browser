import { useEffect, useState } from 'react';
import { storage } from '@/storage';
import { DEFAULT_SETTINGS } from '@/types/settings';
import type { Settings } from '@/types/settings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await storage.getSettings();
        setSettings(saved);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      await storage.saveSettings(updates);
      setSettings((prev) => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  return { settings, loading, updateSettings };
}
