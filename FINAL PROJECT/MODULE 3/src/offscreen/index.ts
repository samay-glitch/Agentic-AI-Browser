import { ContentExtractor } from '@/services/parser/extractor';
import type { MessageRequest, MessageResponse } from '@/types/messages';
import type { ExtractedContent } from '@/services/parser/extractor';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

console.log('Agentic AI: Offscreen Document initialized');

// ─── Extract text from PDF URL ─────────────────────────────
async function extractPdfText(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    pages.push(pageText);
  }

  return pages.join('\n\n');
}

// ─── Message Listener ───────────────────────────────────────
chrome.runtime.onMessage.addListener(
  (
    request: MessageRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse<ExtractedContent | string | null>) => void
  ) => {
    // Handle HTML URL extraction
    if (request.action === 'EXTRACT_URL_CONTENT') {
      const { url } = request.payload as { url: string };
      
      (async () => {
        try {
          console.log(`Agentic AI: Fetching URL: ${url}`);
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const content = ContentExtractor.extract(doc);
          
          sendResponse({ success: true, data: content });
        } catch (error) {
          console.error('Agentic AI: URL Extraction failed:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown URL extraction error',
          });
        }
      })();
      
      return true;
    }

    // Handle PDF extraction
    if (request.action === 'EXTRACT_PDF_CONTENT') {
      const { url } = request.payload as { url: string };

      (async () => {
        try {
          console.log(`Agentic AI: Extracting PDF: ${url}`);
          const text = await extractPdfText(url);

          if (!text.trim()) {
            throw new Error('PDF appears to be empty or image-only (no extractable text).');
          }

          sendResponse({ success: true, data: text });
        } catch (error) {
          console.error('Agentic AI: PDF Extraction failed:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown PDF extraction error',
          });
        }
      })();

      return true;
    }
  }
);
