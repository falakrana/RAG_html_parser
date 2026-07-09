import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { DocumentChunk } from '../types';

/**
 * Strips formatting, headers, footers, and other boilerplate from a page's raw HTML content
 * using Readability and JSDOM, then chunks the text into overlapping segments of max 2000 chars.
 * 
 * @param rawHtml - The raw HTML string of the crawled page.
 * @param url - The URL of the crawled page (required for JSDOM context).
 * @param title - The title of the crawled page.
 * @returns An array of document chunks with content and metadata.
 */
export function chunkPage(rawHtml: string, url: string, title: string): DocumentChunk[] {
  let cleanText = '';

  try {
    const dom = new JSDOM(rawHtml, { url });
    const reader = new Readability(dom.window.document);
    const parsedArticle = reader.parse();
    
    if (parsedArticle && parsedArticle.textContent) {
      cleanText = parsedArticle.textContent;
    } else {
      // Fallback: extract page body content directly if Readability returns null
      cleanText = dom.window.document.body?.textContent || '';
    }
  } catch (error) {
    console.error(`Error cleaning HTML content with Readability for URL: ${url}`, error);
    // Ultimate fallback: regex strip HTML tag outlines
    cleanText = rawHtml.replace(/<[^>]*>/g, ' ');
  }

  // Clean up whitespace by converting multiple tabs/newlines/spaces to a single space
  cleanText = cleanText.replace(/\s+/g, ' ').trim();

  const chunks: DocumentChunk[] = [];
  if (!cleanText) {
    return chunks;
  }

  const maxChunkSize = 2000;
  const overlap = 200;
  const step = Math.max(1, maxChunkSize - overlap);

  let start = 0;
  let chunkIndex = 0;

  while (start < cleanText.length) {
    const end = Math.min(start + maxChunkSize, cleanText.length);
    const text = cleanText.substring(start, end).trim();

    if (text.length > 0) {
      chunks.push({
        text,
        metadata: {
          url,
          title,
          chunkIndex,
        },
      });
      chunkIndex++;
    }

    if (end >= cleanText.length) {
      break;
    }

    start += step;
  }

  return chunks;
}
