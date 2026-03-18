import { useState, useEffect, useMemo } from 'react';
import { AudioCard } from '@/components/AudioCard';
import { useAppStore } from '@/store/appStore';
import { Music2, Heart, LogIn, UserPlus, UserCheck, Loader2, Settings, GitBranch } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchUserAudios, fetchUserColabs, fetchUserFollowers, fetchUserFollowing,
  fetchAudioList, fetchUserStats, followUser, unfollowUser, fetchMyFollowing, fetchIsFollowing,
} from '@/api/audio';
import type { UserStats, UserCard } from '@/api/audio';
import { fetchGlobalActivity } from '@/api/activity';
import type { AudioTrack } from '@/types';
import type { Activity } from '@/api/activity';
import { ActivityItem } from '@/components/ActivityItem';

type ProfileTab = 'audios' | 'colabs' | 'likes' | 'seguidores' | 'siguiendo';

export function PerfilPage() {
  const { username } = useParams<{ username: string }>();
  const { user, openLoginModal } = useAppStore();
  const navigate = useNavigate();

  const isOwnProfile = !!user && user.username === username;
  const profileUsername = username ?? user?.username;

  // Core data
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [audioCount, setAudioCount] = useState(0);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Tabs
  const [tab, setTab] = useState<ProfileTab>('audios');

  // Lazy-loaded tab data
  const [colabs, setColabs] = useState<AudioTrack[] | null>(null);
  const [colabsLoading, setColabsLoading] = useState(false);
  const [followers, setFollowers] = useState<UserCard[] | null>(null);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [following, setFollowingList] = useState<UserCard[] | null>(null);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Load core data on mount / username change
  useEffect(() => {
    if (!profileUsername) return;
    setLoading(true);
    setTracks([]); setStats(null); setNotFound(false);
    setColabs(null); setFollowers(null); setFollowingList(null);
    setTab('audios');
    Promise.all([
      fetchUserAudios(profileUsername),
      fetchUserStats(profileUsername),
      !isOwnProfile ? fetchIsFollowing(profileUsername) : Promise.resolve(false),
    ])
      .then(([{ count, tracks: t }, userStats, following]) => {
        if (!userStats) { setNotFound(true); return; }
        setAudioCount(count);
        setTracks(t);
        setStats(userStats);
        setIsFollowing(following as boolean);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [profileUsername, isOwnProfile]);

  // Lazy load colabs when tab first activated
  useEffect(() => {
    if (tab !== 'colabs' || colabs !== null || !profileUsername) return;
    setColabsLoading(true);
    fetchUserColabs(profileUsername)
      .then(setColabs)
      .finally(() => setColabsLoading(false));
  }, [tab, profileUsername, colabs]);

  // Lazy load followers
  useEffect(() => {
    if (tab !== 'seguidores' || followers !== null || !profileUsername) return;
    setFollowersLoading(true);
    fetchUserFollowers(profileUsername)
      .then(setFollowers)
      .finally(() => setFollowersLoading(false));
  }, [tab, profileUsername, followers]);

  // Lazy load following
  useEffect(() => {
    if (tab !== 'siguiendo' || following !== null || !profileUsername) return;
    setFollowingLoading(true);
    fetchUserFollowing(profileUsername)
      .then(setFollowingList)
      .finally(() => setFollowingLoading(false));
  }, [tab, profileUsername, following]);

  if (!profileUsername) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center pb-32">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <LogIn className="w-8 h-8 text-gray-600" />
        </div>
        <h2 className="text-white font-semibold mb-2">Tu perfil</h2>
        <p className="text-gray-500 text-sm mb-5">Iniciá sesión para ver tus audios y estadísticas</p>
        <button onClick={() => openLoginModal()}
          className="px-6 py-2.5 rounded-full gradient-cyan-lime text-navy-900 text-sm font-semibold"
        >Iniciar sesión</button>
      </div>
    );
  }

  if (notFound && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center pb-32">
        <p className="text-gray-500 text-sm">Usuario @{profileUsername} no encontrado.</p>
      </div>
    );
  }

  const initial = profileUsername[0].toUpperCase();

  const handleFollow = async () => {
    if (!user) { openLoginModal(); return; }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(profileUsername);
        setIsFollowing(false);
        setStats(s => s ? { ...s, followers_count: s.followers_count - 1 } : s);
      } else {
        await followUser(profileUsername);
        setIsFollowing(true);
        setStats(s => s ? { ...s, followers_count: s.followers_count + 1 } : s);
      }
    } catch { /* ignore */ }
    finally { setFollowLoading(false); }
  };

  const TABS: { id: ProfileTab; label: string }[] = [
    { id: 'audios',     label: 'Subidos' },
    { id: 'colabs',     label: 'Colabs' },
    { id: 'likes',      label: 'Likes' },
    { id: 'seguidores', label: 'Seguidores' },
    { id: 'siguiendo',  label: 'Siguiendo' },
  ];

  return (
    <div className="pb-32">
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-5 text-center border-b border-white/10">
        <div className="w-20 h-20 rounded-full gradient-cyan-lime mx-auto flex items-center justify-center mb-3">
          <span className="text-navy-900 font-bold text-2xl">{initial}</span>
        </div>
        <h1 className="text-xl font-bold text-white">@{profileUsername}</h1>

        {/* Action button */}
        {isOwnProfile ? (
          <button onClick={() => navigate('/about')}
            className="mt-3 inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
          ><Settings className="w-4 h-4" /> Editar perfil</button>
        ) : user ? (
          <button onClick={handleFollow} disabled={followLoading}
            className={`mt-3 inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-50 ${
              isFollowing ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'gradient-cyan-lime text-navy-900'
            }`}
          >
            {isFollowing ? <><UserCheck className="w-4 h-4" /> Siguiendo</> : <><UserPlus className="w-4 h-4" /> Seguir</>}
          </button>
        ) : (
          <button onClick={() => openLoginModal()}
            className="mt-3 inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-colors"
          ><LogIn className="w-4 h-4" /> Seguir</button>
        )}

        {/* Clickable stats */}
        <div className="flex justify-center gap-2 mt-4">
          {[
            { label: 'Audios',     val: audioCount,                    tab: 'audios'     as ProfileTab },
            { label: 'Seguidores', val: stats?.followers_count ?? '—', tab: 'seguidores' as ProfileTab },
            { label: 'Siguiendo',  val: stats?.following_count ?? '—', tab: 'siguiendo'  as ProfileTab },
          ].map(stat => (
            <button
              key={stat.label}
              onClick={() => setTab(stat.tab)}
              className={`flex-1 py-2 px-1 rounded-xl transition-colors text-center ${
                tab === stat.tab ? 'bg-cyan-500/15 border border-cyan-500/30' : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <p className={`font-bold text-base ${tab === stat.tab ? 'text-cyan-400' : 'text-white'}`}>{stat.val}</p>
              <p className="text-gray-500 text-xs">{stat.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-white/10 overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
              tab === t.id ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
            {tab === t.id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full gradient-cyan-lime" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="px-4 pt-4">
        {loading && tab === 'audios' ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
        ) : tab === 'audios' ? (
          tracks.length === 0
            ? <p className="text-sm text-gray-500 text-center py-8">{isOwnProfile ? 'Todavía no subiste ningún audio.' : 'Este usuario no tiene audios todavía.'}</p>
            : <div className="grid grid-cols-2 gap-3">{tracks.map(t => <AudioCard key={t.id} track={t} variant="large" />)}</div>

        ) : tab === 'colabs' ? (
          colabsLoading
            ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
            : !colabs || colabs.length === 0
              ? <p className="text-sm text-gray-500 text-center py-8">Todavía no hay colaboraciones.</p>
              : <div className="grid grid-cols-2 gap-3">{colabs.map(t => <AudioCard key={t.id} track={t} variant="large" />)}</div>

        ) : tab === 'likes' ? (
          <div className="py-12 text-center">
            <Heart className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Los likes todavía no están implementados.</p>
          </div>

        ) : tab === 'seguidores' ? (
          followersLoading
            ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
            : !followers || followers.length === 0
              ? <p className="text-sm text-gray-500 text-center py-8">Todavía no hay seguidores.</p>
              : <div className="space-y-2">{followers.map(u => <UserRow key={u.username} u={u} />)}</div>

        ) : tab === 'siguiendo' ? (
          followingLoading
            ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
            : !following || following.length === 0
              ? <p className="text-sm text-gray-500 text-center py-8">No sigue a nadie todavía.</p>
              : <div className="space-y-2">{following.map(u => <UserRow key={u.username} u={u} />)}</div>
        ) : null}
      </div>
    </div>
  );
}

function UserRow({ u }: { u: UserCard }) {
  const navigate = useNavigate();
  const { user, openLoginModal } = useAppStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIsFollowing(u.username).then(setIsFollowing);
  }, [u.username]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { openLoginModal(); return; }
    if (user.username === u.username) return;
    setLoading(true);
    try {
      if (isFollowing) { await unfollowUser(u.username); setIsFollowing(false); }
      else             { await followUser(u.username);   setIsFollowing(true); }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const isMe = user?.username === u.username;

  return (
    <div
      onClick={() => navigate(`/${u.username}`)}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
    >
      <div className="w-10 h-10 rounded-full gradient-cyan-lime flex items-center justify-center flex-shrink-0">
        <span className="text-navy-900 font-bold text-sm">{u.username[0].toUpperCase()}</span>
      </div>
      <p className="flex-1 text-sm font-medium text-white">@{u.username}</p>
      {!isMe && (
        <button
          onClick={handleFollow}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 disabled:opacity-50 ${
            isFollowing
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'
          }`}
        >
          {isFollowing ? <><UserCheck className="w-3 h-3" /> Siguiendo</> : <><UserPlus className="w-3 h-3" /> Seguir</>}
        </button>
      )}
    </div>
  );
}

