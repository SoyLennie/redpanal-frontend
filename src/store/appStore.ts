import { create } from 'zustand';
import type { AudioTrack } from '@/types';

interface AuthUser {
  id: number;
  username: string;
  avatar_url: string | null;
}

interface AppStore {
  menuOpen: boolean;
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  playerExpanded: boolean;
  queue: AudioTrack[];
  progress: number;
  user: AuthUser | null;
  loginModalOpen: boolean;
  loginCallback: (() => void) | null;

  toggleMenu: () => void;
  closeMenu: () => void;
  playTrack: (track: AudioTrack, contextQueue?: AudioTrack[]) => void;
  togglePlay: () => void;
  expandPlayer: () => void;
  collapsePlayer: () => void;
  setProgress: (p: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  openLoginModal: (callback?: () => void) => void;
  closeLoginModal: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  menuOpen: false,
  currentTrack: null,
  isPlaying: false,
  playerExpanded: false,
  queue: [],
  progress: 0,
  user: (() => {
    try { return JSON.parse(localStorage.getItem('redpanal_user') || 'null'); }
    catch { return null; }
  })(),
  loginModalOpen: false,
  loginCallback: null,

  toggleMenu: () => set((s) => ({ menuOpen: !s.menuOpen })),
  closeMenu: () => set({ menuOpen: false }),
  
  playTrack: (track, contextQueue = []) => {
    const q = contextQueue.filter(t => t.id !== track.id);
    set({ currentTrack: track, isPlaying: true, queue: q, progress: 0 });
  },
  
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  expandPlayer: () => set({ playerExpanded: true }),
  collapsePlayer: () => set({ playerExpanded: false }),
  setProgress: (p) => set({ progress: p }),
  
  nextTrack: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ currentTrack: next, queue: rest, isPlaying: true, progress: 0 });
    }
  },
  
  prevTrack: () => {
    set({ progress: 0 });
  },

  setAuth: (token, user) => {
    localStorage.setItem('redpanal_token', token);
    localStorage.setItem('redpanal_user', JSON.stringify(user));
    set({ user });
  },

  clearAuth: () => {
    localStorage.removeItem('redpanal_token');
    localStorage.removeItem('redpanal_user');
    set({ user: null });
  },

  openLoginModal: (callback) => set({ loginModalOpen: true, loginCallback: callback ?? null }),
  closeLoginModal: () => set({ loginModalOpen: false, loginCallback: null }),
}));
