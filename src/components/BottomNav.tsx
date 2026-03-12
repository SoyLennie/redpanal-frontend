import { Search, Users, MessageSquare, Bell, User } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { PageId } from '@/types';

interface NavItem {
  id: PageId;
  icon: typeof Search;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'descubri', icon: Search, label: 'Descubrí' },
  { id: 'comunidad', icon: Users, label: 'Comunidad' },
  { id: 'asamblea', icon: MessageSquare, label: 'Asamblea' },
  { id: 'interacciones', icon: Bell, label: 'Notis' },
  { id: 'perfil', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const { currentPage, setPage } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Top border gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      
      {/* Nav container */}
      <div className="glass-strong px-2 pb-safe">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`relative flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'text-cyan-400' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-1 w-8 h-1 rounded-full gradient-cyan-lime" />
                )}
                
                <div className={`relative ${isActive ? 'transform -translate-y-0.5' : ''} transition-transform`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : ''}`} />
                  
                  {/* Notification badge for interacciones */}
                  {item.id === 'interacciones' && (
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
