import { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Sparkles, Send, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { AudioTrack } from '@/types';
import type { CollabNode } from '@/api/audio';
import { Z } from '@/lib/zIndex';

// ── Agent definitions ────────────────────────────────────────────────────────

interface Agent {
  id: string;
  name: string;
  role: string;
  style: string;
  description: string;
  avatar: string;
  type: 'overdub' | 'remix';
  processingMessages: string[];
  chatOpener: (trackTitle: string) => string;
  mockReplies: string[];
}

const AGENTS: Agent[] = [
  {
    id: 'guitarist-blues',
    name: 'Carlos Overdrive',
    role: 'Guitarrista',
    style: 'Blues / Rock',
    description: 'Líneas expresivas con vibrato característico. Influencias: BB King, Hendrix.',
    avatar: '🎸',
    type: 'overdub',
    processingMessages: [
      'Escuchando tu track...',
      'Buscando el feeling...',
      'Grabando la línea de guitarra...',
      'Ajustando el vibrato...',
      'Casi listo...',
    ],
    chatOpener: (title) =>
      `Escuché "${title}". Tiene buena energía. ¿Querés algo más crudo y directo, o preferís una línea más melódica?`,
    mockReplies: [
      'Perfecto. Voy a ir por algo más crudo entonces — distorsión suave, notas largas con vibrato al final de cada frase.',
      'Me gusta esa idea. ¿En qué escala venís? Si es menor natural te puedo tirar algo muy oscuro.',
      'Dale, arranco grabando. Voy a hacer una toma limpia y una con más feeling, vos elegís cuál te sirve más.',
      'Listo, generando la pista ahora...',
    ],
  },
  {
    id: 'drummer-groove',
    name: 'Martina Groove',
    role: 'Baterista',
    style: 'Funk / Soul',
    description: 'Patrones tight con ghost notes. Hace que cualquier track se mueva.',
    avatar: '🥁',
    type: 'overdub',
    processingMessages: [
      'Escuchando el tempo...',
      'Analizando el groove...',
      'Marcando el kick y el snare...',
      'Agregando ghost notes...',
      'Casi listo...',
    ],
    chatOpener: (title) =>
      `Escuché "${title}". El tempo me habla. ¿Querés un groove más suelto y funky, o algo más tight y cuadrado?`,
    mockReplies: [
      'Buena elección. Voy por algo funky — mucho hi-hat abierto y ghost notes en el snare para que respire.',
      'Perfecto. ¿Tenés alguna referencia de baterista? Puedo acercarme más a un estilo específico.',
      'Me gusta trabajar así. Arranco con un patrón base y después veo dónde agregar variaciones.',
      'Generando la pista de batería ahora...',
    ],
  },
  {
    id: 'producer-funk',
    name: 'DJ Síntesis',
    role: 'Productor',
    style: 'Funk',
    description: 'Remixes que conservan la esencia pero le dan un nuevo cuerpo. Influencias: James Brown, Prince.',
    avatar: '🎛️',
    type: 'remix',
    processingMessages: [
      'Analizando la estructura...',
      'Cortando y reorganizando...',
      'Agregando capas de bajo funk...',
      'Poniendo el groove...',
      'Casi listo...',
    ],
    chatOpener: (title) =>
      `"${title}" tiene potencial. Lo puedo llevar a algo más bailable sin perder la esencia. ¿Qué tanto querés alejarte del original?`,
    mockReplies: [
      'Bien, voy a respetar la estructura pero meterle más cuerpo abajo — bajo más pesado, percusión más marcada.',
      '¿Tenés BPM definido o lo agarro yo? Puedo ajustarlo para que se mueva mejor en la pista.',
      'Perfecto. Mi idea es tomar el riff principal y construir alrededor. El original queda como columna vertebral.',
      'Empezando el remix ahora...',
    ],
  },
  {
    id: 'producer-soul',
    name: 'Ana Reverb',
    role: 'Productora',
    style: 'Soul / R&B',
    description: 'Arreglos con calidez analógica. Especialista en voces y capas atmosféricas.',
    avatar: '🎹',
    type: 'remix',
    processingMessages: [
      'Escuchando con atención...',
      'Diseñando el arreglo...',
      'Agregando texturas atmosféricas...',
      'Mezclando capas de voz...',
      'Casi listo...',
    ],
    chatOpener: (title) =>
      `"${title}" tiene algo especial. Puedo envolver eso en calidez analógica. ¿Querés mantener el mood, o lo llevamos hacia algo más oscuro?`,
    mockReplies: [
      'Me alegra. Voy a trabajar con reverbs grandes y un pad suave de fondo — crea profundidad sin saturar.',
      'Perfecto. ¿Hay voces en el track? Si las hay, las puedo procesar por separado para que vuelen.',
      'Mi enfoque es que cada elemento tenga su espacio. Cuando termino, cada cosa se escucha con claridad.',
      'Empezando el arreglo ahora...',
    ],
  },
];

// ── Types ────────────────────────────────────────────────────────────────────

type Screen =
  | { id: 'panel' }
  | { id: 'processing'; agent: Agent }
  | { id: 'result'; agent: Agent }
  | { id: 'chat'; agent: Agent }
  | { id: 'free-chat' };

interface ChatMessage {
  role: 'agent' | 'user' | 'system';
  text: string;
}

interface AgentPanelProps {
  track: AudioTrack;
  onClose: () => void;
  onAddToTree: (node: CollabNode) => void;
}

// ── AgentPanel ───────────────────────────────────────────────────────────────

export function AgentPanel({ track, onClose, onAddToTree }: AgentPanelProps) {
  const [screen, setScreen] = useState<Screen>({ id: 'panel' });

  const handleFantasia = (agent: Agent) => {
    setScreen({ id: 'processing', agent });
  };

  const handleChat = (agent: Agent) => {
    setScreen({ id: 'chat', agent });
  };

  const handleProcessingDone = (agent: Agent) => {
    setScreen({ id: 'result', agent });
  };

  const handleAddToTree = (agent: Agent) => {
    const mockNode: CollabNode = {
      id: Date.now(),
      slug: `ia-${agent.id}-${Date.now()}`,
      name: `${agent.name} — overdub de "${track.title}"`,
      audio: null,
      user: { id: 0, username: agent.name, avatar_url: null },
      use_type: agent.type === 'overdub' ? 'loop' : 'song',
      isIA: true,
      collaborations: [],
    };
    onAddToTree(mockNode);
    onClose();
  };

  if (screen.id === 'processing') {
    return (
      <ProcessingScreen
        agent={screen.agent}
        track={track}
        onDone={() => handleProcessingDone(screen.agent)}
      />
    );
  }

  if (screen.id === 'result') {
    return (
      <ResultScreen
        agent={screen.agent}
        track={track}
        onAddToTree={() => handleAddToTree(screen.agent)}
        onDiscard={onClose}
      />
    );
  }

  if (screen.id === 'chat') {
    return (
      <ChatScreen
        agent={screen.agent}
        track={track}
        onBack={() => setScreen({ id: 'panel' })}
        onGenerate={() => setScreen({ id: 'processing', agent: screen.agent })}
      />
    );
  }

  if (screen.id === 'free-chat') {
    return (
      <FreeChatScreen
        track={track}
        onBack={() => setScreen({ id: 'panel' })}
        onGenerate={() => {
          // Free chat: use a generic agent for processing
          setScreen({ id: 'processing', agent: AGENTS[0] });
        }}
      />
    );
  }

  // ── Panel screen ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex items-end" style={{ zIndex: Z.agentPanel }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full bg-[#0f1f38] rounded-t-3xl p-5 pb-10 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-fuchsia-400" />
              Agentes IA
            </h2>
            <p className="text-tertiary text-xs mt-0.5">Colaborá con músicos virtuales en "{track.title}"</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-secondary" />
          </button>
        </div>

        {/* Agent cards */}
        <div className="space-y-3 mb-6">
          {AGENTS.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onFantasia={() => handleFantasia(agent)}
              onChat={() => handleChat(agent)}
            />
          ))}
        </div>

        {/* Free chat */}
        <button
          onClick={() => setScreen({ id: 'free-chat' })}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-fuchsia-500/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div className="text-left">
              <p className="text-white font-medium text-sm">Chat libre</p>
              <p className="text-tertiary text-xs">Pedí lo que quieras sin personaje asignado</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-tertiary" />
        </button>
      </div>
    </div>
  );
}

