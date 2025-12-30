-- =============================================
-- MIGRACIÓN V2: Familias, Gastos Avanzados y Deudas
-- =============================================

-- 1. CREAR TABLA DE FAMILIAS
-- 1. CREAR TABLA DE FAMILIAS
create table if not exists public.families (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en families
alter table public.families enable row level security;

-- 2. ACTUALIZAR PROFILES (Relación con Familia)
-- Primero creamos la columna para que exista antes de usarla en políticas
alter table public.profiles 
add column if not exists family_id uuid references public.families(id),
add column if not exists phone text,
add column if not exists country text,
add column if not exists currency text default 'COP';

-- Ahora sí, Política: Un usuario puede ver su propia familia
create policy "Usuarios pueden ver su propia familia" on public.families
  for select using (
    id in (select family_id from public.profiles where id = auth.uid())
  );

-- Política actualizada de Profiles (Ver a todos los miembros de mi familia)
drop policy if exists "Users can insert their own profile" on public.profiles;

-- Re-crear políticas más robustas
create policy "Ver perfil propio y de familia" on public.profiles
  for select using (
    auth.uid() = id or 
    family_id in (select family_id from public.profiles where id = auth.uid())
  );

create policy "Editar perfil propio" on public.profiles
  for update using ( auth.uid() = id );

create policy "Insertar perfil propio" on public.profiles
  for insert with check ( auth.uid() = id );

-- 3. ACTUALIZAR EXPENSES (Recurrencia y Detalles)
alter table public.expenses
add column if not exists is_recurring boolean default false,
add column if not exists recurrence_type text check (recurrence_type in ('fixed', 'variable')),
add column if not exists bill_arrival_day integer check (bill_arrival_day between 1 and 31),
add column if not exists payment_url text;

-- 4. ACTUALIZAR LOANS (Detalles Bancarios)
alter table public.loans
add column if not exists entity text, -- Banco o Persona
add column if not exists loan_type text, -- Libre, Hipotecario
add column if not exists interest_rate numeric, -- %
add column if not exists rate_type text, -- EA, MV
add column if not exists disbursement_date date;

-- 5. ACTUALIZAR CARDS (Detalles Tarjeta)
alter table public.cards
add column if not exists franchise text, -- Visa, Master
add column if not exists cutoff_day integer check (cutoff_day between 1 and 31);

-- 6. ACTUALIZAR TRIGGER DE NUEVO USUARIO
-- Cuando alguien se registra, CREA una familia automáticamente para él.
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  new_family_id uuid;
begin
  -- 1. Crear una familia nueva para este usuario
  insert into public.families (name)
  values ('Familia de ' || new.raw_user_meta_data->>'name')
  returning id into new_family_id;

  -- 2. Crear el perfil del usuario asignado a esa familia
  insert into public.profiles (id, email, name, role, family_id, phone, country, currency)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name',
    'admin', -- El creador es Admin por defecto
    new_family_id,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'country',
    'COP' -- Default, se debería mapear en frontend
  );
  return new;
end;
$$ language plpgsql security definer;

-- NOTA: Como la función 'handle_new_user' ya existe, el 'create or replace' la actualizará.
-- Sin embargo, si ya tienes usuarios creados SIN familia, necesitarán un "parche".

-- 7. PARCHE PARA USUARIOS EXISTENTES (Opcional, correr solo si hay datos viejos)
do $$
declare
  user_rec record;
  fam_id uuid;
begin
  for user_rec in select * from public.profiles where family_id is null loop
    -- Crear familia para el usuario huérfano
    insert into public.families (name) values ('Familia de ' || user_rec.name) returning id into fam_id;
    -- Asignar
    update public.profiles set family_id = fam_id where id = user_rec.id;
  end loop;
end $$;
