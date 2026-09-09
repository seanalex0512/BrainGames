import { create } from 'zustand';

const ADMIN_PASSWORD = 'Bs109400!';
const STORAGE_KEY = 'braingames_admin';

interface AuthState {
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAdmin: sessionStorage.getItem(STORAGE_KEY) === 'true',

  login: (password: string) => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      set({ isAdmin: true });
      return true;
    }
    return false;
  },

  logout: () => {
    sessionStorage.removeItem(STORAGE_KEY);
    set({ isAdmin: false });
  },
}));
