import React from 'react';
import type { Source } from '../types';

interface SourceListProps {
  sources?: Source[];
}

/**
 * Renders a list of cited reference sources.
 * Displays clickable links that open in a new browser tab.
 * 
 * @param props - The component properties containing the sources list.
 */
export const SourceList: React.FC<SourceListProps> = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pt-2 border-t border-slate-700/40 text-xs">
      <span className="text-slate-400 font-medium mr-2 block sm:inline-block mb-1 sm:mb-0">
        Sources:
      </span>
      <div className="inline-flex flex-wrap gap-1.5 align-middle">
        {sources.map((source, index) => {
          // Fallback to url domain name if title is empty or generic
          let displayName = source.title;
          try {
            if (!displayName || displayName === 'Untitled') {
              const url = new URL(source.url);
              displayName = url.pathname !== '/' ? `${url.hostname}${url.pathname}` : url.hostname;
            }
          } catch (e) {
            displayName = source.url;
          }

          // Truncate display name if too long
          if (displayName.length > 35) {
            displayName = displayName.substring(0, 32) + '...';
          }

          return (
            <a
              key={`${source.url}-${index}`}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800/80 hover:bg-indigo-950/80 border border-slate-700/60 hover:border-indigo-500/40 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <span>{displayName}</span>
              <svg
                className="w-3 h-3 ml-1 opacity-70"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </a>
          );
        })}
      </div>
    </div>
  );
};
export default SourceList;
