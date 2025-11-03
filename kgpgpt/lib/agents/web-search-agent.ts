import { BaseAgent } from './base-agent';
import axios from 'axios';

export interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  relevance: number;
  searchEngine?: string;
  linkedinData?: LinkedInProfile;
}

export interface LinkedInProfile {
  linkedin_num_id: string;
  url: string;
  name: string;
  country_code: string;
  city: string;
  about: string | null;
  followers: number;
  connections: number;
  position: string;
  experience: LinkedInExperience[];
  current_company: {
    company_id: string;
    name: string;
    title: string;
    location?: string;
  };
  education: LinkedInEducation[];
  avatar: string;
  first_name: string;
  last_name: string;
  bio_links: any[];
  similar_profiles: LinkedInSimilarProfile[];
  people_also_viewed: LinkedInPeopleAlsoViewed[];
}

export interface LinkedInExperience {
  company: string;
  company_id: string;
  company_logo_url: string;
  description_html: string | null;
  end_date: string;
  start_date: string;
  title: string;
  url: string;
}

export interface LinkedInEducation {
  description: string | null;
  description_html: string | null;
  end_year: string;
  institute_logo_url: string;
  start_year: string;
  title: string;
  url?: string;
}

export interface LinkedInSimilarProfile {
  name: string;
  title: string | null;
  url: string;
  url_text: string;
}

export interface LinkedInPeopleAlsoViewed {
  about: string | null;
  location: string;
  name: string;
  profile_link: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  totalFound: number;
  query: string;
  searchTime: number;
  error?: string;
}

export interface SearchEngine {
  name: string;
  baseUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  enabled: boolean;
}

export class WebSearchAgent extends BaseAgent {
  private searchEngines: SearchEngine[];
  private defaultEngine: string = 'serper';

