import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, GitBranch, Clock, UserPlus, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { fetchFeed } from '@/api/activity';
import { fetchUserColabs, fetchAudioList, followUser } from '@/api/audio';
import type { Activity } from '@/api/activity';
import type { AudioTrack } from '@/types';
import { ActivityItem } from '@/components/ActivityItem';
import { AudioCard } from '@/components/AudioCard';

export function HomeFeed() {
  const navigate = useNavigate();
  const { user } = useAppStore();

  const [feed, setFeed] = useState<Activity[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  const [colabs, setColabs] = useState<AudioTrack[]>([]);
  const [colabsLoading, setColabsLoading] = useState(true);

  const [novedades, setNovedades] = useState<AudioTrack[]>([]);
  const [novedadesLoading, setNovedadesLoading] = useState(true);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    fetchFeed()
      .then(setFeed)
      .finally(() => setFeedLoading(false));
    fetchUserColabs(user.username)
      .then(setColabs)
      .finally(() => setColabsLoading(false));
    fetchAudioList(6, undefined, '-created_at')
      .then(setNovedades)
      .finally(() => setNovedadesLoading(false));
  }, [user?.username]);

  // Load user suggestions when feed is empty
  useEffect(() => {
    if (feedLoading || feed.length > 0) return;
    fetchAudioList(20, undefined, '-created_at').then(tracks => {
      const seen = new Set<string>();
      const users: string[] = [];
      for (const t of tracks) {
        const u = t.artist.replace(/^@/, '');
        if (!seen.has(u) && u !== user?.username) {
          seen.add(u);
          users.push(u);
        }
        if (users.length >= 5) break;
      }
      setSuggestions(users);
    });
  }, [feedLoading, feed.length, user?.username]);

  const handleFollow = async (username: string) => {
    try {
      await followUser(username);
      setFollowed(prev => new Set([...prev, username]));
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen pb-40">

      {/* ── Greeting header ── */}
      <div className="px-4 pt-6 pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Hola, <span className="text-gradient">@{user?.username}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Tu mundo musical</p>
        </div>
        <button
          onClick={() => navigate('/descubri')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition-colors"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
          Explorar
        </button>
      </div>

      {/* ── Sección 1: Lo que está pasando ── */}
      <section className="mb-8">
        <div className="px-4 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h2 className="text-base font-semibold text-white">Lo que está pasando</h2>
        </div>

        {feedLoading ? (
          <div className="px-4 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : feed.length === 0 ? (
          <div className="px-4">
            <div className="p-5 rounded-2xl bg-white/3 border border-white/8">
              <p className="text-gray-400 text-sm text-center mb-4">
                Seguí músicos para ver su actividad acá
              </p>
              {suggestions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 text-center mb-3">Músicos activos que quizás te interesan</p>
                  {suggestions.map(username => (
                    <div key={username} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5">
                      <button
                        onClick={() => navigate(`/${username}`)}
                        className="text-sm text-white font-medium hover:text-cyan-400 transition-colors"
                      >
                        @{username}
                      </button>
                      {followed.has(username) ? (
                        <span className="text-xs text-cyan-400 font-medium">✓ Siguiendo</span>
                      ) : (
                        <button
                          onClick={() => handleFollow(username)}
                          className="flex items-center gap-1 px-3 py-1 rounded-full gradient-cyan-lime text-navy-900 text-xs font-semibold"
                        >
                          <UserPlus className="w-3 h-3" />
                          Seguir
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center">
                  <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="px-4 space-y-2">
            {feed.slice(0, 8).map(a => (
              <ActivityItem key={a.id} activity={a} mode="global" />
            ))}
          </div>
        )}
      </section>

      {/* ── Sección 2: Tus colaboraciones recientes ── */}
      <section className="mb-8">
        <div className="px-4 mb-3 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">Tus colaboraciones recientes</h2>
        </div>

        {colabsLoading ? (
          <div className="flex gap-3 px-4 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-shrink-0 w-36 aspect-square rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : colabs.length === 0 ? (
          <div className="px-4">
            <div className="p-5 rounded-2xl bg-white/3 border border-white/8 text-center">
              <p className="text-gray-400 text-sm mb-3">
                Todavía no colaboraste con nadie. ¿Empezamos?
              </p>
              <button
                onClick={() => navigate('/descubri')}
                className="px-4 py-2 rounded-full gradient-cyan-lime text-navy-900 text-sm font-semibold"
              >
                Explorar audios
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {colabs.map(t => (
              <AudioCard key={t.id} track={t} />
            ))}
          </div>
        )}
      </section>

      {/* ── Sección 3: Novedades de la comunidad ── */}
      <section className="mb-6">
        <div className="px-4 mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">🔥 Novedades de la comunidad</h2>
          <button
            onClick={() => navigate('/descubri')}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Ver todo
          </button>
        </div>

        {novedadesLoading ? (
          <div className="flex gap-3 px-4 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-shrink-0 w-36 aspect-square rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {novedades.map(t => (
              <AudioCard key={t.id} track={t} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
