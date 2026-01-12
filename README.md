# Torqen

Torqen is a Bun-powered dashboard and API with a React (Vite) client and a SQLite database managed via Drizzle.

## Requirements

- Bun (recommended)
- Node.js + npm (for the client)

## Repository Structure

- `server/` Backend (Bun + Elysia)
- `server/db/` SQLite + Drizzle schema/migrations
- `client/` Frontend (React + Vite)

## Quick Start

### 1) Install dependencies

Backend dependencies:

```bash
bun install
```

Client dependencies:

```bash
npm --prefix client install
```

### 2) Configure environment

Copy the example env file and fill in the required values:

```bash
cp .env_example .env
```

Required variables:

- `TORQEN_DB_PATH` Path to the SQLite database file
- `TORQEN_JWT_SECRET` Secret used to sign/verify session JWTs

Optional variables:

- `APP_KEY` Reserved for future functionality
- `PTERODACTYL_PANEL_URL`, `PTERODACTYL_APPLICATION_KEY`, `PTERODACTYL_CLIENT_API_KEY` (if using Pterodactyl integration)

### 3) Run database migrations

```bash
bun run db:migrate
```

### 4) Start the server

```bash
bun run start:server
```

### 5) Start the client

```bash
npm --prefix client run dev
```

## Authentication

The web dashboard uses cookie-based authentication backed by:

- A `sessions` table in SQLite
- A JWT stored in the `torqen_session` cookie containing a session id (`sid`)

The backend supports reading auth from either:

- Cookie (`torqen_session`) for browser sessions
- `Authorization: Bearer <jwt>` for programmatic access

## CLI

The repository includes a small CLI for local administration.

### List users

```bash
bun run cli:users
```

### List sessions (active/expired)

```bash
bun run cli:sessions
```

## Development Notes

- The client API is mounted under `/api/v1/client`.
- If you do not have Pterodactyl configured, registration may fail depending on how the integration is used.

## Maintainers

| Name | GitHub |
|------|--------|
| Mason | https://github.com/Masondeguy |
