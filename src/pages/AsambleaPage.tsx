import { useState } from 'react';
import { Plus, Lock, Globe, MessageSquare, Send, X } from 'lucide-react';

interface Assembly {
  id: string;
  name: string;
  members: number;
  activeNow: number;
  lastMessage: string;
  lastTime: string;
  isPublic: boolean;
  anchoredAudio?: string;
  purpose?: string;
}

const publicAssemblies: Assembly[] = [
  { id: 'p1', name: 'General RedPanal', members: 847, activeNow: 23, lastMessage: '@dj_libre: ¿Alguien tiene loops de bombo a 95bpm?', lastTime: 'hace 3 min', isPublic: true },
  { id: 'p2', name: 'Folklore colaborativo', members: 134, activeNow: 8, lastMessage: '@folklorista: Subí un arpegío criolla nuevo', lastTime: 'hace 12 min', isPublic: true, anchoredAudio: 'Arpegios de guitarra criolla' },
  { id: 'p3', name: 'Loops y bases', members: 290, activeNow: 15, lastMessage: '@rhythmero: ¿Alguien quiere colaborar en un funk?', lastTime: 'hace 28 min', isPublic: true },
];

const myAssemblies: Assembly[] = [
  { id: 'm1', name: 'Proyecto cumbia', members: 4, activeNow: 2, lastMessage: 'vos: Subí la nueva versión del bajo', lastTime: 'hace 1 hora', isPublic: false, purpose: 'Armar un tema de cumbia entre 4' },
  { id: 'm2', name: 'Collab guitarra/bajo', members: 2, activeNow: 0, lastMessage: '@bajonero: Escuché tu loop, está perfecto', lastTime: 'hace 2 días', isPublic: false, purpose: 'Grabar guitarra y bajo juntos' },
];

const mockMessages: Record<string, Array<{ id: number; user: string; text: string; time: string; isMe?: boolean }>> = {
  p1: [
    { id: 1, user: '@rhythmero', text: 'Subí una base de batería funk nueva. Está en 120bpm, check it out', time: '14:23' },
    { id: 2, user: '@folklorista', text: 'Buenazo! Le voy a poner una guitarra criolla encima', time: '14:25' },
    { id: 3, user: '@dj_libre', text: '¿Alguien tiene loops de bombo a 95bpm?', time: '14:31' },
    { id: 4, user: 'vos', text: 'Mirá los de @bajonero, creo que tiene algo así', time: '14:33', isMe: true },
  ],
  p2: [
    { id: 1, user: '@cantora_libre', text: 'Este arpegío está re bien para una chacarera', time: '13:10' },
    { id: 2, user: '@folklorista', text: 'Gracias! Lo grabé con una Yamaha criolla, sin procesamiento', time: '13:12' },
  ],
  p3: [
    { id: 1, user: '@synthwave_ar', text: '¿Qué BPM prefieren para bases de trap?', time: '13:45' },
    { id: 2, user: '@rhythmero', text: 'Entre 140 y 160, yo voy a 145 generalmente', time: '13:47' },
    { id: 3, user: 'vos', text: '¿Alguien quiere colaborar en un funk?', time: '14:02', isMe: true },
  ],
  m1: [
    { id: 1, user: '@candomblero', text: 'Tengo la percusión lista, ¿cuándo la subo?', time: '10:30' },
    { id: 2, user: 'vos', text: 'Subí la nueva versión del bajo', time: '11:45', isMe: true },
  ],
  m2: [
    { id: 1, user: '@bajonero', text: 'Escuché tu loop, está perfecto', time: 'ayer' },
  ],
};

