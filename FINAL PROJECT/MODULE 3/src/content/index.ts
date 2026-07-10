import { ContentExtractor } from '@/services/parser/extractor';
import type { MessageRequest, MessageResponse } from '@/types/messages';
import type { ExtractedContent } from '@/services/parser/extractor';

console.log('Agentic AI: Content Script injected');

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener(
  (
    request: MessageRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse<ExtractedContent | null>) => void
  ) => {
    if (request.action === 'EXTRACT_PAGE_CONTENT') {
      try {
        console.log('Agentic AI: Extracting page content...');
        const content = ContentExtractor.extract(document);
        
        sendResponse({
          success: true,
          data: content,
        });
      } catch (error) {
        console.error('Agentic AI: Extraction failed:', error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown extraction error',
        });
      }
    }
    
    // Return true to indicate we will send a response asynchronously (if needed, though this is synchronous right now, it's good practice for extension messaging)
    return true;
  }
);
