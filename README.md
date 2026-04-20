# CuraLink – AI Medical Research Assistant

CuraLink is a Retrieval-Augmented Generation (RAG) medical research assistant that retrieves evidence from trusted biomedical sources, ranks the most relevant publications and clinical trials, and then generates a grounded answer using an open-source LLM.

The assistant does not answer directly from model memory. Instead, every response is grounded in retrieved medical evidence.

---

## Features

* Multi-source medical retrieval

  * PubMed
  * OpenAlex
  * ClinicalTrials.gov
* Query understanding and follow-up context
* Query expansion using medical synonyms
* Source deduplication
* Custom ranking pipeline
* Grounded answer generation using Groq + Llama 3.1
* Persistent conversation history using MongoDB
* Source cards with real evidence links
* Responsive chat-style UI
* Deployment-ready frontend and backend

---

## Demo Flow

1. User enters:

   * Disease
   * Intent / treatment
   * Optional location
   * Optional follow-up message

2. Backend:

   * Understands the query
   * Expands medical terminology
   * Retrieves candidates from 3 medical sources
   * Deduplicates overlapping results
   * Ranks the best evidence
   * Sends only top-ranked evidence to the LLM

3. Frontend renders:

   * Condition Overview
   * Research Insights
   * Personalized Takeaway
   * Source Publications
   * Clinical Trials
   * Research Details

---

## Tech Stack

### Frontend

* React
* TypeScript
* React Router
* TanStack Query
* Axios
* CSS
* Vite

### Backend

* Node.js
* Express
* MongoDB + Mongoose
* Zod
* Axios
* Groq SDK

### LLM

* Provider: Groq
* Model: llama-3.1-8b-instant

---

## How the RAG Pipeline Works

### 1. Query Understanding

The system first normalizes the user query and detects whether the question is a new request or a follow-up.

Example:

```text
User: What about side effects?
```

If the previous context was:

```text
Disease: Parkinson's disease
Intent: Deep Brain Stimulation
```

Then the system internally transforms the query into:

```text
Side effects of Deep Brain Stimulation for Parkinson's disease
```

---

### 2. Query Expansion

Medical terminology varies across papers.

Example:

```text
Deep Brain Stimulation -> DBS
Parkinson's disease -> Parkinson disease
Lung cancer -> NSCLC / SCLC / lung neoplasm
```

The system generates multiple retrieval queries to improve recall.

---

### 3. Retrieval

The backend retrieves data in parallel from:

* PubMed
* OpenAlex
* ClinicalTrials.gov

Each source is normalized into a common internal structure:

```json
{
  "title": "...",
  "abstract": "...",
  "authors": ["..."],
  "year": 2024,
  "platform": "PubMed",
  "url": "..."
}
```

---

### 4. Deduplication

The same paper may appear in multiple sources.

Deduplication is done using:

1. Clinical trial ID
2. URL
3. Cleaned title

The richer source version is retained.

---

### 5. Ranking

Every source receives a weighted score:

```text
Final Score =
0.50 * relevance
+ 0.15 * recency
+ 0.15 * credibility
+ 0.10 * completeness
+ 0.10 * contextual bonus
```

Where:

* Relevance = disease + intent match
* Recency = newer medical studies rank higher
* Credibility = PubMed and ClinicalTrials.gov prioritized
* Completeness = title + abstract + authors + year + URL
* Context bonus = recruiting trials and location match


---

## LLM Prompting

Only the top-ranked evidence is sent into the model.

The prompt contains:

* User question
* Active disease / intent / location
* Top-ranked source summaries
* Strict grounding rules

The model is instructed to:

* Use only the provided evidence
* Never invent citations, authors, or statistics
* Never diagnose or prescribe
* Explicitly say when evidence is weak
* Return structured JSON only

Example output:

```json
{
  "conditionOverview": "...",
  "researchInsights": ["..."],
  "clinicalTrials": ["..."],
  "personalizedTakeaway": "...",
  "sourceAttribution": ["..."],
  "medicalDisclaimer": "..."
}
```

If the LLM fails or returns invalid JSON, the backend falls back to a safe structured response generated directly from the ranked sources.

---

## Environment Variables

### Backend

Create a `.env` file inside the backend directory:

```env
PORT=5001
MONGO_URI=your_mongodb_atlas_uri
CLIENT_ORIGIN=http://localhost:5173

LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
```

### Frontend

Create a `.env` file inside the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:5001
```

---

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

Runs on:

```text
http://localhost:5001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on:

```text
http://localhost:5173
```

---

## API Endpoints

### Create Chat Turn

```text
POST /api/chat
```

Request:

```json
{
  "conversationId": null,
  "message": "What does the research say about finasteride for male pattern baldness?",
  "structuredContext": {
    "disease": "male pattern baldness",
    "intent": "finasteride treatment",
    "location": "New York"
  }
}
```

---

### Get All Sessions

```text
GET /api/chat/sessions
```

---

### Get Session By ID

```text
GET /api/chat/sessions/:id
```

---

### Full Health Check

```text
GET /api/health/full
```

Response:

```json
{
  "status": "ok",
  "mongoConnected": true,
  "groqConfigured": true,
  "llmProvider": "groq",
  "model": "llama-3.1-8b-instant"
}
```

---

## Future Improvements

* Authentication and user accounts
* Streaming LLM responses
* Semantic retrieval using embeddings
* Vector database support
* Better reranking models
* Journal impact factor and citation weighting
* Medical safety checks
* More personalized clinical trial matching

---

## Example Questions

```text
What does the research say about finasteride and minoxidil for male pattern baldness?
```

Follow-up:

```text
What about side effects and long-term results?
```

```text
What does the research say about GLP-1 medications for Type 2 Diabetes and weight loss?
```

Follow-up:

```text
Are there any newer clinical trials available in India?
```

---

## Author

Rahul

Built as part of an AI Medical Research Assistant assessment using a full Retrieval-Augmented Generation pipeline.
