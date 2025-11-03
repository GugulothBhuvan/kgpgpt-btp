# 🤖 KGPGPT Multi-Agent Architecture

## System Overview

KGPGPT is a sophisticated multi-agent RAG (Retrieval-Augmented Generation) system designed specifically for IIT Kharagpur, utilizing 6 specialized AI agents working in concert to deliver accurate, context-aware responses.

---

## 🎯 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USER INTERFACE                                │
│                    (React + Next.js 14 + Tailwind CSS)                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ User Query
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       ORCHESTRATOR AGENT                                 │
│  • Coordinates all agents                                               │
│  • Manages pipeline flow                                                │
│  • Decides agent execution order                                        │
└──┬──────────────────────────────────────────────────────────────────┬───┘
   │                                                                   │
   │ Step 1: Analyze Query                                           │
   ▼                                                                   │
┌─────────────────────────────────┐                                   │
│  QUERY UNDERSTANDING AGENT      │                                   │
│  • Analyzes user intent         │                                   │
│  • Determines query type        │                                   │
│  • Confidence scoring           │                                   │
│  • Routing decision             │                                   │
└──────────┬──────────────────────┘                                   │
           │                                                           │
           │ Query Analysis                                           │
           ▼                                                           │
     ┌────────────┐                                                   │
     │  Simple?   │                                                   │
     └─────┬──────┘                                                   │
           │                                                           │
     ┌─────┴─────┐                                                    │
     │           │                                                    │
    Yes         No                                                    │
     │           │                                                    │
     │           │ Step 2: Retrieve Context                          │
     │           ▼                                                    │
     │    ┌────────────────────────────────────┐                     │
     │    │  RETRIEVER AGENT (R-A)             │                     │
     │    │  • Searches Qdrant vector DB       │                     │
     │    │  • 197,373 knowledge chunks        │                     │
     │    │  • Semantic similarity search      │                     │
     │    │  • Returns top-k results           │                     │
     │    └──────────┬─────────────────────────┘                     │
     │               │                                                │
     │               │ Knowledge Base Results                         │
     │               ▼                                                │
     │    ┌────────────────────────────────────┐                     │
     │    │  WEB SEARCH AGENT (Optional)       │                     │
     │    │  • Multi-engine search             │                     │
     │    │  • Serper, Bing, DuckDuckGo        │                     │
     │    │  • IIT KGP site-specific search    │                     │
     │    │  • Fact verification               │                     │
     │    └──────────┬─────────────────────────┘                     │
     │               │                                                │
     │               │ Web Search Results                             │
     │               ▼                                                │
     │    ┌────────────────────────────────────┐                     │
     │    │  REASONING AGENT                   │                     │
     │    │  • Analyzes all contexts           │                     │
     │    │  • Identifies patterns             │                     │
     │    │  • Makes logical connections       │                     │
     │    │  • Generates insights              │                     │
     │    └──────────┬─────────────────────────┘                     │
     │               │                                                │
     │               │ Reasoning + Analysis                           │
     │               ▼                                                │
     │    ┌────────────────────────────────────┐                     │
     │    │  SUMMARIZER AGENT                  │                     │
     │    │  • Google Gemini Pro LLM           │                     │
     │    │  • Context-aware response          │                     │
     │    │  • Conversation memory             │                     │
     │    │  • IIT KGP specific tone           │                     │
     │    └──────────┬─────────────────────────┘                     │
     │               │                                                │
     └───────────────┼────────────────────────────────────────────────┘
                     │
                     │ Final Response
                     ▼
              ┌──────────────────┐
              │  SIMPLE RESPONSE  │
              │     AGENT         │
              │  • Greetings      │
              │  • Small talk     │
              │  • Quick replies  │
              └──────────┬────────┘
                         │
                         │ Response
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                                   │
│                    Display Response with Sources                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Detailed Agent Flow

### 1️⃣ Query Understanding Agent

**Purpose**: Analyzes and classifies user queries

**Input**: 
- Raw user query
- Conversation history

**Processing**:
```javascript
{
  intent: "information_query" | "greeting" | "clarification",
  confidence: 0.0 - 1.0,
  queryType: "factual" | "opinion" | "procedural",
  requiresFullPipeline: boolean,
  reasoning: "Why this classification"
}
```

**Output**: Query analysis object

**Decision Logic**:
- Simple queries (greetings) → Simple Response Agent
- Complex queries → Full pipeline (Retriever → Reasoning → Summarizer)

---

### 2️⃣ Retriever Agent (R-A)

**Purpose**: Fetches relevant information from knowledge base

**Technology**:
- Qdrant Vector Database
- 768-dimensional embeddings
- Cosine similarity search

**Data Sources**:
- 197,373 text chunks
- IIT KGP official documents
- MetaKGP wiki data
- Course materials

