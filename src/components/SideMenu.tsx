import { X, Info, HelpCircle, Mail, Github, Heart, LogIn, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { Z } from '@/lib/zIndex';

const menuItems = [
  { label: '¿Qué es RedPanal?', icon: Info, action: 'redpanal' },
  { label: 'FAQ', icon: HelpCircle, action: 'faq' },
  { label: 'Contacto', icon: Mail, action: 'contacto' },
  { label: 'GitHub', icon: Github, action: 'github' },
];

export function SideMenu() {
  const navigate = useNavigate();
  const { menuOpen, toggleMenu, closeMenu, user, openLoginModal, clearAuth } = useAppStore();

  const handleItemClick = (action: string) => {
    if (action === 'redpanal') {
      navigate('/about');
    }
    closeMenu();
  };

  return (
    <>
      {/* Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
          style={{ zIndex: Z.sideMenu - 1 }}
          onClick={closeMenu}
        />
      )}
      
      {/* Menu panel */}
      <nav
        className={`fixed top-0 left-0 h-full w-72 glass-strong transform transition-transform duration-300 ease-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ zIndex: Z.sideMenu }}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-cyan-lime flex items-center justify-center">
                <span className="text-navy-900 font-bold">RP</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">Menú</h3>
                <p className="text-xs text-secondary">RedPanal.org</p>
              </div>
            </div>
            <button 
              onClick={toggleMenu}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Menu items */}
        <div className="p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.action}>
                <button
                  onClick={() => handleItemClick(item.action)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  <item.icon className="w-5 h-5 text-cyan-400" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10">
          {/* Auth row */}
          {user ? (
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="text-sm text-white font-medium">@{user.username}</span>
              </div>
              <button
                onClick={() => { clearAuth(); closeMenu(); }}
                className="flex items-center gap-1.5 text-xs text-secondary hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          ) : (
            <div className="px-4 pt-4 pb-2">
              <button
                onClick={() => { openLoginModal(); closeMenu(); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/20 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Iniciar sesión
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-tertiary pb-4 pt-2">
            <span>Hecho con</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>y código libre</span>
          </div>
        </div>
      </nav>
    </>
  );
}
