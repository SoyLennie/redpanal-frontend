import { useState, useRef, useEffect } from 'react';
import { Mic, Upload, ChevronRight, Loader2, AlertCircle, X, ArrowLeft, GitBranch, Headphones, Volume2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { uploadAudio } from '@/api/audio';
import type { UploadError } from '@/api/audio';
import type { AudioTrack } from '@/types';

type Step = 'choose' | 'headphone-check' | 'record' | 'preview' | 'upload' | 'metadata' | 'processing';

const FRONTEND_TO_USE_TYPE: Record<string, string> = {
  loop:    'loop',
  sample:  'sample',
  cancion: 'song',
  pista:   'track',
};

const USE_TYPE_TO_AUDIO_TYPE: Record<string, AudioTrack['type']> = {
  loop:   'loop',
  track:  'pista',
  song:   'cancion',
  sample: 'sample',
};

const MAX_RECORDING_SECONDS = 600;
const WAVEFORM_BARS = 40;

function drawCanvas(canvas: HTMLCanvasElement, analyser: AnalyserNode, color: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  const step = Math.floor(dataArray.length / WAVEFORM_BARS);
  const barW = width / WAVEFORM_BARS - 2;
  for (let i = 0; i < WAVEFORM_BARS; i++) {
    const val = dataArray[i * step] / 255;
    const barH = Math.max(3, val * height);
    const x = i * (barW + 2);
    const y = (height - barH) / 2;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barW, barH);
  }
}

function getRmsLevel(analyser: AnalyserNode): number {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  const sum = data.reduce((acc, v) => acc + v, 0);
  return Math.min(1, (sum / data.length) / 128);
}

interface SourceAudio {
  pkId: number;
  slug: string;
  name: string;
  username: string;
  audioUrl?: string;
}