export function AsambleaPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPurpose, setNewPurpose] = useState('');

  const selectedPublic = publicAssemblies.find(a => a.id === selectedId);
  const selectedMine = myAssemblies.find(a => a.id === selectedId);
  const selected = selectedPublic || selectedMine;
  const messages = selectedId ? (mockMessages[selectedId] || []) : [];

  if (selected) {
    return (
      <div className="flex flex-col h-[calc(100vh-128px)] pb-safe">
        {/* Chat header */}
        <div className={`px-4 py-3 border-b border-white/10 ${!selected.isPublic ? 'bg-gray-900/50' : ''}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {selected.isPublic ? <Globe className="w-4 h-4 text-cyan-400" /> : <Lock className="w-4 h-4 text-gray-400" />}
                <h2 className="font-semibold text-white text-sm">{selected.name}</h2>
              </div>
              <p className="text-xs text-gray-500">
                {selected.activeNow > 0 ? `${selected.activeNow} activos ahora · ` : ''}{selected.members} miembros
              </p>
            </div>
          </div>

          {/* Privacy banner for private assemblies */}
          {!selected.isPublic && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-gray-800 border border-white/10">
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-gray-500" />
                Solo vos y las personas que invitaste pueden ver esta asamblea
              </p>
            </div>
          )}

          {/* Anchored audio */}
          {selected.anchoredAudio && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Anclado a</p>
                <p className="text-xs text-cyan-400 truncate">{selected.anchoredAudio}</p>
              </div>
            </div>
          )}

          {/* Purpose banner for private */}
          {selected.purpose && (
            <div className="mt-2 px-3 py-1.5 rounded-lg bg-white/5">
              <p className="text-xs text-gray-400">📌 {selected.purpose}</p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${m.isMe ? '' : ''}`}>
                {!m.isMe && (
                  <p className="text-xs text-cyan-400 mb-1 ml-1">{m.user}</p>
                )}
                <div className={`px-3 py-2 rounded-2xl ${
                  m.isMe
                    ? 'gradient-cyan-lime text-navy-900 rounded-tr-sm'
                    : 'bg-white/10 text-gray-200 rounded-tl-sm'
                }`}>
                  <p className="text-sm">{m.text}</p>
                </div>
                <p className="text-[10px] text-gray-600 mt-1 px-1">{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Message input */}
        <div className="px-4 py-3 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            placeholder="Escribí un mensaje... @menciones #tags"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
          />
          <button className="w-10 h-10 rounded-xl gradient-cyan-lime flex items-center justify-center flex-shrink-0">
            <Send className="w-4 h-4 text-navy-900" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-32">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-white">Asambleas</h1>
        <button
          onClick={() => setShowNewDialog(true)}
          className="w-9 h-9 rounded-xl gradient-cyan-lime flex items-center justify-center"
        >
          <Plus className="w-5 h-5 text-navy-900" />
        </button>
      </div>

      {/* Public assemblies section */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Asambleas abiertas</p>
        <div className="space-y-2">
          {publicAssemblies.map(a => (
            <AssemblyItem key={a.id} assembly={a} onClick={() => setSelectedId(a.id)} />
          ))}
        </div>
      </div>

      {/* My assemblies section */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Mis asambleas</p>
        <div className="space-y-2">
          {myAssemblies.map(a => (
            <AssemblyItem key={a.id} assembly={a} onClick={() => setSelectedId(a.id)} />
          ))}
        </div>
      </div>

      {/* New assembly dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowNewDialog(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full bg-[#0f1f38] rounded-t-3xl p-6 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <h3 className="text-white font-bold text-xl mb-1">Nueva asamblea</h3>
            <p className="text-sm text-gray-400 mb-5">Las asambleas privadas son donde coordinás en tiempo real. El resultado es lo que importa.</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ej: Jam de jazz nocturno"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Propósito *</label>
                <input
                  type="text"
                  value={newPurpose}
                  onChange={e => setNewPurpose(e.target.value)}
                  placeholder="Ej: mezcla del EP de fulano"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                />
                <p className="text-xs text-gray-600 mt-1">Obligatorio — les da contexto a los invitados</p>
              </div>
            </div>

            <button
              onClick={() => setShowNewDialog(false)}
              disabled={!newName || !newPurpose}
              className="w-full mt-5 py-3.5 rounded-2xl gradient-cyan-lime text-navy-900 font-bold disabled:opacity-40"
            >
              Crear asamblea
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AssemblyItem({ assembly, onClick }: { assembly: Assembly; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors text-left"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        assembly.isPublic ? 'bg-cyan-500/15' : 'bg-gray-700/50'
      }`}>
        {assembly.isPublic
          ? <Globe className="w-5 h-5 text-cyan-400" />
          : <Lock className="w-5 h-5 text-gray-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white truncate">{assembly.name}</p>
          {assembly.activeNow > 0 && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{assembly.lastMessage}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-[10px] text-gray-600">{assembly.lastTime}</p>
        {assembly.members > 10 && (
          <p className="text-[10px] text-gray-600">{assembly.members} miembros</p>
        )}
      </div>
    </button>
  );
}
