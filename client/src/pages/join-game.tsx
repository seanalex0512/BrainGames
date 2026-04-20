import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLobbyStore } from '../stores/lobby-store';

function PinInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="\d{6}"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      placeholder="Game PIN"
      aria-label="Game PIN"
      className="w-full text-center text-4xl font-black tracking-widest bg-white/10 border-2 border-white/30 rounded-2xl py-5 text-white placeholder-white/30 outline-none focus:border-white/60 transition-colors"
    />
  );
}

function WaitingRoom() {
  const selfPlayer = useLobbyStore((s) => s.selfPlayer);
  const players = useLobbyStore((s) => s.players);
  const phase = useLobbyStore((s) => s.phase);
  const navigate = useNavigate();

  if (phase === 'kicked') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-black text-white mb-2">You've been removed</h2>
        <p className="text-white/60 mb-6">The host removed you from this game.</p>
        <button
          onClick={() => navigate('/join')}
          className="px-6 py-3 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30"
        >
          Join Another Game
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center py-12"
    >
      {selfPlayer && (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-28 h-28 rounded-full flex items-center justify-center text-white text-5xl font-black shadow-2xl mb-4"
            style={{ backgroundColor: selfPlayer.avatarColor }}
          >
            {selfPlayer.nickname[0]?.toUpperCase()}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-black text-white mb-1"
          >
            {selfPlayer.nickname}
          </motion.h2>
        </>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-2 mt-6"
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-white/60 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
            />
          ))}
        </div>
        <p className="text-white/70 text-lg font-semibold">Waiting for host to start…</p>
        <p className="text-white/40 text-sm">
          {players.length} {players.length === 1 ? 'player' : 'players'} in lobby
        </p>
      </motion.div>
    </motion.div>
  );
}

export function JoinGame() {
  const { pin: pinParam } = useParams<{ pin?: string }>();
  const navigate = useNavigate();

  const [pin, setPin] = useState(pinParam ?? '');
  const [nickname, setNickname] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const phase = useLobbyStore((s) => s.phase);
  const session = useLobbyStore((s) => s.session);
  const error = useLobbyStore((s) => s.error);
  const joinGame = useLobbyStore((s) => s.joinGame);
  const reset = useLobbyStore((s) => s.reset);

  useEffect(() => {
    return () => {
      // Only reset if the game hasn't started — when navigating to the game
      // page the socket must stay connected.  PlayerGame handles its own cleanup.
      const { session } = useLobbyStore.getState();
      if (session?.status !== 'playing') {
        reset();
      }
    };
  }, [reset]);

  // Navigate when game starts
  useEffect(() => {
    if (session?.status === 'playing') {
      navigate(`/game/${session.id}/play`);
    }
  }, [session?.status, session?.id, navigate]);

  const canSubmit = pin.length === 6 && nickname.trim().length >= 1;
  const inLobby = phase === 'lobby' || phase === 'kicked';

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
    joinGame(pin, nickname.trim());
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-black text-white">Join Game</h1>
        <p className="text-white/50 mt-2">Enter the PIN shown on the host screen</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!inLobby ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleJoin}
            className="flex flex-col gap-4"
          >
            <PinInput value={pin} onChange={setPin} />

            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your nickname"
              aria-label="Nickname"
              maxLength={20}
              className="w-full text-center text-2xl font-bold bg-white/10 border-2 border-white/30 rounded-2xl py-4 text-white placeholder-white/30 outline-none focus:border-white/60 transition-colors"
            />

            {(phase === 'error' || (submitted && error)) && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-brain-red text-center font-semibold"
                role="alert"
              >
                {error ?? 'Something went wrong. Try again.'}
              </motion.p>
            )}

            <motion.button
              whileHover={canSubmit ? { scale: 1.03 } : {}}
              whileTap={canSubmit ? { scale: 0.97 } : {}}
              type="submit"
              disabled={!canSubmit || phase === 'connecting'}
              className="w-full py-4 bg-brain-accent hover:bg-brain-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xl rounded-2xl transition-colors"
            >
              {phase === 'connecting' ? 'Joining…' : 'Join →'}
            </motion.button>
          </motion.form>
        ) : (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <WaitingRoom />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
