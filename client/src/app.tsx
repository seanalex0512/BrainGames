import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAudioStore } from './stores/audio-store';
import { VolumeOnIcon, VolumeOffIcon } from './components/ui/icons';
import logoUrl from './assets/logo.png';

export function App() {
  const muted = useAudioStore((s) => s.muted);
  const toggleMute = useAudioStore((s) => s.toggleMute);

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center">
          <Link to="/" className="no-underline flex items-center gap-2">
            <motion.img
              src={logoUrl}
              alt="BrainGames"
              className="h-8 w-auto"
              whileHover={{ scale: 1.05 }}
            />
          </Link>

          <button
            onClick={toggleMute}
            aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
            title={muted ? 'Unmute sounds' : 'Mute sounds'}
            className="ml-auto text-white/60 hover:text-white transition-colors p-1.5 rounded"
          >
            {muted ? <VolumeOffIcon size={20} /> : <VolumeOnIcon size={20} />}
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
