'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Volume2, ThumbsUp, ThumbsDown, Copy, MoreVertical, FileText, Download, Share2 } from 'lucide-react';
import Sidebar from './Sidebar';
import Image from 'next/image';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

// Custom hook for dark mode detection
function useDarkMode() {
  const [isDark, setIsDark] = useState(true); // Default to dark mode
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkDarkMode = () => {
      if (typeof window !== 'undefined') {
        // Check if user has a saved preference
        const savedTheme = localStorage.getItem('kgpgpt-theme');
        if (savedTheme) {
          setIsDark(savedTheme === 'dark');
        } else {
          // Check system preference
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setIsDark(systemPrefersDark);
        }
      }
    };
    
    checkDarkMode();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    
    return () => mediaQuery.removeEventListener('change', checkDarkMode);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('kgpgpt-theme', newTheme ? 'dark' : 'light');
  };

  return { isDark, mounted, toggleTheme };
}

// Custom Logo Component using PNG images
const CustomLogo = ({ isDark, size = 'large' }: { isDark: boolean; size?: 'small' | 'large' }) => {
  const logoSize = size === 'large' ? 'w-20 h-20' : 'w-8 h-8';
  
  return (
    <div className={`${logoSize} flex items-center justify-center`}>
      <Image
        src={isDark ? "/assets/kgpgpt-white.png" : "/assets/kgpgpt-dark.png"}
        alt="KGPGPT Logo"
        width={size === 'large' ? 80 : 32}
        height={size === 'large' ? 80 : 32}
        className="rounded-2xl"
      />
    </div>
  );
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reactions: {
    thumbsUp: number;
    thumbsDown: number;
  };
  sources?: string[];
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

export default function ChatInterface() {
  const { isDark, mounted, toggleTheme } = useDarkMode();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationNavigator, setShowLocationNavigator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with a default chat
  useEffect(() => {
    if (chats.length === 0) {
      // Try to load chats from localStorage
      const savedChats = localStorage.getItem('kgpgpt-chats');
      if (savedChats) {
        try {
          const parsedChats = JSON.parse(savedChats);
          // Convert timestamp strings back to Date objects
          const chatsWithDates = parsedChats.map((chat: any) => ({
            ...chat,
            timestamp: new Date(chat.timestamp),
            messages: chat.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              reactions: msg.reactions || { thumbsUp: 0, thumbsDown: 0 }
            }))
          }));
          setChats(chatsWithDates);
          setCurrentChatId(chatsWithDates[0]?.id || 'default');
        } catch (error) {
          console.error('Failed to parse saved chats:', error);
          createDefaultChat();
        }
      } else {
        createDefaultChat();
      }
    }
  }, [chats.length]);

  const createDefaultChat = () => {
    const defaultChat: Chat = {
      id: 'default',
      title: 'New chat',
      messages: [],
      timestamp: new Date()
    };
    setChats([defaultChat]);
    setCurrentChatId('default');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, currentChatId]);

  const currentChat = chats.find(chat => chat.id === currentChatId);

  const createNewChat = () => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: 'New chat',
      messages: [],
      timestamp: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    
    // Focus input after creating new chat
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      if (chats.length > 1) {
        setCurrentChatId(chats[0].id);
      } else {
        createNewChat();
      }
    }
  };

  const clearAllChats = () => {
    localStorage.removeItem('kgpgpt-chats');
    setChats([]);
    createDefaultChat();
  };



  const addReaction = (messageId: string, reaction: 'thumbsUp' | 'thumbsDown') => {
    setChats(prev => prev.map(chat => ({
      ...chat,
      messages: chat.messages.map(msg => 
        msg.id === messageId 
          ? {
              ...msg,
              reactions: {
                ...msg.reactions,
                [reaction]: (msg.reactions?.[reaction] || 0) + 1
              }
            }
          : msg
      )
    })));
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const sendMessage = async (content: string, fileContext?: string, fileName?: string) => {
    console.log('🔍 ChatInterface: sendMessage called with:', content);
    console.log('🔍 ChatInterface: currentChat:', currentChat);
    console.log('🔍 ChatInterface: fileContext:', fileContext ? `${fileName} (${fileContext.length} chars)` : 'none');
    
    if (!content.trim() || !currentChat) {
      console.log('🔍 ChatInterface: Early return - content:', content.trim(), 'currentChat:', !!currentChat);
      return;
    }

    console.log('🔍 ChatInterface: Creating user message...');
    
    // If file context is provided, append it to the message display
    const displayContent = fileName 
      ? `📄 ${fileName}\n\n${content.trim()}`
      : content.trim();

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: displayContent,
      timestamp: new Date(),
      reactions: { thumbsUp: 0, thumbsDown: 0 }
    };

    // Update chat with user message
    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, userMessage],
      title: currentChat.messages.length === 0 ? content.slice(0, 30) + '...' : currentChat.title
    };

    setChats(prev => prev.map(chat => 
      chat.id === currentChatId ? updatedChat : chat
    ));

    // Update title if it's the first message
    if (currentChat.messages.length === 0) {
      // Update the chat title directly in the state
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, title: content.slice(0, 30) + '...' }
          : chat
      ));
    }

    console.log('🔍 ChatInterface: Setting loading to true...');
    setIsLoading(true);

    try {
      console.log('🔍 ChatInterface: Making API call to /api/query...');
      
      // If file context exists, prepend it to the query for the AI
      const enhancedQuery = fileContext 
        ? `Here is the content of the document "${fileName}":\n\n${fileContext}\n\nUser's question: ${content.trim()}`
        : content.trim();
      
      const requestBody = { 
        query: enhancedQuery,
        enableWebSearch: !fileContext, // Disable web search when analyzing uploaded files
        isFirstMessage: currentChat.messages.length === 0,
        conversationHistory: currentChat.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };
      console.log('🔍 ChatInterface: Request body:', requestBody);
      
      console.log('🔍 ChatInterface: Starting fetch with 30s timeout...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('🔍 ChatInterface: Fetch timeout after 30s, aborting...');
        controller.abort();
      }, 30000);
      
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        credentials: 'include', // Include cookies for authentication
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('🔍 ChatInterface: Fetch completed, clearing timeout');
      
      console.log('🔍 ChatInterface: API response received:', response);
      console.log('🔍 ChatInterface: Response status:', response.status);
      console.log('🔍 ChatInterface: Response ok:', response.ok);

      if (response.ok) {
        console.log('🔍 ChatInterface: Response is OK, parsing JSON...');
        const data = await response.json();
        console.log('🔍 ChatInterface: API Response received:', data);
        console.log('🔍 ChatInterface: data.response:', data.response);
        console.log('🔍 ChatInterface: data type:', typeof data);
        console.log('🔍 ChatInterface: data keys:', Object.keys(data));
        console.log('🔍 ChatInterface: data.sources:', data.sources);
        console.log('🔍 ChatInterface: data.metadata:', data.metadata);
        
        const assistantMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          reactions: { thumbsUp: 0, thumbsDown: 0 },
          sources: data.sources || []
        };
        
        console.log('🔍 ChatInterface: Created assistant message:', assistantMessage);

        const finalChat = {
          ...updatedChat,
          messages: [...updatedChat.messages, assistantMessage]
        };

        console.log('🔍 ChatInterface: Final chat before state update:', finalChat);
        console.log('🔍 ChatInterface: Current chat ID:', currentChatId);

        setChats(prev => {
          const updated = prev.map(chat => 
            chat.id === currentChatId ? finalChat : chat
          );
          console.log('🔍 ChatInterface: Updated chats state:', updated);
          return updated;
        });
      } else {
        console.error('🔍 ChatInterface: API Error Response - Status:', response.status);
        console.error('🔍 ChatInterface: API Error Response - StatusText:', response.statusText);
        console.error('🔍 ChatInterface: API Error Response - Headers:', response.headers);
        const errorText = await response.text();
        console.error('🔍 ChatInterface: API Error Response - Body:', errorText);
        console.error('🔍 ChatInterface: Full response object:', response);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('🔍 ChatInterface: Error sending message:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        reactions: { thumbsUp: 0, thumbsDown: 0 }
      };

      const errorChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, errorMessage]
      };

      setChats(prev => prev.map(chat => 
        chat.id === currentChatId ? errorChat : chat
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    console.log('🔍 ChatInterface: handleSubmit called');
    e.preventDefault();
    const input = inputRef.current;
    console.log('🔍 ChatInterface: input ref:', input);
    console.log('🔍 ChatInterface: input value:', input?.value);
    if (input && input.value.trim()) {
      console.log('🔍 ChatInterface: Calling sendMessage with:', input.value);
      sendMessage(input.value);
      input.value = '';
    } else {
      console.log('🔍 ChatInterface: No input or empty value');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    console.log('🔍 ChatInterface: handleKeyPress called with key:', e.key);
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('🔍 ChatInterface: Enter key pressed, calling handleSubmit');
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('kgpgpt-chats', JSON.stringify(chats));
    }
  }, [chats]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex h-screen">
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onNewChat={createNewChat}
          onSelectChat={selectChat}
          onDeleteChat={deleteChat}
          onClearAllChats={clearAllChats}
          onOpenLocationNavigator={() => {}}
          onToggleTheme={() => {}}
          isDark={true}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  // Debug current chat state
  console.log('🔍 ChatInterface: Render - currentChatId:', currentChatId);
  console.log('🔍 ChatInterface: Render - currentChat:', currentChat);
  console.log('🔍 ChatInterface: Render - chats:', chats);

  const openLocationNavigator = () => {
    setShowLocationNavigator(true);
  };

  const handleReaction = (messageId: string, reaction: 'thumbsUp' | 'thumbsDown') => {
    addReaction(messageId, reaction);
  };

  const handleCopy = (content: string) => {
    copyMessage(content);
  };

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={createNewChat}
        onSelectChat={setCurrentChatId}
        onDeleteChat={deleteChat}
        onClearAllChats={clearAllChats}
        onOpenLocationNavigator={() => setShowLocationNavigator(true)}
        onToggleTheme={toggleTheme}
        isDark={isDark}
      />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {showLocationNavigator ? (
          /* Location Navigator Interface */
          <div className="flex h-full">
            {/* Left Panel - Chat Interface */}
            <div className="w-2/5 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Location Navigator Chat</h2>
                    <button
                      onClick={() => setShowLocationNavigator(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-gray-600 dark:text-gray-400">← Back to Chat</span>
                    </button>
                  </div>
                </div>
                
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🗺️</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Welcome to Location Navigator!</h3>
                    <p className="text-gray-600 dark:text-gray-400">Ask me about campus locations, directions, or how to find places.</p>
                  </div>
                </div>
                
                {/* Chat Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Ask about campus locations..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Panel - Interactive Map Canvas */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-6">
              <div className="h-full flex flex-col">
                {/* Map Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Interactive Campus Map</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Travel Mode:</span>
                      <div className="flex space-x-1">
                        <button className="p-2 rounded-lg bg-blue-600 text-white text-sm">🚗</button>
                        <button className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm">🚶</button>
                        <button className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm">🚴</button>
                        <button className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm">🚌</button>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Select a location from the chat to see them on the map</p>
                </div>
                
                {/* Map Canvas */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-4xl">🌍</span>
                    </div>
                    <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Interactive Google Maps</h3>
                    <p className="text-gray-500 dark:text-gray-400">Ask me about locations to see them on the map!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Regular Chat Interface */
          <>
            {/* Chat Header */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4`}>
              <div className="flex items-center justify-between">
                <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {currentChat ? currentChat.title : 'New Chat'}
                </h1>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={openLocationNavigator}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    🗺️ Location Navigator
                  </button>
                </div>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className={`flex-1 overflow-y-auto p-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
              {currentChat && currentChat.messages.length > 0 ? (
                <div className="space-y-4">
                  {currentChat.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <MessageBubble
                        message={message}
                        isDark={isDark}
                        onReaction={handleReaction}
                        onCopy={handleCopy}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CustomLogo isDark={isDark} size="large" />
                  <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mt-6 mb-4`}>
                    Welcome to KGPGPT
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8 max-w-2xl mx-auto`}>
                    Your AI assistant for IIT KGP. Ask me anything about academics, campus life, events, technical help, library resources, or use the Location Navigator to find places on campus.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {[
                      { icon: '🎓', title: 'Academics', desc: 'Course info, exams, grades' },
                      { icon: '👥', title: 'Campus Life', desc: 'Hostels, food, activities' },
                      { icon: '📅', title: 'Events & Fests', desc: 'Kshitij, Spring Fest, etc.' },
                      { icon: '⚡', title: 'Technical Help', desc: 'Code, projects, research' },
                      { icon: '📚', title: 'Library', desc: 'Books, resources, study spaces' },
                      { icon: '🗺️', title: 'Locations', desc: 'Campus map, directions' }
                    ].map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (item.title === 'Locations') {
                            openLocationNavigator();
                          } else {
                            setInputMessage(`Tell me about ${item.title.toLowerCase()}`);
                          }
                        }}
                        className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-gray-700 hover:border-blue-600' : 'border-gray-200 hover:border-blue-300'} transition-all duration-200 hover:shadow-md`}
                      >
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>{item.title}</h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat Input */}
            <ChatInput
              onSubmit={sendMessage}
              isLoading={isLoading}
              isDark={isDark}
            />
          </>
        )}
      </div>
    </div>
  );
}
