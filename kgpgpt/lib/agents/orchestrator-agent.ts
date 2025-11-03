import { BaseAgent } from './base-agent';
import { QueryUnderstandingAgent, QueryAnalysis } from './query-understanding-agent';
import { RetrieverAgent, RetrievalResult } from './retriever-agent';
import { WebSearchAgent, WebSearchResponse } from './web-search-agent';
import { ReasoningAgent, ReasoningResult } from './reasoning-agent';
import { SummarizerAgent, SummarizedResponse } from './summarizer-agent';
import { SimpleResponseAgent, SimpleResponse } from './simple-response-agent';

export interface OrchestrationResult {
  response: SummarizedResponse | SimpleResponse;
  queryAnalysis: QueryAnalysis;
  retrievalResult?: RetrievalResult;
  webSearchResult?: WebSearchResponse;
  reasoningResult?: ReasoningResult;
  totalProcessingTime: number;
  agentTimeline: {
    queryUnderstanding: number;
    retrieval?: number;
    webSearch?: number;
    reasoning?: number;
    summarization?: number;
    simpleResponse?: number;
  };
  isSimpleResponse: boolean;
}

export class OrchestratorAgent extends BaseAgent {
  private queryUnderstandingAgent: QueryUnderstandingAgent;
  private retrieverAgent: RetrieverAgent;
  private webSearchAgent: WebSearchAgent;
  private reasoningAgent: ReasoningAgent;
  private summarizerAgent: SummarizerAgent;
  private simpleResponseAgent: SimpleResponseAgent;

  constructor(
    retrieverAgent: RetrieverAgent,
    webSearchAgent: WebSearchAgent,
    summarizerAgent: SummarizerAgent
  ) {
    super(
      'Orchestrator Agent',
      'Coordinates all agents and manages the multi-agent pipeline'
    );
    
    this.queryUnderstandingAgent = new QueryUnderstandingAgent();
    this.retrieverAgent = retrieverAgent;
    this.webSearchAgent = webSearchAgent;
    this.reasoningAgent = new ReasoningAgent();
    this.summarizerAgent = summarizerAgent;
    this.simpleResponseAgent = new SimpleResponseAgent();
  }

