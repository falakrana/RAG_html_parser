import React, { useState } from 'react';
import { crawlSite } from '../api';

interface UrlInputProps {
  onCrawlStart: () => void;
  onCrawlSuccess: (collectionName: string, stats: { pagesCrawled: number; chunksIndexed: number }) => void;
  onCrawlError: (errorMsg: string) => void;
}

/**
 * Renders a centered URL entry card to trigger website crawling and vector indexing.
 * Validates format and executes the server crawl API request.
 * 
 * @param props - Event triggers for crawl lifecycle (start, success, error).
 */
export const UrlInput: React.FC<UrlInputProps> = ({
  onCrawlStart,
  onCrawlSuccess,
  onCrawlError,
}) => {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const targetUrl = url.trim();
    if (!targetUrl) {
      setValidationError('Please enter a website URL.');
      return;
    }

    // Check basic URL format
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setValidationError('The URL protocol must be HTTP or HTTPS.');
        return;
      }
    } catch (err) {
      setValidationError('Please enter a valid URL (e.g., https://example.com).');
      return;
    }

    try {
      onCrawlStart();
      const response = await crawlSite(targetUrl);
      onCrawlSuccess(response.collectionName, {
        pagesCrawled: response.pagesCrawled,
        chunksIndexed: response.chunksIndexed,
      });
    } catch (error: any) {
      const serverError = error.response?.data?.error || error.message || 'An unexpected error occurred.';
      onCrawlError(serverError);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden border border-slate-700/50">
        
        {/* Subtle decorative color spot */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative z-10 text-center">
          {/* Logo/Icon */}
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6 text-indigo-400">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9y2.015 0 4.5 9-2.015 9-4.5 9z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 leading-none">
            Chat with a Website
          </h1>
          <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto">
            Input a website URL. We will crawl the pages, index its contents, and let you ask questions about it.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative rounded-xl overflow-hidden shadow-inner">
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (validationError) setValidationError('');
                }}
                placeholder="https://example.com"
                className="w-full bg-slate-900/60 border border-slate-700/60 text-slate-100 placeholder-slate-500 px-5 py-4 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-base transition-all font-medium"
              />
            </div>

            {validationError && (
              <div className="text-rose-400 text-sm text-left px-1 flex items-center gap-1.5 font-medium animate-pulse">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {validationError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-xl transition-all glow-btn-indigo hover:translate-y-[-1px] active:translate-y-[1px]"
            >
              Crawl & Index Website
            </button>

            {/* HTML-only disclaimer */}
            <div className="flex items-start gap-2.5 mt-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-left">
              <svg
                className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"
                />
              </svg>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                <span className="font-semibold text-amber-300">HTML-only websites supported.</span>{' '}
                Pages that rely on JavaScript to render content (e.g. React, Vue, Angular SPAs) cannot be crawled.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default UrlInput;
