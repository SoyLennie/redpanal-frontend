import { useState, useEffect } from 'react';
import { Play, Pause, Heart, Share2, Download, GitBranch, ChevronRight, Users, Loader2, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { fetchComments, postComment, fetchCollabTree, fetchPeaks, fetchAudioBySlug } from '@/api/audio';
import type { Comment, CollabNode } from '@/api/audio';
import { AgentPanel } from '@/components/AgentPanel';
import type { AudioTrack } from '@/types';

type Tab = 'historia' | 'comentarios' | 'info';
type CollabStep = null | 'choose' | 'record-layer' | 'upload-version';

const WAVEFORM_PLACEHOLDER = Array.from({ length: 50 }, () => 0.15);

const typeColors: Record<string, string> = {
  loop: 'from-fuchsia-500 to-purple-600',
  pista: 'from-amber-500 to-orange-600',
  cancion: 'from-emerald-500 to-green-600',
  sample: 'from-rose-500 to-pink-600'
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} días`;
}

export function ArchivoPage() {
  const { slug } = useParams<{ username: string; slug: string }>();
  const { currentTrack, isPlaying, playTrack, togglePlay, user, openLoginModal } = useAppStore();

  const [track, setTrack] = useState<AudioTrack | null>(
    // Use currentTrack as initial state if slug matches — avoids loading flash
    currentTrack?.id === slug ? currentTrack : null
  );
  const [loadingTrack, setLoadingTrack] = useState(!track);

  const [tab, setTab] = useState<Tab>('historia');
  const [liked, setLiked] = useState(false);
  const [collabStep, setCollabStep] = useState<CollabStep>(null);
  const [progress, setProgress] = useState(0.35);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [collabRoot, setCollabRoot] = useState<CollabNode | null>(null);
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [loadingTree, setLoadingTree] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(WAVEFORM_PLACEHOLDER);
  const [loadingWaveform, setLoadingWaveform] = useState(false);

  // Fetch audio data when slug changes
  useEffect(() => {
    if (!slug) return;
    // If currentTrack matches, use it directly; still fetch in background to get full data
    if (currentTrack?.id !== slug) {
      setTrack(null);
      setLoadingTrack(true);
    }
    fetchAudioBySlug(slug).then(data => {
      if (data) {
        setTrack(data);
        // Start playing if nothing is currently playing this track
        if (currentTrack?.id !== slug) playTrack(data);
      }
    }).finally(() => setLoadingTrack(false));
  }, [slug]);

  // Fetch comments, collab tree and waveform when slug/track changes
  useEffect(() => {
    if (!slug) return;
    setLoadingComments(true);
    fetchComments(slug)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoadingComments(false));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setLoadingTree(true);
    setCollabRoot(null);
    fetchCollabTree(slug)
      .then(setCollabRoot)
      .finally(() => setLoadingTree(false));
  }, [slug]);

  useEffect(() => {
    const pkId = track?.pkId;
    if (!pkId) return;
    setWaveform(WAVEFORM_PLACEHOLDER);
    setLoadingWaveform(true);
    fetchPeaks(pkId)
      .then(({ peaks }) => {
        if (!peaks.length) return;
        const max = Math.max(...peaks);
        const normalized = max > 1 ? peaks.map(p => Math.max(0.04, p / max)) : peaks;
        setWaveform(normalized);
      })
      .catch(() => {})
      .finally(() => setLoadingWaveform(false));
  }, [track?.pkId]);

  const isCurrentPlaying = isPlaying && currentTrack?.id === slug;

  const handlePostComment = async () => {
    if (!slug || !commentInput.trim() || postingComment) return;
    setPostingComment(true);
    setCommentError('');
    try {
      const newComment = await postComment(slug, commentInput.trim());
      setComments(prev => [...prev, newComment]);
      setCommentInput('');
    } catch {
      setCommentError('No se pudo publicar el comentario, intentá de nuevo');
    } finally {
      setPostingComment(false);
    }
  };

  const handleAddIAToTree = (node: CollabNode) => {
    setCollabRoot(prev => {
      if (!prev) return prev;
      return { ...prev, collaborations: [...prev.collaborations, node] };
    });
    setTab('historia');
  };

  const handlePlay = () => {
    if (!track) return;
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setProgress((e.clientX - rect.left) / rect.width);
  };

  if (loadingTrack) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pb-32">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center pb-32">
        <p className="text-gray-500 text-sm">Audio no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="pb-40 min-h-screen">
      {/* Waveform + Player */}
      <div className="px-4 pt-4 pb-4 border-b border-white/10">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${typeColors[track.type]} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-bold text-xs">{track.type.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg leading-tight">{track.title}</h1>
            <p className="text-cyan-400 text-sm">{track.artist}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span>{track.instrument}</span>
              <span>·</span>
              <span>{track.genre}</span>
              <span>·</span>
              <span>{track.duration}</span>
            </div>
          </div>
        </div>

        <div
          className={`flex items-end gap-px h-16 cursor-pointer rounded-lg overflow-hidden mb-2 transition-opacity duration-500 ${loadingWaveform ? 'opacity-40' : 'opacity-100'}`}
          onClick={handleWaveformClick}
        >
          {waveform.map((height, i) => {
            const isPast = i / waveform.length <= progress;
            return (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-colors ${isPast ? 'bg-cyan-400' : 'bg-white/15'}`}
                style={{ height: `${height * 100}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mb-3">
          <span>{formatTime(progress, track.duration)}</span>
          <span>{track.duration}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePlay}
            className="w-12 h-12 rounded-full gradient-cyan-lime flex items-center justify-center shadow-md"
          >
            {isCurrentPlaying ? <Pause className="w-5 h-5 text-navy-900" /> : <Play className="w-5 h-5 text-navy-900 ml-0.5" />}
          </button>

          <button
            onClick={() => setCollabStep('choose')}
            className="flex-1 py-3 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-cyan-500/25 transition-colors"
          >
            <GitBranch className="w-4 h-4" />
            Colaborar
          </button>

          <button onClick={() => setLiked(l => !l)} className={`w-10 h-10 rounded-xl flex items-center justify-center ${liked ? 'bg-rose-500/20' : 'bg-white/5'}`}>
            <Heart className={`w-5 h-5 ${liked ? 'text-rose-400 fill-rose-400' : 'text-gray-400'}`} />
          </button>
          <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-gray-400" />
          </button>
          <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Download className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={() => setAgentPanelOpen(true)}
            className="w-10 h-10 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center hover:bg-fuchsia-500/25 transition-colors"
          >
            <Sparkles className="w-5 h-5 text-fuchsia-400" />
          </button>
        </div>

        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          {(track.collaborations || 0) > 0 && (
            <span className="text-cyan-400">{track.collaborations} colaboraciones</span>
          )}
          <span>CC BY-SA</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['historia', 'comentarios', 'info'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors capitalize relative ${
              tab === t ? 'text-cyan-400' : 'text-gray-500'
            }`}
          >
            {t}
            {tab === t && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full gradient-cyan-lime" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4 pt-4">
        {tab === 'historia' && (
          <div>
            {loadingTree ? (
              <div className="py-8 text-center text-sm text-gray-500">Cargando árbol...</div>
            ) : !collabRoot ? (
              <div className="py-8 text-center text-sm text-gray-500">Sin colaboraciones todavía.</div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-4">
                  Árbol de colaboraciones — {countNodes(collabRoot) - 1} derivaciones
                </p>
                <CollabTreeNode node={collabRoot} depth={0} currentSlug={slug!} />
              </>
            )}
          </div>
        )}

        {tab === 'comentarios' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Los comentarios son permanentes y forman la historia del audio.</p>

            {loadingComments ? (
              <div className="py-8 text-center text-sm text-gray-500">Cargando comentarios...</div>
            ) : comments.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">Todavía no hay comentarios. Sé el primero.</div>
            ) : (
              comments.map(c => {
                const isAuthor = user?.username === c.user.username;
                return (
                  <div key={c.id} className={`p-3 rounded-xl ${isAuthor ? 'bg-cyan-500/5 border border-cyan-500/20' : 'bg-white/5'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      {c.user.avatar_url ? (
                        <img src={c.user.avatar_url} alt={c.user.username} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-gray-400">
                          {c.user.username[0].toUpperCase()}
                        </div>
                      )}
                      <span className={`text-sm font-medium ${isAuthor ? 'text-cyan-400' : 'text-white'}`}>
                        @{c.user.username}
                      </span>
                      {isAuthor && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">autor</span>}
                      <span className="text-xs text-gray-600 ml-auto">{timeAgo(c.created_at)}</span>
                    </div>
                    <p
                      className="text-sm text-gray-300 [&_a]:text-cyan-400 [&_a]:hover:underline"
                      dangerouslySetInnerHTML={{ __html: c.msg_html }}
                    />
                  </div>
                );
              })
            )}

            <div className="mt-4 space-y-2">
              <textarea
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                placeholder="Comentá, mencioná con @ o taggeá con #"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 resize-none"
              />
              {commentError && <p className="text-xs text-rose-400">{commentError}</p>}
              <button
                onClick={() => {
                  if (!user) { openLoginModal(() => handlePostComment()); return; }
                  handlePostComment();
                }}
                disabled={!commentInput.trim() || postingComment}
                className="px-5 py-2 rounded-xl gradient-cyan-lime text-navy-900 font-semibold text-sm disabled:opacity-40"
              >
                {postingComment ? 'Publicando...' : 'Comentar'}
              </button>
            </div>
          </div>
        )}

        {tab === 'info' && (
          <div className="space-y-3">
            {[
              { label: 'Instrumento', value: track.instrument },
              { label: 'Género', value: track.genre },
              { label: 'Tipo', value: track.type },
              { label: 'Duración', value: track.duration },
              { label: 'Licencia', value: 'Creative Commons BY-SA 4.0' },
            ].filter(row => row.value).map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-white/5">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm text-white">{value}</span>
              </div>
            ))}
            <div className="pt-2">
              <span className="text-sm text-gray-500 block mb-2">Tags</span>
              <div className="flex flex-wrap gap-2">
                {track.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-full bg-white/5 text-xs text-gray-400">#{tag}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collaboration bottom sheet */}
      {collabStep && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setCollabStep(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full bg-[#0f1f38] rounded-t-3xl p-6 pb-12"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            {collabStep === 'choose' && (
              <>
                <h3 className="text-white font-bold text-xl mb-1">Colaborar</h3>
                <p className="text-sm text-gray-400 mb-6">Con licencia CC podés colaborar sin pedir permiso. Tu trabajo queda registrado en el árbol.</p>
                <div className="space-y-3">
                  {[
                    { icon: '🎙', title: 'Grabar una capa nueva', desc: 'El audio original suena de fondo mientras grabás', action: 'record-layer' },
                    { icon: '📁', title: 'Subir algo que ya tenés', desc: 'Sube un archivo que preparaste previamente', action: 'upload-version' },
                    { icon: '🔀', title: 'Hacer una versión', desc: 'Descargá el original y publicá tu remix', action: 'upload-version' },
                  ].map(opt => (
                    <button
                      key={opt.title}
                      onClick={() => setCollabStep(opt.action as CollabStep)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors text-left"
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="flex-1">
                        <p className="text-white font-medium">{opt.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {collabStep === 'record-layer' && (
              <>
                <h3 className="text-white font-bold text-xl mb-1">Grabá una capa</h3>
                <p className="text-sm text-gray-400 mb-4">El original suena de guía mientras grabás</p>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 mb-5">
                  <button onClick={handlePlay} className="w-9 h-9 rounded-full gradient-cyan-lime flex items-center justify-center flex-shrink-0">
                    {isCurrentPlaying ? <Pause className="w-3.5 h-3.5 text-navy-900" /> : <Play className="w-3.5 h-3.5 text-navy-900" />}
                  </button>
                  <div className="flex-1">
                    <p className="text-xs text-white">{track.title} (guía)</p>
                    <div className="h-1 bg-white/10 rounded-full mt-1">
                      <div className="h-full gradient-cyan-lime rounded-full" style={{ width: `${progress * 100}%` }} />
                    </div>
                  </div>
                </div>
                <button className="w-full py-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-lg flex items-center justify-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  Grabar
                </button>
              </>
            )}

            {collabStep === 'upload-version' && (
              <>
                <h3 className="text-white font-bold text-xl mb-1">Subir colaboración</h3>
                <p className="text-sm text-gray-400 mb-5">Se va a vincular automáticamente al árbol de "{track.title}"</p>
                <label className="flex flex-col items-center gap-3 border-2 border-dashed border-white/20 rounded-2xl py-8 cursor-pointer hover:border-cyan-500/40 transition-colors">
                  <input type="file" accept="audio/*" className="hidden" />
                  <span className="text-3xl">🎵</span>
                  <div className="text-center">
                    <p className="text-white font-medium">Elegí tu archivo</p>
                    <p className="text-xs text-gray-500 mt-0.5">MP3, WAV, OGG, FLAC</p>
                  </div>
                </label>
              </>
            )}
          </div>
        </div>
      )}

      {/* Agent Panel */}
      {agentPanelOpen && track && (
        <AgentPanel
          track={track}
          onClose={() => setAgentPanelOpen(false)}
          onAddToTree={handleAddIAToTree}
        />
      )}
    </div>
  );
}

function countNodes(node: CollabNode): number {
  return 1 + node.collaborations.reduce((acc, c) => acc + countNodes(c), 0);
}

function CollabTreeNode({ node, depth, currentSlug }: { node: CollabNode; depth: number; currentSlug: string }) {
  const navigate = useNavigate();
  const { playTrack } = useAppStore();
  const isCurrent = node.slug === currentSlug;

  const handleNavigate = () => {
    if (!isCurrent) {
      playTrack({
        id:     node.slug,
        pkId:   node.id,
        title:  node.name,
        artist: `@${node.user.username}`,
        type:   node.use_type as 'loop' | 'pista' | 'cancion' | 'sample',
        instrument: '', genre: '', tags: [], duration: '0:00', status: 'published',
      });
      navigate(`/${node.user.username}/${node.slug}`);
    }
  };

  return (
    <div className={depth > 0 ? 'ml-5 pl-4 border-l border-white/10' : ''}>
      <div
        onClick={handleNavigate}
        className={`flex items-center gap-3 p-3 rounded-xl mb-2 transition-colors ${
          isCurrent
            ? 'bg-cyan-500/10 border border-cyan-500/20'
            : 'bg-white/5 cursor-pointer hover:bg-white/10'
        }`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
          isCurrent ? 'gradient-cyan-lime text-navy-900' : 'bg-white/10 text-gray-400'
        }`}>
          {node.use_type.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isCurrent ? 'text-white' : 'text-gray-300'}`}>
            {node.name}
            {isCurrent && <span className="ml-2 text-[10px] text-cyan-400 font-normal">← este</span>}
          </p>
          <p className="text-xs text-cyan-400">@{node.user.username}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {node.isIA && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 font-bold">
              IA
            </span>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            node.use_type === 'loop'   ? 'bg-fuchsia-500/20 text-fuchsia-400' :
            node.use_type === 'track'  ? 'bg-amber-500/20 text-amber-400' :
            node.use_type === 'song'   ? 'bg-emerald-500/20 text-emerald-400' :
            'bg-rose-500/20 text-rose-400'
          }`}>
            {node.use_type}
          </span>
          {node.collaborations.length > 0 && (
            <span className="text-[10px] text-gray-500 flex items-center gap-0.5 ml-1">
              <Users className="w-3 h-3" /> {node.collaborations.length}
            </span>
          )}
        </div>
      </div>
      {node.collaborations.map(child => (
        <CollabTreeNode key={child.id} node={child} depth={depth + 1} currentSlug={currentSlug} />
      ))}
    </div>
  );
}

function formatTime(ratio: number, duration: string) {
  const parts = duration.split(':').map(Number);
  const totalSeconds = parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0];
  const current = Math.floor(ratio * totalSeconds);
  const m = Math.floor(current / 60);
  const s = current % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
