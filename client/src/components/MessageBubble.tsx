import React from 'react';
import type { Message } from '../types';
import { SourceList } from './SourceList';

interface MessageBubbleProps {
  message: Message;
}

/**
 * Renders a single chat bubble (user or assistant).
 * User bubbles are right-aligned with an indigo background.
 * Assistant bubbles are left-aligned with a slate background and reference citation link lists.
 * 
 * @param props - The component properties containing the Message object.
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[85%] sm:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold select-none ${
          isUser 
            ? 'bg-gradient-to-tr from-indigo-500 to-violet-500 text-white' 
            : 'bg-gradient-to-tr from-slate-700 to-slate-600 text-indigo-400 border border-slate-600'
        }`}>
          {isUser ? 'U' : 'AI'}
        </div>

        {/* Message Container */}
        <div className={`flex flex-col rounded-2xl px-4 py-3 shadow-md ${
          isUser 
            ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-tr-none' 
            : 'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-100 rounded-tl-none'
        }`}>
          {/* Message Text */}
          <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap select-text">
            {message.content}
          </div>

          {/* Source references for Assistant replies */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <SourceList sources={message.sources} />
          )}
        </div>
      </div>
    </div>
  );
};
export default MessageBubble;
