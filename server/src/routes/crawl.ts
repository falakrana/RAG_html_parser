import { Router, Request, Response, NextFunction } from 'express';
import { crawlWebsite } from '../lib/crawler';
import { chunkPage } from '../lib/chunker';
import { embedTexts } from '../lib/embedder';
import { createCollection, addDocuments } from '../lib/vectorstore';
import { CrawlRequest, CrawlResponse } from '../types';

const router = Router();

/**
 * Sanitizes a URL domain to match the collection naming rules of ChromaDB.
 * ChromaDB collections:
 * - Must be between 3 and 63 characters long.
 * - Must start and end with a lowercase letter or digit.
 * - Must contain only lowercase letters, digits, underscores, or hyphens.
 * - Cannot contain consecutive periods.
 * 
 * @param urlStr - The input website URL.
 * @returns A sanitized, compliant collection name.
 */
function getSanitizedCollectionName(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    // Convert hostname to lowercase and replace non-alphanumeric chars with underscores
    let domain = url.hostname.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const timestamp = Math.floor(Date.now() / 1000);

    let name = `${domain}_${timestamp}`;
    // Compress consecutive underscores
    name = name.replace(/_+/g, '_');
    // Strip leading/trailing underscores or hyphens
    name = name.replace(/^[^a-z0-9]+/, '').replace(/[^a-z0-9]+$/, '');

    // Truncate to max 63 characters
    if (name.length > 63) {
      name = name.substring(0, 63);
      name = name.replace(/[^a-z0-9]+$/, '0');
    }

    // Pad to min 3 characters
    while (name.length < 3) {
      name += '0';
    }

    return name;
  } catch (error) {
    return `collection_${Math.floor(Date.now() / 1000)}`;
  }
}

/**
 * POST /api/crawl
 * Triggers the crawl and indexing pipeline for a given website URL.
 */
router.post(
  '/',
  async (
    req: Request<{}, {}, CrawlRequest>,
    res: Response<CrawlResponse | { error: string }>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { url } = req.body;

      if (!url) {
        res.status(400).json({ error: 'URL is required.' });
        return;
      }

      // Basic URL structural validation
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          res.status(400).json({ error: 'URL protocol must be HTTP or HTTPS.' });
          return;
        }
      } catch (err) {
        res.status(400).json({ error: 'Invalid URL format.' });
        return;
      }

      // 1. Crawl website
      console.log(`Starting crawl for: ${url}`);
      const pages = await crawlWebsite(url);
      if (pages.length === 0) {
        res.status(400).json({ error: 'No pages were crawled from the specified website. Check the URL or robots.txt restrictions.' });
        return;
      }

      // 2. Clean and chunk pages
      console.log(`Crawled ${pages.length} pages. Starting chunking...`);
      const allChunks = [];
      for (const page of pages) {
        const chunks = chunkPage(page.rawHtml, page.url, page.title);
        allChunks.push(...chunks);
      }

      if (allChunks.length === 0) {
        res.status(400).json({ error: 'No readable text content could be extracted from the crawled pages.' });
        return;
      }

      // 3. Batch embed chunk text
      console.log(`Extracted ${allChunks.length} chunks. Generating embeddings...`);
      const chunkTexts = allChunks.map((c) => c.text);
      const embeddings = await embedTexts(chunkTexts);

      // 4. Create collection and store document vectors
      const collectionName = getSanitizedCollectionName(url);
      console.log(`Creating ChromaDB collection: ${collectionName}`);
      const collection = await createCollection(collectionName);
      
      console.log(`Indexing chunks in ChromaDB...`);
      await addDocuments(collection, allChunks, embeddings);

      console.log(`Crawl and index completed successfully for: ${url}`);
      res.status(200).json({
        collectionName,
        pagesCrawled: pages.length,
        chunksIndexed: allChunks.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
