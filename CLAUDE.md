# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This is a training exercise repository focused on **E2E testing with Cypress** for the LTI Talent Tracking System. The goal is to write Cypress E2E tests for the `PositionDetails` interface — specifically testing page load and drag-and-drop candidate stage changes.

Reference docs in `documentacion/`:
- `ejercicio.md` — exercise requirements and delivery instructions
- `bdd.md` — BDD methodology reference
- `test_ai.md` — AI-assisted testing reference
- `basic_data.md` — seed data / test data reference

## Commands

### Start the full stack (required before Cypress tests)
```bash
# 1. Start database
docker-compose up -d

# 2. Start backend (http://localhost:3010)
cd backend && npm run dev

# 3. Start frontend (http://localhost:3000)
cd frontend && npm start
```

### Cypress
```bash
# Install (if not yet done)
cd frontend && npm install cypress --save-dev

# Open interactive test runner
npx cypress open

# Run headless
npx cypress run

# Run a specific spec
npx cypress run --spec "cypress/integration/position.spec.js"
```

### Backend
```bash
cd backend
npm run dev          # dev server with auto-reload
npm run build        # compile TypeScript to dist/
npm test             # Jest unit tests
npm run lint         # ESLint

# Database
npx prisma generate
npx prisma migrate dev
ts-node prisma/seed.ts
```

### Frontend
```bash
cd frontend
npm start            # dev server (http://localhost:3000)
npm run build        # production build
npm test             # Jest unit tests
```

## Architecture

### Backend (`backend/src/`)

Follows Domain-Driven Design with four layers:

- **`domain/models/`** — Business entities: `Candidate`, `Position`, `Interview`, `InterviewFlow`, `InterviewStep`, `Application`
- **`application/services/`** — Orchestration: `candidateService.ts` (`addCandidate`, `findCandidateById`, `updateCandidateStage`), `positionService.ts`, `validator.ts`
- **`presentation/controllers/`** — HTTP handlers that validate IDs, call services, return status codes
- **`routes/`** — Express route definitions mapping to controllers
- **`index.ts`** — Express entry point; initializes Prisma, configures CORS (localhost:3000), listens on port 3010

Key API endpoints relevant to Cypress tests:
- `GET /positions/:id/interviewFlow` — returns position name and ordered interview steps
- `GET /positions/:id/candidates` — returns candidates with `currentInterviewStep`, `fullName`, `averageScore`, `applicationId`
- `PUT /candidates/:id` — updates `{ applicationId, currentInterviewStep }` (stage change)

### Frontend (`frontend/src/`)

- **`App.js`** — React Router setup
- **`components/PositionDetails.js`** — Main target for Cypress tests: fetches interview flow and candidates, renders `StageColumn` components inside a `DragDropContext` (`react-beautiful-dnd`), calls `PUT /candidates/:id` on drag end
- **`components/StageColumn.js`** — Renders a `Droppable` column with `droppableId={index}` (numeric string) and `Card.Header` showing stage title
- **`components/CandidateCard.js`** — Individual draggable candidate card
- **`services/candidateService.js`** — axios helpers for CV upload and candidate creation

### Database
Prisma schema at `backend/prisma/schema.prisma`. Core entities: `Candidate`, `Position`, `InterviewFlow`, `InterviewStep`, `Application`, `Interview`.

## Cypress Test Structure

Exercise requires creating `cypress/integration/position.spec.js` covering:

1. **Page load**: position title visible, stage columns rendered, candidate cards in correct columns
2. **Drag-and-drop**: simulate card drag between columns, verify card moves to destination column, verify `PUT /candidates/:id` called with correct payload

### Drag-and-drop caveat
`react-beautiful-dnd` does not work with Cypress's built-in `.drag()` — use pointer event simulation or a custom Cypress drag command. Intercept the backend call with `cy.intercept('PUT', '/candidates/*')` to verify the API call without needing a live database.

## Environment

`.env` at root and `backend/.env` should contain:
```
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<dbname>"
```

Values are in the `.env` files already committed (development only). Docker Compose reads the root `.env` to start PostgreSQL.
