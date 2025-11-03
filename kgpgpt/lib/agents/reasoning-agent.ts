import { BaseAgent } from './base-agent';
import { RetrievedDocument } from './retriever-agent';
import { WebSearchResult } from './web-search-agent';

export interface SynthesizedContext {
  localKnowledge: string[];
  webInsights: string[];
  conflictingInfo: string[];
  confidence: number;
  reasoning: string;
  combinedContext: string;
}

export interface ReasoningResult {
  context: SynthesizedContext;
  recommendations: string[];
  requiresClarification: boolean;
  clarificationQuestions?: string[];
}

export class ReasoningAgent extends BaseAgent {
  constructor() {
    super(
      'Reasoning Agent (RS-A)',
      'Combines and synthesizes retrieved knowledge and search results'
    );
  }

  async process(input: {
    query: string;
    localDocuments?: RetrievedDocument[];
    webResults?: WebSearchResult[];
    enableWebSearch: boolean;
    conversationHistory?: Array<{ role: string; content: string }>;
  }): Promise<ReasoningResult> {
    this.log(`Synthesizing context for query: "${input.query}"`);
    
    const { query, localDocuments = [], webResults = [], enableWebSearch, conversationHistory = [] } = input;
    
    // Extract key insights from local documents
    const localKnowledge = this.extractLocalInsights(localDocuments);
    
    // Extract key insights from web results
    const webInsights = enableWebSearch ? this.extractWebInsights(webResults) : [];
    
    // Identify potential conflicts
    const conflictingInfo = this.identifyConflicts(localKnowledge, webInsights);
    
    // Calculate overall confidence
    const confidence = this.calculateConfidence(localKnowledge, webInsights, conflictingInfo);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(localKnowledge, webInsights, conflictingInfo, enableWebSearch, conversationHistory);
    
    // Combine context for final response
    const combinedContext = this.combineContext(localKnowledge, webInsights, conflictingInfo);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(localKnowledge, webInsights, conflictingInfo);
    
    // Determine if clarification is needed
    const requiresClarification = this.needsClarification(query, localKnowledge, webInsights, conflictingInfo);
    const clarificationQuestions = requiresClarification ? 
      this.generateClarificationQuestions(query, localKnowledge, webInsights) : undefined;
    
    const result: ReasoningResult = {
      context: {
        localKnowledge,
        webInsights,
        conflictingInfo,
        confidence,
        reasoning,
        combinedContext
      },
      recommendations,
      requiresClarification,
      clarificationQuestions
    };
    
    this.log(`Reasoning complete. Confidence: ${confidence}, Clarification needed: ${requiresClarification}`);
    
    return result;
  }

  private extractLocalInsights(documents: RetrievedDocument[]): string[] {
    return documents
      .filter(doc => doc.score > 0.5) // Only high-confidence results
      .map(doc => {
        const content = doc.content.substring(0, 200); // First 200 chars
        return `[Local KB] ${content}${content.length === 200 ? '...' : ''}`;
      });
  }

  private extractWebInsights(results: WebSearchResult[]): string[] {
    return results
      .filter(result => result.relevance > 0.6) // Only relevant results
      .map(result => {
        const snippet = result.snippet.substring(0, 150); // First 150 chars
        return `[Web] ${result.title}: ${snippet}${snippet.length === 150 ? '...' : ''}`;
      });
  }

  private identifyConflicts(localKnowledge: string[], webInsights: string[]): string[] {
    const conflicts: string[] = [];
    
    // Simple conflict detection based on keyword overlap and sentiment
    // This is a basic implementation - could be enhanced with more sophisticated NLP
    
    const localKeywords = this.extractKeywords(localKnowledge.join(' '));
    const webKeywords = this.extractKeywords(webInsights.join(' '));
    
    // Check for contradictory information patterns
    const contradictionPatterns = [
      { positive: ['good', 'excellent', 'positive', 'benefit'], negative: ['bad', 'poor', 'negative', 'harm'] },
      { positive: ['increase', 'rise', 'grow'], negative: ['decrease', 'fall', 'decline'] },
      { positive: ['support', 'agree', 'confirm'], negative: ['oppose', 'disagree', 'refute'] }
    ];
    
    contradictionPatterns.forEach(pattern => {
      const hasPositive = pattern.positive.some(word => 
        localKeywords.includes(word) || webKeywords.includes(word)
      );
      const hasNegative = pattern.negative.some(word => 
        localKeywords.includes(word) || webKeywords.includes(word)
      );
      
      if (hasPositive && hasNegative) {
        conflicts.push(`Potential contradiction detected between positive and negative information`);
      }
    });
    
    return conflicts;
  }

