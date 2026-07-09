import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
  collectionName: string;
  messages: Message[];
  onSendMessage: (text: string) => Promise<void>;
  onStartOver: () => void;
  isWaitingForResponse: boolean;
  stats: { pagesCrawled: number; chunksIndexed: number } | null;
}

/**
 * Parses the original domain name from the sanitized collection name.
 * 
 * @param collectionName - The collection name in format "domain_name_timestamp".
 * @returns Reconstructed hostname string.
 */
function getDomainFromCollection(collectionName: string): string {
  const parts = collectionName.split('_');
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    // Remove the trailing timestamp if it is a pure integer
    if (/^\d+$/.test(lastPart)) {
      parts.pop();
    }
  }
  return parts.join('.');
}

/**
 * Main chat screen UI containing messages, user input controls,
 * database indexing statistics, and start-over reset triggers.
 * 
 * @param props - System configuration, messages feed, sending triggers, and statistics.
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({
  collectionName,
  messages,
  onSendMessage,
  onStartOver,
  isWaitingForResponse,
  stats,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const domainName = getDomainFromCollection(collectionName);

  // Auto-scroll to the bottom of the message thread whenever a new message is added or state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWaitingForResponse]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isWaitingForResponse) return;

    setInputText('');
    await onSendMessage(text);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-6 h-[85vh] text-slate-100">
      
      {/* Side Dashboard (Crawl Stats & RAG metadata) */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="glass-panel border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-ring" />
              Source Website
            </div>
            
            <h2 className="text-xl font-extrabold text-white truncate mb-1" title={domainName}>
              {domainName}
            </h2>
            <a 
              href={`https://${domainName}`} 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mb-6"
            >
              Visit website
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            {/* Statistics */}
            {stats && (
              <div className="space-y-4 mb-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="text-sm text-slate-400 font-medium">Pages Crawled</div>
                  <div className="text-lg font-bold text-indigo-300">{stats.pagesCrawled}</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="text-sm text-slate-400 font-medium">Vector Chunks</div>
                  <div className="text-lg font-bold text-indigo-300">{stats.chunksIndexed}</div>
                </div>
              </div>
            )}

            {/* Pipeline Info */}
            <div className="border-t border-slate-800 pt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">LLM Engine</span>
                <span className="text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded border border-slate-700/50">Gemini 2.5 Flash</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Embeddings</span>
                <span className="text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded border border-slate-700/50">gemini-embedding-2</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Vector DB</span>
                <span className="text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded border border-slate-700/50">ChromaDB</span>
              </div>
            </div>
          </div>

          <button
            onClick={onStartOver}
            className="mt-6 w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Reset & Index New Site
          </button>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col glass-panel border border-slate-700/50 rounded-2xl overflow-hidden h-full">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto select-none">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-400">
                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l-1.922 4.413a.75.75 0 00.126.837l2.585 2.585a.75.75 0 00.837.126l4.413-1.922m-6.039-6.039l6.039-6.039m0 0a1.56 1.56 0 112.207 2.207l-6.039 6.039m6.039-6.039l6.039 6.039m0 0a1.56 1.56 0 11-2.207 2.207l-6.039-6.039" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mb-1">Vector Index Loaded!</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Ask any question about the contents of this website. Our assistant will extract facts strictly from the crawl context.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}

          {/* Assistant Writing Loader */}
          {isWaitingForResponse && (
            <div className="flex w-full justify-start mb-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-indigo-400">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl rounded-tl-none px-4 py-3 text-slate-400 text-sm font-medium flex items-center gap-1.5">
                  Thinking
                  <span className="flex gap-0.5 align-bottom">
                    <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-850 p-4 bg-slate-900/40 backdrop-blur-md">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isWaitingForResponse 
                  ? 'Waiting for AI response...' 
                  : 'Ask about this website...'
              }
              disabled={isWaitingForResponse}
              className="flex-1 bg-slate-950/70 border border-slate-750 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3.5 focus:outline-none focus:border-indigo-500 disabled:opacity-50 text-sm sm:text-base font-medium transition-all"
            />
            <button
              type="submit"
              disabled={isWaitingForResponse || !inputText.trim()}
              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-semibold rounded-xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-lg glow-btn-indigo"
            >
              <span className="hidden sm:inline mr-1.5">Send</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 transform rotate-90" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
export default ChatWindow;
