import { CheerioCrawler, RequestQueue } from 'crawlee';
import robotsParser from 'robots-parser';
import { CrawledPage } from '../types';

/**
 * Fetches the robots.txt file from the origin of the root URL and returns a RobotsParser instance.
 * If fetching or parsing fails, returns null (implicitly allowing all paths).
 * 
 * @param rootUrl - The entrypoint URL of the crawl.
 * @returns A Promise resolving to a robots-parser instance, or null if unavailable.
 */
async function getRobotsParser(rootUrl: string): Promise<ReturnType<typeof robotsParser> | null> {
  try {
    const origin = new URL(rootUrl).origin;
    const robotsUrl = `${origin}/robots.txt`;
    const response = await fetch(robotsUrl);
    if (response.ok) {
      const text = await response.text();
      return robotsParser(robotsUrl, text);
    }
  } catch (error) {
    console.warn('Failed to fetch/parse robots.txt, defaulting to allowing all paths:', error);
  }
  return null;
}

/**
 * Crawls a website starting from the given root URL.
 * Respects robots.txt, limits crawl to same origin, restricts depth to 3, caps at 50 pages,
 * and maintains a rate limit of 1 request per second.
 * 
 * @param rootUrl - The starting URL of the crawl.
 * @returns A Promise resolving to an array of crawled pages with raw HTML and metadata.
 */
export async function crawlWebsite(rootUrl: string): Promise<CrawledPage[]> {
  const parsedRoot = new URL(rootUrl);
  const origin = parsedRoot.origin;
  
  // Create a unique queue to avoid collision between concurrent crawl requests
  const queueId = `crawl_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const requestQueue = await RequestQueue.open(queueId);
  
  // Add the root URL to start the crawl
  await requestQueue.addRequest({
    url: rootUrl,
    userData: { depth: 0 }
  });

  const results: CrawledPage[] = [];
  const robots = await getRobotsParser(rootUrl);

  const crawler = new CheerioCrawler({
    requestQueue,
    minConcurrency: 1,
    maxConcurrency: 1,
    maxRequestsPerCrawl: 50,
    
    async requestHandler({ request, $, response, body, enqueueLinks, log }) {
      const currentUrl = request.url;
      const depth = (request.userData?.depth as number) || 0;

      log.info(`Crawling: ${currentUrl} (depth: ${depth})`);

      // Skip non-HTML responses
      const contentType = response.headers?.['content-type'] || '';
      if (contentType && !contentType.toLowerCase().includes('text/html')) {
        log.info(`Skipping non-HTML page: ${currentUrl} (Content-Type: ${contentType})`);
        return;
      }

      // Check robots.txt allowance
      if (robots && !robots.isAllowed(currentUrl, '*')) {
        log.info(`Skipping disallowed URL due to robots.txt: ${currentUrl}`);
        return;
      }

      // Extract title from <title> or fallback
      const title = $('title').first().text().trim() || 'Untitled';
      const rawHtml = typeof body === 'string' ? body : body.toString('utf-8');

      results.push({
        url: currentUrl,
        title,
        rawHtml,
      });

      // Implement rate limit of 1 request per second
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (depth < 3) {
        await enqueueLinks({
          strategy: 'same-origin',
          transformRequestFunction(req) {
            try {
              const reqUrl = new URL(req.url);
              // Only follow same origin links
              if (reqUrl.origin !== origin) {
                return false;
              }
            } catch (err) {
              return false;
            }

            // Respect robots.txt
            if (robots && !robots.isAllowed(req.url, '*')) {
              return false;
            }

            req.userData = {
              ...req.userData,
              depth: depth + 1,
            };
            return req;
          },
        });
      }
    },

    failedRequestHandler({ request, log }) {
      log.error(`Request to URL ${request.url} failed.`);
    },
  });

  try {
    await crawler.run();
  } finally {
    // Drop queue to clean up local storage files
    await requestQueue.drop();
  }

  return results;
}
