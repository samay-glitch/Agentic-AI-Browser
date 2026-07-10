import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';

export interface ExtractedContent {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  byline: string;
  dir: string;
  siteName: string;
  lang: string;
  length: number;
}

export class ContentExtractor {
  /**
   * Cleans the DOM clone by removing unnecessary elements before parsing.
   */
  private static cleanDOM(documentClone: Document): void {
    const selectorsToRemove = [
      'nav',
      'footer',
      'header',
      'aside',
      '.ad',
      '.ads',
      '.advertisement',
      '.cookie-banner',
      '#cookie-notice',
      '.newsletter-signup',
      '.social-share',
      '.comments',
      '#comments',
      'script',
      'noscript',
      'style',
      'iframe',
      'svg',
      '[role="banner"]',
      '[role="complementary"]',
      '[role="contentinfo"]',
    ];

    const elements = documentClone.querySelectorAll(selectorsToRemove.join(', '));
    elements.forEach((el) => el.parentNode?.removeChild(el));
  }

  /**
   * Extracts meaningful content from a given document.
   */
  public static extract(doc: Document = document): ExtractedContent {
    try {
      // 1. Clone the document to avoid modifying the actual page
      const documentClone = doc.cloneNode(true) as Document;

      // 2. Pre-clean the DOM to help Readability
      this.cleanDOM(documentClone);

      // 3. Run Readability
      const reader = new Readability(documentClone, {
        keepClasses: false,
      });

      const article = reader.parse();

      if (!article) {
        throw new Error('Readability failed to parse the document.');
      }

      // 4. Sanitize the output
      const cleanHtml = DOMPurify.sanitize(article.content || '', {
        USE_PROFILES: { html: true },
      });

      return {
        title: article.title || doc.title || 'Untitled',
        content: cleanHtml,
        textContent: (article.textContent || '').trim().replace(/\s+/g, ' '), // Normalize whitespace
        excerpt: article.excerpt || '',
        byline: article.byline || '',
        dir: article.dir || '',
        siteName: article.siteName || '',
        lang: article.lang || document.documentElement.lang || 'en',
        length: article.length || 0,
      };
    } catch (error) {
      console.error('Content extraction failed:', error);
      
      // Fallback: Just get the body text if readability fails
      return {
        title: doc.title || 'Untitled',
        content: doc.body.innerHTML,
        textContent: doc.body.innerText.trim().replace(/\s+/g, ' '),
        excerpt: '',
        byline: '',
        dir: '',
        siteName: '',
        lang: document.documentElement.lang || 'en',
        length: doc.body.innerText.length,
      };
    }
  }
}
