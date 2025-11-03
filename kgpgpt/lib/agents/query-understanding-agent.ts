import { BaseAgent } from './base-agent';

export interface QueryAnalysis {
  intent: 'simple' | 'local' | 'internet' | 'hybrid';
  confidence: number;
  reasoning: string;
  keywords: string[];
  requiresWebSearch: boolean;
  requiresFullPipeline: boolean;
}

export class QueryUnderstandingAgent extends BaseAgent {
  constructor() {
    super(
      'Query Understanding Agent (Q-UA)',
      'Interprets user intent and decides retrieval strategy'
    );
  }

  async process(query: string): Promise<QueryAnalysis> {
    this.log(`Analyzing query: "${query}"`);
    
    const analysis: QueryAnalysis = {
      intent: 'local',
      confidence: 0.8,
      reasoning: '',
      keywords: [],
      requiresWebSearch: false,
      requiresFullPipeline: true
    };

    // Extract keywords
    analysis.keywords = this.extractKeywords(query);
    
    // First check if it's a simple query that doesn't need the full pipeline
    if (this.isSimpleQuery(query)) {
      analysis.intent = 'simple';
      analysis.requiresWebSearch = false;
      analysis.requiresFullPipeline = false;
      analysis.confidence = 0.95;
      analysis.reasoning = 'Simple greeting or basic interaction - no complex processing needed';
      this.log(`Query analysis complete: ${analysis.intent} (confidence: ${analysis.confidence})`);
      return analysis;
    }
    
    // Determine intent based on query characteristics
    if (this.isWebSearchQuery(query)) {
      analysis.intent = 'internet';
      analysis.requiresWebSearch = true;
      analysis.requiresFullPipeline = true;
      analysis.confidence = 0.9;
      analysis.reasoning = 'Query requires current/recent information or external data';
    } else if (this.isHybridQuery(query)) {
      analysis.intent = 'hybrid';
      analysis.requiresWebSearch = true;
      analysis.requiresFullPipeline = true;
      analysis.confidence = 0.7;
      analysis.reasoning = 'Query benefits from both local knowledge and current information';
    } else {
      analysis.intent = 'local';
      analysis.requiresWebSearch = false;
      analysis.requiresFullPipeline = true;
      analysis.confidence = 0.8;
      analysis.reasoning = 'Query can be answered from local knowledge base';
    }

    this.log(`Query analysis complete: ${analysis.intent} (confidence: ${analysis.confidence})`);
    return analysis;
  }

  private isSimpleQuery(query: string): boolean {
    const trimmedQuery = query.trim().toLowerCase();
    
    // Greetings and basic interactions
    const simplePatterns = [
      // Greetings
      /^(hi|hello|hey|good morning|good afternoon|good evening|good night)$/i,
      /^(hi there|hello there|hey there)$/i,
      
      // Basic responses
      /^(yes|no|ok|okay|sure|alright|fine|good|great|thanks|thank you)$/i,
      /^(yes please|no thanks|no thank you)$/i,
      
      // Simple questions about the system
      /^(what can you do|what are you|who are you|help|how are you)$/i,
      /^(what is this|what is kgp gpt|what is this system)$/i,
      
      // Simple acknowledgments
      /^(got it|understood|i see|i understand|noted)$/i,
      
      // Simple requests
      /^(start over|reset|clear|new conversation)$/i,
      
      // Very short queries (1-2 words that are common)
      /^(bye|goodbye|see you|take care)$/i,
      /^(test|testing|check)$/i
    ];
    
    // Check if query matches simple patterns
    if (simplePatterns.some(pattern => pattern.test(trimmedQuery))) {
      return true;
    }
    
    // Check for very short queries (1-2 words) that don't contain specific terms
    const words = trimmedQuery.split(/\s+/).filter(word => word.length > 0);
    if (words.length <= 2) {
      // If it's very short and doesn't contain specific IIT KGP terms, treat as simple
      const hasSpecificTerms = /chakladar|professor|faculty|department|hall|mess|tsg|fest|iit|kgp|kharagpur|admission|placement|exam|course|student|research/i.test(trimmedQuery);
      return !hasSpecificTerms;
    }
    
    return false;
  }

