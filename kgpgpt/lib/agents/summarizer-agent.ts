import { BaseAgent } from './base-agent';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ReasoningResult } from './reasoning-agent';

export interface SummarizedResponse {
  response: string;
  confidence: number;
  sources: string[];
  metadata: {
    model: string;
    tokensUsed: number;
    generationTime: number;
  };
}

export class SummarizerAgent extends BaseAgent {
  private genAI: GoogleGenerativeAI;
  private model: any; // Gemini model instance

  constructor(apiKey: string) {
    super(
      'Summarizer Agent (SM-A)',
      'Generates final user-facing responses using Gemini LLM'
    );
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async process(input: {
    query: string;
    reasoningResult: ReasoningResult;
    enableWebSearch: boolean;
    isFirstMessage: boolean;
    conversationHistory?: Array<{ role: string; content: string }>;
  }): Promise<SummarizedResponse> {
    this.log(`Generating response for query: "${input.query}"`);
    const startTime = Date.now();

    try {
      const { query, reasoningResult, enableWebSearch, conversationHistory = [] } = input;
      const { context, recommendations, requiresClarification, clarificationQuestions } = reasoningResult;

      // Build the prompt for Gemini
      const prompt = this.buildPrompt(query, context, recommendations || [], requiresClarification, clarificationQuestions || [], input.isFirstMessage, conversationHistory);
      
      // Generate response using Gemini
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Extract sources from the context
      const sources = this.extractSources(context);
      
      // Calculate confidence based on reasoning result
      const confidence = context.confidence;
      
      const generationTime = Date.now() - startTime;
      
      this.log(`Response generated successfully in ${generationTime}ms`);
      
      return {
        response,
        confidence,
        sources,
        metadata: {
          model: 'gemini-2.5-flash',
          tokensUsed: response.length / 4, // Rough estimate
          generationTime
        }
      };

    } catch (error) {
      this.error('Failed to generate response', error);
      
      // Fallback response
      return {
        response: `I apologize, but I encountered an error while generating a response. Please try rephrasing your question or check your internet connection.`,
        confidence: 0.1,
        sources: [],
        metadata: {
          model: 'gemini-pro',
          tokensUsed: 0,
          generationTime: Date.now() - startTime
        }
      };
    }
  }

  private buildPrompt(
    query: string,
    context: {
      combinedContext: string;
      reasoning: string;
    },
    recommendations: string[],
    requiresClarification: boolean,
    clarificationQuestions: string[],
    isFirstMessage: boolean,
    conversationHistory: Array<{ role: string; content: string }>
  ): string {
    // Ensure context has valid content
    const combinedContext = context.combinedContext || 'No specific context available';
    const reasoning = context.reasoning || 'Processing query based on available information';
    
    let prompt = `You are **KGPGPT**, the official AI assistant for IIT Kharagpur.  
Your role: act like a **friendly, knowledgeable senior student** who knows IIT KGP inside out.  

### Personality
- Warm, approachable, and supportive  
- Conversational and natural (like talking to a helpful senior), not robotic  
- Enthusiastic about IIT KGP life, culture, and academics  
- Professional when needed, but never overly formal  

---

${conversationHistory.length > 0 ? `### ⚠️ CONVERSATION HISTORY - READ THIS FIRST! ⚠️
${conversationHistory.slice(-4).map((msg, idx) => `${idx + 1}. ${msg.role === 'user' ? '👤 User' : '🤖 You (Assistant)'}: ${msg.content}`).join('\n\n')}

**🔴 IMPORTANT:** The user's current question "${query}" is likely a follow-up to this conversation. If they mention "him/her/his/her/they/their/this/that" or ask for "more details/information", they are referring to people/topics mentioned above. Identify what they're asking about from the conversation history and provide the specific information requested.

---

` : ''}### Current User Query
"${query}"

---

### Knowledge & Reasoning (for your reference)
- **Context from knowledge base/web:** ${combinedContext}  
- **Analysis:** ${reasoning}  
- **Key Recommendations:** ${recommendations.length > 0 ? recommendations.join(', ') : 'None available'}  

---

### How to Answer
1. ${isFirstMessage 
   ? `Begin with: "Hello! I'm KGPGPT, your IIT Kharagpur AI assistant. How can I help you today?"` 
   : `**CRITICAL: READ THE CONVERSATION HISTORY ABOVE FIRST!**
   
   If the user asks about "him/her/his/her/their/they/this/that" or says "more details/tell me more", they are referring to someone/something mentioned in the conversation above.
   
   Example:
   - If they previously asked "Who is the director?" and now ask "his details", they want details about THE DIRECTOR mentioned in your previous response.
   - If they asked about "Prof. X" and now say "tell me more", they want more info about Prof. X.
   
   DO NOT give a generic response. DO NOT ask what they're looking for. USE THE CONVERSATION CONTEXT to understand their question and provide the specific information they're asking for.`}
2. Always prioritize IIT KGP–specific knowledge (mention halls, departments, professors, events, mess, library, TSG, fests, etc. when relevant).  
3. If information is missing or outdated, politely say so and suggest checking official IIT KGP sources or web search.  
4. Only ask for clarification if you have NO information from both knowledge base and web search. Otherwise, provide the best answer possible with available information.  
5. Keep answers **short and direct** — get to the point quickly without unnecessary background information.  
6. Speak in a **helpful, student-friendly voice** — no jargon, explain in simple words.  
7. Only add follow-up suggestions if directly relevant to the question asked.
8. **For follow-up questions:** Reference the conversation history to maintain context and continuity.  

---

### If Clarification Needed
Ask naturally:  
${clarificationQuestions.length > 0 ? clarificationQuestions.map(q => `- ${q}`).join('\n') : 'No clarification questions available'}

Example:  
"Could you clarify whether you're asking about mess food timings or quality? That'll help me give you the right info."  

---

### Example Style
**Q:** "Where can I practice sports on campus?"  
**A:** "Tata Sports Complex for cricket/football, Technology Students' Gymkhana for badminton/table tennis. Most halls also have courts for casual practice. Need help booking slots?"

**Q:** "Who is TSG VP 2025-26?"
**A:** "I found mentions of Sudhagani Praneeth Kumar but couldn't confirm officially. Check the TSG website or their social media for current details."  

---

### Final Instruction
Write the **best possible student-friendly response** to the user query.  
Make it **clear, concise, and grounded in IIT Kharagpur life.**

**Avoid:**
- Unnecessary background explanations (like "TSG is a huge part of KGP experience")
- Over-enthusiastic commentary 
- Lengthy introductions or conclusions
- Multiple unrelated follow-up suggestions

**Focus on:**
- Direct answer to the question
- Relevant facts and information
- One helpful next step if appropriate`;

    return prompt;
  }

  private extractSources(context: any): string[] {
    const sources: string[] = [];
    
    // Extract local knowledge sources
    if (context.localKnowledge && context.localKnowledge.length > 0) {
      sources.push('Local Knowledge Base');
    }
    
    // Extract web search sources
    if (context.webInsights && context.webInsights.length > 0) {
      sources.push('Web Search Results');
    }
    
    return sources;
  }

  async isApiKeyValid(): Promise<boolean> {
    try {
      // Try to generate a simple test response
      const result = await this.model.generateContent('Hello');
      return result.response.text().length > 0;
    } catch {
      return false;
    }
  }

  getApiKeyStatus(): string {
    // This would need to be implemented based on how the API key is stored
    return 'unknown';
  }

  async generateClarificationResponse(clarificationQuestions: string[]): Promise<string> {
    try {
      const prompt = `The user's query needs clarification. Please ask these questions in a helpful way:\n\n${clarificationQuestions.map(q => `- ${q}`).join('\n')}\n\nAlso provide a brief explanation of why this clarification is needed.`;
      
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      this.error('Failed to generate clarification response', error);
      return `I need some clarification to better answer your question. Could you please provide more specific details?`;
    }
  }

  async enhanceResponseWithContext(
    baseResponse: string,
    additionalContext: string
  ): Promise<string> {
    try {
      const prompt = `Please enhance this response with the additional context provided, making it more comprehensive and accurate while maintaining the original tone and structure.

Original Response:
${baseResponse}

Additional Context:
${additionalContext}

Enhanced Response:`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      this.error('Failed to enhance response', error);
      return baseResponse; // Return original response if enhancement fails
    }
  }
}
