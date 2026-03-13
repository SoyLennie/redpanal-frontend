import type { AudioTrack } from '@/types';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const USE_TYPE_MAP: Record<string, AudioTrack['type']> = {
  loop:   'loop',
  track:  'pista',
  song:   'cancion',
  sample: 'sample',
};

function formatDuration(totalframes: number | null, samplerate: number | null): string {
  if (!totalframes || !samplerate) return '0:00';
  const seconds = Math.floor(totalframes / samplerate);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAudio(a: any): AudioTrack {
  return {
    id:           a.slug,
    pkId:         a.id,
    audioUrl:     a.audio,
    title:        a.name,
    artist:       `@${a.user.username}`,
    type:         USE_TYPE_MAP[a.use_type] ?? 'loop',
    instrument:   a.instrument || '',
    genre:        a.genre || '',
    duration:     formatDuration(a.totalframes, a.samplerate),
    tags:         a.tags ?? [],
    status:       'published',
    collaborations: 0,
  };
}

export interface PeaksResponse {
  peaks: number[];
  duration: number | null;
}

export async function fetchPeaks(pkId: number): Promise<PeaksResponse> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/a/${pkId}/peaks/`);
  if (!res.ok) return { peaks: [], duration: null };
  return res.json();
}

export async function fetchAudioBySlug(slug: string): Promise<AudioTrack | null> {
  try {
    const res = await fetch(`${API_BASE}/audio/by-slug/${encodeURIComponent(slug)}/`);
    if (!res.ok) return null;
    return mapAudio(await res.json());
  } catch {
    return null;
  }
}

export async function fetchAudioList(
  pageSize = 100,
  tag?: string,
  ordering?: '-created_at' | '-id',
): Promise<AudioTrack[]> {
  const qs = new URLSearchParams({ page_size: String(pageSize) });
  if (tag) qs.set('tag', tag);
  if (ordering) qs.set('ordering', ordering);
  const res = await fetch(`${API_BASE}/audio/list/?${qs}`);
  if (!res.ok) throw new Error('Error cargando audios');
  const data = await res.json();
  const results = Array.isArray(data) ? data : (data.results ?? []);
  return results.map(mapAudio);
}

export async function fetchAudioSearch(query: string, pageSize = 40): Promise<AudioTrack[]> {
  const qs = new URLSearchParams({ search: query, page_size: String(pageSize) });
  const res = await fetch(`${API_BASE}/audio/list/?${qs}`);
  if (!res.ok) throw new Error('Error en búsqueda');
  const data = await res.json();
  const results = Array.isArray(data) ? data : (data.results ?? []);
  return results.map(mapAudio);
}

export interface UserStats {
  username: string;
  followers_count: number;
  following_count: number;
}

export async function fetchUserStats(username: string): Promise<UserStats | null> {
  try {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}/stats/`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchUserAudios(username: string): Promise<{ count: number; tracks: AudioTrack[] }> {
  const res = await fetch(`${API_BASE}/audio/list/?user=${encodeURIComponent(username)}&page_size=200`);
  if (!res.ok) throw new Error('Error cargando audios del usuario');
  const data = await res.json();
  const results = Array.isArray(data) ? data : (data.results ?? []);
  const count = Array.isArray(data) ? results.length : (data.count ?? results.length);
  return { count, tracks: results.map(mapAudio) };
}

export interface PopularTag {
  name: string;
  slug: string;
  count: number;
}

export async function fetchPopularTags(limit = 20): Promise<PopularTag[]> {
  try {
    const res = await fetch(`${API_BASE}/tags/popular/?limit=${limit}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export interface Comment {
  id: number;
  msg_html: string;
  user: { id: number; username: string; avatar_url: string | null };
  created_at: string;
}

function getToken(): string | null {
  return localStorage.getItem('redpanal_token');
}

export async function fetchComments(slug: string): Promise<Comment[]> {
  const res = await fetch(`${API_BASE}/audio/${slug}/comments/`);
  if (!res.ok) throw new Error('Error al cargar comentarios');
  return res.json();
}

export interface CollabNode {
  id: number;
  slug: string;
  name: string;
  user: { id: number; username: string; avatar_url: string | null };
  use_type: string;
  isIA?: boolean;
  collaborations: CollabNode[];
}

export async function fetchCollabTree(slug: string): Promise<CollabNode | null> {
  try {
    const res = await fetch(`${API_BASE}/audio/${slug}/collab-tree/`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface UploadFields {
  name: string;
  use_type?: string;
  genre?: string;
  instrument?: string;
  description?: string;
  license?: string;
}

export interface UploadError {
  status: number;
  body: string;
}

export function uploadAudio(
  file: File,
  fields: UploadFields,
  onProgress?: (percent: number) => void,
): Promise<{ id: number; slug: string; name: string; use_type: string; audio: string }> {
  const token = getToken();
  const fd = new FormData();
  fd.append('audio', file);
  fd.append('name', fields.name);
  fd.append('use_type', fields.use_type ?? 'other');
  if (fields.genre)       fd.append('genre', fields.genre);
  if (fields.instrument)  fd.append('instrument', fields.instrument);
  if (fields.description) fd.append('description', fields.description);
  fd.append('license', fields.license ?? 'CC-BY-SA-4.0');
  // taggit_serializer requires the field to be present even when empty
  fd.append('tags', '[]');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/audio/`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 201) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject({ status: xhr.status, body: xhr.responseText } as UploadError);
      }
    };

    xhr.onerror = () => reject({ status: 0, body: 'Error de red' } as UploadError);
    xhr.send(fd);
  });
}

export async function fetchMyFollowing(): Promise<string[]> {
  const token = getToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE}/users/following/me/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function followUser(username: string): Promise<void> {
  const token = getToken();
  console.log('[followUser] token:', token ? 'present' : 'null', 'username:', username);
  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}/follow/`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  console.log('[followUser] status:', res.status);
  if (!res.ok) {
    const body = await res.text();
    console.error('[followUser] error body:', body);
    throw new Error(`Error al seguir usuario: ${res.status}`);
  }
}

export async function unfollowUser(username: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}/follow/`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Error al dejar de seguir');
}

export async function postComment(slug: string, msg: string): Promise<Comment> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/audio/${slug}/comments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ msg }),
  });
  if (!res.ok) throw new Error('Error al publicar comentario');
  return res.json();
}
