import { createBrowserRouter } from 'react-router-dom';
import { App } from './app';
import { QuizLibrary } from './pages/quiz-library';
import { QuizCreator } from './pages/quiz-creator';
import { SoloPlay } from './pages/solo-play';
import { HostLobby } from './pages/host-lobby';
import { HostGame } from './pages/host-game';
import { JoinGame } from './pages/join-game';
import { PlayerGame } from './pages/player-game';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <QuizLibrary /> },
      { path: 'quiz/new', element: <QuizCreator /> },
      { path: 'quiz/:id/edit', element: <QuizCreator /> },
      { path: 'quiz/:id/play', element: <SoloPlay /> },
      { path: 'quiz/:quizId/host', element: <HostLobby /> },
      { path: 'game/:sessionId/host', element: <HostGame /> },
      { path: 'join', element: <JoinGame /> },
      { path: 'join/:pin', element: <JoinGame /> },
      { path: 'game/:sessionId/play', element: <PlayerGame /> },
    ],
  },
]);
