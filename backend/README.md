# Task Manager Backend

Backend API for the task management assessment.

## Tech stack

- Node.js
- Express
- TypeScript
- Prisma ORM v7
- PostgreSQL
- JWT authentication

## Features

- User registration, login, refresh, and logout
- Password hashing with bcrypt
- Access token + refresh token authentication flow
- User-scoped task CRUD
- Task pagination, filtering by status, and title search
- Request validation with Zod
- Centralized error handling

## Project structure

```text
src/
  config/
  controllers/
  middlewares/
  routes/
  services/
  types/
  utils/
prisma/
  migrations/
  schema.prisma
```

## Environment variables

Create a `.env` file in `backend/` using `.env.example`.

Required values:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/task_manager?schema=public"
JWT_ACCESS_SECRET=replace-with-a-long-random-string
JWT_REFRESH_SECRET=replace-with-a-different-long-random-string
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## Install dependencies

```bash
npm install
```

## Prisma setup

Generate the Prisma client:

```bash
npm run prisma:generate
```

Apply the migration to your local database:

```bash
npm run prisma:deploy
```

If you prefer creating migrations locally during development:

```bash
npm run prisma:migrate -- --name init
```

## Run the backend

Development:

```bash
npm run dev
```

Production-style local run:

```bash
npm run build
npm run start
```

## API endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### Tasks

- `GET /tasks`
- `POST /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`
- `PATCH /tasks/:id/toggle`

## Example task query params

```text
GET /tasks?page=1&limit=10&status=PENDING&search=report
```

## Notes

- Refresh token is stored in an `httpOnly` cookie.
- Protected task routes require `Authorization: Bearer <access-token>`.
- All task operations are restricted to the authenticated user.
