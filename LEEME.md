# Reseñas · PN Web Studio

Web para que tus clientes valoren tu trabajo. Son archivos estáticos (sin instalar nada) y se suben a Vercel igual que tu portafolio.

## 1. Base de datos

Ya está creada y conectada: proyecto **pn-resenas** en tu organización PN Web Studio de Supabase (París). `supabase.sql` queda como copia de lo que se instaló.

## 2. Súbela a Vercel

- **Con GitHub (como tu portafolio):** sube esta carpeta a un repositorio nuevo → en Vercel, **Add New → Project → Import** → Framework: *Other* → Deploy.
- **Sin GitHub:** en la carpeta, ejecuta `npx vercel` y sigue los pasos.

Te dará un enlace tipo `pn-resenas.vercel.app`. Ponlo en tu bio de Instagram, en tu Linktree o mándalo a cada cliente al terminar un proyecto (`…vercel.app/#deja-tu-huella` lleva directo al formulario).

## 3. Gestionar reseñas

En Supabase → **Table Editor → resenas**:
- Para ocultar una reseña, desmarca `visible`.
- Para borrarla, elimina la fila.
- Si prefieres aprobarlas antes de que salgan, mira el final de `supabase.sql`.

## Personalizar

- Servicios del desplegable: `config.js` → `servicios` (si los cambias, cambia también la lista del SQL).
- Colores y tipografías: arriba del todo en `styles.css`.
