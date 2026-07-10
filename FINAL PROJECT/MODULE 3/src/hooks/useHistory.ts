import { useEffect, useState, useCallback } from 'react';
import { storage } from '@/storage';
import type { HistoryEntry } from '@/types/summary';

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const saved = await storage.getHistory();
      setHistory(saved);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const addEntry = async (entry: HistoryEntry) => {
    await storage.addHistoryEntry(entry);
    await loadHistory();
  };

  const deleteEntry = async (id: string) => {
    await storage.deleteHistoryEntry(id);
    await loadHistory();
  };

  const clearAll = async () => {
    await storage.clearHistory();
    setHistory([]);
  };

  const search = (query: string): HistoryEntry[] => {
    if (!query.trim()) return history;
    const lower = query.toLowerCase();
    return history.filter(
      (entry) =>
        entry.title.toLowerCase().includes(lower) ||
        entry.summary.toLowerCase().includes(lower) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(lower))
    );
  };

  return { history, loading, addEntry, deleteEntry, clearAll, search, refresh: loadHistory };
}