  async process(input: {
    query: string;
    enableWebSearch: boolean;
    isFirstMessage?: boolean;
    conversationHistory?: Array<{ role: string; content: string }>;
  }): Promise<OrchestrationResult> {
    const startTime = Date.now();
    this.log(`Starting orchestration for query: "${input.query}"`);
    
    const { query, enableWebSearch, isFirstMessage = false, conversationHistory = [] } = input;
    const agentTimeline: any = {};
    
    try {
      // Step 1: Query Understanding
      const queryStart = Date.now();
      const queryAnalysis = await this.queryUnderstandingAgent.process(query);
      agentTimeline.queryUnderstanding = Date.now() - queryStart;
      this.log(`Query understanding completed in ${agentTimeline.queryUnderstanding}ms`);
      
      // Check if this is a simple query that doesn't need the full pipeline
      if (!queryAnalysis.requiresFullPipeline) {
        this.log('Simple query detected - using fast response path');
        const simpleResponseStart = Date.now();
        const simpleResponse = await this.simpleResponseAgent.process(query);
        agentTimeline.simpleResponse = Date.now() - simpleResponseStart;
        
        const totalProcessingTime = Date.now() - startTime;
        this.log(`Simple response completed in ${totalProcessingTime}ms`);
        
        return {
          response: simpleResponse,
          queryAnalysis,
          totalProcessingTime,
          agentTimeline,
          isSimpleResponse: true
        };
      }
      
      // Step 2: Local Retrieval (always attempt)
      let retrievalResult: RetrievalResult | undefined;
      let retrievalTime: number | undefined;
      
      try {
        const retrievalStart = Date.now();
        retrievalResult = await this.retrieverAgent.process(query);
        retrievalTime = Date.now() - retrievalStart;
        agentTimeline.retrieval = retrievalTime;
        this.log(`Local retrieval completed in ${retrievalTime}ms`);
      } catch (error) {
        this.log('Local retrieval failed, continuing without local knowledge');
        retrievalResult = undefined;
        agentTimeline.retrieval = 0;
      }
      
      // Step 3: Web Search (if enabled and required OR if KB has no results)
      let webSearchResult: WebSearchResponse | undefined;
      let webSearchTime: number | undefined;
      
      const shouldWebSearch = enableWebSearch && (
        queryAnalysis.requiresWebSearch || 
        !retrievalResult?.documents || 
        retrievalResult.documents.length === 0 ||
        retrievalResult.documents.every(doc => doc.score < 0.3) // Low quality results
      );
      
      if (shouldWebSearch) {
        try {
          const webSearchStart = Date.now();
          webSearchResult = await this.webSearchAgent.process(query, conversationHistory);
          webSearchTime = Date.now() - webSearchStart;
          agentTimeline.webSearch = webSearchTime;
          this.log(`Web search completed in ${webSearchTime}ms`);
        } catch (error) {
          this.log('Web search failed, continuing without web results');
          webSearchResult = undefined;
          agentTimeline.webSearch = 0;
        }
      } else {
        agentTimeline.webSearch = 0;
      }
      
      // Step 4: Reasoning and Synthesis
      const reasoningStart = Date.now();
      const reasoningResult = await this.reasoningAgent.process({
        query,
        localDocuments: retrievalResult?.documents,
        webResults: webSearchResult?.results,
        enableWebSearch: enableWebSearch && queryAnalysis.requiresWebSearch,
        conversationHistory
      });
      agentTimeline.reasoning = Date.now() - reasoningStart;
      this.log(`Reasoning completed in ${agentTimeline.reasoning}ms`);
      
      // Step 5: Final Response Generation
      const summarizationStart = Date.now();
      const response = await this.summarizerAgent.process({
        query,
        reasoningResult,
        enableWebSearch: enableWebSearch && queryAnalysis.requiresWebSearch,
        isFirstMessage: isFirstMessage,
        conversationHistory
      });
      agentTimeline.summarization = Date.now() - summarizationStart;
      this.log(`Response generation completed in ${agentTimeline.summarization}ms`);
      
      const totalProcessingTime = Date.now() - startTime;
      
      this.log(`Orchestration completed successfully in ${totalProcessingTime}ms`);
      
      return {
        response,
        queryAnalysis,
        retrievalResult,
        webSearchResult,
        reasoningResult,
        totalProcessingTime,
        agentTimeline,
        isSimpleResponse: false
      };
      
    } catch (error) {
      this.error('Orchestration failed', error);
      throw new Error(`Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    agentStatus: Record<string, string>;
    details: string[];
  }> {
    const agentStatus: Record<string, string> = {};
    const details: string[] = [];
    
    // Check each agent's health
    try {
      // Query Understanding Agent (always available - local)
      agentStatus['Query Understanding'] = 'healthy';
    } catch (error) {
      agentStatus['Query Understanding'] = 'unhealthy';
      details.push('Query Understanding Agent failed health check');
    }
    
    try {
      // Retriever Agent
      const isCollectionReady = await this.retrieverAgent.isCollectionReady();
      agentStatus['Retriever'] = isCollectionReady ? 'healthy' : 'degraded';
      if (!isCollectionReady) {
        details.push('Qdrant collection not ready');
      }
    } catch (error) {
      agentStatus['Retriever'] = 'unhealthy';
      details.push('Retriever Agent failed health check');
    }
    
    try {
      // Web Search Agent
      const isApiValid = await this.webSearchAgent.isApiKeyValid();
      agentStatus['Web Search'] = isApiValid ? 'healthy' : 'degraded';
      if (!isApiValid) {
        details.push('Serper API key invalid or expired');
      }
    } catch (error) {
      agentStatus['Web Search'] = 'unhealthy';
      details.push('Web Search Agent failed health check');
    }
    
    try {
      // Reasoning Agent (always available - local)
      agentStatus['Reasoning'] = 'healthy';
    } catch (error) {
      agentStatus['Reasoning'] = 'unhealthy';
      details.push('Reasoning Agent failed health check');
    }
    
    try {
      // Summarizer Agent
      const isApiValid = await this.summarizerAgent.isApiKeyValid();
      agentStatus['Summarizer'] = isApiValid ? 'healthy' : 'degraded';
      if (!isApiValid) {
        details.push('Gemini API key invalid or expired');
      }
    } catch (error) {
      agentStatus['Summarizer'] = 'unhealthy';
      details.push('Summarizer Agent failed health check');
    }
    
    // Determine overall system status
    const healthyCount = Object.values(agentStatus).filter(status => status === 'healthy').length;
    const totalAgents = Object.keys(agentStatus).length;
    
    let systemStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalAgents) {
      systemStatus = 'healthy';
    } else if (healthyCount >= totalAgents * 0.6) {
      systemStatus = 'degraded';
    } else {
      systemStatus = 'unhealthy';
    }
    
    return {
      status: systemStatus,
      agentStatus,
      details
    };
  }

  getAgentDescriptions(): Record<string, string> {
    return {
      'Query Understanding Agent': this.queryUnderstandingAgent.getDescription(),
      'Retriever Agent': this.retrieverAgent.getDescription(),
      'Web Search Agent': this.webSearchAgent.getDescription(),
      'Reasoning Agent': this.reasoningAgent.getDescription(),
      'Summarizer Agent': this.summarizerAgent.getDescription(),
      'Orchestrator Agent': this.getDescription()
    };
  }
}
