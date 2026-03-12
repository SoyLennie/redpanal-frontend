import { useState } from 'react';
import { Mic, Upload, ChevronRight, Loader2, AlertCircle, X, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { uploadAudio } from '@/api/audio';
import type { UploadError } from '@/api/audio';
import type { AudioTrack } from '@/types';

type Step = 'choose' | 'record' | 'upload' | 'metadata' | 'processing';

// Maps frontend display values to backend use_type values
const FRONTEND_TO_USE_TYPE: Record<string, string> = {
  loop:    'loop',
  sample:  'sample',
  cancion: 'song',
  pista:   'track',
};

// Maps backend use_type to frontend AudioType
const USE_TYPE_TO_AUDIO_TYPE: Record<string, AudioTrack['type']> = {
  loop:   'loop',
  track:  'pista',
  song:   'cancion',
  sample: 'sample',
};

export function GrabarPage() {
  const { user, openLoginModal, playTrack, setPage } = useAppStore();

  const [step, setStep] = useState<Step>('choose');
  const [name, setName] = useState('');
  const [audioType, setAudioType] = useState('');
  const [genre, setGenre] = useState('');
  const [instrument, setInstrument] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'processing'>('uploading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const handlePublish = async () => {
    if (!user) {
      openLoginModal();
      return;
    }
    if (!selectedFile || !name) return;

    setErrorMessage('');
    setStep('processing');
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      const data = await uploadAudio(
        selectedFile,
        {
          name,
          use_type: FRONTEND_TO_USE_TYPE[audioType] ?? undefined,
          genre:      genre      || undefined,
          instrument: instrument || undefined,
        },
        (percent) => setUploadProgress(percent),
      );

      // Upload done — show processing animation briefly, then navigate
      setUploadStatus('processing');
      setTimeout(() => {
        const newTrack: AudioTrack = {
          id:          data.slug,
          pkId:        data.id,
          audioUrl:    data.audio,
          title:       data.name,
          artist:      `@${user.username}`,
          type:        USE_TYPE_TO_AUDIO_TYPE[data.use_type] ?? 'loop',
          instrument:  instrument || '',
          genre:       genre || '',
          duration:    '0:00',
          tags:        tags.split(',').map(t => t.trim()).filter(Boolean),
          status:      'published',
          collaborations: 0,
        };
        playTrack(newTrack);
        setPage('archivo');
        // Reset form for next use
        setStep('choose');
        setName('');
        setAudioType('');
        setGenre('');
        setInstrument('');
        setTags('');
        setSelectedFile(null);
        setUploadProgress(0);
      }, 1500);

    } catch (err) {
      const e = err as UploadError;
      setStep('metadata');
      if (e.status === 403 || e.status === 401) {
        openLoginModal();
      } else {
        let msg = 'Error al publicar. Intentá de nuevo.';
        try {
          const parsed = JSON.parse(e.body);
          // DRF returns field errors as { field: ["msg"] } or { detail: "msg" }
          const first = Object.values(parsed)[0];
          if (Array.isArray(first)) msg = first[0] as string;
          else if (typeof first === 'string') msg = first;
          else if (typeof parsed.detail === 'string') msg = parsed.detail;
        } catch { /* use default */ }
        setErrorMessage(msg);
      }
    }
  };

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setStep('record');
    } else {
      setIsRecording(true);
      setRecordingTime(0);
      const t = setInterval(() => {
        setRecordingTime(s => {
          if (s >= 120) { clearInterval(t); setIsRecording(false); return s; }
          return s + 1;
        });
      }, 1000);
    }
  };

  const formatRecTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Processing / uploading screen ──────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center pb-32">
        <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-5">
          {uploadStatus === 'uploading' ? (
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle
                  cx="32" cy="32" r="28"
                  fill="none" stroke="#00d4ff" strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - uploadProgress / 100)}`}
                  className="transition-all duration-300"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-cyan-400">
                {uploadProgress}%
              </span>
            </div>
          ) : (
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          )}
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          {uploadStatus === 'uploading' ? 'Subiendo tu audio...' : 'Procesando...'}
        </h2>
        <p className="text-gray-400 text-sm">
          {uploadStatus === 'uploading'
            ? 'Enviando el archivo al servidor'
            : 'Generando waveform y transcodificando. Ya casi está.'}
        </p>

        {uploadStatus === 'processing' && (
          <div className="mt-6 flex items-end gap-1 h-8 justify-center">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-cyan-400/50 rounded-full animate-pulse"
                style={{ height: `${Math.sin(i) * 60 + 40}%`, animationDelay: `${i * 0.08}s` }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Metadata / publish form ────────────────────────────────────────────────
  if (step === 'metadata') {
    return (
      <div className="px-4 pt-4 pb-32">
        <button onClick={() => setStep('choose')} className="flex items-center gap-2 text-gray-400 mb-5">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <h1 className="text-xl font-bold text-white mb-1">Publicar audio</h1>
        <p className="text-sm text-gray-400 mb-6">Completá los datos para que otros puedan encontrarlo</p>

        {/* Selected file indicator */}
        {selectedFile && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-emerald-400 text-xs font-medium truncate flex-1">
              ✓ {selectedFile.name}
            </span>
            <button onClick={() => { setSelectedFile(null); setStep('upload'); }}>
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Error banner */}
        {errorMessage && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-rose-300">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Base de batería funk"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {['loop', 'sample', 'cancion', 'pista'].map(t => (
                <button
                  key={t}
                  onClick={() => setAudioType(prev => prev === t ? '' : t)}
                  className={`py-2.5 rounded-xl text-sm capitalize transition-all ${
                    audioType === t
                      ? 'gradient-cyan-lime text-navy-900 font-semibold'
                      : 'bg-white/5 border border-white/10 text-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Instrumento */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Instrumento</label>
            <div className="flex flex-wrap gap-2">
              {['Batería', 'Guitarra', 'Bajo', 'Voz', 'Piano', 'Sintetizador', 'Percusión', 'Otro'].map(i => (
                <button
                  key={i}
                  onClick={() => setInstrument(prev => prev === i ? '' : i)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                    instrument === i
                      ? 'bg-fuchsia-500 text-white font-medium'
                      : 'bg-white/5 border border-white/10 text-gray-400'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Género */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Género</label>
            <div className="flex flex-wrap gap-2">
              {['Folklore', 'Rock', 'Jazz', 'Electrónica', 'Tango', 'Reggae', 'Funk', 'Ambient', 'Otro'].map(g => (
                <button
                  key={g}
                  onClick={() => setGenre(prev => prev === g ? '' : g)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                    genre === g
                      ? 'bg-amber-500 text-white font-medium'
                      : 'bg-white/5 border border-white/10 text-gray-400'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="120bpm, groove, funky..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
            />
            <p className="text-xs text-gray-600 mt-1">Separados por coma</p>
          </div>
        </div>

        <button
          onClick={handlePublish}
          disabled={!name || !selectedFile}
          className="w-full mt-6 py-4 rounded-2xl gradient-cyan-lime text-navy-900 font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Publicar
        </button>
        <p className="text-center text-xs text-gray-600 mt-2">
          Licencia CC BY-SA 4.0 — libre para remixar y colaborar
        </p>
      </div>
    );
  }

  // ── Record flow ────────────────────────────────────────────────────────────
  if (step === 'record') {
    return (
      <div className="px-4 pt-4 pb-32">
        <button onClick={() => setStep('choose')} className="flex items-center gap-2 text-gray-400 mb-5">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <h1 className="text-xl font-bold text-white mb-1">Grabá tu idea</h1>
        <p className="text-sm text-gray-400 mb-8">Capturá el momento. Los detalles los completás después.</p>

        <div className="flex flex-col items-center py-8">
          {isRecording && (
            <div className="flex items-end gap-0.5 h-16 mb-6">
              {[...Array(32)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-rose-400 rounded-full animate-pulse"
                  style={{ height: `${Math.random() * 60 + 10}%`, animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
          )}

          <div className={`text-4xl font-mono font-bold mb-8 ${isRecording ? 'text-rose-400' : 'text-gray-600'}`}>
            {formatRecTime(recordingTime)}
          </div>

          <button
            onClick={handleRecord}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? 'bg-rose-500 scale-110 shadow-2xl shadow-rose-500/50'
                : 'bg-rose-500/20 border-2 border-rose-500 hover:bg-rose-500/30'
            }`}
          >
            {isRecording ? (
              <div className="w-8 h-8 rounded bg-white" />
            ) : (
              <Mic className="w-8 h-8 text-rose-400" />
            )}
            {isRecording && (
              <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-30" />
            )}
          </button>

          <p className="mt-4 text-sm text-gray-500">
            {isRecording ? 'Tocá para detener' : 'Tocá para grabar'}
          </p>
        </div>

        {!isRecording && recordingTime > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-center text-sm text-emerald-400">✓ Grabado: {formatRecTime(recordingTime)}</p>
            <button
              onClick={() => setStep('metadata')}
              className="w-full py-4 rounded-2xl gradient-cyan-lime text-navy-900 font-bold text-lg"
            >
              Continuar →
            </button>
            <button
              onClick={() => setRecordingTime(0)}
              className="w-full py-3 rounded-xl bg-white/5 text-gray-400 text-sm"
            >
              Grabar de nuevo
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── File upload picker ─────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="px-4 pt-4 pb-32">
        <button onClick={() => setStep('choose')} className="flex items-center gap-2 text-gray-400 mb-5">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <h1 className="text-xl font-bold text-white mb-1">Subir archivo</h1>
        <p className="text-sm text-gray-400 mb-6">Formatos soportados: mp3, wav, ogg, flac, aac</p>

        <label className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/20 rounded-2xl py-12 px-6 cursor-pointer hover:border-cyan-500/40 transition-colors group">
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedFile(file);
                // Pre-fill name from filename if still empty
                if (!name) {
                  setName(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
                }
                setStep('metadata');
              }
            }}
          />
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-cyan-400 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-white font-medium">Elegí tu archivo</p>
            <p className="text-sm text-gray-500 mt-1">o arrastralo acá</p>
          </div>
        </label>

        <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-400">
              Si el archivo no puede procesarse te lo vamos a avisar. No subas archivos protegidos por copyright.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Default: choose mode ───────────────────────────────────────────────────
  return (
    <div className="px-4 pt-6 pb-32">
      <h1 className="text-2xl font-bold text-white mb-1">Crear</h1>
      <p className="text-gray-400 mb-8">Capturá tu idea ahora. Los detalles los completás después.</p>

      <div className="space-y-3">
        <button
          onClick={() => user ? setStep('record') : openLoginModal()}
          className="w-full p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-left hover:bg-rose-500/20 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/30 transition-colors">
                <Mic className="w-7 h-7 text-rose-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Grabar ahora</h3>
                <p className="text-sm text-gray-400">Capturá directo desde el micrófono</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </div>
        </button>

        <button
          onClick={() => user ? setStep('upload') : openLoginModal()}
          className="w-full p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-left hover:bg-cyan-500/20 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                <Upload className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Subir archivo</h3>
                <p className="text-sm text-gray-400">MP3, WAV, OGG, FLAC, AAC</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </div>
        </button>
      </div>

      <div className="mt-8 p-4 rounded-2xl bg-white/3 border border-white/5">
        <h4 className="text-sm font-semibold text-gray-300 mb-1">💡 Flujo rápido</h4>
        <p className="text-xs text-gray-500">
          Podés grabar ahora y completar el nombre, instrumento y género después.
          Tu audio queda como borrador hasta que lo publiques.
        </p>
      </div>
    </div>
  );
}