**Process**:
```
Query → Embedding → Vector Search → Top-K Results → Context
```

**Output**:
```javascript
{
  results: [
    {
      content: "Retrieved text...",
      metadata: { source, confidence },
      score: 0.95
    }
  ],
  totalRetrieved: 5,
  avgScore: 0.87
}
```

---

### 3️⃣ Web Search Agent

**Purpose**: Supplements KB with real-time web data

**Search Engines**:
- Serper (Google Search API)
- Bing Search API
- DuckDuckGo
- Semantic Scholar (academic)
- Tavily AI Search

**Smart Features**:
- IIT KGP site-specific search (`site:iitkgp.ac.in`)
- Query enhancement with context
- Result ranking and filtering
- Professor/faculty detection
- Conversation-aware follow-ups

**Process**:
```
Query → Enhance → Multi-Engine Search → Filter → Rank → Results
```

**Output**:
```javascript
{
  results: [
    {
      title: "Page Title",
      link: "URL",
      snippet: "Preview text",
      relevance: 0.92
    }
  ],
  sources: ["iitkgp.ac.in", "metakgp.org"]
}
```

---

### 4️⃣ Reasoning Agent

**Purpose**: Analyzes and synthesizes information

**Functions**:
- Pattern recognition
- Context integration
- Logical inference
- Gap identification
- Confidence assessment

**Input**: 
- KB retrieval results
- Web search results
- Conversation history

**Output**:
```javascript
{
  analysis: "Detailed reasoning...",
  keyPoints: ["Point 1", "Point 2"],
  confidence: 0.85,
  gaps: ["Missing info"],
  recommendations: ["Suggest checking..."]
}
```

---

### 5️⃣ Summarizer Agent

**Purpose**: Generates final user-facing response

**Technology**: Google Gemini Pro LLM

**Capabilities**:
- Context-aware generation
- Conversation memory (10 messages)
- IIT KGP-specific tone
- Source attribution
- Follow-up suggestions

**Prompt Engineering**:
- Role: "Friendly IIT KGP senior student"
- Style: Conversational, helpful, concise
- Memory: Maintains context across turns
- Personalization: IIT KGP culture and terminology

**Output**:
```javascript
{
  response: "Natural language answer",
  confidence: 0.88,
  sources: [{ title, url }],
  metadata: {
    tokensUsed: 450,
    generationTime: 1200
  }
}
```

---

### 6️⃣ Simple Response Agent

**Purpose**: Handles simple queries without full pipeline

**Use Cases**:
- Greetings: "Hello", "Hi"
- Small talk: "How are you?"
- Basic help: "What can you do?"

**Benefits**:
- Faster response time
- Lower API costs
- Better UX for simple interactions

---

## 🔄 Complete Request Flow

### Example: "Who is the director of IIT Kharagpur?"

```
Step 1: USER QUERY
├─ Input: "Who is the director of IIT Kharagpur?"
└─ Timestamp: 2025-10-25T12:00:00Z

Step 2: ORCHESTRATOR AGENT
├─ Receives query
├─ Loads conversation history
└─ Routes to Query Understanding Agent

Step 3: QUERY UNDERSTANDING AGENT
├─ Analyzes intent: "information_query"
├─ Query type: "factual"
├─ Confidence: 0.95
├─ Decision: Requires full pipeline
└─ Output: Query analysis

Step 4: RETRIEVER AGENT
├─ Converts query to embedding
├─ Searches Qdrant (197,373 chunks)
├─ Returns top 5 results
├─ Result 1: "Prof. V K Tewari is the director..." (score: 0.92)
└─ Total time: 120ms

Step 5: WEB SEARCH AGENT (if enabled)
├─ Enhances query: "IIT Kharagpur director 2025"
├─ Site-specific search: site:iitkgp.ac.in
├─ Multi-engine search (Serper, Bing)
├─ Filters & ranks results
├─ Top result: iitkgp.ac.in/director
└─ Total time: 800ms

Step 6: REASONING AGENT
├─ Analyzes KB results
├─ Analyzes web results
├─ Identifies: Prof. V K Tewari
├─ Confidence: 0.90
├─ Reasoning: "Multiple sources confirm..."
└─ Total time: 50ms

Step 7: SUMMARIZER AGENT
├─ Receives all context
├─ Loads conversation history
├─ Generates response with Gemini Pro
├─ Response: "The current director of IIT Kharagpur is 
│   Professor V K Tewari. He has been serving since..."
├─ Adds sources
└─ Total time: 1500ms

Step 8: RESPONSE DELIVERY
├─ Total processing: 2470ms
├─ Confidence: 0.90
├─ Sources: 3 (KB + Web)
└─ Display to user
```

---

## 🏗️ Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context API
- **Auth**: Supabase Auth