  constructor(serperApiKey: string, brightdataApiKey?: string, brightdataUsername?: string, brightdataPassword?: string) {
    super(
      'Web Search Agent (WS-A)',
      'Interfaces with multiple search engines for comprehensive internet search including LinkedIn data scraping'
    );
    
    // Initialize search engines
    this.searchEngines = [
      {
        name: 'serper',
        baseUrl: 'https://google.serper.dev/search',
        apiKey: serperApiKey,
        headers: {
          'X-API-KEY': serperApiKey,
          'Content-Type': 'application/json'
        },
        enabled: !!serperApiKey
      },
      {
        name: 'bing',
        baseUrl: 'https://api.bing.microsoft.com/v7.0/search',
        apiKey: process.env.BING_API_KEY,
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.BING_API_KEY || '',
          'Content-Type': 'application/json'
        },
        enabled: !!process.env.BING_API_KEY
      },
      {
        name: 'duckduckgo',
        baseUrl: 'https://api.duckduckgo.com/',
        enabled: true // No API key required for basic search
      },
      {
        name: 'academic',
        baseUrl: 'https://api.semanticscholar.org/graph/v1/paper/search',
        apiKey: process.env.SEMANTIC_SCHOLAR_API_KEY,
        headers: {
          'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY || '',
          'Content-Type': 'application/json'
        },
        enabled: !!process.env.SEMANTIC_SCHOLAR_API_KEY
      },
      {
        name: 'tavily',
        baseUrl: 'https://api.tavily.com/search',
        apiKey: process.env.TAVILY_API_KEY,
        headers: {
          'api-key': process.env.TAVILY_API_KEY || '',
          'Content-Type': 'application/json'
        },
        enabled: !!process.env.TAVILY_API_KEY
      },
      {
        name: 'brightdata',
        baseUrl: 'https://api.brightdata.com',
        apiKey: brightdataApiKey,
        headers: {
          'Authorization': `Bearer ${brightdataApiKey}`,
          'Content-Type': 'application/json'
        },
        enabled: !!(brightdataApiKey && brightdataUsername && brightdataPassword)
      }
    ];
  }

  async process(query: string, conversationHistory?: Array<{ role: string; content: string }>): Promise<WebSearchResponse> {
    this.log(`Performing comprehensive web search for query: "${query}"`);
    const startTime = Date.now();

    // Enhance query with IIT Kharagpur context and conversation context for better results
    const enhancedQuery = this.enhanceQuery(query, conversationHistory);
    
    this.log(`Enhanced query: "${enhancedQuery}"`);
    
    // Multi-tiered search strategy
    let allResults: WebSearchResult[] = [];
    
    // Tier 1: Try site-specific search for IIT KGP domains (for faculty/professor queries)
    if (this.isProfessorQuery(query)) {
      this.log(`Detected professor query, performing site-specific search first`);
      const siteSpecificResults = await this.searchIITKGPSites(enhancedQuery);
      
      if (siteSpecificResults.length >= 3) {
        this.log(`Found ${siteSpecificResults.length} results from IIT KGP sites, using these`);
        allResults = siteSpecificResults;
      } else {
        this.log(`Only ${siteSpecificResults.length} results from IIT KGP sites, expanding to general search`);
        const generalResults = await this.searchMultipleEngines(enhancedQuery);
        allResults = [...siteSpecificResults, ...generalResults];
      }
    } else if (this.isCDCQuery(query)) {
      // Tier 2: For CDC-related queries, search CDC site first
      this.log(`Detected CDC query, performing site-specific search first`);
      const cdcResults = await this.searchCDCSite(enhancedQuery);
      
      if (cdcResults.length >= 2) {
        this.log(`Found ${cdcResults.length} results from CDC site, using these`);
        allResults = cdcResults;
      } else {
        this.log(`Only ${cdcResults.length} results from CDC site, expanding to general search`);
        const generalResults = await this.searchMultipleEngines(enhancedQuery);
        allResults = [...cdcResults, ...generalResults];
      }
    } else {
      // Regular search for non-professor queries
      allResults = await this.searchMultipleEngines(enhancedQuery);
    }
    
    // Merge, deduplicate, and rank results
    const mergedResults = this.mergeAndRankResults(allResults);
    
    const searchTime = Date.now() - startTime;
    
    this.log(`Comprehensive web search completed: ${mergedResults.length} results in ${searchTime}ms`);
    
    return {
      results: mergedResults.slice(0, 10), // Return top 10 results
      totalFound: mergedResults.length,
      query,
      searchTime
    };
  }

  private isProfessorQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    // Exclude CDC queries from professor queries
    if (this.isCDCQuery(query)) {
      return false;
    }
    return (
      lowerQuery.includes('professor') ||
      lowerQuery.includes('prof.') ||
      lowerQuery.includes('prof ') ||
      lowerQuery.includes('dr.') ||
      lowerQuery.includes('dr ') ||
      lowerQuery.includes('faculty') ||
      lowerQuery.includes('teacher') ||
      lowerQuery.includes('director') ||
      lowerQuery.includes('head of department') ||
      lowerQuery.includes('hod') ||
      // School-related queries
      lowerQuery.includes('school of') ||
      lowerQuery.includes('vgsom') ||
      lowerQuery.includes('rgsoipl') ||
      lowerQuery.includes('department of') ||
      lowerQuery.includes('dept of') ||
      // New schools (2025)
      lowerQuery.includes('entrepreneurship') ||
      lowerQuery.includes('quality and reliability') ||
      lowerQuery.includes('telecommunications') ||
      lowerQuery.includes('infrastructure design') ||
      // Academic and administrative
      lowerQuery.includes('erp') ||
      lowerQuery.includes('library') ||
      lowerQuery.includes('central library') ||
      lowerQuery.includes('gymkhana') ||
      lowerQuery.includes('tsg')
    );
  }

  private isCDCQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return (
      lowerQuery.includes('cdc') ||
      lowerQuery.includes('career development cell') ||
      lowerQuery.includes('placement') ||
      lowerQuery.includes('internship') ||
      lowerQuery.includes('recruiter') ||
      lowerQuery.includes('company visit') ||
      (lowerQuery.includes('job') && (lowerQuery.includes('campus') || lowerQuery.includes('iit'))) ||
      lowerQuery.includes('campus placement')
    );
  }

  private async searchIITKGPSites(query: string): Promise<WebSearchResult[]> {
    /**
     * IIT Kharagpur has 22+ interdisciplinary schools and important services.
     * 
     * Major Schools & Departments:
     * - VGSoM (Management): som.iitkgp.ac.in
     * - RGSOIPL (IP Law): gateoffice.iitkgp.ac.in/law
     * - Academic Schools: /department/SM, /department/SE, etc.
     * 
     * Important Services:
     * - CDC (Career Development Cell): cdc.iitkgp.ac.in
     * - Central Library: library.iitkgp.ac.in
     * - ERP Portal: erp.iitkgp.ac.in
     * - Students' Gymkhana: gymkhana.iitkgp.ac.in
     * - MetaKGP Wiki: metakgp.org
     */
    
    // Use broader site search with main domain to catch all departments and schools
    const broadQuery = `${query} site:iitkgp.ac.in`;
    
    this.log(`Performing IIT KGP site-specific search: ${broadQuery}`);

    // Search with the primary enabled engine
    const primaryEngine = this.searchEngines.find(e => e.enabled && (e.name === 'serper' || e.name === 'bing'));
    
    if (!primaryEngine) {
      this.log('No suitable search engine available for site-specific search');
      return [];
    }

    try {
      // Primary search on main iitkgp.ac.in domain (catches all departments)
      const mainResults = await this.searchWithEngine(primaryEngine, broadQuery);
      this.log(`Main IIT KGP search found ${mainResults.length} results`);
      
      // Secondary searches on specific important subdomains
      const subdomainQueries = [
        `${query} site:som.iitkgp.ac.in`,           // VGSoM
        `${query} site:cdc.iitkgp.ac.in`,           // Career Development Cell
        `${query} site:library.iitkgp.ac.in`,       // Central Library
        `${query} site:erp.iitkgp.ac.in`,           // ERP Portal
        `${query} site:gymkhana.iitkgp.ac.in`,      // Students' Gymkhana
        `${query} site:metakgp.org`,                // MetaKGP Wiki
        `${query} site:gateoffice.iitkgp.ac.in`     // Gate Office (Law School)
      ];
      
      const subdomainPromises = subdomainQueries.map(siteQuery => 
        this.searchWithEngine(primaryEngine, siteQuery)
      );
      
      const subdomainResults = await Promise.allSettled(subdomainPromises);
      const allResults: WebSearchResult[] = [...mainResults];
      
      subdomainResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          this.log(`Subdomain search ${index + 1} found ${result.value.length} results`);
          allResults.push(...result.value);
        }
      });
      
      return allResults;
    } catch (error) {
      this.error('Site-specific search failed', error);
      return [];
    }
  }

  private async searchCDCSite(query: string): Promise<WebSearchResult[]> {
    /**
     * CDC (Career Development Cell) - IIT Kharagpur's placement and internship portal
     * Official website: cdc.iitkgp.ac.in
     * 
     * CDC handles:
     * - Campus placements and recruitment
     * - Internship opportunities
     * - Company visits and PPOs
     * - Career development programs
     */
    
    this.log(`Performing CDC site-specific search for: ${query}`);

    // Search with the primary enabled engine
    const primaryEngine = this.searchEngines.find(e => e.enabled && (e.name === 'serper' || e.name === 'bing'));
    
    if (!primaryEngine) {
      this.log('No suitable search engine available for CDC site search');
      return [];
    }

    try {
      // Search CDC domain first
      const cdcQuery = `${query} site:cdc.iitkgp.ac.in`;
      const cdcResults = await this.searchWithEngine(primaryEngine, cdcQuery);
      this.log(`CDC site search found ${cdcResults.length} results`);
      
      // Also search main IIT KGP site with CDC context
      const mainQuery = `${query} cdc placement site:iitkgp.ac.in`;
      const mainResults = await this.searchWithEngine(primaryEngine, mainQuery);
      this.log(`Main site CDC search found ${mainResults.length} results`);
      
      // Also check MetaKGP for CDC-related info (student experiences, company reviews, etc.)
      const metakgpQuery = `${query} cdc placement site:metakgp.org`;
      const metakgpResults = await this.searchWithEngine(primaryEngine, metakgpQuery);
      this.log(`MetaKGP CDC search found ${metakgpResults.length} results`);
      
      return [...cdcResults, ...mainResults, ...metakgpResults];
    } catch (error) {
      this.error('CDC site-specific search failed', error);
      return [];
    }
  }

  private async searchMultipleEngines(query: string): Promise<WebSearchResult[]> {
    const searchPromises = this.searchEngines
      .filter(engine => engine.enabled)
      .map(engine => this.searchWithEngine(engine, query));

    try {
      const results = await Promise.allSettled(searchPromises);
      const allResults: WebSearchResult[] = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          allResults.push(...result.value);
        } else if (result.status === 'rejected') {
          this.error(`Search failed for ${this.searchEngines[index].name}:`, result.reason);
        }
      });
      
      return allResults;
    } catch (error) {
      this.error('Multiple engine search failed', error);
      return [];
    }
  }

  private async searchWithEngine(engine: SearchEngine, query: string): Promise<WebSearchResult[]> {
    try {
      switch (engine.name) {
        case 'serper':
          return await this.searchSerper(engine, query);
        case 'bing':
          return await this.searchBing(engine, query);
        case 'duckduckgo':
          return await this.searchDuckDuckGo(engine, query);
        case 'academic':
          return await this.searchAcademic(engine, query);
        case 'tavily':
          return await this.searchTavily(engine, query);
        case 'brightdata':
          return await this.searchBrightData(engine, query);
        default:
          return [];
      }
    } catch (error) {
      this.error(`Search failed for ${engine.name}:`, error);
      return [];
    }
  }

  private async searchSerper(engine: SearchEngine, query: string): Promise<WebSearchResult[]> {
    const response = await axios.post(
      engine.baseUrl,
      { q: query },
      { headers: engine.headers }
    );

    const searchResults = response.data.organic || [];
    
    return searchResults
      .slice(0, 5)
      .map((result: any, index: number) => ({
        title: result.title || 'No title',
        link: result.link || '#',
        snippet: result.snippet || 'No description available',
        source: this.extractDomain(result.link),
        relevance: this.calculateRelevance(result, index),
        searchEngine: 'Google (via Serper)'
      }))
      .filter((result: WebSearchResult) => result.title && result.snippet);
  }

  private async searchBing(engine: SearchEngine, query: string): Promise<WebSearchResult[]> {
    const response = await axios.get(
      engine.baseUrl,
      {
        params: { q: query, count: 5 },
        headers: engine.headers
      }
    );

    const searchResults = response.data.webPages?.value || [];
    
    return searchResults.map((result: any, index: number) => ({
      title: result.name || 'No title',
      link: result.url || '#',
      snippet: result.snippet || 'No description available',
      source: this.extractDomain(result.url),
      relevance: this.calculateRelevance(result, index),
      searchEngine: 'Bing'
    }));
  }

  private async searchDuckDuckGo(engine: SearchEngine, query: string): Promise<WebSearchResult[]> {
    // DuckDuckGo Instant Answer API (limited but free)
    const response = await axios.get(
      engine.baseUrl,
      {
        params: { 
          q: query,
          format: 'json',
          no_html: '1',
          skip_disambig: '1'
        }
      }
    );

    const results: WebSearchResult[] = [];
    
    // Add instant answer if available
    if (response.data.Abstract) {
      results.push({
        title: response.data.Heading || 'Instant Answer',
        link: response.data.AbstractURL || '#',
        snippet: response.data.Abstract,
        source: this.extractDomain(response.data.AbstractURL),
        relevance: 0.9,
        searchEngine: 'DuckDuckGo'
      });
    }

    // Add related topics
    if (response.data.RelatedTopics) {
      response.data.RelatedTopics.slice(0, 3).forEach((topic: any, index: number) => {
        if (topic.Text) {
          results.push({
            title: topic.Text.split(' - ')[0] || 'Related Topic',
            link: topic.FirstURL || '#',
            snippet: topic.Text,
            source: this.extractDomain(topic.FirstURL),
            relevance: 0.7 - (index * 0.1),
            searchEngine: 'DuckDuckGo'
          });
        }
      });
    }

    return results;
  }

  private async searchAcademic(engine: SearchEngine, query: string): Promise<WebSearchResult[]> {
    const response = await axios.get(
      engine.baseUrl,
      {
        params: { 
          query: query,
          limit: 5,
          fields: 'title,abstract,url,year,authors'
        },
        headers: engine.headers
      }
    );

    const searchResults = response.data.data || [];
    
    return searchResults.map((result: any, index: number) => ({
      title: result.title || 'No title',
      link: result.url || '#',
      snippet: result.abstract || 'No abstract available',
      source: 'Semantic Scholar',
      relevance: this.calculateRelevance(result, index),
      searchEngine: 'Semantic Scholar'
    }));
  }

  private async searchTavily(engine: SearchEngine, query: string): Promise<WebSearchResult[]> {
    const response = await axios.post(
      engine.baseUrl,
      {
        query: query,
        search_depth: 'basic',
        include_answer: true,
        include_raw_content: false,
        max_results: 5
      },
      { headers: engine.headers }
    );

    const searchResults = response.data.results || [];
    
    const results: WebSearchResult[] = [];
    
    // Add main results
    searchResults.forEach((result: any, index: number) => {
      if (result.title && result.url) {
        results.push({
          title: result.title,
          link: result.url,
          snippet: result.content || 'No content available',
          source: this.extractDomain(result.url),
          relevance: this.calculateRelevance(result, index),
          searchEngine: 'Tavily'
        });
      }
    });

    // Add answer if available
    if (response.data.answer) {
      results.unshift({
        title: 'Direct Answer',
        link: '#',
        snippet: response.data.answer,
        source: 'Tavily AI',
        relevance: 1.0,
        searchEngine: 'Tavily'
      });
    }

    return results;
  }

  private async searchBrightData(engine: SearchEngine, query: string): Promise<WebSearchResult[]> {
    try {
      // Check if query is LinkedIn-related (person name, company, or LinkedIn-specific terms)
      if (this.isLinkedInQuery(query)) {
        return await this.searchLinkedInProfiles(engine, query);
      }
      
      // For general web search using BrightData
      return await this.searchBrightDataWeb(engine, query);
    } catch (error) {
      this.error('BrightData search failed:', error);
      return [];
    }
  }

  private isLinkedInQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    const linkedinKeywords = [
      'linkedin', 'profile', 'person', 'employee', 'staff', 'team member',
      'professor', 'faculty', 'researcher', 'engineer', 'manager', 'director',
      'ceo', 'cto', 'founder', 'co-founder', 'head of', 'lead', 'senior',
      'junior', 'associate', 'analyst', 'consultant', 'specialist'
    ];
    
    return linkedinKeywords.some(keyword => lowerQuery.includes(keyword)) ||
           this.containsPersonName(query);
  }

  private containsPersonName(query: string): boolean {
    // Simple heuristic to detect person names (2+ capitalized words)
    const words = query.split(/\s+/);
    const capitalizedWords = words.filter(word => 
      word.length > 1 && word[0] === word[0].toUpperCase() && word[0].match(/[A-Z]/)
    );
    return capitalizedWords.length >= 2;
  }

  private async searchLinkedInProfiles(engine: SearchEngine, query: string): Promise<WebSearchResult[]> {
    try {
      // Use BrightData LinkedIn scraper
      const response = await axios.post(
        `${engine.baseUrl}/linkedin/profile/search`,
        {
          query: query,
          max_results: 5,
          include_experience: true,
          include_education: true,
          include_connections: true
        },
        {
          headers: {
            ...engine.headers,
            'Authorization': `Bearer ${engine.apiKey}`,
            'X-Username': process.env.BRIGHTDATA_USERNAME || '',
            'X-Password': process.env.BRIGHTDATA_PASSWORD || ''
          }
        }
      );

      const profiles = response.data.results || [];
      
      return profiles.map((profile: LinkedInProfile, index: number) => {
        const snippet = this.generateLinkedInSnippet(profile);
        
        return {
          title: `${profile.name} - ${profile.current_company?.title || profile.position}`,
          link: profile.url,
          snippet: snippet,
          source: 'LinkedIn',
          relevance: this.calculateLinkedInRelevance(profile, query, index),
          searchEngine: 'BrightData LinkedIn',
          linkedinData: profile
        };
      });
    } catch (error) {
      this.error('LinkedIn profile search failed:', error);
      return [];
    }
  }

  private async searchBrightDataWeb(engine: SearchEngine, query: string): Promise<WebSearchResult[]> {
    try {
      const response = await axios.post(
        `${engine.baseUrl}/web/search`,
        {
          query: query,
          max_results: 5,
          include_content: true,
          country: 'US',
          language: 'en'
        },
        {
          headers: {
            ...engine.headers,
            'X-Username': process.env.BRIGHTDATA_USERNAME || '',
            'X-Password': process.env.BRIGHTDATA_PASSWORD || ''
          }
        }
      );

      const searchResults = response.data.results || [];
      
      return searchResults.map((result: any, index: number) => ({
        title: result.title || 'No title',
        link: result.url || '#',
        snippet: result.content || result.description || 'No description available',
        source: this.extractDomain(result.url),
        relevance: this.calculateRelevance(result, index),
        searchEngine: 'BrightData Web'
      }));
    } catch (error) {
      this.error('BrightData web search failed:', error);
      return [];
    }
  }

  private generateLinkedInSnippet(profile: LinkedInProfile): string {
    let snippet = '';
    
    if (profile.about) {
      snippet += profile.about.substring(0, 200) + '...';
    } else if (profile.current_company) {
      snippet += `${profile.current_company.title} at ${profile.current_company.name}`;
    } else if (profile.experience && profile.experience.length > 0) {
      const latestExp = profile.experience[0];
      snippet += `${latestExp.title} at ${latestExp.company}`;
    }
    
    if (profile.education && profile.education.length > 0) {
      const latestEdu = profile.education[0];
      snippet += ` | Education: ${latestEdu.title}`;
    }
    
    if (profile.city) {
      snippet += ` | Location: ${profile.city}`;
    }
    
    return snippet || 'LinkedIn profile information available';
  }

  private calculateLinkedInRelevance(profile: LinkedInProfile, query: string, index: number): number {
    let score = 1.0 - (index * 0.1);
    const lowerQuery = query.toLowerCase();
    
    // Boost score for name matches
    if (profile.name.toLowerCase().includes(lowerQuery) || 
        lowerQuery.includes(profile.name.toLowerCase())) {
      score += 0.3;
    }
    
    // Boost score for company matches
    if (profile.current_company?.name.toLowerCase().includes(lowerQuery)) {
      score += 0.2;
    }
    
    // Boost score for title matches
    if (profile.current_company?.title.toLowerCase().includes(lowerQuery) ||
        profile.position.toLowerCase().includes(lowerQuery)) {
      score += 0.2;
    }
    
    // Boost score for education matches
    if (profile.education.some(edu => 
        edu.title.toLowerCase().includes(lowerQuery))) {
      score += 0.1;
    }
    
    // Boost score for location matches
    if (profile.city.toLowerCase().includes(lowerQuery)) {
      score += 0.1;
    }
    
    return Math.max(0.1, Math.min(1.0, score));
  }

  private mergeAndRankResults(allResults: WebSearchResult[]): WebSearchResult[] {
    // Remove duplicates based on URL similarity
    const uniqueResults = this.removeDuplicates(allResults);
    
    // Boost relevance scores for IIT Kharagpur-specific sources
    uniqueResults.forEach(result => {
      const urlLower = result.link.toLowerCase();
      const titleLower = result.title.toLowerCase();
      const snippetLower = result.snippet.toLowerCase();
      
      // Highest priority: Official IIT KGP domains and important services
      if (urlLower.includes('iitkgp.ac.in') || 
          urlLower.includes('som.iitkgp.ac.in') ||
          urlLower.includes('cdc.iitkgp.ac.in') ||
          urlLower.includes('library.iitkgp.ac.in') ||
          urlLower.includes('erp.iitkgp.ac.in') ||
          urlLower.includes('gymkhana.iitkgp.ac.in') ||
          urlLower.includes('gateoffice.iitkgp.ac.in')) {
        result.relevance += 0.5;
        this.log(`Boosted IIT KGP official source: ${result.title}`);
      }
      
      // Extra boost for CDC when query is about placements/career
      if (urlLower.includes('cdc.iitkgp.ac.in') && 
          (titleLower.includes('placement') || titleLower.includes('career') || 
           titleLower.includes('job') || titleLower.includes('internship'))) {
        result.relevance += 0.3;
        this.log(`Extra boost for CDC career content: ${result.title}`);
      }
      
      // High priority: IIT KGP community and media sites
      if (urlLower.includes('metakgp.org') || 
          urlLower.includes('kgpchronicle') ||
          urlLower.includes('wiki.metakgp')) {
        result.relevance += 0.3;
      }
      
      // Medium priority: Content mentions IIT Kharagpur
      if (titleLower.includes('iit kharagpur') || titleLower.includes('iitkgp') || 
          snippetLower.includes('iit kharagpur') || snippetLower.includes('iitkgp')) {
        result.relevance += 0.2;
      }
      
      // Penalize non-academic results for academic queries
      if (urlLower.includes('hospital') || urlLower.includes('clinic') || 
          urlLower.includes('doctor') || urlLower.includes('surgeon') ||
          titleLower.includes('doctor') || titleLower.includes('surgeon') ||
          snippetLower.includes('hospital') || snippetLower.includes('medical')) {
        result.relevance -= 0.4;
        this.log(`Penalized non-academic source: ${result.title}`);
      }
    });
    
    // Sort by updated relevance score
    return uniqueResults.sort((a, b) => b.relevance - a.relevance);
  }

  private removeDuplicates(results: WebSearchResult[]): WebSearchResult[] {
    const seen = new Set<string>();
    const unique: WebSearchResult[] = [];
    
    for (const result of results) {
      const normalizedUrl = this.normalizeUrl(result.link);
      if (!seen.has(normalizedUrl)) {
        seen.add(normalizedUrl);
        unique.push(result);
      }
    }
    
    return unique;
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.hostname}${urlObj.pathname}`.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  private calculateRelevance(result: any, index: number): number {
    // Simple relevance scoring based on position and content quality
    let score = 1.0 - (index * 0.1); // Position-based score
    
    // Boost score for results with longer, more descriptive snippets
    if (result.snippet && result.snippet.length > 100) {
      score += 0.1;
    }
    
    // Boost score for results with clear titles
    if (result.title && result.title.length > 20) {
      score += 0.1;
    }
    
    // Boost academic/research results
    if (result.searchEngine === 'Semantic Scholar') {
      score += 0.2;
    }
    
    return Math.max(0.1, Math.min(1.0, score));
  }

  private enhanceQuery(query: string, conversationHistory?: Array<{ role: string; content: string }>): string {
    const lowerQuery = query.toLowerCase();
    let enhancedQuery = query;
    
    // Check if this is a follow-up question (contains pronouns or vague references)
    const isFollowUp = /\b(his|her|their|him|them|this|that|more|details)\b/i.test(query);
    
    if (isFollowUp && conversationHistory && conversationHistory.length > 0) {
      // Extract person/topic from recent conversation
      const recentMessages = conversationHistory.slice(-3);
      
      // Look for professor names or specific topics in recent messages
      for (const msg of recentMessages.reverse()) {
        const content = msg.content;
        
        // Extract professor names (simple pattern matching)
        const profPattern = /(?:Professor|Prof\.?|Dr\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g;
        const nameMatch = profPattern.exec(content);
        
        if (nameMatch && nameMatch[1]) {
          enhancedQuery = `${nameMatch[1]} IIT Kharagpur professor details`;
          this.log(`Detected follow-up query about ${nameMatch[1]}, enhanced to: "${enhancedQuery}"`);
          return enhancedQuery;
        }
        
        // Extract director if mentioned
        if (content.toLowerCase().includes('director')) {
          const directorPattern = /director.*?(?:is|:)?\s+(?:Professor|Prof\.?|Dr\.?)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i;
          const directorMatch = directorPattern.exec(content);
          if (directorMatch && directorMatch[1]) {
            enhancedQuery = `${directorMatch[1]} IIT Kharagpur director professor details`;
            this.log(`Detected follow-up about director ${directorMatch[1]}`);
            return enhancedQuery;
          }
        }
      }
    }
    
    // If query mentions faculty, professor, or specific names, add IIT Kharagpur context
    if (lowerQuery.includes('professor') || lowerQuery.includes('faculty') || 
        lowerQuery.includes('teacher') || lowerQuery.includes('director') ||
        lowerQuery.includes('prof.') || lowerQuery.includes('dr.')) {
      // Check if it already has IIT Kharagpur context
      if (!lowerQuery.includes('iit') && !lowerQuery.includes('kharagpur') && !lowerQuery.includes('kgp')) {
        enhancedQuery = `${query} IIT Kharagpur`;
      }
    }
    
    // If query mentions specific common Indian names, add IIT Kharagpur context
    if (lowerQuery.includes('chakladar') || lowerQuery.includes('chakraborty') || lowerQuery.includes('kumar') || 
        lowerQuery.includes('singh') || lowerQuery.includes('patel') || lowerQuery.includes('sharma') || 
        lowerQuery.includes('verma') || lowerQuery.includes('gupta') || lowerQuery.includes('tewari') || 
        lowerQuery.includes('goyal') || lowerQuery.includes('banerjee') || lowerQuery.includes('chatterjee')) {
      if (!lowerQuery.includes('iit') && !lowerQuery.includes('kharagpur') && !lowerQuery.includes('kgp')) {
        enhancedQuery = `${query} IIT Kharagpur`;
      }
    }
    
    // If query mentions departments, schools, halls, or campus facilities, add IIT Kharagpur context
    if (lowerQuery.includes('department') || lowerQuery.includes('school of') || 
        lowerQuery.includes('vgsom') || lowerQuery.includes('rgsoipl') ||
        lowerQuery.includes('hall') || lowerQuery.includes('mess') || 
        lowerQuery.includes('tsg') || lowerQuery.includes('library') || lowerQuery.includes('campus') ||
        // New schools keywords
        lowerQuery.includes('entrepreneurship school') || lowerQuery.includes('quality school') ||
        lowerQuery.includes('telecommunications school') || lowerQuery.includes('infrastructure school')) {
      if (!lowerQuery.includes('iit') && !lowerQuery.includes('kharagpur') && !lowerQuery.includes('kgp')) {
        enhancedQuery = `${query} IIT Kharagpur`;
      }
    }
    
    // Note: CDC queries are now handled by dedicated searchCDCSite method
    // No need to modify query here as it will be enhanced in searchCDCSite
    
    // Add "official" or "bio" for detail-seeking queries
    if (lowerQuery.includes('details') || lowerQuery.includes('about') || lowerQuery.includes('information')) {
      if (!enhancedQuery.includes('official') && !enhancedQuery.includes('bio')) {
        enhancedQuery = `${enhancedQuery} official`;
      }
    }
    
    return enhancedQuery;
  }

  async isApiKeyValid(): Promise<boolean> {
    try {
      const response = await this.process('test query');
      return !response.error;
    } catch {
      return false;
    }
  }

  getApiKeyStatus(): string {
    const enabledEngines = this.searchEngines.filter(engine => engine.enabled);
    if (enabledEngines.length === 0) {
      return 'missing';
    }
    if (enabledEngines.length === 1 && enabledEngines[0].name === 'duckduckgo') {
      return 'limited';
    }
    return 'present';
  }

  getEnabledEngines(): string[] {
    return this.searchEngines
      .filter(engine => engine.enabled)
      .map(engine => engine.name);
  }
}
