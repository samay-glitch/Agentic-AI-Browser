import { STORAGE_KEYS } from '@/constants';
import { DEFAULT_SETTINGS } from '@/types/settings';
import type { Settings } from '@/types/settings';
import type { HistoryEntry } from '@/types/summary';

class StorageService {
  private async get<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.local.get(key);
      return (result[key] as T) ?? null;
    } catch (error) {
      console.error(`Storage get error for key ${key}:`, error);
      return null;
    }
  }

  private async set<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      console.error(`Storage set error for key ${key}:`, error);
      throw new Error(`Failed to save ${key}`);
    }
  }

  private async remove(key: string): Promise<void> {
    try {
      await chrome.storage.local.remove(key);
    } catch (error) {
      console.error(`Storage remove error for key ${key}:`, error);
    }
  }

  async getSettings(): Promise<Settings> {
    const settings = await this.get<Settings>(STORAGE_KEYS.SETTINGS);
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    
    return merged;
  }

  async saveSettings(settings: Partial<Settings>): Promise<void> {
    const current = await this.getSettings();
    await this.set(STORAGE_KEYS.SETTINGS, { ...current, ...settings });
  }

  async getApiKey(): Promise<string> {
    const key = await this.get<string>(STORAGE_KEYS.API_KEY);
    return key ?? '';
  }

  async saveApiKey(apiKey: string): Promise<void> {
    await this.set(STORAGE_KEYS.API_KEY, apiKey);
  }

  async getHistory(): Promise<HistoryEntry[]> {
    const history = await this.get<HistoryEntry[]>(STORAGE_KEYS.HISTORY);
    return history ?? [];
  }

  async addHistoryEntry(entry: HistoryEntry): Promise<void> {
    const history = await this.getHistory();
    const settings = await this.getSettings();

    history.unshift(entry);

    // Enforce max items
    const trimmed = history.slice(0, settings.maxHistoryItems);

    // Enforce retention policy
    const cutoff = Date.now() - settings.historyRetentionDays * 24 * 60 * 60 * 1000;
    const filtered = trimmed.filter((h) => h.createdAt >= cutoff);

    await this.set(STORAGE_KEYS.HISTORY, filtered);
  }

  async deleteHistoryEntry(id: string): Promise<void> {
    const history = await this.getHistory();
    const filtered = history.filter((h) => h.id !== id);
    await this.set(STORAGE_KEYS.HISTORY, filtered);
  }

  async clearHistory(): Promise<void> {
    await this.remove(STORAGE_KEYS.HISTORY);
  }
}

export const storage = new StorageService();
