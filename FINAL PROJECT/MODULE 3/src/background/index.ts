import { GeminiService } from '@/services/ai/gemini';
import type { CompareResult } from '@/services/ai/gemini';
import { storage } from '@/storage';
import type { MessageRequest, MessageResponse } from '@/types/messages';
import type { Summary } from '@/types/summary';

console.log('Agentic AI: Background Service Worker initialized');

// ─── Offscreen Document Management ──────────────────────────
let creating: Promise<void> | null = null;

async function setupOffscreenDocument(path: string) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) return;

  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Parse HTML/PDF to extract text for AI summarization',
    });
    await creating;
    creating = null;
  }
}

// ─── Helper: Save summary to history ────────────────────────
async function saveToHistory(summary: Summary) {
  await storage.addHistoryEntry({
    id: summary.id,
    title: summary.metadata.title,
    url: summary.metadata.url,
    summary: summary.tldr,
    tags: summary.tags,
    createdAt: summary.createdAt,
    source: summary.source,
  });
}

// ─── Helper: Send message to offscreen doc ──────────────────
function sendToOffscreen(action: string, payload: Record<string, unknown>): Promise<any> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action, payload }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

// ─── Message Listener ───────────────────────────────────────
chrome.runtime.onMessage.addListener(
  (
    request: MessageRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse<any>) => void
  ) => {
    // ── Summarize Content (from content script) ─────────────
    if (request.action === 'SUMMARIZE_CONTENT') {
      const { content, title, url, source } = request.payload as {
        content: string;
        title: string;
        url: string;
        source: Summary['source'];
      };

      (async () => {
        try {
          const settings = await storage.getSettings();
          if (!settings.apiKey) throw new Error('API Key is missing. Go to Settings to add it.');

          const summary = await GeminiService.summarize(content, title, url, settings);
          summary.source = source;
          await saveToHistory(summary);

          sendResponse({ success: true, data: summary });
        } catch (error) {
          console.error('Summarize error:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to summarize content',
          });
        }
      })();
      return true;
    }

    // ── Summarize URL (via offscreen) ───────────────────────
    if (request.action === 'SUMMARIZE_URL') {
      const { url } = request.payload as { url: string };

      (async () => {
        try {
          const settings = await storage.getSettings();
          if (!settings.apiKey) throw new Error('API Key is missing.');

          // Check if URL is a PDF
          const isPdf = url.toLowerCase().endsWith('.pdf') ||
            url.toLowerCase().includes('/pdf/') ||
            url.toLowerCase().includes('type=pdf');

          await setupOffscreenDocument('src/offscreen/index.html');

          let contentText: string;
          let pageTitle: string;

          if (isPdf) {
            // Extract PDF text
            const pdfResponse = await sendToOffscreen('EXTRACT_PDF_CONTENT', { url });
            if (!pdfResponse.success) throw new Error(pdfResponse.error);
            contentText = pdfResponse.data as string;
            pageTitle = url.split('/').pop()?.replace('.pdf', '') || 'PDF Document';
          } else {
            // Extract HTML content
            const htmlResponse = await sendToOffscreen('EXTRACT_URL_CONTENT', { url });
            if (!htmlResponse.success) throw new Error(htmlResponse.error);
            contentText = htmlResponse.data.textContent || htmlResponse.data.content;
            pageTitle = htmlResponse.data.title;
          }

          const summary = await GeminiService.summarize(contentText, pageTitle, url, settings);
          summary.source = isPdf ? 'pdf' : 'url';
          await saveToHistory(summary);

          sendResponse({ success: true, data: summary });
        } catch (error) {
          console.error('Summarize URL error:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to summarize URL',
          });
        }
      })();
      return true;
    }

    // ── Translate + Summarize ───────────────────────────────
    if (request.action === 'TRANSLATE_SUMMARIZE') {
      const { content, title, url, targetLanguage, source } = request.payload as {
        content: string;
        title: string;
        url: string;
        targetLanguage: string;
        source: Summary['source'];
      };

      (async () => {
        try {
          const settings = await storage.getSettings();
          if (!settings.apiKey) throw new Error('API Key is missing.');

          const summary = await GeminiService.translateAndSummarize(
            content, title, url, targetLanguage, settings
          );
          summary.source = source;
          await saveToHistory(summary);

          sendResponse({ success: true, data: summary });
        } catch (error) {
          console.error('Translate+Summarize error:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to translate and summarize',
          });
        }
      })();
      return true;
    }

    // ── Compare Pages ───────────────────────────────────────
    if (request.action === 'COMPARE_PAGES') {
      const { pages } = request.payload as {
        pages: { content: string; title: string; url: string }[];
      };

      (async () => {
        try {
          const settings = await storage.getSettings();
          if (!settings.apiKey) throw new Error('API Key is missing.');

          const result: CompareResult = await GeminiService.comparePages(pages, settings);
          sendResponse({ success: true, data: result });
        } catch (error) {
          console.error('Compare error:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to compare pages',
          });
        }
      })();
      return true;
    }

    // ── Analyze Job Description ─────────────────────────────
    if (request.action === 'ANALYZE_JOB') {
      const { content, title, url } = request.payload as {
        content: string;
        title: string;
        url: string;
      };

      (async () => {
        try {
          const settings = await storage.getSettings();
          if (!settings.apiKey) throw new Error('API Key is missing.');

          const jobData = await GeminiService.analyzeJob(content, title, url, settings);
          sendResponse({ success: true, data: jobData });
        } catch (error) {
          console.error('Analyze Job error:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to analyze job',
          });
        }
      })();
      return true;
    }
  }
);
