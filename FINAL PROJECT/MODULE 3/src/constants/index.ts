export const APP_NAME = 'Agentic AI';
export const APP_VERSION = '1.0.0';

export const STORAGE_KEYS = {
  SETTINGS: 'agentic_settings',
  HISTORY: 'agentic_history',
  API_KEY: 'agentic_api_key',
} as const;

export const AI_CONFIG = {
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.3,
  MAX_CONTENT_LENGTH: 15000,
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
] as const;

export const JOB_CATEGORIES = [
  'Frontend', 'Backend', 'Full Stack', 'AI', 'ML',
  'Data Science', 'DevOps', 'Cloud', 'Security',
  'Embedded', 'Mobile', 'UI/UX', 'Other',
] as const;

export const SUMMARY_SOURCES = [
  { key: 'current-page', label: 'Current Page' },
  { key: 'url', label: 'URL' },
  { key: 'pdf', label: 'PDF' },
  { key: 'job-description', label: 'Job Description' },
] as const;
