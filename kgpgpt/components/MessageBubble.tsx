'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, MoreVertical, Check, ExternalLink } from 'lucide-react';

interface MessageBubbleProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    reactions?: {
      thumbsUp: number;
      thumbsDown: number;
    };
    sources?: string[];
  };
  isDark: boolean;
  onReaction: (messageId: string, reaction: 'thumbsUp' | 'thumbsDown') => void;
  onCopy: (content: string) => void;
}

export default function MessageBubble({ message, isDark, onReaction, onCopy }: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatContent = (content: string) => {
    // Simple code block detection (you can enhance this with proper syntax highlighting)
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    
    let formattedContent = content;
    
    // Replace code blocks
    formattedContent = formattedContent.replace(codeBlockRegex, (match, lang, code) => {
      return `<div class="code-block ${lang || ''}">${code}</div>`;
    });
    
    // Replace inline code
    formattedContent = formattedContent.replace(inlineCodeRegex, (match, code) => {
      return `<code class="inline-code">${code}</code>`;
    });
    
    // Convert line breaks to <br> tags
    formattedContent = formattedContent.replace(/\n/g, '<br>');
    
    return formattedContent;
  };

  const isCodeBlock = (content: string) => {
    return content.includes('```') || content.includes('`');
  };

  return (
    <div className={`max-w-[80%] group relative`}>
      <div
        className={`rounded-2xl p-4 shadow-sm ${
          message.role === 'user'
            ? isDark
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
            : isDark
              ? 'bg-gray-800 text-white border border-gray-700'
              : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
        }`}
      >
        {/* Message Content */}
        <div 
          className="whitespace-pre-wrap leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />
        
        {/* Sources for assistant messages */}
        {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-600 border-opacity-30">
            <p className="text-xs text-gray-400 mb-2">Sources:</p>
            <div className="space-y-1">
              {message.sources.map((source, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs text-blue-400 hover:text-blue-300 cursor-pointer group">
                  <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>{source}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Message Actions */}
      <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
        message.role === 'user' ? 'text-blue-200' : 'text-gray-400'
      }`}>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-black hover:bg-opacity-20 transition-colors relative"
            title="Copy message"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="p-1 rounded hover:bg-black hover:bg-opacity-20 transition-colors"
            title="Add reaction"
          >
            <MoreVertical size={14} />
          </button>
        </div>
      </div>
      
      {/* Reactions */}
      {showReactions && (
        <div className={`absolute top-10 right-0 p-2 rounded-lg shadow-lg z-10 ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onReaction(message.id, 'thumbsUp')}
              className="flex items-center space-x-1 p-1 rounded hover:bg-gray-700 transition-colors"
            >
              <ThumbsUp size={16} />
              <span className="text-xs">{message.reactions?.thumbsUp || 0}</span>
            </button>
            <button
              onClick={() => onReaction(message.id, 'thumbsDown')}
              className="flex items-center space-x-1 p-1 rounded hover:bg-gray-700 transition-colors"
            >
              <ThumbsDown size={16} />
              <span className="text-xs">{message.reactions?.thumbsDown || 0}</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Timestamp */}
      <div className={`text-xs mt-2 ${
        message.role === 'user' ? 'text-right' : 'text-left'
      } ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* Custom CSS for code blocks */}
      <style jsx>{`
        .code-block {
          background: ${isDark ? '#1f2937' : '#f3f4f6'};
          border: 1px solid ${isDark ? '#374151' : '#d1d5db'};
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 0.5rem 0;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
          overflow-x: auto;
          white-space: pre;
        }
        
        .inline-code {
          background: ${isDark ? '#374151' : '#e5e7eb'};
          color: ${isDark ? '#f9fafb' : '#111827'};
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
