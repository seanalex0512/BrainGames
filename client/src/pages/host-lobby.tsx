import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLobbyStore } from '../stores/lobby-store';
import { audioManager } from '../utils/audio-manager';
import type { Player } from '@braingames/shared';

function PlayerAvatar({ player }: { player: Player }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="flex flex-col items-center gap-2"
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-black shadow-lg"
        style={{ backgroundColor: player.avatarColor }}
      >
        {player.nickname[0]?.toUpperCase()}
      </div>
      <span className="text-white/80 text-sm font-semibold text-center max-w-[80px] truncate">
        {player.nickname}
      </span>
    </motion.div>
  );
}

export function HostLobby() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const phase = useLobbyStore((s) => s.phase);
  const session = useLobbyStore((s) => s.session);
  const players = useLobbyStore((s) => s.players);
  const error = useLobbyStore((s) => s.error);
  const createGame = useLobbyStore((s) => s.createGame);
  const kickPlayer = useLobbyStore((s) => s.kickPlayer);
  const startGame = useLobbyStore((s) => s.startGame);
  const reset = useLobbyStore((s) => s.reset);

  useEffect(() => {
    if (quizId) createGame(quizId);
    return () => {
      // Only reset if the game hasn't started — when navigating to the game
      // page the socket must stay connected.  HostGame handles its own cleanup.
      const { session } = useLobbyStore.getState();
      if (session?.status !== 'playing') {
        reset();
      }
    };
  }, [quizId, createGame, reset]);

  // Lobby waiting music — start when PIN is visible, stop on navigate/unmount
  useEffect(() => {
    if (phase !== 'lobby') return;
    audioManager.startLobbyMusic();
    return () => { audioManager.stopLobbyMusic(); };
  }, [phase]);

  // Navigate when game starts
  useEffect(() => {
    if (session?.status === 'playing') {
      navigate(`/game/${session.id}/host`);
    }
  }, [session?.status, session?.id, navigate]);

  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-white/70 text-lg">{error ?? 'Failed to create game'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
        >
          Back to Library
        </button>
      </div>
    );
  }

  if (phase === 'connecting' || phase === 'idle' || !session) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="h-10 w-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* PIN display */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <p className="text-white/60 text-lg font-semibold uppercase tracking-widest mb-2">
          Game PIN
        </p>
        <motion.p
          className="text-8xl font-black text-white tracking-widest tabular-nums select-all"
          aria-label={`Game PIN: ${session.pin}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          {session.pin}
        </motion.p>
        <p className="text-white/50 mt-3 text-sm">
          Players join at <span className="text-white font-semibold">braingames.app/join</span>
        </p>
      </motion.div>

      {/* Player count */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <motion.span
            key={players.length}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="text-white font-black text-2xl tabular-nums"
          >
            {players.length}
          </motion.span>
          <span className="text-white/60 text-lg">
            {players.length === 1 ? 'player' : 'players'} joined
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-white/70 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            disabled={players.length === 0}
            className="px-6 py-2 bg-brain-correct hover:bg-brain-correct/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-lg transition-colors"
          >
            Start Game →
          </motion.button>
        </div>
      </div>

      {/* Player grid */}
      {players.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <p className="text-white/50 text-lg">Waiting for players to join...</p>
          <p className="text-white/30 text-sm mt-2">
            Share the PIN above to get started
          </p>
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4"
        >
          <AnimatePresence>
            {players.map((player) => (
              <div key={player.id} className="relative group">
                <PlayerAvatar player={player} />
                <button
                  onClick={() => kickPlayer(player.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-brain-red rounded-full text-white text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  aria-label={`Kick ${player.nickname}`}
                >
                  ×
                </button>
              </div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