### Backend
- **Runtime**: Node.js (Edge Runtime)
- **API**: Next.js API Routes
- **Agent Framework**: Custom TypeScript classes
- **LLM**: Google Gemini Pro

### Data Layer
- **Vector DB**: Qdrant (197K+ chunks)
- **Relational DB**: Supabase PostgreSQL
- **Embeddings**: 768-dimensional vectors
- **Search**: Multi-engine (Serper, Bing, etc.)

### Infrastructure
- **Deployment**: Vercel / Self-hosted
- **Container**: Docker (Qdrant)
- **Environment**: Node.js 18+

---

## 📈 Performance Metrics

| Metric | Value |
|--------|-------|
| **Knowledge Base Size** | 197,373 chunks |
| **Vector Dimensions** | 768 |
| **Average Query Time** | 2-4 seconds |
| **Retrieval Time** | 100-200ms |
| **LLM Generation Time** | 1-2 seconds |
| **Conversation Memory** | Last 10 messages |
| **Search Engines** | 6 (multi-engine) |
| **Concurrent Users** | Scalable |

---

## 🎨 Agent Collaboration Example

### Query: "Tell me more about his research"

**Challenge**: Vague pronoun reference

**Solution**: Multi-agent coordination

```
1. Query Understanding Agent
   ├─ Detects: Follow-up question
   └─ Flag: Requires conversation context

2. Orchestrator Agent
   ├─ Loads conversation history
   ├─ Previous: "Who is Prof. V K Tewari?"
   └─ Context: User asking about Tewari's research

3. Web Search Agent
   ├─ Enhances query: "Prof V K Tewari IIT Kharagpur research"
   ├─ Adds context from history
   └─ Searches: site:iitkgp.ac.in research publications

4. Summarizer Agent
   ├─ Uses conversation memory
   ├─ References previous answer
   └─ Response: "Prof. V K Tewari's research focuses on..."
```

**Result**: Context-aware, coherent response

---

## 🔐 Security & Privacy

- **Authentication**: Supabase Row Level Security (RLS)
- **Data Isolation**: User-specific conversations
- **API Keys**: Encrypted environment variables
- **Rate Limiting**: Query throttling
- **Input Validation**: Sanitized queries

---

## 🚀 Key Innovations

1. **Multi-Agent Orchestration**
   - Dynamic routing based on query complexity
   - Parallel processing where possible
   - Fallback mechanisms

2. **Conversation Memory**
   - Maintains context across turns
   - Handles pronouns and follow-ups
   - 10-message sliding window

3. **Hybrid RAG**
   - Local KB + Real-time web search
   - Best of both worlds
   - Fact verification

4. **IIT KGP Specialization**
   - Domain-specific knowledge base
   - Campus-aware responses
   - Student-friendly tone

5. **Smart Query Enhancement**
   - Automatic query improvement
   - Context injection
   - IIT KGP keyword addition

---

## 📚 Knowledge Base Coverage

- **Academic**: Courses, exams, curriculum, departments
- **Campus Life**: Hostels, mess, halls, facilities
- **Events**: Kshitij, Spring Fest, cultural events
- **Administration**: Faculty, staff, policies
- **Research**: Labs, projects, publications
- **Resources**: Library, labs, equipment

---

## 🎯 Use Cases

1. **New Students**: Campus navigation, hostel info
2. **Current Students**: Course details, exam schedules
3. **Faculty**: Department information, resources
4. **Visitors**: Campus tour, event information
5. **Alumni**: Reconnecting with campus updates

---

## 🔮 Future Enhancements

- [ ] Voice input/output (Deepgram integration)
- [ ] Image understanding (campus photos)
- [ ] Personalized recommendations
- [ ] Multi-language support (Hindi, Bengali)
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Feedback loop for continuous improvement

---

## 📊 Architecture Benefits

✅ **Modularity**: Each agent is independent and testable
✅ **Scalability**: Horizontal scaling of agents
✅ **Flexibility**: Easy to add/remove agents
✅ **Reliability**: Fallback mechanisms at each step
✅ **Maintainability**: Clear separation of concerns
✅ **Performance**: Parallel processing where possible
✅ **Accuracy**: Multi-source verification

---

## 🎓 Academic Impact

This multi-agent architecture demonstrates:
- **AI/ML**: RAG, vector search, LLMs
- **Software Engineering**: Microservices, clean architecture
- **Data Science**: Embeddings, similarity search
- **Systems Design**: Distributed systems, orchestration
- **UX Design**: Conversation design, context management

---

*Built with ❤️ for IIT Kharagpur Community*

**Technologies**: Next.js 14 | React 18 | TypeScript | Qdrant | Gemini Pro | Supabase | Tailwind CSS

**Version**: 1.0.0  
**Last Updated**: October 2025

