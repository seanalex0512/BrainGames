# BrainGames

A Kahoot-inspired interactive quiz web app for creating, hosting, and playing trivia games in real-time. Designed for fun, fast-paced learning with a vibrant, engaging UI.

---

## Core Concept

BrainGames lets a host create quiz games with custom questions, then run live game sessions where players join via a game PIN, answer questions against a countdown timer, and compete on a live leaderboard. The experience should feel energetic, colorful, and rewarding — just like Kahoot.

---

## Question Types

### Phase 1
- **Multiple Choice** — 2 to 4 answer options, one correct
- **True / False** — binary choice with distinct visual treatment

### Future Phases
- **Type Answer** — players type a short text answer
- **Poll** — no correct answer, just gathering opinions
- **Slider** — pick a numeric value on a range
- **Puzzle / Order** — drag items into the correct sequence

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | **React 18+** with TypeScript | Component-driven, large ecosystem |
| Styling | **Tailwind CSS** + **Framer Motion** | Rapid styling + smooth animations |
| State | **Zustand** | Lightweight, minimal boilerplate |
| Backend | **Node.js / Express** | Simple REST + WebSocket server |
| Real-time | **Socket.IO** | Reliable WebSocket abstraction for live gameplay |
| Database | **SQLite** (via better-sqlite3) | Zero-config, file-based, great for local/dev |
| Auth | **Simple PIN-based** (Phase 1) | No user accounts needed initially |

---

## UI / UX Design Guidelines

### Kahoot DNA — What Makes It Fun

1. **Bold Colors** — Each answer option gets a signature color + shape icon:
   - Red triangle (Option A)
   - Blue diamond (Option B)
   - Yellow circle (Option C)
   - Green square (Option D)
   - For True/False: Blue diamond (True) / Red triangle (False)

2. **Countdown Timer** — Large, animated circular timer with urgency escalation:
   - Calm pace for first 60% of time
   - Pulse animation at 30% remaining
   - Rapid shake at 10% remaining
   - Dramatic sound effects at key thresholds

3. **Music & Sound Effects**
   - Lobby music while waiting for players
   - Thinking music during question countdown
   - Correct/incorrect answer sounds
   - Drumroll before leaderboard reveal
   - Victory fanfare for winner

4. **Animations Everywhere**
   - Questions slide/fade in with spring physics
   - Answer buttons bounce on hover
   - Confetti explosion on correct answers
   - Streak fire animation for consecutive correct answers
   - Podium animation for final results

5. **Score System**
   - Points based on correctness AND speed
   - Formula: `basePoints * (timeRemaining / totalTime)` — faster = more points
   - Bonus streak multiplier for consecutive correct answers (x2, x3, etc.)
   - Max 1000 points per question

6. **Leaderboard Between Questions**
   - Show top 5 players with animated bar chart
   - Highlight position changes (arrows up/down)
   - Suspenseful reveal animation

7. **Player Nicknames + Avatars**
   - Players pick a fun nickname on join
   - Auto-assigned random avatar/color combo
   - Displayed on leaderboard and host screen

### Screen Layouts

- **Host Lobby** — Game PIN displayed large, player list filling in as they join
- **Host Question View** — Question text top, countdown center, answer options bottom (no correct indicator)
- **Host Results View** — Bar chart showing how many picked each answer, correct answer highlighted
- **Player Waiting** — "Get Ready!" with player's nickname and avatar
- **Player Question View** — Just the colored answer buttons (question shown on host screen only)
- **Player Result** — Correct/Incorrect feedback with points earned and current rank
- **Final Podium** — Top 3 on an animated podium with confetti

---

## Features by Phase

### Phase 1 — Quiz Creator + Solo Play (MVP)

The foundation: build and play quizzes locally without multiplayer.

- [ ] **Quiz Creator**
  - Create a new quiz with title and optional description
  - Add questions with configurable time limit (5s, 10s, 20s, 30s, 60s)
  - Choose question type: Multiple Choice or True/False
  - Set 2-4 answer options for multiple choice
  - Mark the correct answer
  - Reorder questions via drag-and-drop
  - Edit and delete existing questions
  - Quiz saved to local database

- [ ] **Solo Play Mode**
  - Play through a quiz yourself to preview/test it
  - Full countdown timer with animations
  - Immediate correct/incorrect feedback
  - Score tracking with speed bonus
  - Summary screen at the end with score breakdown

- [ ] **Quiz Library**
  - List all created quizzes
  - Search/filter quizzes
  - Duplicate a quiz
  - Delete a quiz

- [ ] **Core UI Components**
  - Kahoot-style color scheme and answer buttons
  - Animated countdown timer (circular)
  - Correct/incorrect feedback animations
  - Responsive layout (works on desktop and mobile)

### Phase 2 — Multiplayer (Real-Time)

The real Kahoot experience: host a game, players join and compete live.

- [ ] **Game Hosting**
  - Generate a unique game PIN (6-digit)
  - Lobby screen showing connected players
  - Host controls: start game, skip question, pause, end game
  - Host screen shows question + answers + live response count

- [ ] **Player Join Flow**
  - Enter game PIN on join screen
  - Choose a nickname
  - Auto-assigned avatar/color
  - Waiting room with "Get Ready" screen

