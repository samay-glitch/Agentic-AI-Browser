export type MessageAction =
  | 'EXTRACT_PAGE_CONTENT'
  | 'EXTRACT_URL_CONTENT'
  | 'EXTRACT_PDF_CONTENT'
  | 'SUMMARIZE_CONTENT'
  | 'SUMMARIZE_URL'
  | 'TRANSLATE_SUMMARIZE'
  | 'COMPARE_PAGES'
  | 'ANALYZE_JOB'
  | 'DETECT_JOB_PAGE'
  | 'GET_SETTINGS'
  | 'SAVE_SETTINGS'
  | 'GET_HISTORY'
  | 'SAVE_HISTORY'
  | 'DELETE_HISTORY'
  | 'TRANSLATE_SUMMARY';

export interface MessageRequest {
  action: MessageAction;
  payload?: Record<string, unknown>;
}

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
