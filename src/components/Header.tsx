import { Menu, Search, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { Z } from '@/lib/zIndex';

export function Header() {
  const navigate = useNavigate();
  const { toggleMenu, user, openLoginModal, clearAuth } = useAppStore();

  return (
    <header className="fixed top-0 left-0 right-0" style={{ zIndex: Z.header }}>
      {/* Glassmorphism background */}
      <div className="glass-strong px-4 h-16 flex items-center justify-between">
        <button
          onClick={toggleMenu}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors md:hidden"
        >
          <Menu className="w-5 h-5 text-cyan-400" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-cyan-lime flex items-center justify-center">
            <span className="text-navy-900 font-bold text-sm">RP</span>
          </div>
          <span className="text-xl font-bold text-gradient">RedPanal</span>
        </div>

        {/* Desktop inline search */}
        <button
          onClick={() => navigate('/buscar')}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-500 hover:border-white/20 transition-colors w-64"
        >
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span>Buscar en RedPanal...</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Mobile search icon */}
          <button
            onClick={() => navigate('/buscar')}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors md:hidden"
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
            <>
              {/* Desktop login button */}
              <button
                onClick={() => openLoginModal()}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Iniciar sesión
              </button>
              {/* Mobile login icon */}
              <button
                onClick={() => openLoginModal()}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors md:hidden"
                title="Iniciar sesión"
              >
                <LogIn className="w-5 h-5 text-cyan-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bottom border gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
    </header>
  );
}
