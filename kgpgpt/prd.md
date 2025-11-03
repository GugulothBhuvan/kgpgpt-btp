# Product Requirements Document (PRD) – Multi-Agent RAG Chatbot

## 1. Overview
We are building a **multi-agent Retrieval-Augmented Generation (RAG) chatbot prototype** powered by **Gemini LLM**. The chatbot will:
- Retrieve information from a local knowledge base (via Qdrant vector DB).
- Perform **internet search augmentation** using **Serper API**.
- Use a **multi-agent framework** to split responsibilities (retrieval, reasoning, summarization).
- Provide a **front-end prototype** (React/Next.js) with API route integration, no backend for now.

This document defines the architecture, workflows, UI specifications, and agent responsibilities.

---

## 2. Goals
- Deliver a **low-latency, high-accuracy chatbot** prototype.
- Implement **multi-agent orchestration** for modularity and future scalability.
- Enable **hybrid retrieval** (local + internet search).
- Provide a **simple, intuitive frontend UI** for user interaction.

---

## 3. System Architecture

### Components
1. **Frontend (React/Next.js)**
   - Chat UI with message history.
   - Input box with optional advanced search toggle.
   - API routes to handle requests (acts as thin backend).

2. **Agents (Multi-Agent Framework)**
   - **Query Understanding Agent (Q-UA)**: Refines user query, decides retrieval strategy.
   - **Retriever Agent (R-A)**: Fetches relevant documents from Qdrant DB.
   - **Web Search Agent (WS-A)**: Calls Serper API for internet search results.
   - **Reasoning Agent (RS-A)**: Synthesizes retrieved docs + search results.
   - **Summarizer Agent (SM-A)**: Generates final user-friendly response.

3. **Knowledge Base (Vector Store)**
   - **Qdrant** for document embeddings storage and retrieval.
   - Embeddings generated using **Gemini-compatible embedding model**.

4. **External APIs**
   - **Gemini LLM API** (text generation + embeddings).
   - **Serper API** (real-time internet search).

### Data Flow
1. User enters query in frontend.
2. Query sent to **Query Understanding Agent**.
3. Depending on query, agents trigger:
   - Local retrieval (Qdrant)
   - Web search (Serper)
   - Or both.
4. Retrieved content + search results passed to **Reasoning Agent**.
5. **Summarizer Agent** generates final response using Gemini LLM.
6. Response displayed in frontend chat UI.

---

## 4. Multi-Agent Roles & Responsibilities

### 4.1 Query Understanding Agent (Q-UA)
- Role: Interpret user intent, classify query (local vs internet vs hybrid).
- Responsibilities:
  - Parse input.
  - Route query to Retriever or Web Search Agent.

### 4.2 Retriever Agent (R-A)
- Role: Handle local retrieval from knowledge base.
- Responsibilities:
  - Convert query → embeddings (Gemini embeddings).
  - Search Qdrant DB.
  - Return top-N relevant documents.

### 4.3 Web Search Agent (WS-A)
- Role: Augment responses with live internet search.
- Responsibilities:
  - Call **Serper API** with query.
  - Extract relevant snippets.
  - Pass structured results to Reasoning Agent.

### 4.4 Reasoning Agent (RS-A)
- Role: Combine retrieved knowledge + search results.
- Responsibilities:
  - Rank and filter conflicting sources.
  - Ensure factual accuracy.
  - Generate context-rich structured input for Summarizer Agent.

### 4.5 Summarizer Agent (SM-A)
- Role: Generate final user-facing response.
- Responsibilities:
  - Use Gemini LLM to draft final answer.
  - Ensure clarity, conciseness, and context preservation.

---

## 5. Frontend Specifications

### 5.1 UI Components
- **Chat Window**: Displays conversation history.
- **Input Box**: User types query (multi-line support).
- **Send Button**: Triggers query submission.
- **Advanced Search Toggle**: Option to enable/disable web search.
- **Response Bubbles**: Differentiated styling for user vs AI.
- **Loading Indicator**: While agents process query.

### 5.2 UX Considerations
- Minimalist design, focus on usability.
- Smooth transitions and typing indicator for realism.
- Error messages for failed API calls.

---

## 6. API Route Integration

Since no backend is deployed, API routes in Next.js will handle requests:

- **`/api/query`**
  - Input: `{ query: string, enableWebSearch: boolean }`
  - Process: Calls multi-agent pipeline.
  - Output: `{ response: string, sources: [ {type, content, url?} ] }`

- **`/api/health`**
  - Health check route for system debugging.

---

## 7. Technical Requirements
- **Language Model**: Gemini LLM API (generation + embeddings).
- **Vector DB**: Qdrant (self-hosted or managed, local for prototype).
- **Search API**: Serper API.
- **Frontend**: React + Next.js.
- **Framework**: Local prototype, no backend infra yet.

---

## 8. Success Metrics
- <2s latency for local retrieval queries.
- <4s latency for hybrid (web search + retrieval).
- >80% accuracy in relevance (measured via test queries).
- Positive user feedback on UI simplicity.

---

## 9. Future Enhancements
- Backend integration for scalability.
- Agent memory and personalization.
- Fine-tuned domain-specific embeddings.
- Multi-modal support (images, PDFs).

---

**End of Document**

