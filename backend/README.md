# CuraLink Backend

Node.js + Express backend for the CuraLink AI Medical Research Assistant.

## Tech Stack

- Node.js JavaScript ES modules
- Express
- MongoDB Atlas with Mongoose for medical research conversations
- JWT access token + refresh token auth flow
- Zod request validation

## Features

- User registration, login, refresh, and logout
- MongoDB-backed research sessions and chat messages
- Query understanding and query expansion
- Retrieval from OpenAlex, PubMed, and ClinicalTrials.gov
- Deduplication and deterministic ranking
- Retrieval metadata returned to the frontend
- Centralized error handling

## Project Structure

```text
src/
  config/
  controllers/
  middlewares/
  models/
  routes/
  services/
    chat/
    query/
    ranking/
    retrieval/
  utils/
```

## Environment Variables

Create a `.env` file in `backend/` using `.env.example`.

```env
NODE_ENV=development
PORT=5001
CLIENT_URL=http://localhost:5173
MONGO_URI="mongodb+srv://<user>:<password>@<cluster>/medical_research_assistant?retryWrites=true&w=majority"
```

## Run Locally

```bash
npm install
npm run dev
```

Production-style local run:

```bash
npm run build
npm run start
```

## API Endpoints

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Research assistant:

- `POST /api/chat`
- `GET /api/chat/sessions`
- `GET /api/chat/sessions/:id`

Health:

- `GET /api/health`
- `GET /api/health/db`

## Retrieval Sources

- OpenAlex: publications
- PubMed E-utilities: publications
- ClinicalTrials.gov API v2: clinical trials

The backend fetches a broad candidate pool, deduplicates sources, ranks them by relevance, recency, credibility, completeness, and context fit, then returns the top ranked sources with retrieval stats.
