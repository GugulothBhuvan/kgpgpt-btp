'use client';

import { useState } from 'react';
import { Plus, MoreHorizontal, Trash2, FileText, Download, ChevronLeft, ChevronRight, User, Settings, Moon, Sun, LogOut, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

interface Chat {
  id: string;
  title: string;
  messages: any[];
  timestamp: Date;
}

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onClearAllChats: () => void;
  onOpenLocationNavigator: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
}

export default function Sidebar({ 
  chats, 
  currentChatId, 
  onNewChat, 
  onSelectChat, 
  onDeleteChat,
  onClearAllChats,
  onOpenLocationNavigator,
  onToggleTheme,
  isDark
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };




  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleContextMenu = (chatId: string) => {
    setShowContextMenu(showContextMenu === chatId ? null : chatId);
  };

  const exportChatAsPDF = (chatId: string) => {
    console.log(`Exporting chat ${chatId} as PDF`);
    setShowContextMenu(null);
  };

  const exportChatAsJSON = (chatId: string) => {
    console.log(`Exporting chat ${chatId} as JSON`);
    setShowContextMenu(null);
  };

  const exportChatAsTXT = (chatId: string) => {
    console.log(`Exporting chat ${chatId} as TXT`);
    setShowContextMenu(null);
  };

  const handleDeleteChat = (chatId: string) => {
    onDeleteChat(chatId);
    setShowContextMenu(null);
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out flex flex-col h-full ${
      isDark 
        ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-white border-r border-gray-700' 
        : 'bg-gradient-to-b from-gray-50 to-white text-gray-900 border-r border-gray-200'
    }`}>
      {/* Logo Section */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 relative">
                <Image
                  src={isDark ? "/assets/kgpgpt-white.png" : "/assets/kgpgpt-dark.png"}
                  alt="KGPGPT Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>KGPGPT</h1>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>IIT KGP AI</p>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            }`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center justify-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200 hover:scale-105 shadow-lg ${
            isCollapsed ? 'px-2' : 'px-4'
          }`}
        >
          <Plus size={isCollapsed ? 20 : 18} />
          {!isCollapsed && <span>New Chat</span>}
        </button>
      </div>


      {/* Recent Chats Section */}
      <div className="flex-1 overflow-y-auto">
      <div className="px-4">
          {!isCollapsed && (
            <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${
          isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>Recent Chats</h3>
          )}
        
          <div className="space-y-2">
          {chats.map((chat) => (
              <div key={chat.id} className="relative group">
                <div
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 text-left cursor-pointer ${
                currentChatId === chat.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : isDark
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <MessageSquare size={16} className="flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {chat.title || 'New Chat'}
                      </p>
                {!isCollapsed && (
                        <p className={`text-xs truncate ${
                          currentChatId === chat.id 
                            ? 'text-blue-100' 
                            : isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {chat.messages.length} messages
                        </p>
                      )}
                    </div>
              </div>
              
                  {/* More Options Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                      handleContextMenu(chat.id);
                    }}
                    className={`p-1 rounded transition-all duration-200 ${
                      currentChatId === chat.id 
                        ? 'text-white hover:bg-white hover:bg-opacity-20' 
                        : isDark
                          ? 'text-gray-400 group-hover:text-white hover:bg-gray-700'
                          : 'text-gray-500 group-hover:text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {/* Context Menu */}
                {showContextMenu === chat.id && (
                  <div className="absolute right-0 top-full mt-1 z-50">
                    <div className={`rounded-lg shadow-xl py-1 min-w-48 ${
                      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}>
                      <button
                        onClick={() => exportChatAsPDF(chat.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-2 text-sm transition-all duration-200 ${
                          isDark 
                            ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <FileText size={16} />
                        <span>Export as PDF</span>
                      </button>
                      <button
                        onClick={() => exportChatAsJSON(chat.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-2 text-sm transition-all duration-200 ${
                          isDark 
                            ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <Download size={16} />
                        <span>Export as JSON</span>
                      </button>
                      <button
                        onClick={() => exportChatAsTXT(chat.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-2 text-sm transition-all duration-200 ${
                    isDark
                            ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <FileText size={16} />
                        <span>Export as TXT</span>
                      </button>
                      <hr className={`my-1 ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />
                      <button
                        onClick={() => handleDeleteChat(chat.id)}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:bg-opacity-20 transition-all duration-200"
                      >
                        <Trash2 size={16} />
                        <span>Delete Chat</span>
                </button>
                    </div>
                  </div>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Bottom Actions */}
      {!isCollapsed && chats.length > 0 && (
        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClearAllChats}
            className={`w-full flex items-center justify-center space-x-2 p-2 rounded-lg transition-all duration-200 ${
              isDark
                ? 'text-gray-400 hover:text-red-400 hover:bg-red-900 hover:bg-opacity-20'
                : 'text-gray-600 hover:text-red-600 hover:bg-red-100'
            }`}
          >
            <Trash2 size={16} />
            <span className="text-sm">Clear All Chats</span>
          </button>
        </div>
      )}

      {/* Profile and Settings Section */}
      <div className={`border-t p-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Theme Toggle */}
        <button
                              onClick={onToggleTheme}
          className={`w-full flex items-center justify-center space-x-3 p-3 rounded-lg transition-all duration-200 mb-3 ${
            isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'
          }`}
          title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {!isCollapsed && <span className="text-sm">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Profile Section */}
        <div className="relative">
        <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
            isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'
            }`}>
              <User size={16} className="text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{user?.email || 'User Profile'}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage settings</p>
              </div>
            )}
            {!isCollapsed && (
              <Settings size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && !isCollapsed && (
            <div className={`absolute bottom-full left-0 mb-2 w-full rounded-lg shadow-xl py-1 z-50 ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <button className={`w-full flex items-center space-x-3 px-4 py-2 text-sm transition-all duration-200 ${
                isDark 
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}>
                <User size={16} />
                <span>Edit Profile</span>
              </button>
              <button className={`w-full flex items-center space-x-3 px-4 py-2 text-sm transition-all duration-200 ${
                isDark 
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}>
                <Settings size={16} />
                <span>Preferences</span>
              </button>
              <hr className={`my-1 ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:bg-opacity-20 transition-all duration-200"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