interface Musician {
  username: string;
  avatar_url: string | null;
  instrument: string;
}

// Community page
export function ComunidadPage() {
  const { user, openLoginModal } = useAppStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recentTracks, setRecentTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetchGlobalActivity(),
      fetchAudioList(20, undefined, '-created_at'),
      fetchMyFollowing(),
    ])
      .then(([acts, tracks, following]) => {
        setActivities(acts);
        setRecentTracks(tracks);
        setFollowed(new Set(following));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFollowToggle = async (username: string) => {
    if (!user) { openLoginModal(() => handleFollowToggle(username)); return; }
    setFollowLoading(prev => new Set(prev).add(username));
    try {
      if (followed.has(username)) {
        await unfollowUser(username);
        setFollowed(prev => { const s = new Set(prev); s.delete(username); return s; });
      } else {
        await followUser(username);
        setFollowed(prev => new Set(prev).add(username));
      }
    } catch (err) {
      console.error('[follow] error:', err);
    } finally {
      setFollowLoading(prev => { const s = new Set(prev); s.delete(username); return s; });
    }
  };

  // Extract up to 5 unique users from recent tracks
  const musicians = useMemo<Musician[]>(() => {
    const seen = new Set<string>();
    const result: Musician[] = [];
    for (const t of recentTracks) {
      const username = t.artist.replace(/^@/, '');
      if (!seen.has(username)) {
        seen.add(username);
        result.push({ username, avatar_url: null, instrument: t.instrument });
      }
      if (result.length >= 5) break;
    }
    return result;
  }, [recentTracks]);

  return (
    <div className="px-4 pt-4 pb-32">
      <h1 className="text-xl font-bold text-white mb-1">Comunidad</h1>
      <p className="text-sm text-gray-400 mb-5">Músicos activos en RedPanal</p>

      {/* Global activity feed */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Actividad reciente</p>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-sm text-gray-500">Todavía no hay actividad en la comunidad.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.slice(0, 10).map(a => (
              <ActivityItem key={a.id} activity={a} mode="global" />
            ))}
          </div>
        )}
      </div>

      {/* Suggested musicians */}
      {musicians.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Músicos</p>
          <div className="space-y-2">
            {musicians.map(m => (
              <div key={m.username} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                {m.avatar_url ? (
                  <img
                    src={m.avatar_url}
                    alt={m.username}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full gradient-cyan-lime flex items-center justify-center flex-shrink-0">
                    <span className="text-navy-900 font-bold text-sm">
                      {m.username.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">@{m.username}</p>
                  {m.instrument && (
                    <p className="text-xs text-gray-500 truncate">{m.instrument}</p>
                  )}
                </div>
                <button
                  disabled={followLoading.has(m.username)}
                  onClick={() => handleFollowToggle(m.username)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 disabled:opacity-50 ${
                    followed.has(m.username)
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {followed.has(m.username)
                    ? <><UserCheck className="w-3 h-3" /> Siguiendo</>
                    : <><UserPlus className="w-3 h-3" /> Seguir</>
                  }
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// RedPanal info page
export function RedPanalPage() {
  return (
    <div className="px-4 pt-6 pb-32">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl gradient-cyan-lime mx-auto flex items-center justify-center mb-4">
          <span className="text-navy-900 font-bold text-2xl">RP</span>
        </div>
        <h1 className="text-2xl font-bold text-white">RedPanal</h1>
        <p className="text-gray-400 mt-2">Música libre y colaborativa</p>
      </div>

      <div className="space-y-4">
        {[
          { title: 'Un panal de música libre', body: 'RedPanal es una comunidad de músicxs que crean, comparten y colaboran con música libre. Todo el contenido se publica bajo licencias Creative Commons.' },
          { title: 'Colaborá sin pedir permiso', body: 'Con licencias CC podés remixar, versionar y agregar capas a cualquier audio de la comunidad. La colaboración no necesita aprobación — es un derecho.' },
          { title: 'Árbol de colaboraciones', body: 'Cada audio puede derivar en múltiples versiones y capas. El árbol registra quién colaboró con quién, construyendo la historia musical de la comunidad.' },
        ].map(s => (
          <div key={s.title} className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-white font-semibold mb-2">{s.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 text-center">
        <p className="text-cyan-400 font-semibold mb-1">Código abierto</p>
        <p className="text-sm text-gray-400">RedPanal es software libre. Podés contribuir en GitHub.</p>
      </div>
    </div>
  );
}
