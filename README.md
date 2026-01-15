# Torqen

Torqen is a Bun-powered dashboard and API with a React (Vite) client and a SQLite database managed via Drizzle.

> [!NOTE]
> This project is under active development and the API and UI are subject to change.

> [!IMPORTANT]
> Cookie auth requires `TORQEN_JWT_SECRET` to be set in your `.env`.


## Requirements

- Bun (recommended)
- Node.js + npm (for the client)

## Repository Structure

- `server/` Backend (Bun + Elysia)
- `server/db/` SQLite + Drizzle schema/migrations
- `client/` Frontend (React + Vite)

## Quick Start (Production)

This section describes the recommended setup for running Torqen in production.

### 1) Install dependencies

```bash
bun install
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

### 4) Build the client

```bash
npm --prefix client run build
```

### 5) Start the server

```bash
bun run start:server
```

## Development Setup

### 1) Install dependencies

```bash
bun install
npm --prefix client install
```

### 2) Configure environment

```bash
cp .env_example .env
```

### 3) Run database migrations

```bash
bun run db:migrate
```

### 4) Run the server (watch mode)

```bash
bun run dev:server
```

### 5) Run the client (Vite dev server)

```bash
bun run dev:client
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

```bash
bun run cli:users
bun run cli:sessions
bun run cli:user-delete -- <userId>
bun run cli:status
bun run cli:reset
bun run cli:nests
bun run cli:nests -- --full
bun run cli:locations
bun run cli:default-resources
bun run cli:servers
```

### Commands

- `cli:users` List users.
- `cli:sessions` List sessions (active/expired).
- `cli:user-delete -- <userId>` Delete a user and their sessions.
- `cli:status` Print DB + HTTP health checks.
- `cli:reset` Drop all tables and re-run migrations (destructive).
- `cli:nests` List imported nests and eggs.
- `cli:nests -- --full` Include full parsed egg env vars per egg.
- `cli:locations` List imported locations and nodes.
- `cli:default-resources` Show server default resource configuration.
- `cli:servers` List servers.

## Development Notes

- The client API is mounted under `/api/v1/client`.

> [!WARNING]
> If you do not have Pterodactyl configured, registration may fail depending on how the integration is used.

## Maintainers

| Maintainer |
|-----------|
| <a href="https://github.com/Masondeguy"><img src="https://github.com/Masondeguy.png?size=60" width="60" height="60" alt="Masondeguy" /><br /><sub><b>@Masondeguy</b></sub></a> |
