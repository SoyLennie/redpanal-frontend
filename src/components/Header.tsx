import { Menu, Search, LogIn } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

export function Header() {
  const { toggleMenu, setPage, user, openLoginModal, clearAuth } = useAppStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Glassmorphism background */}
      <div className="glass-strong px-4 h-16 flex items-center justify-between">
        <button
          onClick={toggleMenu}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5 text-cyan-400" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-cyan-lime flex items-center justify-center">
            <span className="text-navy-900 font-bold text-sm">RP</span>
          </div>
          <span className="text-xl font-bold text-gradient">RedPanal</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage('descubri')}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Search className="w-5 h-5 text-cyan-400" />
          </button>

          {user ? (
            <button
              onClick={clearAuth}
              title={`@${user.username} — Cerrar sesión`}
              className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm hover:bg-cyan-500/25 transition-colors"
            >
              {user.username[0].toUpperCase()}
            </button>
          ) : (
            <button
              onClick={openLoginModal}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              title="Iniciar sesión"
            >
              <LogIn className="w-5 h-5 text-cyan-400" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom border gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
    </header>
  );
}
