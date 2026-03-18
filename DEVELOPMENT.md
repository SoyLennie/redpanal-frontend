# Levantar RedPanal frontend localmente

## Requisitos

- Node.js 18+
- El backend corriendo (ver `DEVELOPMENT.md` en el repo del backend)

---

## Pasos

### 1. Clonar el repo

```bash
git clone https://github.com/SoyLennie/redpanal-frontend.git
cd redpanal-frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editá `.env.local` si el backend no corre en el puerto por defecto:

```env
VITE_API_URL=http://localhost:8000
```

### 4. Levantar el servidor de desarrollo

```bash
npm run dev
```

---

## Verificar que funciona

- Abrir http://localhost:5173
- La pantalla de Descubrí debe cargar (puede mostrar lista vacía si el backend no tiene datos)
- El botón de login debe conectar contra el backend configurado en `.env.local`

> Si el backend no está corriendo, las llamadas a la API fallan silenciosamente.
> Verificá que `VITE_API_URL` apunta al puerto correcto.

---

## Notas

- **`.env.local`** está en `.gitignore` — nunca se commitea. Cada desarrollador lo crea localmente desde `.env.example`.
- **Puerto:** Vite usa `:5173` por defecto. Si está ocupado, elige el siguiente disponible (`:5174`, etc.).
- **Build de producción:** `npm run build` genera los estáticos en `dist/`.