  private extractKeywords(query: string): string[] {
    // Simple keyword extraction - remove common words and extract meaningful terms
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'when', 'where', 'why', 'how', 'who', 'which', 'that', 'this', 'these', 'those']);
    
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  private isWebSearchQuery(query: string): boolean {
    const webSearchPatterns = [
      // Person/identity queries (always need web search)
      /who is|who are|who was|who were/i,
      /tell me about|information about|details about/i,
      /what is|what are|what was|what were/i,
      /biography|profile|background|history/i,
      
      // Time-sensitive patterns
      /current|recent|latest|today|yesterday|this week|this month|this year|now/i,
      /news|update|trend|trending|popular|viral|breaking/i,
      /weather|stock|price|market|forecast|live/i,
      /real.?time|live|happening|ongoing/i,
      /\d{4}|\d{2}\/\d{2}|\d{2}-\d{2}/, // Dates
      /what.?happened|what.?going.?on|current events/i,
      
      // IIT KGP specific patterns that might need current info
      /admission.?2024|admission.?2025|current admission|this year admission/i,
      /placement.?2024|placement.?2025|current placement|this year placement/i,
      /festival.?2024|festival.?2025|current festival|this year festival/i,
      /exam.?schedule.?2024|exam.?schedule.?2025|current exam schedule/i,
      /holiday.?list.?2024|holiday.?list.?2025|current holiday list/i,
      /academic.?calendar.?2024|academic.?calendar.?2025|current academic calendar/i,
      
      // General current information patterns
      /latest|recent|current|upcoming|next|future/i,
      /announcement|notification|update|change|modification/i
    ];

    return webSearchPatterns.some(pattern => pattern.test(query));
  }

  private isHybridQuery(query: string): boolean {
    const hybridPatterns = [
      // Comparison patterns
      /compare|difference|versus|vs|between|among/i,
      /both|and|also|additionally|moreover|furthermore/i,
      /context|background|history|evolution|development/i,
      /how.?to|guide|tutorial|steps|procedure/i,
      
      // IIT KGP specific hybrid patterns
      /best|top|ranking|comparison|which is better/i,
      /facilities|amenities|infrastructure|campus life/i,
      /departments|programs|courses|specializations/i,
      /student life|activities|clubs|organizations/i,
      /accommodation|hostels|halls|residence/i,
      /transportation|connectivity|location|access/i,
      
      // Faculty and professor queries (often need current info)
      /professor|faculty|teacher|instructor|lecturer/i,
      /chakladar|kumar|singh|patel|sharma|verma|gupta/i, // Common surnames
      /research|publication|paper|conference|journal/i
    ];

    return hybridPatterns.some(pattern => pattern.test(query));
  }

  // Determine if a query needs clarification
  needsClarification(query: string): boolean {
    // Only ask for clarification if the query is extremely vague
    const isVeryVague = query.length < 8 || 
                        (query.toLowerCase().includes('what') && query.length < 12) ||
                        (query.toLowerCase().includes('who') && query.length < 10);
    
    // Don't ask for clarification if the query has specific terms
    const hasSpecificTerms = /chakladar|professor|faculty|department|hall|mess|tsg|fest/i.test(query);
    
    return isVeryVague && !hasSpecificTerms;
  }

  // Generate clarification questions if needed
  generateClarificationQuestions(query: string): string[] {
    if (!this.needsClarification(query)) {
      return [];
    }

    const questions: string[] = [];
    
    if (query.toLowerCase().includes('professor') || query.toLowerCase().includes('faculty')) {
      questions.push('Which department are you interested in?');
      questions.push('Are you looking for a specific professor or general faculty information?');
    } else if (query.toLowerCase().includes('hall') || query.toLowerCase().includes('hostel')) {
      questions.push('Which hall or hostel are you asking about?');
      questions.push('Are you looking for accommodation details or general information?');
    } else {
      questions.push('Could you provide more specific details about what you\'re looking for?');
    }
    
    return questions;
  }
}
