import { useState, useEffect, useMemo } from 'react';
import { Search, X, Mic, Play, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AudioCard } from '@/components/AudioCard';
import { useAppStore } from '@/store/appStore';
import { fetchAudioList, fetchPopularTags } from '@/api/audio';
import type { AudioTrack } from '@/types';
import type { PopularTag } from '@/api/audio';

const PILLS_VISIBLE = 8;

const placeholders = [
  'Buscá loops de batería...',
  'Buscá por @usuario...',
  'Buscá #folklorico...',
  'Buscá samples de voz...',
];

export function DescubriPage() {
  const navigate = useNavigate();

  // Home sections (no tag active)
  const [novedades, setNovedades] = useState<AudioTrack[]>([]);
  const [activos, setActivos] = useState<AudioTrack[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);

  // Tag-filtered section
  const [tagTracks, setTagTracks] = useState<AudioTrack[]>([]);
  const [loadingTag, setLoadingTag] = useState(false);

  // Tag pills
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);
  const [selectedTag, setSelectedTag] = useState<PopularTag | null>(null);
  const [tagSheetOpen, setTagSheetOpen] = useState(false);

  // Search
  const [search, setSearch] = useState('');
  const [placeholderIndex] = useState(() => Math.floor(Math.random() * placeholders.length));

  // Fetch popular tags once
  useEffect(() => {
    fetchPopularTags(20).then(setPopularTags);
  }, []);

  // Fetch home sections once on mount
  useEffect(() => {
    setLoadingHome(true);
    Promise.all([
      fetchAudioList(12, undefined, '-created_at'),
      fetchAudioList(12, undefined, '-id'),
    ])
      .then(([nov, act]) => {
        setNovedades(nov);
        setActivos(act);
      })
      .catch(() => {})
      .finally(() => setLoadingHome(false));
  }, []);

  // Fetch tag-filtered tracks when selectedTag changes
  useEffect(() => {
    if (!selectedTag) return;
    setLoadingTag(true);
    fetchAudioList(200, selectedTag.slug)
      .then(setTagTracks)
      .catch(() => {})
      .finally(() => setLoadingTag(false));
  }, [selectedTag]);

  const visiblePills = popularTags.slice(0, PILLS_VISIBLE);
  const hasMoreTags = popularTags.length > PILLS_VISIBLE;

  // All tracks for search (combine novedades + activos, deduplicate)
  const allLocalTracks = useMemo(() => {
    const seen = new Set<string>();
    return [...novedades, ...activos].filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [novedades, activos]);

  const searchResults = useMemo(() => {
    if (!search || search.length < 2) return null;
    const q = search.toLowerCase();
    const pool = selectedTag ? tagTracks : allLocalTracks;
    return {
      audios: pool.filter(t =>
        t.title.toLowerCase().includes(q) || t.tags.some(tag => tag.includes(q))
      ).slice(0, 4),
      musicians: [...new Set(
        pool.filter(t => t.artist.toLowerCase().includes(q)).map(t => t.artist)
      )].slice(0, 3),
      tags: [...new Set(
        pool.flatMap(t => t.tags).filter(tag => tag.includes(q))
      )].slice(0, 5),
    };
  }, [search, allLocalTracks, tagTracks, selectedTag]);

  const handleTagClick = (tag: PopularTag) => {
    setSelectedTag(prev => prev?.slug === tag.slug ? null : tag);
    setTagSheetOpen(false);
  };

  const clearTag = () => setSelectedTag(null);

  const isLoading = selectedTag ? loadingTag : loadingHome;
  const isEmpty = selectedTag
    ? !loadingTag && tagTracks.length === 0
    : !loadingHome && novedades.length === 0;

  return (
    <div className="pb-40 min-h-screen">
      {/* Sticky header: search + tag pills */}
      <div className="sticky top-16 z-30 bg-[#0a1628]/95 backdrop-blur-md">
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={placeholders[placeholderIndex]}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Tag pills */}
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {visiblePills.map(tag => (
            <button
              key={tag.slug}
              onClick={() => handleTagClick(tag)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedTag?.slug === tag.slug
                  ? 'gradient-cyan-lime text-navy-900 font-semibold'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:border-white/20'
              }`}
            >
              #{tag.name}
            </button>
          ))}
          {hasMoreTags && (
            <button
              onClick={() => setTagSheetOpen(true)}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-gray-400 bg-white/5 border border-white/10 hover:border-white/20 transition-all"
            >
              <Plus className="w-3 h-3" />
              más
            </button>
          )}
          {selectedTag && (
            <button
              onClick={clearTag}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 ml-1"
            >
              <X className="w-3 h-3" />
              limpiar
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {searchResults && search.length >= 2 && (
        <div className="px-4 space-y-4 pt-2">
          {searchResults.audios.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">🎵 Audios</p>
              <div className="space-y-2">
                {searchResults.audios.map(t => (
                  <AudioCard key={t.id} track={t} variant="large" />
                ))}
              </div>
            </div>
          )}
          {searchResults.musicians.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">👤 Músicos</p>
              <div className="flex flex-wrap gap-2">
                {searchResults.musicians.map(m => (
                  <span key={m} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-cyan-400">{m}</span>
                ))}
              </div>
            </div>
          )}
          {searchResults.tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">🏷 Tags</p>
              <div className="flex flex-wrap gap-2">
                {searchResults.tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      const found = popularTags.find(t => t.slug === tag || t.name === tag);
                      if (found) handleTagClick(found);
                      setSearch('');
                    }}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 hover:border-cyan-500/40 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          {searchResults.audios.length === 0 && searchResults.musicians.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No encontramos resultados para "{search}"</p>
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      {(!search || search.length < 2) && (
        <div className="pt-2">
          {isLoading ? (
            <div className="px-4 space-y-6">
              {[1, 2].map(i => (
                <div key={i}>
                  <div className="h-4 w-24 bg-white/5 rounded mb-3 animate-pulse" />
                  <div className="flex gap-3 overflow-hidden">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="flex-shrink-0 w-36 aspect-square rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-white font-semibold mb-2">
                {selectedTag ? `No hay audios con #${selectedTag.name}` : 'Todavía no hay contenido'}
              </h3>
              <p className="text-gray-500 text-sm mb-4">¿Querés ser el primero?</p>
              <button
                onClick={() => navigate('/grabar')}
                className="px-6 py-2.5 rounded-full gradient-cyan-lime text-navy-900 text-sm font-semibold"
              >
                Grabar ahora
              </button>
            </div>
          ) : selectedTag ? (
            <div className="px-4 space-y-6">
              <ScrollSection
                title={`#${selectedTag.name} — ${tagTracks.length} audios`}
                tracks={tagTracks}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <ScrollSection title="🕐 Novedades" tracks={novedades} />
              <ScrollSection title="🔥 Activos" tracks={activos} />
            </div>
          )}
        </div>
      )}

      {/* "+ más tags" bottom sheet */}
      {tagSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setTagSheetOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full bg-[#0f1f38] rounded-t-3xl p-6 pb-10 max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-lg">Tags populares</h3>
              {selectedTag && (
                <button onClick={clearTag} className="text-xs text-rose-400 flex items-center gap-1">
                  <X className="w-3 h-3" /> limpiar filtro
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {popularTags.map(tag => (
                <button
                  key={tag.slug}
                  onClick={() => handleTagClick(tag)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all ${
                    selectedTag?.slug === tag.slug
                      ? 'gradient-cyan-lime text-navy-900 font-semibold'
                      : 'bg-white/5 border border-white/10 text-gray-300 hover:border-white/20'
                  }`}
                >
                  <span>#{tag.name}</span>
                  <span className={`text-[10px] ${selectedTag?.slug === tag.slug ? 'text-navy-900/70' : 'text-gray-500'}`}>
                    {tag.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScrollSection({ title, tracks }: { title: string; tracks: AudioTrack[] }) {
  const { playTrack } = useAppStore();

  return (
    <div>
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <button
          onClick={() => tracks.length > 0 && playTrack(tracks[0], tracks.slice(1))}
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Play className="w-3 h-3 fill-cyan-400" />
          Reproducir todo
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide">
        {tracks.map(track => (
          <AudioCard key={track.id} track={track} />
        ))}
      </div>
    </div>
  );
}
