# Torqen

[![Bun](https://img.shields.io/badge/runtime-bun-black)](https://bun.sh/)
[![Elysia](https://img.shields.io/badge/backend-elysiajs-0b1020)](https://elysiajs.com/)
[![React](https://img.shields.io/badge/frontend-react-20232a)](https://react.dev/)
[![Drizzle](https://img.shields.io/badge/orm-drizzle-0c0c0c)](https://orm.drizzle.team/)
[![SQLite](https://img.shields.io/badge/database-sqlite-07405e)](https://www.sqlite.org/)

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

> [!WARNING]
> If you do not have Pterodactyl configured, registration may fail depending on how the integration is used.

## Maintainers

| Maintainer |
|-----------|
| <a href="https://github.com/Masondeguy"><img src="https://github.com/Masondeguy.png?size=60" width="60" height="60" alt="Masondeguy" /><br /><sub><b>@Masondeguy</b></sub></a> |
