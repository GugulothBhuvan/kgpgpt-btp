import { BaseAgent } from './base-agent';

export interface SimpleResponse {
  response: string;
  confidence: number;
  sources: string[];
  metadata: {
    responseType: 'greeting' | 'acknowledgment' | 'system_info' | 'goodbye' | 'help';
    processingTime: number;
  };
}

export class SimpleResponseAgent extends BaseAgent {
  constructor() {
    super(
      'Simple Response Agent (SR-A)',
      'Handles simple greetings, acknowledgments, and basic interactions without complex processing'
    );
  }

  async process(query: string): Promise<SimpleResponse> {
    const startTime = Date.now();
    this.log(`Processing simple query: "${query}"`);
    
    const trimmedQuery = query.trim().toLowerCase();
    const response = this.generateSimpleResponse(trimmedQuery);
    const processingTime = Date.now() - startTime;
    
    this.log(`Simple response generated in ${processingTime}ms`);
    
    return {
      response: response.text,
      confidence: response.confidence,
      sources: response.sources,
      metadata: {
        responseType: response.type,
        processingTime
      }
    };
  }

  private generateSimpleResponse(query: string): {
    text: string;
    confidence: number;
    sources: string[];
    type: 'greeting' | 'acknowledgment' | 'system_info' | 'goodbye' | 'help';
  } {
    // Greetings
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|good night)$/i.test(query)) {
      return {
        text: "Hello! I'm KGP GPT, your AI assistant for IIT Kharagpur. I can help you with information about the institute, faculty, departments, campus life, and much more. What would you like to know?",
        confidence: 0.95,
        sources: ['System Response'],
        type: 'greeting'
      };
    }
    
    if (/^(hi there|hello there|hey there)$/i.test(query)) {
      return {
        text: "Hi there! 👋 I'm here to help you with anything related to IIT Kharagpur. Feel free to ask me about professors, departments, campus facilities, or any other questions you might have!",
        confidence: 0.95,
        sources: ['System Response'],
        type: 'greeting'
      };
    }

    // Basic responses
    if (/^(yes|ok|okay|sure|alright|fine|good|great)$/i.test(query)) {
      return {
        text: "Great! How can I assist you today?",
        confidence: 0.9,
        sources: ['System Response'],
        type: 'acknowledgment'
      };
    }

    if (/^(thanks|thank you)$/i.test(query)) {
      return {
        text: "You're welcome! Is there anything else I can help you with?",
        confidence: 0.9,
        sources: ['System Response'],
        type: 'acknowledgment'
      };
    }

    if (/^(no|no thanks|no thank you)$/i.test(query)) {
      return {
        text: "No problem! Feel free to ask if you need anything else.",
        confidence: 0.9,
        sources: ['System Response'],
        type: 'acknowledgment'
      };
    }

    // System information
    if (/^(what can you do|what are you|who are you)$/i.test(query)) {
      return {
        text: "I'm KGP GPT, an AI assistant specialized in IIT Kharagpur information. I can help you with:\n\n• Faculty and professor information\n• Department details and programs\n• Campus facilities and infrastructure\n• Student life and activities\n• Admission and academic information\n• Research and publications\n• And much more!\n\nJust ask me anything about IIT Kharagpur!",
        confidence: 0.95,
        sources: ['System Information'],
        type: 'system_info'
      };
    }

    if (/^(what is this|what is kgp gpt|what is this system)$/i.test(query)) {
      return {
        text: "KGP GPT is a multi-agent AI system designed specifically for IIT Kharagpur. It combines local knowledge from the institute's databases with real-time web search capabilities to provide comprehensive and accurate information about the institute, its faculty, students, and activities.",
        confidence: 0.95,
        sources: ['System Information'],
        type: 'system_info'
      };
    }

    if (/^(help)$/i.test(query)) {
      return {
        text: "I'm here to help! You can ask me about:\n\n🏛️ **Institute Info**: Departments, programs, facilities\n👨‍🏫 **Faculty**: Professors, research, publications\n🎓 **Academic**: Courses, admissions, exams\n🏠 **Campus Life**: Hostels, mess, activities, festivals\n🔬 **Research**: Projects, labs, collaborations\n\nJust type your question naturally - I'll understand and help you find the information you need!",
        confidence: 0.95,
        sources: ['System Help'],
        type: 'help'
      };
    }

    if (/^(how are you)$/i.test(query)) {
      return {
        text: "I'm doing great, thank you for asking! I'm ready to help you with any questions about IIT Kharagpur. What would you like to know?",
        confidence: 0.9,
        sources: ['System Response'],
        type: 'acknowledgment'
      };
    }

    // Acknowledgments
    if (/^(got it|understood|i see|i understand|noted)$/i.test(query)) {
      return {
        text: "Perfect! Let me know if you need any clarification or have other questions.",
        confidence: 0.9,
        sources: ['System Response'],
        type: 'acknowledgment'
      };
    }

    // Goodbyes
    if (/^(bye|goodbye|see you|take care)$/i.test(query)) {
      return {
        text: "Goodbye! Feel free to come back anytime if you have more questions about IIT Kharagpur. Have a great day! 👋",
        confidence: 0.95,
        sources: ['System Response'],
        type: 'goodbye'
      };
    }

    // Simple requests
    if (/^(start over|reset|clear|new conversation)$/i.test(query)) {
      return {
        text: "Sure! Starting fresh. How can I help you today?",
        confidence: 0.9,
        sources: ['System Response'],
        type: 'acknowledgment'
      };
    }

    // Testing
    if (/^(test|testing|check)$/i.test(query)) {
      return {
        text: "System is working perfectly! ✅ I'm ready to help you with IIT Kharagpur information. What would you like to know?",
        confidence: 0.95,
        sources: ['System Test'],
        type: 'acknowledgment'
      };
    }

    // Fallback for very short queries
    if (query.split(/\s+/).length <= 2) {
      return {
        text: "I'm here to help! Could you tell me more about what you're looking for? I can assist with information about IIT Kharagpur's faculty, departments, campus life, and much more.",
        confidence: 0.8,
        sources: ['System Response'],
        type: 'help'
      };
    }

    // Default fallback
    return {
      text: "I'm KGP GPT, your AI assistant for IIT Kharagpur. I can help you with information about the institute, faculty, departments, and campus life. What specific information are you looking for?",
      confidence: 0.8,
      sources: ['System Response'],
      type: 'system_info'
    };
  }
}
