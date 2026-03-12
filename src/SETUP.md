# RedPanal — Rediseño Mejorado

## Mejoras implementadas (según PDF ChatGPT 20/02/2026)

### 🔍 DescubriPage
- Layout adaptivo: <6 items → grilla 2x2, ≥6 → scroll horizontal
- Estado vacío con invitación a grabar ("¿Querés ser el primero?")
- Filtro 2D combinable: Tipo × Instrumento (bottom sheet en mobile)
- Pills de filtros activos con botón de limpiar individual
- Búsqueda en tiempo real dividida en Audios / Músicos / Tags
- Placeholder rotativo contextual ("Buscá loops de batería...", etc.)
- "Reproducir todo" por sección (encolado automático de contexto)
- Secciones emergentes del contenido real (no hardcodeadas)

### 🎵 Player
- Waveform decorativo eliminado → barra de progreso real (simula Web Audio API)
- Waveform en player expandido: estático y honesto (no Math.random() por render)
- Waveform interactivo: clickeable para saltar a cualquier punto
- Queue vacío: NO muestra "Track en cola 1,2,3" hardcodeados — sección ausente si vacío
- Cola real: al tocar play en una sección, los demás tracks se encolan automáticamente
- Botones con jerarquía de 2 niveles: Favorito, Compartir, Comentar, Descargar siempre visibles; Playlist y Agente IA detrás de "Más"
- Botón "Colaborar" como acción secundaria visible en player expandido
- Agente IA con contexto: muestra instrumento, género, BPM sugerido

### 🎙 GrabarPage
- Flujo 2 momentos: Capturar (nombre + tipo) → Publicar (metadatos completos)
- Feedback de estados: Subiendo (con %) → Procesando (animación) → Listo → Error
- "Arrobados" eliminado → privacidad simplificada: Público / Privado
- Grabación directa con preview de waveform en tiempo real
- Interfaz de grabación sin formularios intermedios
- Soporte para formatos explícito en error state

### 📁 ArchivoPage
- Waveform interactivo y clickeable para scrubbing
- Botón "Colaborar" prominente al mismo nivel que Play
- Tabs: Historia (árbol visual) | Comentarios (permanentes) | Info
- Árbol de colaboraciones como grafo visual con mini player por nodo
- Flujo de colaboración en 3 modos: Grabar capa / Subir versión / Remix
- Audio original disponible de guía al grabar una capa
- Comentarios con distinción autor vs. comunidad, replies

### 💬 AsambleaPage
- Separación visual clara: Asambleas abiertas vs. Mis asambleas
- Banner explícito de privacidad para asambleas privadas (texto, no solo color)
- Audio anclado visible en el header del chat
- "Propósito" obligatorio al crear asamblea privada
- Chat diferenciado visualmente (vos vs. ellos)

### 🔔 InteraccionesPage
- Colaboraciones separadas de reacciones
- Notificaciones de colaboración con acciones inline: ▶ Escuchar / Ver en árbol

## Para correr el proyecto
```bash
npm install
npm run dev
```

## Estructura de archivos nuevos/modificados
```
src/
  App.tsx                    ← actualizado
  components/
    Player.tsx               ← reescrito
  pages/
    DescubriPage.tsx         ← nuevo
    GrabarPage.tsx           ← nuevo
    ArchivoPage.tsx          ← nuevo
    AsambleaPage.tsx         ← nuevo
    InteraccionesPage.tsx    ← nuevo
    OtherPages.tsx           ← nuevo (Perfil, Comunidad, RedPanal)
  store/
    appStore.ts              ← nuevo (Zustand)
    mockData.ts              ← nuevo (datos de ejemplo)
  types/
    index.ts                 ← nuevo
```
