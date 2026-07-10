export type AIModel = string;

export type SummaryLength = 'brief' | 'standard' | 'detailed';
export type Theme = 'dark' | 'light' | 'system';
export type Language = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

export interface Settings {
  apiKey: string;
  model: AIModel;
  theme: Theme;
  language: Language;
  summaryLength: SummaryLength;
  historyRetentionDays: number;
  maxHistoryItems: number;
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: 'gemini-1.5-flash-8b',
  theme: 'dark',
  language: 'en',
  summaryLength: 'standard',
  historyRetentionDays: 30,
  maxHistoryItems: 100,
};
