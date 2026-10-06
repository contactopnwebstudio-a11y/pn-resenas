-- Pega todo esto en Supabase → SQL Editor → New query → Run.
-- Crea la tabla de reseñas y deja que cualquiera lea las visibles y escriba nuevas,
-- pero nadie puede editar ni borrar desde la web (eso solo lo haces tú en Supabase).

create table if not exists public.resenas (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  nombre      text not null check (char_length(nombre) between 2 and 60),
  negocio     text check (negocio is null or char_length(negocio) <= 80),
  servicio    text not null check (servicio in (
                'Identidad visual','Logo','Instagram Pro','Identidad + Redes',
                'Letrero de local','Carta o menú','Diseño web','Otro')),
  puntuacion  int  not null check (puntuacion between 1 and 5),
  texto       text not null check (char_length(texto) between 10 and 600),
  visible     boolean not null default true
);

alter table public.resenas enable row level security;

drop policy if exists "Leer reseñas visibles" on public.resenas;
create policy "Leer reseñas visibles" on public.resenas
  for select to anon, authenticated
  using (visible = true);

drop policy if exists "Publicar reseñas" on public.resenas;
create policy "Publicar reseñas" on public.resenas
  for insert to anon, authenticated
  with check (visible = true);

grant select, insert on public.resenas to anon, authenticated;

-- ¿Prefieres aprobar cada reseña antes de que salga en el muro?
-- Ejecuta estas tres líneas y luego marca "visible" a mano en Table Editor:
--   alter table public.resenas alter column visible set default false;
--   drop policy "Publicar reseñas" on public.resenas;
--   create policy "Publicar reseñas" on public.resenas for insert to anon, authenticated with check (visible = false);