  private calculateConfidence(localKnowledge: string[], webInsights: string[], conflicts: string[]): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence based on amount of information
    if (localKnowledge.length > 0) confidence += 0.2;
    if (webInsights.length > 0) confidence += 0.1;
    
    // Reduce confidence based on conflicts
    confidence -= conflicts.length * 0.1;
    
    // Boost confidence if we have both local and web sources
    if (localKnowledge.length > 0 && webInsights.length > 0) confidence += 0.1;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private generateReasoning(
    localKnowledge: string[],
    webInsights: string[],
    conflictingInfo: string[],
    enableWebSearch: boolean,
    conversationHistory: Array<{ role: string; content: string }>
  ): string {
    let reasoning = '';
    
    if (localKnowledge.length > 0 && webInsights.length > 0) {
      reasoning = `Combined local knowledge base (${localKnowledge.length} sources) with current web information (${webInsights.length} sources) to provide comprehensive answer.`;
    } else if (localKnowledge.length > 0) {
      reasoning = `Used local IIT Kharagpur knowledge base (${localKnowledge.length} sources) for authoritative campus information.`;
    } else if (webInsights.length > 0) {
      reasoning = `Relied on current web information (${webInsights.length} sources) as local knowledge base had limited relevant data.`;
    } else {
      reasoning = 'Limited information available from both local knowledge base and web search.';
    }
    
    if (conflictingInfo.length > 0) {
      reasoning += ` Detected ${conflictingInfo.length} potential conflicts between sources - prioritized most recent and authoritative information.`;
    }
    
    if (conversationHistory.length > 0) {
      reasoning += ` Considered conversation context to provide relevant follow-up information.`;
    }
    
    return reasoning;
  }

  private combineContext(
    localKnowledge: string[],
    webInsights: string[],
    conflictingInfo: string[]
  ): string {
    let combined = '';
    
    if (localKnowledge.length > 0) {
      combined += `**Local Knowledge Base (${localKnowledge.length} sources):**\n`;
      combined += localKnowledge.map(k => `• ${k}`).join('\n');
      combined += '\n\n';
    }
    
    if (webInsights.length > 0) {
      combined += `**Current Web Information (${webInsights.length} sources):**\n`;
      combined += webInsights.map(w => `• ${w}`).join('\n');
      combined += '\n\n';
    }
    
    if (conflictingInfo.length > 0) {
      combined += `**Note:** Some conflicting information was detected. I've prioritized the most current and authoritative sources.\n\n`;
    }
    
    if (combined === '') {
      combined = 'Limited information available from both local knowledge base and web search.';
    }
    
    return combined;
  }

  private generateRecommendations(localKnowledge: string[], webInsights: string[], conflicts: string[]): string[] {
    const recommendations: string[] = [];
    
    if (localKnowledge.length === 0) {
      recommendations.push('Consider enabling web search for current information');
    }
    
    if (webInsights.length === 0 && localKnowledge.length > 0) {
      recommendations.push('Local knowledge base has relevant information');
    }
    
    if (conflicts.length > 0) {
      recommendations.push('Verify information from multiple sources');
      recommendations.push('Consider the recency of web information vs local knowledge');
    }
    
    if (localKnowledge.length > 0 && webInsights.length > 0) {
      recommendations.push('Combining local knowledge with current web information');
    }
    
    return recommendations;
  }

  private needsClarification(query: string, localKnowledge: string[], webInsights: string[], conflicts: string[]): boolean {
    // Don't ask for clarification if we have conversation context
    if (localKnowledge.length > 0 || webInsights.length > 0) {
      return false;
    }
    
    // Only ask for clarification if the query is very vague and we have no information
    const isVague = query.length < 10 || 
                   query.toLowerCase().includes('what') && query.length < 15 ||
                   query.toLowerCase().includes('how') && query.length < 15;
    
    return isVague && localKnowledge.length === 0 && webInsights.length === 0;
  }

  private generateClarificationQuestions(query: string, localKnowledge: string[], webInsights: string[]): string[] {
    const questions: string[] = [];
    
    if (localKnowledge.length === 0 && webInsights.length === 0) {
      questions.push('Could you provide more specific details about what you\'re looking for?');
      questions.push('Are you looking for current information or historical data?');
    }
    
    if (query.includes('compare') || query.includes('difference')) {
      questions.push('What specific aspects would you like me to compare?');
      questions.push('Are you looking for a comparison between current and historical information?');
    }
    
    if (query.includes('how to') || query.includes('guide')) {
      questions.push('What is your current skill level with this topic?');
      questions.push('Are you looking for step-by-step instructions or general guidance?');
    }
    
    return questions;
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }
}
