'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, User, Settings, Bell, Search, Menu } from 'lucide-react';

export default function Header() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if body already has dark class (from previous session)
    if (typeof window !== 'undefined') {
      const bodyHasDark = document.body.classList.contains('dark');
      setIsDark(bodyHasDark);
    }
  }, []);

  useEffect(() => {
    // Apply theme to body only after mounting
    if (mounted) {
      document.body.classList.toggle('dark', isDark);
    }
  }, [isDark, mounted]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Custom Logo Component
  const CustomLogo = ({ isDark }: { isDark: boolean }) => (
    <div className="w-10 h-10 flex items-center justify-center">
      {isDark ? (
        // Dark theme logo (white background with black shapes)
        <div className="w-full h-full bg-white rounded-xl flex items-center justify-center relative overflow-hidden">
          <div className="w-6 h-6 relative">
            {/* Top shape - inverted triangle pointing down and left */}
            <div className="absolute top-0 left-0 w-3 h-3 bg-black rounded-tl-lg rounded-tr-lg transform rotate-45 origin-bottom-left"></div>
            
            {/* Bottom shape - L-shaped element */}
            <div className="absolute bottom-0 left-0 w-4 h-4 bg-black rounded-bl-lg">
              <div className="w-3 h-3 bg-black rounded-br-lg transform translate-x-1 -translate-y-1"></div>
            </div>
          </div>
        </div>
      ) : (
        // Light theme logo (black background with white shapes)
        <div className="w-full h-full bg-black rounded-xl flex items-center justify-center relative overflow-hidden">
          <div className="w-6 h-6 relative">
            {/* Top shape - inverted triangle pointing down and left */}
            <div className="absolute top-0 left-0 w-3 h-3 bg-white rounded-tl-lg rounded-tr-lg transform rotate-45 origin-bottom-left"></div>
            
            {/* Bottom shape - L-shaped element */}
            <div className="absolute bottom-0 left-0 w-4 h-4 bg-white rounded-bl-lg">
              <div className="w-3 h-3 bg-white rounded-br-lg transform translate-x-1 -translate-y-1"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white border-b border-gray-700 p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <CustomLogo isDark={true} />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">KGPGPT</h1>
              <p className="text-xs text-gray-400">IIT Kharagpur AI Assistant</p>
            </div>
          </div>
          <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <header className={`${isDark ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white' : 'bg-gradient-to-r from-white via-gray-50 to-white text-gray-900'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4 shadow-lg`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <CustomLogo isDark={isDark} />
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>KGPGPT</h1>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>IIT Kharagpur AI Assistant</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search Button */}
          <button
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title="Search conversations"
          >
            <Search size={20} />
          </button>

          {/* Notifications */}
          <button
            className={`p-2 rounded-lg transition-all duration-200 relative ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title="Notifications"
          >
            <Bell size={20} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title="Toggle theme"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Settings */}
          <button
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title="Settings"
          >
            <Settings size={20} />
          </button>
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ${
                isDark 
                  ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'
              }`}>
                <User size={16} className="text-white" />
              </div>
              <span className="text-sm font-medium hidden md:block">User</span>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50 ${
                isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <a href="#" className={`block px-4 py-2 text-sm hover:bg-opacity-10 ${
                  isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  Profile Settings
                </a>
                <a href="#" className={`block px-4 py-2 text-sm hover:bg-opacity-10 ${
                  isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  Usage Analytics
                </a>
                <a href="#" className={`block px-4 py-2 text-sm hover:bg-opacity-10 ${
                  isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  Help & Support
                </a>
                <hr className={`my-1 ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />
                <a href="#" className={`block px-4 py-2 text-sm hover:bg-opacity-10 ${
                  isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  Sign Out
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