// ── AgentCard ────────────────────────────────────────────────────────────────

function AgentCard({
  agent,
  onFantasia,
  onChat,
}: {
  agent: Agent;
  onFantasia: () => void;
  onChat: () => void;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl leading-none">{agent.avatar}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-semibold text-sm">{agent.name}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-400 font-medium">
              {agent.role}
            </span>
            <span className="text-[10px] text-tertiary">{agent.style}</span>
          </div>
          <p className="text-xs text-secondary mt-1 leading-relaxed">{agent.description}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onFantasia}
          className="flex-1 py-2.5 rounded-xl gradient-cyan-lime text-navy-900 text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Tirame fantasía
        </button>
        <button
          onClick={onChat}
          className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs font-medium hover:border-white/20 transition-colors"
        >
          Quiero charlar
        </button>
      </div>
    </div>
  );
}

// ── ProcessingScreen ─────────────────────────────────────────────────────────

const TOTAL_DURATION_MS = 8000;

function ProcessingScreen({
  agent,
  track,
  onDone,
}: {
  agent: Agent;
  track: AudioTrack;
  onDone: () => void;
}) {
  const [msgIndex, setMsgIndex] = useState(0);
  const msgs = agent.processingMessages;

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => Math.min(i + 1, msgs.length - 1));
    }, TOTAL_DURATION_MS / msgs.length);

    const timeout = setTimeout(onDone, TOTAL_DURATION_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-navy-900 flex flex-col items-center justify-center px-6 text-center" style={{ zIndex: Z.agentPanel }}>
      {/* Avatar */}
      <div className="text-6xl mb-4">{agent.avatar}</div>
      <h2 className="text-white font-bold text-xl mb-1">{agent.name}</h2>
      <p className="text-tertiary text-sm mb-2">{agent.role} · {agent.style}</p>

      {/* Track badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <span className="text-xs text-secondary truncate max-w-[200px]">{track.title}</span>
      </div>

      {/* Animated waveform */}
      <div className="flex items-end justify-center gap-1 h-16 mb-8">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full bg-fuchsia-500/70"
            style={{
              height: `${30 + Math.sin(i * 0.7) * 25}%`,
              animation: `pulse 0.8s ease-in-out ${i * 0.06}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Cycling message */}
      <p className="text-fuchsia-300 text-sm font-medium min-h-[1.5rem] transition-all duration-500">
        {msgs[msgIndex]}
      </p>
      <p className="text-tertiary text-xs mt-2">No cerrés esta pantalla</p>

      <style>{`
        @keyframes pulse {
          from { transform: scaleY(0.4); opacity: 0.6; }
          to   { transform: scaleY(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  );
}

// ── ResultScreen ─────────────────────────────────────────────────────────────

function ResultScreen({
  agent,
  track,
  onAddToTree,
  onDiscard,
}: {
  agent: Agent;
  track: AudioTrack;
  onAddToTree: () => void;
  onDiscard: () => void;
}) {
  const { isPlaying, currentTrack, togglePlay, playTrack } = useAppStore();
  const isThisPlaying = isPlaying && currentTrack?.id === track.id;

  const handlePreviewPlay = () => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  return (
    <div className="fixed inset-0 flex items-end" style={{ zIndex: Z.agentPanel }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full bg-[#0f1f38] rounded-t-3xl p-6 pb-10">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-4xl">{agent.avatar}</span>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">
              {agent.name} terminó su trabajo
            </h3>
            <p className="text-tertiary text-xs">
              {agent.type === 'overdub' ? 'Overdub' : 'Remix'} · {agent.style}
            </p>
          </div>
          <span className="ml-auto text-[10px] px-2 py-1 rounded-full bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 font-bold">
            IA
          </span>
        </div>

        {/* Mini player (mock) */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 mb-5">
          <button
            onClick={handlePreviewPlay}
            className="w-10 h-10 rounded-full gradient-cyan-lime flex items-center justify-center flex-shrink-0"
          >
            {isThisPlaying
              ? <Pause className="w-4 h-4 text-navy-900" />
              : <Play className="w-4 h-4 text-navy-900 ml-0.5" />
            }
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {agent.name} — sobre "{track.title}"
            </p>
            <p className="text-[10px] text-tertiary mt-0.5">Preview · {track.duration}</p>
            {/* Static waveform */}
            <div className="flex items-end gap-px h-5 mt-1.5">
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${isThisPlaying ? 'bg-cyan-400' : 'bg-white/20'}`}
                  style={{ height: `${30 + Math.abs(Math.sin(i * 0.4) * 70)}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onAddToTree}
            className="w-full py-3.5 rounded-2xl gradient-cyan-lime text-navy-900 font-bold text-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Agregar al árbol de colaboraciones
          </button>
          <button
            onClick={onDiscard}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-secondary text-sm hover:border-white/20 transition-colors"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ChatScreen ───────────────────────────────────────────────────────────────

function ChatScreen({
  agent,
  track,
  onBack,
  onGenerate,
}: {
  agent: Agent;
  track: AudioTrack;
  onBack: () => void;
  onGenerate: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'agent', text: agent.chatOpener(track.title) },
  ]);
  const [input, setInput] = useState('');
  const [replyIndex, setReplyIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');

    // Mock agent reply after short delay
    setTimeout(() => {
      const reply = agent.mockReplies[replyIndex % agent.mockReplies.length];
      setReplyIndex(i => i + 1);
      setMessages(prev => [...prev, { role: 'agent', text: reply }]);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-navy-900 flex flex-col" style={{ zIndex: Z.agentPanel }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 flex-shrink-0">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5">
          <X className="w-4 h-4 text-secondary" />
        </button>
        <span className="text-xl">{agent.avatar}</span>
        <div>
          <p className="text-white font-semibold text-sm">{agent.name}</p>
          <p className="text-tertiary text-xs">{agent.role} · {agent.style}</p>
        </div>
      </div>

      {/* Track context badge */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white/3 border-b border-white/5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
        <span className="text-xs text-tertiary truncate">Hablando sobre: {track.title}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} agentName={agent.name} agentAvatar={agent.avatar} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Generate button */}
      <div className="px-4 pt-2 pb-2 border-t border-white/10 flex-shrink-0">
        <button
          onClick={onGenerate}
          className="w-full py-3 rounded-xl gradient-cyan-lime text-navy-900 font-bold text-sm flex items-center justify-center gap-2 mb-2"
        >
          <Sparkles className="w-4 h-4" />
          Generar con {agent.name}
        </button>
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-4 pb-8 pt-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Respondé..."
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-10 h-10 rounded-full gradient-cyan-lime flex items-center justify-center disabled:opacity-40 flex-shrink-0"
        >
          <Send className="w-4 h-4 text-navy-900" />
        </button>
      </div>
    </div>
  );
}

// ── FreeChatScreen ───────────────────────────────────────────────────────────

function FreeChatScreen({
  track,
  onBack,
  onGenerate,
}: {
  track: AudioTrack;
  onBack: () => void;
  onGenerate: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', text: `Estoy viendo "${track.title}". ¿Qué querés hacer con él?` },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const freeReplies = [
    'Interesante idea. Puedo trabajar con eso. ¿Tenés alguna referencia de estilo en mente?',
    'Perfecto. Voy a analizar la estructura armónica y rítmica del track para encontrar el mejor approach.',
    'Me gusta. ¿Querés mantener el tempo original o lo podemos ajustar un poco?',
    'Entendido. Dame un segundo y armo algo en esa dirección.',
  ];
  const [replyIndex, setReplyIndex] = useState(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setTimeout(() => {
      const reply = freeReplies[replyIndex % freeReplies.length];
      setReplyIndex(i => i + 1);
      setMessages(prev => [...prev, { role: 'system', text: reply }]);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-navy-900 flex flex-col" style={{ zIndex: Z.agentPanel }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 flex-shrink-0">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5">
          <X className="w-4 h-4 text-secondary" />
        </button>
        <span className="text-xl">💬</span>
        <div>
          <p className="text-white font-semibold text-sm">Chat libre</p>
          <p className="text-tertiary text-xs">Sin personaje asignado</p>
        </div>
      </div>

      {/* Track context badge */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white/3 border-b border-white/5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
        <span className="text-xs text-tertiary truncate">Hablando sobre: {track.title}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} agentName="Sistema" agentAvatar="💬" />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Generate button */}
      <div className="px-4 pt-2 pb-2 border-t border-white/10 flex-shrink-0">
        <button
          onClick={onGenerate}
          className="w-full py-3 rounded-xl gradient-cyan-lime text-navy-900 font-bold text-sm flex items-center justify-center gap-2 mb-2"
        >
          <Sparkles className="w-4 h-4" />
          Generar
        </button>
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-4 pb-8 pt-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="¿Qué querés hacer?"
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-10 h-10 rounded-full gradient-cyan-lime flex items-center justify-center disabled:opacity-40 flex-shrink-0"
        >
          <Send className="w-4 h-4 text-navy-900" />
        </button>
      </div>
    </div>
  );
}

// ── ChatBubble ───────────────────────────────────────────────────────────────

function ChatBubble({
  msg,
  agentName,
  agentAvatar,
}: {
  msg: ChatMessage;
  agentName: string;
  agentAvatar: string;
}) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-cyan-500/20 border border-cyan-500/30">
          <p className="text-sm text-white">{msg.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <span className="text-lg flex-shrink-0 mt-0.5">{agentAvatar}</span>
      <div className="max-w-[80%]">
        <p className="text-[10px] text-tertiary mb-1 font-medium">{agentName}</p>
        <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-white/5 border border-white/10">
          <p className="text-sm text-gray-200 leading-relaxed">{msg.text}</p>
        </div>
      </div>
    </div>
  );
}
