import { createBrowserRouter } from 'react-router-dom';
import { App } from './app';
import { QuizLibrary } from './pages/quiz-library';
import { QuizCreator } from './pages/quiz-creator';
import { SoloPlay } from './pages/solo-play';
import { HostLobby } from './pages/host-lobby';
import { HostGame } from './pages/host-game';
import { JoinGame } from './pages/join-game';
import { PlayerGame } from './pages/player-game';
import { AdminGate } from './components/ui/admin-gate';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <JoinGame /> },
      { path: 'admin', element: <AdminGate><QuizLibrary /></AdminGate> },
      { path: 'quiz/new', element: <AdminGate><QuizCreator /></AdminGate> },
      { path: 'quiz/:id/edit', element: <AdminGate><QuizCreator /></AdminGate> },
      { path: 'quiz/:id/play', element: <AdminGate><SoloPlay /></AdminGate> },
      { path: 'quiz/:quizId/host', element: <AdminGate><HostLobby /></AdminGate> },
      { path: 'game/:sessionId/host', element: <AdminGate><HostGame /></AdminGate> },
      { path: 'join', element: <JoinGame /> },
      { path: 'join/:pin', element: <JoinGame /> },
      { path: 'game/:sessionId/play', element: <PlayerGame /> },
    ],
  },
]);
