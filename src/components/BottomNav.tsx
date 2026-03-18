import { Search, Users, MessageSquare, Bell, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { Z } from '@/lib/zIndex';

interface NavItem {
  path: string;
  icon: typeof Search;
  label: string;
  match: (pathname: string, username?: string) => boolean;
}

const navItems: NavItem[] = [
  {
    path: '/',
    icon: Search,
    label: 'Descubrí',
    match: (p) => p === '/' || p === '/descubri',
  },
  {
    path: '/comunidad',
    icon: Users,
    label: 'Comunidad',
    match: (p) => p === '/comunidad',
  },
  {
    path: '/asamblea',
    icon: MessageSquare,
    label: 'Asamblea',
    match: (p) => p === '/asamblea',
  },
  {
    path: '/interacciones',
    icon: Bell,
    label: 'Notis',
    match: (p) => p === '/interacciones',
  },
  {
    path: '/__perfil__',   // resolved dynamically
    icon: User,
    label: 'Perfil',
    match: (p, username) => !!username && p === `/${username}`,
  },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, openLoginModal } = useAppStore();

  const handleNavClick = (item: NavItem) => {
    if (item.label === 'Perfil') {
      if (user) navigate(`/${user.username}`);
      else openLoginModal();
      return;
    }
    navigate(item.path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0" style={{ zIndex: Z.bottomNav }}>
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      <div className="glass-strong px-2 pb-safe">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = item.match(location.pathname, user?.username);
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                className={`relative flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-cyan-400'
                    : 'text-tertiary hover:text-gray-300'
                }`}
              >
                {isActive && (
                  <div className="absolute top-1 w-8 h-1 rounded-full gradient-cyan-lime" />
                )}

                <div className={`relative ${isActive ? 'transform -translate-y-0.5' : ''} transition-transform`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : ''}`} />

                  {item.label === 'Notis' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center font-bold">
                      5
                    </div>
                  )}
                </div>

                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-cyan-400' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
