import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Heart, MessageCircle, Download, Share2, ChevronUp, ChevronDown, X, GitBranch, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { Z } from '@/lib/zIndex';

const typeColors: Record<string, string> = {
  loop: 'from-fuchsia-500 to-purple-600',
  pista: 'from-amber-500 to-orange-600',
  cancion: 'from-emerald-500 to-green-600',
  sample: 'from-rose-500 to-pink-600'
};

const typeLabels: Record<string, string> = {
  loop: 'LOOP', pista: 'PISTA', cancion: 'CANCIÓN', sample: 'SAMPLE'
};

const WAVEFORM_BARS = Array.from({ length: 40 }, (_, i) => {
  const center = Math.sin(i * 0.4) * 0.3 + 0.5;
  const noise = (Math.sin(i * 7.3) * 0.5 + 0.5) * 0.4;
  return Math.max(0.1, Math.min(1, center + noise));
});

export function Player() {
  const navigate = useNavigate();
  const {
    currentTrack, isPlaying, togglePlay,
    playerExpanded, expandPlayer, collapsePlayer,
    queue, nextTrack, prevTrack,
    progress, setProgress,
  } = useAppStore();

  const [liked, setLiked] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [realDuration, setRealDuration] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(new Audio());

  // ── Swap source when track changes ──────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!currentTrack?.audioUrl) {
      audio.pause();
      return;
    }
    audio.src = currentTrack.audioUrl;
    setRealDuration(null);
    setProgress(0);
    audio.load();
    // Auto-play when track changes if the store says isPlaying
    if (isPlaying) {
      audio.play().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // ── Sync play/pause state ────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!currentTrack?.audioUrl) return;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack?.audioUrl]);

  // ── Wire audio element events ────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setProgress(audio.currentTime / audio.duration);
      }
    };

    const onLoadedMetadata = () => {
      if (isFinite(audio.duration)) {
        setRealDuration(audio.duration);
      }
    };

    const onEnded = () => {
      const { queue } = useAppStore.getState();
      if (queue.length > 0) {
        nextTrack();
      } else {
        useAppStore.setState({ isPlaying: false, progress: 0 });
        audio.currentTime = 0;
      }
    };

    const onError = () => {
      useAppStore.setState({ isPlaying: false });
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  // These listeners are stable — wire once, read state via getState() where needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Duration display ─────────────────────────────────────────────────────
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalSeconds = realDuration ?? (() => {
    if (!currentTrack?.duration) return 0;
    const parts = currentTrack.duration.split(':').map(Number);
    return parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0];
  })();

  const currentSeconds = progress * totalSeconds;

  if (!currentTrack) {
    return (
      <div className="fixed left-0 right-0" style={{ zIndex: Z.playerMini, bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mx-4 glass-strong rounded-2xl px-4 py-3">
          <div className="flex items-center justify-center gap-3 text-tertiary">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <Play className="w-4 h-4" />
            </div>
            <span className="text-sm">Seleccioná algo para reproducir</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mini player */}
      <div className="fixed left-0 right-0" style={{ zIndex: Z.playerMini, bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
        <div
          onClick={expandPlayer}
          className="mx-4 glass-strong rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-500/30 transition-colors"
        >
          {/* Progress bar */}
          <div className="h-0.5 bg-white/10">
            <div
              className="h-full gradient-cyan-lime rounded-full"
              style={{ width: `${progress * 100}%`, transition: 'width 0.1s linear' }}
            />
          </div>

          <div className="px-4 py-3 flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeColors[currentTrack.type]} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white font-bold text-xs">{typeLabels[currentTrack.type]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white text-sm truncate">{currentTrack.title}</h4>
              <button
                onClick={e => { e.stopPropagation(); navigate(`/${currentTrack.artist.replace(/^@/, '')}`); }}
                className="text-xs text-secondary truncate hover:text-cyan-400 transition-colors text-left"
              >{currentTrack.artist}</button>
            </div>
            {isPlaying && (
              <div className="hidden sm:flex items-end gap-px h-5">
                {[8, 14, 10, 16, 9].map((h, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-cyan-400 rounded-full"
                    style={{
                      height: `${h}px`,
                      animation: `eqbar 0.7s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.12}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <button
              onClick={e => { e.stopPropagation(); togglePlay(); }}
              className="w-10 h-10 rounded-full gradient-cyan-lime flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-navy-900" /> : <Play className="w-4 h-4 text-navy-900 ml-0.5" />}
            </button>
            <ChevronUp className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Expanded player */}
      {playerExpanded && (
        <div className="fixed inset-0 flex items-end" style={{ zIndex: Z.playerExpanded }}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={collapsePlayer} />
          <div className="relative w-full bg-gradient-to-t from-navy-900 via-navy-900 to-[#1a2a3d] rounded-t-3xl overflow-hidden max-h-[92vh] overflow-y-auto">

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-navy-900/90 backdrop-blur-sm z-10">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="px-6 flex items-center justify-between">
              <button onClick={collapsePlayer}><ChevronDown className="w-6 h-6 text-gray-400" /></button>
              <div className="text-center">
                <p className="text-xs text-tertiary">Reproduciendo</p>
                <p className="text-xs text-cyan-400 font-medium">{currentTrack.instrument} · {currentTrack.genre}</p>
              </div>
              <button onClick={collapsePlayer}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            {/* Album art with waveform */}
            <div className="px-8 pt-6">
              <div className={`aspect-square max-w-sm mx-auto rounded-3xl bg-gradient-to-br ${typeColors[currentTrack.type]} relative overflow-hidden shadow-2xl`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_50%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-5xl opacity-20">{currentTrack.type.toUpperCase()}</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end gap-px h-14">
                  {WAVEFORM_BARS.map((height, i) => {
                    const isPast = i / WAVEFORM_BARS.length <= progress;
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm transition-colors duration-100 ${isPast ? 'bg-white/90' : 'bg-white/25'}`}
                        style={{ height: `${height * 100}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Track info */}
            <div className="px-8 pt-5 text-center">
              <h2 className="text-xl font-bold text-white">{currentTrack.title}</h2>
              <button
                onClick={() => { collapsePlayer(); navigate(`/${currentTrack.artist.replace(/^@/, '')}`); }}
                className="text-base text-cyan-400 mt-1 hover:underline"
              >{currentTrack.artist}</button>
              <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                {currentTrack.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs text-gray-500">#{tag}</span>
                ))}
              </div>
            </div>

            {/* Interactive progress bar */}
            <div className="px-8 pt-5">
              <div className="relative">
                {/* Waveform visual — decorativo */}
                <div className="flex items-end gap-0.5 h-10 pointer-events-none" aria-hidden="true">
                  {WAVEFORM_BARS.map((height, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm transition-colors duration-100 ${
                        i / WAVEFORM_BARS.length <= progress ? 'bg-cyan-400' : 'bg-white/20'
                      }`}
                      style={{ height: `${Math.max(height * 100, 10)}%` }}
                    />
                  ))}
                </div>
                {/* Seek real — accesible */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(progress * 100)}
                  onChange={(e) => {
                    const ratio = Number(e.target.value) / 100;
                    const audio = audioRef.current;
                    if (audio.duration && isFinite(audio.duration)) {
                      audio.currentTime = ratio * audio.duration;
                    }
                    setProgress(ratio);
                  }}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  aria-label="Posición de reproducción"
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-tertiary">
                <span>{formatTime(currentSeconds)}</span>
                <span>{formatTime(totalSeconds)}</span>
              </div>
            </div>

            {/* Playback controls */}
            <div className="px-8 pt-4 flex items-center justify-center gap-6">
              <button onClick={prevTrack} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <SkipBack className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full gradient-cyan-lime flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-cyan-500/30"
              >
                {isPlaying ? <Pause className="w-7 h-7 text-navy-900" /> : <Play className="w-7 h-7 text-navy-900 ml-1" />}
              </button>
              <button onClick={nextTrack} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <SkipForward className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="px-8 pt-6">
              <div className="flex justify-around mb-3">
                {[
                  { icon: Heart, label: 'Favorito', active: liked, onClick: () => setLiked(l => !l), activeClass: 'bg-rose-500/20', activeIconClass: 'text-rose-400 fill-rose-400' },
                  { icon: Share2, label: 'Compartir', active: false, onClick: () => {}, activeClass: '', activeIconClass: '' },
                  { icon: MessageCircle, label: 'Comentar', active: false, onClick: () => {}, activeClass: '', activeIconClass: '' },
                  { icon: Download, label: 'Descargar', active: false, onClick: () => {}, activeClass: '', activeIconClass: '' },
                ].map(({ icon: Icon, label, active, onClick, activeClass, activeIconClass }) => (
                  <button key={label} onClick={onClick} className="flex flex-col items-center gap-1.5 group">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${active ? activeClass : 'bg-white/5 group-hover:bg-cyan-500/20'}`}>
                      <Icon className={`w-5 h-5 transition-colors ${active ? activeIconClass : 'text-gray-400 group-hover:text-cyan-400'}`} />
                    </div>
                    <span className="text-[11px] text-tertiary">{label}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    collapsePlayer();
                    navigate('/grabar', {
                      state: {
                        sourceAudio: {
                          pkId: currentTrack.pkId,
                          slug: currentTrack.id,
                          name: currentTrack.title,
                          username: currentTrack.artist.replace(/^@/, ''),
                          audioUrl: currentTrack.audioUrl,
                        },
                      },
                    });
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-cyan-lime text-navy-900 text-sm font-bold hover:opacity-90 transition-opacity shadow-md shadow-cyan-500/20"
                >
                  <GitBranch className="w-4 h-4" />
                  Colaborar
                </button>
                <button
                  onClick={() => setShowMore(s => !s)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                  Más
                </button>
              </div>

              {showMore && (
                <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-sm text-gray-300 transition-colors text-left">
                    <span className="text-base">🤖</span>
                    <div>
                      <p className="font-medium">Agente IA</p>
                      <p className="text-xs text-gray-500">Preguntale sobre BPM, compases, combinaciones...</p>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-sm text-gray-300 transition-colors text-left">
                    <span className="text-base">🎵</span>
                    <span>Agregar a playlist</span>
                  </button>
                </div>
              )}
            </div>

            {/* Queue */}
            {queue.length > 0 ? (
              <div className="px-6 pt-5 pb-24">
                <h4 className="text-sm font-semibold text-secondary mb-3">A continuación ({queue.length})</h4>
                <div className="space-y-2">
                  {queue.slice(0, 4).map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${typeColors[t.type]} flex items-center justify-center`}>
                        <span className="text-[8px] font-bold text-white">{t.type.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{t.title}</p>
                        <p className="text-xs text-tertiary">{t.artist}</p>
                      </div>
                      <span className="text-xs text-tertiary">{t.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pb-16" />
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes eqbar {
          from { transform: scaleY(0.3); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </>
  );
}