- [ ] **Live Gameplay**
  - WebSocket-driven real-time sync between host and players
  - Players see only answer buttons (question on host screen)
  - Answer lock-in with time tracking for score calculation
  - Live response counter on host screen
  - Results screen after each question (bar chart of answers)

- [ ] **Leaderboard**
  - Animated leaderboard between questions
  - Top 5 with position change indicators
  - Final podium for top 3 with confetti

- [ ] **Sound & Music**
  - Background music tracks for lobby, gameplay, results
  - Sound effects for correct, incorrect, timer warning, reveal

### Phase 3 — Polish & Power Features

- [ ] **Question Media**
  - Add images to questions
  - Add YouTube video embeds to questions
  - Image-based answer options

- [ ] **Game Modes**
  - Classic (standard timed questions)
  - Team Mode (players grouped into teams)
  - Elimination (lowest score eliminated each round)

- [ ] **Player Experience**
  - Streak tracking with fire animation
  - "Answer streak" bonus multiplier
  - Reaction emojis after each question
  - Power-ups (double points, extra time, 50/50 eliminate 2 wrong answers)

- [ ] **Host Dashboard**
  - Game history with results
  - Export results to CSV
  - Question performance analytics (which questions people get wrong most)

### Phase 4 — Accounts & Sharing

- [ ] **User Accounts**
  - Sign up / login (email or OAuth)
  - Save quizzes to account
  - Profile with game history and stats

- [ ] **Quiz Sharing**
  - Share quiz via link
  - Public quiz library / discover page
  - Fork/remix other people's quizzes
  - Quiz rating system

- [ ] **Additional Question Types**
  - Type Answer (text input)
  - Poll (no correct answer)
  - Slider (numeric range)
  - Puzzle / Order (drag to sequence)

---

## Project Structure (Planned)

```
BrainGames/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── quiz/        # Quiz creator components
│   │   │   ├── game/        # Gameplay components
│   │   │   ├── ui/          # Generic UI (buttons, modals, timer)
│   │   │   └── layout/      # Page layouts, navigation
│   │   ├── pages/           # Route-level page components
│   │   ├── stores/          # Zustand state stores
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Helpers, scoring logic, constants
│   │   ├── styles/          # Global styles, Tailwind config
│   │   └── assets/          # Images, sounds, music
│   └── public/
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/          # REST API routes
│   │   ├── models/          # Database models / queries
│   │   ├── services/        # Business logic
│   │   ├── socket/          # Socket.IO event handlers
│   │   └── utils/           # Server utilities
│   └── db/                  # SQLite database files
├── shared/                  # Shared types and constants
│   └── types/               # TypeScript interfaces shared between client/server
└── README.md
```

---

## Data Models (Phase 1)

### Quiz
```typescript
interface Quiz {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Question
```typescript
interface Question {
  id: string;
  quizId: string;
  type: 'multiple_choice' | 'true_false';
  text: string;
  imageUrl?: string;
  timeLimit: 5 | 10 | 20 | 30 | 60; // seconds
  points: number; // base points (default 1000)
  order: number;
}
```

### Answer
```typescript
interface Answer {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  order: number; // 0=A (red), 1=B (blue), 2=C (yellow), 3=D (green)
}
```

### GameSession (Phase 2)
```typescript
interface GameSession {
  id: string;
  quizId: string;
  pin: string; // 6-digit join code
  status: 'lobby' | 'playing' | 'finished';
  currentQuestionIndex: number;
  createdAt: string;
}
```

### Player (Phase 2)
```typescript
interface Player {
  id: string;
  sessionId: string;
  nickname: string;
  avatarColor: string;
  score: number;
  streak: number;
}
```

---

## Scoring Formula

```
points = isCorrect ? Math.round(basePoints * (timeRemaining / timeLimit)) : 0

streakBonus:
  streak >= 5 → 1.5x multiplier
  streak >= 3 → 1.2x multiplier
  streak < 3  → 1.0x (no bonus)

finalPoints = Math.round(points * streakMultiplier)
```

---

## Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Background (primary) | Deep Purple | `#46178F` |
| Answer A | Red | `#E21B3C` |
| Answer B | Blue | `#1368CE` |
| Answer C | Yellow | `#D89E00` |
| Answer D | Green | `#26890C` |
| True | Blue | `#1368CE` |
| False | Red | `#E21B3C` |
| Correct feedback | Bright Green | `#66BF39` |
| Incorrect feedback | Red | `#E21B3C` |
| Text (primary) | White | `#FFFFFF` |
| Accent | Magenta | `#CC0066` |

---

## Getting Started (After Build)

```bash
# Install dependencies
npm install

# Start development (client + server)
npm run dev

# Client runs on http://localhost:5173
# Server runs on http://localhost:3001
```

---

## Notes for Implementation

- Use **Vite** for the React frontend (fast HMR, TypeScript out of the box)
- Use **vitest** for unit tests and **Playwright** for E2E tests
- Animations should use Framer Motion with spring physics for that bouncy Kahoot feel
- Sound effects should be preloaded and managed via a simple audio manager utility
- The timer should use `requestAnimationFrame` for smooth countdown animation
- Mobile-first responsive design — players typically join on their phones
- WebSocket events should follow a clear naming convention: `game:start`, `game:answer`, `question:next`, `player:join`, etc.
