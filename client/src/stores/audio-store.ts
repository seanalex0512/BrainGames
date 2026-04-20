import { create } from 'zustand';
import { audioManager } from '../utils/audio-manager';

const STORAGE_KEY = 'braingames:muted';

function readMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

interface AudioState {
  readonly muted: boolean;
  readonly toggleMute: () => void;
}

const initialMuted = readMuted();
audioManager.setMuted(initialMuted);

export const useAudioStore = create<AudioState>()((set, get) => ({
  muted: initialMuted,
  toggleMute: () => {
    const newMuted = !get().muted;
    audioManager.setMuted(newMuted);
    try { localStorage.setItem(STORAGE_KEY, String(newMuted)); } catch { /* ignore */ }
    set({ muted: newMuted });
  },
}));
