# Full Stack Task Management System

A full stack task management application built for a job assessment.

## Stack

- Frontend: React, TypeScript, Vite, React Query
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- ORM: Prisma ORM v7
- Auth: JWT access token + refresh token

## Features

- User registration, login, refresh, and logout
- Secure password hashing with bcrypt
- Protected task CRUD endpoints
- Task search by title
- Task filtering by status
- Task pagination
- Responsive dashboard UI
- Toast notifications for user actions

## Project Structure

```text
backend/   Express + Prisma API
frontend/  React + Vite client
```

## Local Setup

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

Backend env file:

```env
NODE_ENV=development
PORT=5001
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/task_manager?schema=public"
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend env file:

```env
VITE_API_URL=http://localhost:5001
```

## Deployment Recommendation

- Frontend: Vercel
- Backend: Render or Railway
- Database: PostgreSQL from Neon, Railway, Supabase, or Render

## Notes

- `.env.example` files are included intentionally for setup guidance.
- Local `.env` files and build output should not be committed.
