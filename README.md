# Innovatech Server

Backend API for the **Innovatech** Over The Air Content Updates Platform — a digital system that delivers structured courses, interactive lessons, and practice assessments to students desktop applications.

## Project Intent

Innovatech Desktop app is built for students in local and underserved communities with limited access to the internet. The platform enables administrators to:

- **Curate educational content** — Create and manage courses with multimedia lessons (video, text, summaries).
- **Assess student understanding** — Build practice quizzes with multiple-choice questions and detailed explanations.
- **Manage user registrations** — Track students and their guardian contact information.
- **Deliver application updates** — Manage versioned releases of the desktop app with bundled AI model metadata via deployable manifests.

The server acts as the central hub for the Innovatech mobile app, providing RESTful APIs for content delivery, user management, and over-the-air application updates.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (Bun compatible) |
| Framework | Hono 4.x |
| ORM | Prisma 7.x + PostgreSQL |
| Auth | JWT (HS256 via jose) + bcryptjs |
| Validation | Zod 4.x |
| Rate Limiting | hono-rate-limiter |

## Getting Started

```sh
bun install
bun run db       # Run migrations + generate Prisma client
bun run dev      # Start dev server at http://localhost:9999
```

See [Documentation.md](./Documentation.md) for the complete API reference.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `APP_SECRET` | No | `abc123xyz` | JWT signing secret |
| `PORT` | No | `9999` | Server port |
| `FRONTEND_URL` | No | — | Allowed CORS origin |
| `NODE_ENV` | No | — | Set to `production` to disable debug logging |

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with hot-reload |
| `bun run build` | Compile TypeScript to `dist/` |
| `bun run start` | Run migrations, then start compiled server |
| `bun run db` | Run migration, generate client, push schema |
