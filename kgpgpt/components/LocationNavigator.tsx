'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, Send, X, Car, Footprints, Bike, Bus, MessageSquare } from 'lucide-react';

interface LocationNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

interface Location {
  name: string;
  coordinates: [number, number];
  description: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  location?: Location;
}

export default function LocationNavigator({ isOpen, onClose, isDark }: LocationNavigatorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'bicycling' | 'transit'>('driving');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(true);

  // Common IIT KGP locations
  const campusLocations: Location[] = [
    {
      name: "Main Building",
      coordinates: [22.3149, 87.3105],
      description: "Administrative building and main entrance"
    },
    {
      name: "Computer Science Department",
      coordinates: [22.3152, 87.3108],
      description: "CSE department building"
    },
    {
      name: "Library",
      coordinates: [22.3155, 87.3102],
      description: "Central library and study spaces"
    },
    {
      name: "Student Activity Center",
      coordinates: [22.3145, 87.3100],
      description: "SAC - Student activities and events"
    },
    {
      name: "Hostels",
      coordinates: [22.3160, 87.3110],
      description: "Student accommodation area"
    },
    {
      name: "Cafeteria",
      coordinates: [22.3148, 87.3103],
      description: "Main food court and dining"
    }
  ];

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Location Agent - Parse user queries and find locations
  const locationAgent = (query: string): Location | null => {
    const lowerQuery = query.toLowerCase();
    
    // Search for location matches
    for (const location of campusLocations) {
      if (lowerQuery.includes(location.name.toLowerCase()) ||
          lowerQuery.includes(location.description.toLowerCase()) ||
          location.name.split(' ').some(word => lowerQuery.includes(word.toLowerCase()))) {
        return location;
      }
    }

    // Handle common variations
    if (lowerQuery.includes('main building') || lowerQuery.includes('admin') || lowerQuery.includes('entrance')) {
      return campusLocations.find(loc => loc.name === "Main Building") || null;
    }
    if (lowerQuery.includes('cse') || lowerQuery.includes('computer science') || lowerQuery.includes('cs dept')) {
      return campusLocations.find(loc => loc.name === "Computer Science Department") || null;
    }
    if (lowerQuery.includes('library') || lowerQuery.includes('study') || lowerQuery.includes('books')) {
      return campusLocations.find(loc => loc.name === "Library") || null;
    }
    if (lowerQuery.includes('sac') || lowerQuery.includes('student activity') || lowerQuery.includes('events')) {
      return campusLocations.find(loc => loc.name === "Student Activity Center") || null;
    }
    if (lowerQuery.includes('hostel') || lowerQuery.includes('accommodation') || lowerQuery.includes('dorm')) {
      return campusLocations.find(loc => loc.name === "Hostels") || null;
    }
    if (lowerQuery.includes('cafeteria') || lowerQuery.includes('food') || lowerQuery.includes('dining')) {
      return campusLocations.find(loc => loc.name === "Cafeteria") || null;
    }

    return null;
  };

  // Generate AI response based on location and query
  const generateAIResponse = (query: string, location: Location | null): string => {
    if (!location) {
      return "I couldn't find that location on campus. Try asking about: Main Building, Computer Science Department, Library, Student Activity Center, Hostels, or Cafeteria.";
    }

    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('where') || lowerQuery.includes('location') || lowerQuery.includes('find')) {
      return `The ${location.name} is located at coordinates ${location.coordinates[0]}, ${location.coordinates[1]}. ${location.description}. I've marked it on the map for you!`;
    }
    
    if (lowerQuery.includes('how to get') || lowerQuery.includes('directions') || lowerQuery.includes('route')) {
      return `To get to the ${location.name}, you can use the map above. I've selected it and you can choose your preferred travel mode (Drive, Walk, Bike, or Transit) to get turn-by-turn directions.`;
    }
    
    if (lowerQuery.includes('what is') || lowerQuery.includes('tell me about')) {
      return `The ${location.name} is ${location.description}. It's a key location on the IIT KGP campus. Would you like directions to get there?`;
    }

    return `I found the ${location.name} for you! ${location.description}. You can see it marked on the map above.`;
  };

  const handleSendMessage = async () => {
    if (!searchQuery.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: searchQuery,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setSearchQuery('');
    setIsLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      const location = locationAgent(userMessage.content);
      const aiResponse = generateAIResponse(userMessage.content, location);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        location: location || undefined
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      setSelectedLocation(location);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMapCanvas = () => {
    setIsMapExpanded(!isMapExpanded);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`relative w-full max-w-6xl h-[90vh] mx-4 rounded-2xl shadow-2xl ${
        isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <MapPin size={24} className="text-blue-500" />
            <h2 className="text-2xl font-bold">Location Navigator Chatbot</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex h-full">
          {/* Left Panel - Chat Interface */}
          <div className={`${isMapExpanded ? 'w-2/5' : 'w-full'} border-r transition-all duration-300 ${
            isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex flex-col h-full">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin size={48} className={`mx-auto mb-4 ${
                      isDark ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    <h3 className={`text-lg font-medium ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>Welcome to Location Navigator!</h3>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>Ask me about campus locations, directions, or how to find places.</p>
                    <div className="mt-4 space-y-2">
                      <p className={`text-xs ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>Try asking:</p>
                      <div className="space-y-1">
                        <p className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>• "Where is the main building?"</p>
                        <p className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>• "How do I get to the library?"</p>
                        <p className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>• "Tell me about the cafeteria"</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : isDark
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-200 text-gray-700'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        {message.location && (
                          <div className="mt-2 p-2 rounded bg-blue-500 bg-opacity-20">
                            <p className="text-xs font-medium">📍 {message.location.name}</p>
                            <p className="text-xs opacity-80">{message.location.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-sm">Finding location...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className={`p-4 border-t ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Ask about campus locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!searchQuery.trim() || isLoading}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      searchQuery.trim() && !isLoading
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : isDark
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Interactive Map Canvas (Collapsible) */}
          {isMapExpanded && (
            <div className="flex-1 p-6">
              <div className="h-full flex flex-col">
                {/* Map Header with Travel Mode and Toggle */}
                <div className={`p-4 rounded-xl mb-4 ${
                  isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Interactive Campus Map</h3>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}>Travel Mode:</span>
                        <div className="flex space-x-1">
                          {[
                            { mode: 'driving' as const, icon: Car, label: 'Drive' },
                            { mode: 'walking' as const, icon: Footprints, label: 'Walk' },
                            { mode: 'bicycling' as const, icon: Bike, label: 'Bike' },
                            { mode: 'transit' as const, icon: Bus, label: 'Transit' }
                          ].map(({ mode, icon: Icon, label }) => (
                            <button
                              key={mode}
                              onClick={() => setTravelMode(mode)}
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                travelMode === mode
                                  ? 'bg-blue-600 text-white'
                                  : isDark
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                              title={label}
                            >
                              <Icon size={16} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={toggleMapCanvas}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                        }`}
                        title="Collapse Map"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {selectedLocation && (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{selectedLocation.name}</h4>
                        <p className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>{selectedLocation.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const origin = "22.3149,87.3105"; // IIT KGP center
                            const destinationCoords = `${selectedLocation.coordinates[0]},${selectedLocation.coordinates[1]}`;
                            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destinationCoords}&travelmode=${travelMode}`;
                            window.open(googleMapsUrl, '_blank');
                          }}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                        >
                          <Navigation size={14} />
                          <span>Get Directions</span>
                        </button>
                        <button
                          onClick={() => {
                            const coords = `${selectedLocation.coordinates[0]},${selectedLocation.coordinates[1]}`;
                            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords}`;
                            window.open(googleMapsUrl, '_blank');
                          }}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                            isDark 
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                        >
                          <MapPin size={14} />
                          <span>View on Map</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Google Maps Canvas */}
                <div className="flex-1 rounded-xl border-2 border-dashed flex items-center justify-center ${
                  isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'
                }">
                  {selectedLocation ? (
                    <div className="text-center">
                      <MapPin size={48} className={`mx-auto mb-4 ${
                        isDark ? 'text-blue-400' : 'text-blue-500'
                      }`} />
                      <p className={`text-lg font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>Interactive Google Maps</p>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>Location: {selectedLocation.name}</p>
                      <p className={`text-xs ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>Coordinates: {selectedLocation.coordinates[0]}, {selectedLocation.coordinates[1]}</p>
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            const coords = `${selectedLocation.coordinates[0]},${selectedLocation.coordinates[1]}`;
                            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords}`;
                            window.open(googleMapsUrl, '_blank');
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                        >
                          Open in Google Maps
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <MapPin size={64} className={`mx-auto mb-6 ${
                        isDark ? 'text-gray-600' : 'text-gray-400'
                      }`} />
                      <p className={`text-lg font-medium ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>Campus Map Ready</p>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>Ask me about locations to see them on the map!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Map Toggle Button (when collapsed) */}
          {!isMapExpanded && (
            <div className="absolute right-4 top-20">
              <button
                onClick={toggleMapCanvas}
                className={`p-3 rounded-full shadow-lg transition-all duration-200 ${
                  isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
                title="Expand Map"
              >
                <MapPin size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
