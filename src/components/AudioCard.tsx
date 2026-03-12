import { Play, Pause } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { AudioTrack } from '@/types';

interface AudioCardProps {
  track: AudioTrack;
  variant?: 'default' | 'large';
}

const typeLabels: Record<string, string> = {
  loop: 'LOOP',
  pista: 'PISTA',
  cancion: 'CANCIÓN',
  sample: 'SAMPLE'
};

const typeGradients: Record<string, string> = {
  loop: 'from-fuchsia-500/30 to-purple-600/30',
  pista: 'from-amber-500/30 to-orange-600/30',
  cancion: 'from-emerald-500/30 to-green-600/30',
  sample: 'from-rose-500/30 to-pink-600/30'
};

const typeBorders: Record<string, string> = {
  loop: 'border-fuchsia-500/30',
  pista: 'border-amber-500/30',
  cancion: 'border-emerald-500/30',
  sample: 'border-rose-500/30'
};

export function AudioCard({ track, variant = 'default' }: AudioCardProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay, setPage } = useAppStore();
  const isCurrentTrack = currentTrack?.id === track.id;
  const isPlayingThis = isCurrentTrack && isPlaying;

  const handleCardClick = () => {
    if (!isCurrentTrack) playTrack(track);
    setPage('archivo');
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  if (variant === 'large') {
    return (
      <div
        onClick={handleCardClick}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 cursor-pointer hover:border-cyan-500/50 transition-all duration-300"
      >
        {/* Image area */}
        <div className={`aspect-video bg-gradient-to-br ${typeGradients[track.type]} relative overflow-hidden`}>
          {/* Animated background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.2),transparent_70%)]" />
          </div>
          
          {/* Type badge */}
          <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-semibold backdrop-blur-md type-${track.type}`}>
            {typeLabels[track.type]}
          </div>
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div onClick={handlePlayClick} className="w-14 h-14 rounded-full gradient-cyan-lime flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
              {isPlayingThis ? (
                <Pause className="w-6 h-6 text-navy-900" />
              ) : (
                <Play className="w-6 h-6 text-navy-900 ml-1" />
              )}
            </div>
          </div>
          
          {/* Wave animation when playing */}
          {isPlayingThis && (
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-center gap-1 h-8">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-cyan-400 rounded-full animate-pulse"
                  style={{ 
                    height: `${Math.random() * 20 + 8}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                {track.title}
              </h4>
              <p className="text-sm text-gray-400">{track.artist}</p>
            </div>
            <span className="text-xs text-gray-500">{track.duration}</span>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {track.tags.map((tag) => (
              <span 
                key={tag} 
                className="px-2 py-0.5 rounded-md text-xs bg-white/5 text-gray-400"
              >
                #{tag}
              </span>
            ))}
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span>{track.collaborations ?? 0} colaboraciones</span>
          </div>
        </div>
      </div>
    );
  }

  // Default variant (small card for horizontal scroll)
  return (
    <div
      onClick={handleCardClick}
      className={`group flex-shrink-0 w-36 cursor-pointer ${isCurrentTrack ? 'scale-105' : ''} transition-transform duration-200`}
    >
      {/* Image */}
      <div className={`aspect-square rounded-2xl bg-gradient-to-br ${typeGradients[track.type]} relative overflow-hidden border ${isCurrentTrack ? 'border-cyan-500' : 'border-white/10'} ${typeBorders[track.type]} group-hover:border-cyan-500/50 transition-all`}>
        {/* Type badge */}
        <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-semibold backdrop-blur-md type-${track.type}`}>
          {typeLabels[track.type]}
        </div>
        
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div onClick={handlePlayClick} className="w-10 h-10 rounded-full gradient-cyan-lime flex items-center justify-center">
            {isPlayingThis ? (
              <Pause className="w-4 h-4 text-navy-900" />
            ) : (
              <Play className="w-4 h-4 text-navy-900 ml-0.5" />
            )}
          </div>
        </div>
        
        {/* Playing indicator */}
        {isPlayingThis && (
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-center gap-0.5 h-4">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className="w-0.5 bg-cyan-400 rounded-full animate-pulse"
                style={{ 
                  height: `${Math.random() * 12 + 4}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="mt-2 px-1">
        <h4 className={`font-medium text-sm truncate ${isCurrentTrack ? 'text-cyan-400' : 'text-white'} group-hover:text-cyan-400 transition-colors`}>
          {track.title}
        </h4>
        <p className="text-xs text-gray-500 truncate">{track.artist}</p>
      </div>
    </div>
  );
}
