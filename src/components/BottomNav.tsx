import { useState } from 'react';
import { Search, Users, Bell, User, Plus, Mic, Upload, GitBranch, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';

interface NavItem {
  path: string;
  icon: typeof Search;
  label: string;
  match: (pathname: string, username?: string) => boolean;
}

const leftItems: NavItem[] = [
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
];

const rightItems: NavItem[] = [
  {
    path: '/interacciones',
    icon: Bell,
    label: 'Notis',
    match: (p) => p === '/interacciones',
  },
  {
    path: '/__perfil__',
    icon: User,
    label: 'Perfil',
    match: (p, username) => !!username && p === `/${username}`,
  },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, openLoginModal, currentTrack } = useAppStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [noTrackMsg, setNoTrackMsg] = useState(false);

  const handleNavClick = (item: NavItem) => {
    setSheetOpen(false);
    if (item.label === 'Perfil') {
      if (user) navigate(`/${user.username}`);
      else openLoginModal();
      return;
    }
    navigate(item.path);
  };

  const openSheet = () => {
    setNoTrackMsg(false);
    setSheetOpen(true);
  };

  const handleAction = (action: 'record' | 'upload' | 'collaborate') => {
    if (action === 'record') {
      setSheetOpen(false);
      navigate('/grabar', { state: { startStep: 'record' } });
    } else if (action === 'upload') {
      setSheetOpen(false);
      navigate('/grabar', { state: { startStep: 'upload' } });
    } else {
      if (!currentTrack) {
        setNoTrackMsg(true);
        return;
      }
      setSheetOpen(false);
      navigate('/grabar', {
        state: {
          startStep: 'record',
          sourceAudio: {
            pkId: currentTrack.pkId ?? 0,
            slug: currentTrack.id,
            name: currentTrack.title,
            username: currentTrack.artist.replace(/^@/, ''),
            audioUrl: currentTrack.audioUrl,
          },
        },
      });
    }
  };

  const renderNavButton = (item: NavItem) => {
    const isActive = item.match(location.pathname, user?.username);
    const Icon = item.icon;
    return (
      <button
        key={item.label}
        onClick={() => handleNavClick(item)}
        className={`relative flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-300 ${
          isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        {isActive && <div className="absolute top-1 w-8 h-1 rounded-full gradient-cyan-lime" />}
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
  };

  return (
    <>
      {/* Backdrop */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* Action sheet */}
      <div
        className={`fixed left-0 right-0 z-40 transition-transform duration-300 ease-out ${
          sheetOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
        style={{ bottom: '4rem' }}
      >
        <div className="mx-3 mb-2 rounded-2xl bg-[#111c2e] border border-white/10 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Crear</span>
            <button onClick={() => setSheetOpen(false)}>
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <button
            onClick={() => handleAction('record')}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-white/5 active:bg-white/10 transition-colors text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
              <Mic className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">🎙️ Grabar ahora</p>
              <p className="text-xs text-gray-500">Capturá directo desde el micrófono</p>
            </div>
          </button>

          <button
            onClick={() => handleAction('upload')}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-white/5 active:bg-white/10 transition-colors text-left border-t border-white/5"
          >
            <div className="w-11 h-11 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">📁 Subir archivo</p>
              <p className="text-xs text-gray-500">MP3, WAV, OGG, FLAC, AAC</p>
            </div>
          </button>

          <button
            onClick={() => handleAction('collaborate')}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-white/5 active:bg-white/10 transition-colors text-left border-t border-white/5"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${currentTrack ? 'bg-fuchsia-500/20' : 'bg-white/5'}`}>
              <GitBranch className={`w-5 h-5 ${currentTrack ? 'text-fuchsia-400' : 'text-gray-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm ${currentTrack ? 'text-white' : 'text-gray-500'}`}>
                🤝 Colaborar
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentTrack ? `Con: ${currentTrack.title}` : 'Reproducí un audio primero'}
              </p>
            </div>
          </button>

          {noTrackMsg && (
            <div className="px-4 py-3 bg-amber-500/10 border-t border-amber-500/20">
              <p className="text-xs text-amber-400">Reproducí un audio primero para colaborar con él</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <div className="glass-strong px-2 pb-safe">
          <div className="flex items-center justify-around h-16">
            {leftItems.map(renderNavButton)}

            {/* Center + button */}
            <button
              onClick={sheetOpen ? () => setSheetOpen(false) : openSheet}
              className="relative flex flex-col items-center justify-center flex-1 h-full"
            >
              <div
                className={`w-12 h-12 rounded-full gradient-cyan-lime flex items-center justify-center shadow-lg transition-transform duration-200 ${
                  sheetOpen ? 'rotate-45 scale-95' : 'scale-100'
                }`}
              >
                <Plus className="w-6 h-6 text-[#0a1628] font-bold" />
              </div>
            </button>

            {rightItems.map(renderNavButton)}
          </div>
        </div>
      </nav>
    </>
  );
}
