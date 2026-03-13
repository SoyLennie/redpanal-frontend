import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { AudioCard } from '@/components/AudioCard';
import { fetchAudioSearch, fetchPopularTags } from '@/api/audio';
import type { AudioTrack } from '@/types';
import type { PopularTag } from '@/api/audio';

const DEBOUNCE_MS = 400;

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [results, setResults] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [tags, setTags] = useState<PopularTag[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetchPopularTags(16).then(setTags).catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await fetchAudioSearch(query.trim());
        setResults(data);
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleTagClick = (tagName: string) => {
    setQuery(tagName);
  };

  const clearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="px-4 pt-4 pb-32">
      {/* Search input */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscá por nombre, usuario o tag..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-10 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
        />
        {query && (
          <button
            onClick={clearQuery}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      )}

      {/* Results */}
      {!loading && searched && query.trim() && (
        <>
          <p className="text-xs text-gray-500 mb-3">
            {results.length === 0
              ? null
              : `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${query.trim()}"`}
          </p>

          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-gray-600" />
              </div>
              <p className="text-white font-semibold mb-1">Sin resultados</p>
              <p className="text-gray-500 text-sm">No encontramos nada para "{query.trim()}"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map(track => (
                <AudioCard key={track.id} track={track} variant="large" />
              ))}
            </div>
          )}
        </>
      )}

      {/* Initial state — show popular tags */}
      {!loading && !searched && (
        <>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Tags populares
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.slug}
                onClick={() => handleTagClick(tag.name)}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 hover:border-cyan-500/40 hover:text-cyan-400 transition-colors"
              >
                #{tag.name}
                <span className="ml-1.5 text-xs text-gray-600">{tag.count}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