export function GrabarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { sourceAudio?: SourceAudio; startStep?: Step } | null;
  const sourceAudio = locationState?.sourceAudio;
  const startStep = locationState?.startStep;
  const { user, openLoginModal, playTrack } = useAppStore();

  const [step, setStep] = useState<Step>(startStep ?? 'choose');
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
  const [recordError, setRecordError] = useState('');
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [previewBars, setPreviewBars] = useState<number[]>([]);

  // Reference audio controls (when sourceAudio present)
  const [refVolume, setRefVolume] = useState(20);       // 0–100, default 20% ducking
  const [micLevel, setMicLevel] = useState(0);           // 0–1 real-time level
  const [listenWithRef, setListenWithRef] = useState(false);

  // Refs — mic recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const analyserRef      = useRef<AnalyserNode | null>(null);   // mic analyser
  const audioCtxRef      = useRef<AudioContext | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef     = useRef<number | null>(null);
  const canvasRef        = useRef<HTMLCanvasElement | null>(null);
  const lastBarsRef      = useRef<number[]>([]);
  const recordedBlobRef  = useRef<Blob | null>(null);
  const recordedUrlRef   = useRef<string | null>(null);

  // Refs — reference audio (plain HTMLAudioElement — no WebAudio needed)
  const refAudioRef      = useRef<HTMLAudioElement | null>(null);

  // Ref — preview "escuchar con referencia"
  const previewRecAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewRefAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (recordedUrlRef.current) URL.revokeObjectURL(recordedUrlRef.current);
      stopRefAudio();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatRecTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Reference audio helpers ──────────────────────────────────────────────────

  function stopRefAudio() {
    const el = refAudioRef.current;
    if (el) { el.pause(); el.currentTime = 0; }
  }

  function applyRefVolume(vol: number) {
    if (refAudioRef.current) refAudioRef.current.volume = vol / 100;
  }

  // ── Start waveform animation ──────────────────────────────────────────────────

  function startAnimLoop() {
    function loop() {
      if (analyserRef.current && canvasRef.current) {
        lastBarsRef.current = Array.from(new Uint8Array(analyserRef.current.frequencyBinCount)).map(v => (v / 255) * 100);
        drawCanvas(canvasRef.current, analyserRef.current, 'rgba(74,222,128,0.8)');
        setMicLevel(getRmsLevel(analyserRef.current));
      }
      animFrameRef.current = requestAnimationFrame(loop);
    }
    animFrameRef.current = requestAnimationFrame(loop);
  }

  // ── Start recording ───────────────────────────────────────────────────────────

  async function startRecording() {
    setRecordError('');

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setRecordError('Tu browser no soporta grabación directa. Usá la opción de subir archivo.');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      const errName = (err as Error).name;
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setRecordError('Necesitás permitir el acceso al micrófono para grabar.');
      } else {
        setRecordError('No se pudo acceder al micrófono. Verificá que esté conectado.');
      }
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    // Resume in case browser created it suspended
    audioCtx.resume().catch(() => {});

    // ── Mic analyser (for waveform + level meter) — NOT connected to destination
    const micAnalyser = audioCtx.createAnalyser();
    micAnalyser.fftSize = 128;
    analyserRef.current = micAnalyser;
    audioCtx.createMediaStreamSource(stream).connect(micAnalyser);
    // micAnalyser NOT connected to destination — no mic monitoring feedback

    // ── Reference audio: plain HTMLAudioElement, bypasses CORS WebAudio restrictions
    if (sourceAudio?.audioUrl && refAudioRef.current) {
      refAudioRef.current.volume = refVolume / 100;
      refAudioRef.current.loop = true;
      refAudioRef.current.currentTime = 0;
      refAudioRef.current.play().catch(() => {});
    }

    // ── MediaRecorder — only records the mic stream
    const mimeType = MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/ogg')
        ? 'audio/ogg'
        : '';

    const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      const finalMime = mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: finalMime });
      const url = URL.createObjectURL(blob);
      recordedBlobRef.current = blob;
      recordedUrlRef.current = url;
      setPreviewBars(lastBarsRef.current.length
        ? lastBarsRef.current
        : Array.from({ length: WAVEFORM_BARS }, (_, i) => Math.sin(i * 0.4) * 40 + 50));
      setRecordedUrl(url);
      setStep('preview');
    };

    mr.start();
    setIsRecording(true);
    setRecordingTime(0);

    setTimeout(startAnimLoop, 50);

    timerRef.current = setInterval(() => {
      setRecordingTime(s => {
        if (s + 1 >= MAX_RECORDING_SECONDS) {
          stopRecording(true);
          return s + 1;
        }
        return s + 1;
      });
    }, 1000);
  }

  function stopRecording(autoStopped = false) {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }

    // Pause reference audio
    stopRefAudio();
    setMicLevel(0);

    // Close AudioContext
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }

    setIsRecording(false);
    if (autoStopped) setRecordError('Límite de 10 minutos alcanzado. La grabación se detuvo automáticamente.');
  }

  function discardRecording() {
    if (recordedUrlRef.current) { URL.revokeObjectURL(recordedUrlRef.current); recordedUrlRef.current = null; }
    recordedBlobRef.current = null;
    setRecordedUrl(null);
    setPreviewBars([]);
    setRecordingTime(0);
    setRecordError('');
    setListenWithRef(false);
    setStep('record');
  }

  function handleUseRecording() {
    const blob = recordedBlobRef.current;
    if (!blob) return;
    const ext = blob.type.includes('ogg') ? 'ogg' : 'webm';
    const file = new File([blob], `grabacion-${Date.now()}.${ext}`, { type: blob.type });
    setSelectedFile(file);
    setName(`Grabación ${new Date().toLocaleDateString('es-AR')}`);
    setErrorMessage('');
    setListenWithRef(false);
    setStep('metadata');
  }

  const handlePublish = async () => {
    if (!user) { openLoginModal(() => handlePublish()); return; }
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
          use_type: FRONTEND_TO_USE_TYPE[audioType] ?? 'other',
          genre:      genre      || undefined,
          instrument: instrument || undefined,
          source_audio_id: sourceAudio?.pkId,
        },
        (percent) => setUploadProgress(percent),
      );

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
        navigate(`/${user.username}/${data.slug}`);
        setStep('choose');
        setName(''); setAudioType(''); setGenre(''); setInstrument(''); setTags('');
        setSelectedFile(null); setUploadProgress(0);
        if (recordedUrlRef.current) { URL.revokeObjectURL(recordedUrlRef.current); recordedUrlRef.current = null; }
        recordedBlobRef.current = null;
        setRecordedUrl(null);
      }, 1500);

    } catch (err) {
      const e = err as UploadError;
      setStep('metadata');
      if (e.status === 403 || e.status === 401) {
        openLoginModal(() => handlePublish());
      } else {
        let msg = 'Error al publicar. Intentá de nuevo.';
        try {
          const parsed = JSON.parse(e.body);
          const first = Object.values(parsed)[0];
          if (Array.isArray(first)) msg = first[0] as string;
          else if (typeof first === 'string') msg = first;
          else if (typeof parsed.detail === 'string') msg = parsed.detail;
        } catch { /* use default */ }
        setErrorMessage(msg);
      }
    }
  };

  // ── Processing ───────────────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center pb-32">
        <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-5">
          {uploadStatus === 'uploading' ? (
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle cx="32" cy="32" r="28" fill="none" stroke="#00d4ff" strokeWidth="4"
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
              <div key={i} className="w-1 bg-cyan-400/50 rounded-full animate-pulse"
                style={{ height: `${Math.sin(i) * 60 + 40}%`, animationDelay: `${i * 0.08}s` }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Metadata ─────────────────────────────────────────────────────────────────
  if (step === 'metadata') {
    return (
      <div className="px-4 pt-4 pb-32">
        <button onClick={() => setStep('choose')} className="flex items-center gap-2 text-gray-400 mb-5">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <h1 className="text-xl font-bold text-white mb-1">Publicar audio</h1>
        <p className="text-sm text-gray-400 mb-4">Completá los datos para que otros puedan encontrarlo</p>

        {sourceAudio && <SourceAudioBanner sourceAudio={sourceAudio} />}

        {selectedFile && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-emerald-400 text-xs font-medium truncate flex-1">✓ {selectedFile.name}</span>
            <button onClick={() => { setSelectedFile(null); setStep('upload'); }}>
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-rose-300">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Nombre *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ej: Base de batería funk"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {['loop', 'sample', 'cancion', 'pista'].map(t => (
                <button key={t} onClick={() => setAudioType(prev => prev === t ? '' : t)}
                  className={`py-2.5 rounded-xl text-sm capitalize transition-all ${audioType === t ? 'gradient-cyan-lime text-navy-900 font-semibold' : 'bg-white/5 border border-white/10 text-gray-300'}`}
                >{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Instrumento</label>
            <div className="flex flex-wrap gap-2">
              {['Batería', 'Guitarra', 'Bajo', 'Voz', 'Piano', 'Sintetizador', 'Percusión', 'Otro'].map(i => (
                <button key={i} onClick={() => setInstrument(prev => prev === i ? '' : i)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${instrument === i ? 'bg-fuchsia-500 text-white font-medium' : 'bg-white/5 border border-white/10 text-gray-400'}`}
                >{i}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Género</label>
            <div className="flex flex-wrap gap-2">
              {['Folklore', 'Rock', 'Jazz', 'Electrónica', 'Tango', 'Reggae', 'Funk', 'Ambient', 'Otro'].map(g => (
                <button key={g} onClick={() => setGenre(prev => prev === g ? '' : g)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${genre === g ? 'bg-amber-500 text-white font-medium' : 'bg-white/5 border border-white/10 text-gray-400'}`}
                >{g}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Tags</label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)}
              placeholder="120bpm, groove, funky..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
            />
            <p className="text-xs text-gray-600 mt-1">Separados por coma</p>
          </div>
        </div>

        <button onClick={handlePublish} disabled={!name || !selectedFile}
          className="w-full mt-6 py-4 rounded-2xl gradient-cyan-lime text-navy-900 font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >Publicar</button>
        <p className="text-center text-xs text-gray-600 mt-2">Licencia CC BY-SA 4.0 — libre para remixar y colaborar</p>
      </div>
    );
  }

  // ── Preview ───────────────────────────────────────────────────────────────────
  if (step === 'preview') {
    return (
      <div className="px-4 pt-4 pb-32">
        <button onClick={discardRecording} className="flex items-center gap-2 text-gray-400 mb-5">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <h1 className="text-xl font-bold text-white mb-1">Escuchá tu grabación</h1>
        <p className="text-sm text-gray-400 mb-5">{formatRecTime(recordingTime)} grabado — revisalo antes de publicar</p>

        {/* Waveform snapshot */}
        <div className="flex items-end gap-1 h-16 mb-4 px-2">
          {previewBars.map((h, i) => (
            <div key={i} className="flex-1 bg-emerald-400/60 rounded-sm" style={{ height: `${Math.max(4, h)}%` }} />
          ))}
        </div>

        {/* Solo preview */}
        {recordedUrl && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1.5">Solo tu grabación</p>
            <audio ref={previewRecAudioRef} src={recordedUrl} controls className="w-full rounded-xl"
              style={{ accentColor: '#4ade80' }}
              onPlay={() => {
                if (listenWithRef && previewRefAudioRef.current) {
                  previewRefAudioRef.current.currentTime = 0;
                  previewRefAudioRef.current.play().catch(() => {});
                }
              }}
              onPause={() => {
                if (previewRefAudioRef.current) previewRefAudioRef.current.pause();
              }}
              onSeeked={() => {
                if (listenWithRef && previewRefAudioRef.current && previewRecAudioRef.current) {
                  previewRefAudioRef.current.currentTime = previewRecAudioRef.current.currentTime;
                }
              }}
            />
          </div>
        )}

        {/* Listen with reference toggle */}
        {sourceAudio?.audioUrl && (
          <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10">
            <audio ref={previewRefAudioRef} src={sourceAudio.audioUrl} />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Escuchar con referencia</p>
                <p className="text-xs text-gray-500 mt-0.5">Reproduce ambos en sincronía</p>
              </div>
              <button
                onClick={() => {
                  setListenWithRef(v => !v);
                  // Stop both if turning off
                  if (listenWithRef) {
                    previewRefAudioRef.current?.pause();
                    if (previewRefAudioRef.current) previewRefAudioRef.current.currentTime = 0;
                  }
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${listenWithRef ? 'bg-cyan-500' : 'bg-white/20'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${listenWithRef ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {listenWithRef && (
              <p className="text-xs text-cyan-400 mt-2">
                Usá el reproductor de arriba — la referencia suena sincronizada.
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button onClick={handleUseRecording}
            className="w-full py-4 rounded-2xl gradient-cyan-lime text-navy-900 font-bold text-lg"
          >Usar esta grabación →</button>
          <button onClick={discardRecording}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm"
          >Grabar de nuevo</button>
        </div>
      </div>
    );
  }

  // ── Headphone check (only when sourceAudio present) ──────────────────────────
  if (step === 'headphone-check') {
    return (
      <div className="px-4 pt-4 pb-32">
        <button onClick={() => setStep('choose')} className="flex items-center gap-2 text-gray-400 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-5">
            <Headphones className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Para mejor calidad, usá auriculares</h2>
          <p className="text-sm text-gray-400 max-w-xs mx-auto mb-3">
            Así tu grabación no va a captar el audio de referencia. El micrófono graba solo lo que vos tocás.
          </p>
          <p className="text-xs text-gray-600 mb-8">
            El audio de "{sourceAudio?.name}" suena de guía pero no queda grabado.
          </p>

          {/* Reference audio volume preview */}
          <div className="w-full max-w-xs mb-8 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Volumen de referencia al grabar</span>
            </div>
            <input
              type="range" min={0} max={100} value={refVolume}
              onChange={e => setRefVolume(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Silencio</span>
              <span className="text-cyan-400 font-medium">{refVolume}%</span>
              <span>Máximo</span>
            </div>
          </div>

          <div className="w-full max-w-xs space-y-3">
            <button
              onClick={() => { if (user) setStep('record'); else openLoginModal(() => setStep('record')); }}
              className="w-full py-4 rounded-2xl gradient-cyan-lime text-navy-900 font-bold text-lg flex items-center justify-center gap-2"
            >
              <Headphones className="w-5 h-5" />
              Tengo auriculares — Grabar
            </button>
            <button
              onClick={() => { if (user) setStep('record'); else openLoginModal(() => setStep('record')); }}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm"
            >
              Grabar igual (sin auriculares)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Record screen ─────────────────────────────────────────────────────────────
  if (step === 'record') {
    const hasSource = !!sourceAudio?.audioUrl;

    return (
      <div className="px-4 pt-4 pb-32">
        {/* Hidden reference audio element — wired into AudioContext during recording */}
        {hasSource && (
          <audio
            ref={refAudioRef}
            src={sourceAudio!.audioUrl}
            loop
            preload="auto"
            style={{ display: 'none' }}
          />
        )}

        <button
          onClick={() => { if (isRecording) stopRecording(); setStep(sourceAudio ? 'headphone-check' : 'choose'); }}
          className="flex items-center gap-2 text-gray-400 mb-5"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        {hasSource && (
          <div className="mb-4 px-3 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <p className="text-xs text-cyan-300 truncate">
              Referencia: <span className="font-medium">{sourceAudio!.name}</span>
              {isRecording && <span className="text-cyan-500"> · sonando en loop</span>}
            </p>
          </div>
        )}

        {recordError && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-rose-300">{recordError}</p>
          </div>
        )}

        {/* Mic level meter — visible while recording */}
        {isRecording && (
          <div className="mb-4">
            <LevelMeter label="Tu grabación" level={micLevel} color="green" />
          </div>
        )}

        <div className="flex flex-col items-center py-2">
          {/* Live waveform canvas (mic only) */}
          <div className={`w-full h-20 mb-4 rounded-xl overflow-hidden transition-colors ${isRecording ? 'bg-emerald-500/10' : 'bg-white/3'}`}>
            <canvas ref={canvasRef} width={320} height={80} className="w-full h-full" />
          </div>

          {/* Timer */}
          <div className={`text-5xl font-mono font-bold mb-6 tabular-nums ${isRecording ? 'text-rose-400' : 'text-gray-600'}`}>
            {formatRecTime(recordingTime)}
          </div>

          {/* Record / Stop */}
          <button
            onClick={() => isRecording ? stopRecording() : startRecording()}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? 'bg-rose-500 scale-110 shadow-2xl shadow-rose-500/50'
                : 'bg-rose-500/20 border-2 border-rose-500 hover:bg-rose-500/30'
            }`}
          >
            {isRecording ? <div className="w-8 h-8 rounded bg-white" /> : <Mic className="w-8 h-8 text-rose-400" />}
            {isRecording && <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-30" />}
          </button>

          <p className="mt-4 text-sm text-gray-500">
            {isRecording ? 'Tocá para detener' : 'Tocá para grabar'}
          </p>
          {isRecording && (
            <p className="mt-1 text-xs text-gray-600">Límite: {formatRecTime(MAX_RECORDING_SECONDS - recordingTime)}</p>
          )}
        </div>

        {/* Reference volume slider — visible while recording */}
        {isRecording && hasSource && (
          <div className="mt-4 px-3 py-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs text-gray-400">Volumen de referencia</span>
              <span className="ml-auto text-xs text-cyan-400 font-medium">{refVolume}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={refVolume}
              onChange={e => {
                const v = Number(e.target.value);
                setRefVolume(v);
                applyRefVolume(v);
              }}
              className="w-full accent-cyan-400"
            />
          </div>
        )}
      </div>
    );
  }

  // ── File upload ───────────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="px-4 pt-4 pb-32">
        <button onClick={() => setStep('choose')} className="flex items-center gap-2 text-gray-400 mb-5">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <h1 className="text-xl font-bold text-white mb-1">Subir archivo</h1>
        <p className="text-sm text-gray-400 mb-6">Formatos soportados: mp3, wav, ogg, flac, aac</p>

        {sourceAudio && <SourceAudioBanner sourceAudio={sourceAudio} />}

        <label className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/20 rounded-2xl py-12 px-6 cursor-pointer hover:border-cyan-500/40 transition-colors group">
          <input type="file" accept="audio/*" className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedFile(file);
                if (!name) setName(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
                setErrorMessage('');
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
            <p className="text-xs text-gray-400">Si el archivo no puede procesarse te lo vamos a avisar. No subas archivos protegidos por copyright.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Choose mode ───────────────────────────────────────────────────────────────
  return (
    <div className="px-4 pt-6 pb-32">
      {sourceAudio ? (
        <>
          <h1 className="text-2xl font-bold text-white mb-1">Colaborar</h1>
          <p className="text-gray-400 mb-4">Grabá o subí tu aporte. Se va a vincular al original.</p>
          <SourceAudioBanner sourceAudio={sourceAudio} />
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-white mb-1">Crear</h1>
          <p className="text-gray-400 mb-8">Capturá tu idea ahora. Los detalles los completás después.</p>
        </>
      )}

      <div className="space-y-3">
        <button
          onClick={() => {
            if (!user) { openLoginModal(); return; }
            setStep(sourceAudio ? 'headphone-check' : 'record');
          }}
          className="w-full p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-left hover:bg-rose-500/20 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/30 transition-colors">
                <Mic className="w-7 h-7 text-rose-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Grabar ahora</h3>
                <p className="text-sm text-gray-400">
                  {sourceAudio ? 'Grabá encima del audio original' : 'Capturá directo desde el micrófono'}
                </p>
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

      {!sourceAudio && (
        <div className="mt-8 p-4 rounded-2xl bg-white/3 border border-white/5">
          <h4 className="text-sm font-semibold text-gray-300 mb-1">💡 Flujo rápido</h4>
          <p className="text-xs text-gray-500">
            Podés grabar ahora y completar el nombre, instrumento y género después.
            Tu audio queda como borrador hasta que lo publiques.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LevelMeter({ label, level, color }: { label: string; level: number; color: 'cyan' | 'green' }) {
  const colorClass = color === 'cyan'
    ? 'bg-cyan-400'
    : 'bg-emerald-400';
  const bgClass = color === 'cyan'
    ? 'bg-cyan-500/20'
    : 'bg-emerald-500/20';
  const textClass = color === 'cyan'
    ? 'text-cyan-400'
    : 'text-emerald-400';

  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-medium w-24 flex-shrink-0 ${textClass}`}>{label}</span>
      <div className={`flex-1 h-2 rounded-full ${bgClass} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-75`}
          style={{ width: `${Math.min(100, level * 100)}%` }}
        />
      </div>
    </div>
  );
}

function SourceAudioBanner({ sourceAudio }: { sourceAudio: { pkId: number; slug: string; name: string; username: string; audioUrl?: string } }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  return (
    <div className="mb-6 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Colaborando con</span>
      </div>
      <div className="flex items-center gap-3">
        {sourceAudio.audioUrl && (
          <>
            <audio ref={audioRef} src={sourceAudio.audioUrl} onEnded={() => setPlaying(false)} />
            <button onClick={toggle}
              className="w-9 h-9 rounded-full gradient-cyan-lime flex items-center justify-center flex-shrink-0"
            >
              {playing ? (
                <svg className="w-3.5 h-3.5 text-navy-900 fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-navy-900 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
              )}
            </button>
          </>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{sourceAudio.name}</p>
          <p className="text-xs text-cyan-400">@{sourceAudio.username}</p>
        </div>
      </div>
    </div>
  );
}
