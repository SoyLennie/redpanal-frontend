import { Search, Users, MessageSquare, Bell, User, Mic } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { Z } from '@/lib/zIndex';

const navItems = [
  { path: '/', label: 'Descubrí', icon: Search, match: (p: string) => p === '/' || p === '/descubri' },
  { path: '/comunidad', label: 'Comunidad', icon: Users, match: (p: string) => p === '/comunidad' },
  { path: '/asamblea', label: 'Asamblea', icon: MessageSquare, match: (p: string) => p === '/asamblea' },
  { path: '/interacciones', label: 'Notificaciones', icon: Bell, match: (p: string) => p === '/interacciones' },
];

export function DesktopSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, openLoginModal } = useAppStore();

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-16 bottom-0 w-56 border-r border-white/10 bg-navy-900/95 backdrop-blur-sm"
      style={{ zIndex: Z.stickyHeader }}
    >
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map(({ path, label, icon: Icon, match }) => {
          const isActive = match(location.pathname);
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                  : 'text-tertiary hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {label === 'Notificaciones' && (
                <span className="ml-auto w-5 h-5 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center font-bold">
                  5
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={() => {
            if (user) navigate(`/${user.username}`);
            else openLoginModal();
          }}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
            user && location.pathname === `/${user.username}`
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
              : 'text-tertiary hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          <User className="w-4 h-4 flex-shrink-0" />
          {user ? `@${user.username}` : 'Perfil'}
        </button>
      </nav>

      <div className="p-3">
        <button
          onClick={() => navigate('/grabar')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gradient-cyan-lime text-navy-900 font-bold text-sm hover:opacity-90 transition-opacity shadow-md shadow-cyan-500/20"
        >
          <Mic className="w-4 h-4" />
          Grabar
        </button>
      </div>
    </aside>
  );
}
