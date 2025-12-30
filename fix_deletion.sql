-- ALERTA: Script para corregir errores al eliminar usuarios

-- 1. Permitir que el Perfil se borre si se borra el Usuario (Auth)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey, -- Nombre por defecto común
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 2. Permitir que los Ingresos se borren si se borra el Perfil
ALTER TABLE public.incomes
DROP CONSTRAINT IF EXISTS incomes_user_id_fkey,
ADD CONSTRAINT incomes_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 3. Permitir que los Gastos se borren si se borra el Perfil (Responsable)
ALTER TABLE public.expenses
DROP CONSTRAINT IF EXISTS expenses_responsible_id_fkey,
ADD CONSTRAINT expenses_responsible_id_fkey
FOREIGN KEY (responsible_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 4. Permitir que las Tarjetas se borren si se borra el Perfil (Dueño)
ALTER TABLE public.cards
DROP CONSTRAINT IF EXISTS cards_owner_id_fkey,
ADD CONSTRAINT cards_owner_id_fkey
FOREIGN KEY (owner_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 5. Permitir que los Préstamos se borren si se borra el Perfil (Deudor)
ALTER TABLE public.loans
DROP CONSTRAINT IF EXISTS loans_debtor_id_fkey,
ADD CONSTRAINT loans_debtor_id_fkey
FOREIGN KEY (debtor_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
