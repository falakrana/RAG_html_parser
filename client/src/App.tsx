import { useState } from 'react';
import { UrlInput } from './components/UrlInput';
import { ChatWindow } from './components/ChatWindow';
import type { Message } from './types';
import { askQuestion } from './api';

/**
 * Main React Application Controller.
 * Manages core state transitions ('idle' | 'crawling' | 'chatting'), 
 * stores crawling results, index stats, error logs, and the message thread history.
 */
function App() {
  const [status, setStatus] = useState<'idle' | 'crawling' | 'chatting'>('idle');
  const [collectionName, setCollectionName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<{ pagesCrawled: number; chunksIndexed: number } | null>(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCrawlStart = () => {
    setStatus('crawling');
    setErrorMsg('');
  };

  const handleCrawlSuccess = (
    name: string,
    crawlStats: { pagesCrawled: number; chunksIndexed: number }
  ) => {
    setCollectionName(name);
    setStats(crawlStats);
    setStatus('chatting');
  };

  const handleCrawlError = (error: string) => {
    setErrorMsg(error);
    setStatus('idle');
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isWaitingForResponse) return;

    // 1. Append user message to state
    const userMessage: Message = {
      id: `${Date.now()}_user`,
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsWaitingForResponse(true);

    try {
      // 2. Query RAG backend
      const response = await askQuestion(text, collectionName);
      
      // 3. Append assistant response
      const assistantMessage: Message = {
        id: `${Date.now()}_assistant`,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error fetching chat response:', error);
      const serverError = error.response?.data?.error || error.message || 'Failed to fetch answer from backend.';
      
      const errorMessage: Message = {
        id: `${Date.now()}_error`,
        role: 'assistant',
        content: `Oops, I ran into an error while communicating with the server: "${serverError}". Please try asking again.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const handleStartOver = () => {
    setStatus('idle');
    setCollectionName('');
    setMessages([]);
    setStats(null);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-grid-pattern bg-[#0b0f17] flex flex-col justify-between py-6 px-4">
      {/* Background radial gradient glow */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-t from-transparent via-[#0f172a]/20 to-transparent z-0" />

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center z-10 py-6">
        
        {/* Render: URL Entry Form */}
        {status === 'idle' && (
          <div className="w-full">
            {errorMsg && (
              <div className="max-w-xl mx-auto mb-6 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm font-medium flex items-center gap-2 animate-pulse">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Crawl Failed: {errorMsg}</span>
              </div>
            )}
            <UrlInput
              onCrawlStart={handleCrawlStart}
              onCrawlSuccess={handleCrawlSuccess}
              onCrawlError={handleCrawlError}
            />
          </div>
        )}

        {/* Render: Crawl Progress Screen */}
        {status === 'crawling' && (
          <div className="text-center max-w-md mx-auto py-12">
            <div className="relative w-24 h-24 mx-auto mb-8">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 border border-indigo-500/30 animate-pulse-ring" />
              {/* Spinning middle loader */}
              <div className="absolute inset-2 rounded-full border-t-2 border-r-2 border-indigo-400 animate-spin" />
              {/* Inner static node */}
              <div className="absolute inset-6 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Indexing Website...</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto font-medium">
              We are crawling pages, cleaning boilerplate content, generating vector embeddings, and indexing them in ChromaDB. This may take up to a minute.
            </p>
          </div>
        )}

        {/* Render: Active Chat Screen */}
        {status === 'chatting' && (
          <ChatWindow
            collectionName={collectionName}
            messages={messages}
            onSendMessage={handleSendMessage}
            onStartOver={handleStartOver}
            isWaitingForResponse={isWaitingForResponse}
            stats={stats}
          />
        )}

      </main>

      {/* Elegant minimalist footer */}
      <footer className="text-center text-xs text-slate-600 select-none font-medium mt-6 z-10">
        &copy; {new Date().getFullYear()} Antigravity Systems. Powered by Gemini 2.5 Flash, gemini-embedding-2, and ChromaDB.
      </footer>
    </div>
  );
}

export default App;
