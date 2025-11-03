'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Smile, X, FileText, Image, Video, Music } from 'lucide-react';

interface ChatInputProps {
  onSubmit: (message: string, fileContext?: string, fileName?: string) => void;
  isLoading: boolean;
  isDark: boolean;
}

export default function ChatInput({ onSubmit, isLoading, isDark }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSubmit(
        message.trim(),
        uploadedFile?.content,
        uploadedFile?.name
      );
      setMessage('');
      setUploadedFile(null); // Clear file after sending
      setShowFileUpload(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process file');
      }

      setUploadedFile({
        name: data.fileName,
        content: data.content,
      });

      setMessage(`Tell me about this document: ${data.fileName}`);
      
    } catch (error: any) {
      console.error('File upload error:', error);
      setUploadError(error.message || 'Failed to upload file');
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFile(files[0]); // Process first file
      event.target.value = ''; // Reset input
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]); // Process first dropped file
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Implement voice recording logic here
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} />;
    if (type.startsWith('video/')) return <Video size={16} />;
    if (type.startsWith('audio/')) return <Music size={16} />;
    return <FileText size={16} />;
  };

  return (
    <div className={`border-t p-6 ${
      isDark 
        ? 'border-gray-700 bg-gray-900' 
        : 'border-gray-200 bg-white'
    }`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* File Upload Area */}
        {showFileUpload && (
          <div className="space-y-2">
            {/* Upload Status or Drop Zone */}
            {isUploading ? (
              <div className={`p-4 rounded-xl ${
                isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-300'
              }`}>
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                    Processing file...
                  </span>
                </div>
              </div>
            ) : uploadedFile ? (
              <div className={`p-4 rounded-xl ${
                isDark ? 'bg-green-900 bg-opacity-20 border border-green-700' : 'bg-green-50 border border-green-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-green-500" size={20} />
                    <div>
                      <p className={`text-sm font-medium ${
                        isDark ? 'text-green-300' : 'text-green-700'
                      }`}>
                        {uploadedFile.name}
                      </p>
                      <p className={`text-xs ${
                        isDark ? 'text-green-400' : 'text-green-600'
                      }`}>
                        Ready! Ask questions about this document.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFile(null);
                      setMessage('');
                    }}
                    className={`p-1 rounded-full ${
                      isDark ? 'hover:bg-green-800 text-green-400' : 'hover:bg-green-200 text-green-600'
                    }`}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`relative p-4 border-2 border-dashed rounded-xl transition-colors ${
                  dragActive
                    ? isDark ? 'border-blue-400 bg-blue-900 bg-opacity-20' : 'border-blue-400 bg-blue-50'
                    : isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <Paperclip size={24} className={`mx-auto mb-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <p className={`text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Drag and drop a file here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`underline ${
                        isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                      }`}
                    >
                      browse
                    </button>
                  </p>
                  <p className={`text-xs mt-1 ${
                    isDark ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Supports: PDF, DOCX, TXT (Max 10MB)
                  </p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,text/plain,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => {
                    setShowFileUpload(false);
                    setUploadError('');
                  }}
                  className={`absolute top-2 right-2 p-1 rounded-full ${
                    isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Error Message */}
            {uploadError && (
              <div className={`p-3 rounded-lg ${
                isDark ? 'bg-red-900 bg-opacity-20 border border-red-700' : 'bg-red-50 border border-red-300'
              }`}>
                <p className={`text-sm ${
                  isDark ? 'text-red-300' : 'text-red-700'
                }`}>
                  ⚠️ {uploadError}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message KGPGPT..."
              rows={1}
              className={`w-full p-4 rounded-2xl border transition-all duration-200 resize-none ${
                isDark
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20'
              } focus:outline-none`}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              style={{ minHeight: '56px', maxHeight: '120px' }}
            />
            
            {/* Character Count */}
            {message.length > 0 && (
              <div className={`absolute bottom-2 right-2 text-xs ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {message.length}/1000
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => setShowFileUpload(!showFileUpload)}
              className={`p-4 rounded-2xl transition-all duration-200 ${
                showFileUpload
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-900'
              }`}
              title="Attach files"
            >
              <Paperclip size={20} />
            </button>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-4 rounded-2xl transition-all duration-200 ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-900'
              }`}
              title={isRecording ? 'Stop recording' : 'Voice input'}
            >
              <Mic size={20} />
            </button>
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className={`p-4 rounded-2xl transition-all duration-200 ${
                isLoading || !message.trim()
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-105 transform'
              } ${
                isDark
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Emojis (coming soon)"
            >
              <Smile size={16} />
            </button>
          </div>
          
          <div className={`text-xs ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </form>
    </div>
  );
}
