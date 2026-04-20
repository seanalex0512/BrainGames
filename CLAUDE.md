# CLAUDE.md

Project guidance for Claude Code when working on BrainGames.

## Project Overview

BrainGames is a Kahoot-inspired interactive quiz web app. See `README.md` for the full feature spec, phased roadmap, and design guidelines.

## Tech Stack

- **Frontend**: React 18+ with TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand
- **Backend**: Node.js / Express with TypeScript
- **Real-time**: Socket.IO (Phase 2)
- **Database**: SQLite via better-sqlite3
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Package Manager**: npm

## Project Structure

```
BrainGames/
├── client/          # React frontend (Vite)
├── server/          # Express backend
├── shared/          # Shared TypeScript types
├── CLAUDE.md        # This file
└── README.md        # Feature spec and roadmap
```

## Development Commands

```bash
# Install all dependencies
npm install

# Start dev (client + server concurrently)
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Test
npm run test

# E2E tests
npm run test:e2e
```

## Architecture Decisions

- **Monorepo with npm workspaces**: `client/`, `server/`, `shared/` are npm workspaces
- **Immutable state**: All state updates return new objects, never mutate
- **Feature-based organization**: Components grouped by feature (`quiz/`, `game/`, `ui/`)
- **Repository pattern**: Data access behind interfaces for testability
- **Consistent API envelope**: `{ success, data, error, meta }` for all responses

## Agent Usage

Use these agents proactively — do not wait for the user to ask:

| Trigger | Agent | Why |
|---------|-------|-----|
| Planning a feature | **planner** | Break down into phases, identify risks |
| New feature or bug fix | **tdd-guide** | Write tests first (RED/GREEN/REFACTOR) |
| After writing/modifying code | **code-reviewer** | Quality, security, maintainability |
| After writing/modifying TS/JS | **typescript-reviewer** | Type safety, async correctness, React patterns |
| Security-sensitive code | **security-reviewer** | Auth, input validation, XSS/CSRF |
| Build failures | **build-error-resolver** | Fix build/type errors with minimal changes |
| E2E test needed | **e2e-runner** | Playwright tests for critical flows |
| Architecture decisions | **architect** | System design, scalability |
| Dead code found | **refactor-cleaner** | Remove unused code safely |

## Coding Conventions

- TypeScript strict mode everywhere
- `const` by default, `let` only when needed, never `var`
- Functional components with hooks (no class components)
- Named exports preferred over default exports
- File naming: lowercase with hyphens (`quiz-creator.tsx`, `game-session.ts`)
- Component naming: PascalCase (`QuizCreator`, `GameSession`)
- Max file size: 400 lines (800 absolute max)
- Max function size: 50 lines

## Key Design References

- **Color palette**: See README.md → Color Palette section
- **Answer colors**: Red (#E21B3C), Blue (#1368CE), Yellow (#D89E00), Green (#26890C)
- **Background**: Deep Purple (#46178F)
- **Scoring**: `basePoints * (timeRemaining / timeLimit)` with streak multipliers

## Skills

| Context | Skill |
|---------|-------|
| TypeScript code | `coding-standards`, `frontend-patterns` |
| React components | `frontend-patterns` |
| API endpoints | `backend-patterns`, `api-design` |
| Database queries | `database-migrations`, `postgres-patterns` |
| Testing | `tdd-workflow`, `e2e-testing` |
| Security | `security-review` |
| Docker/deploy | `docker-patterns`, `deployment-patterns` |
