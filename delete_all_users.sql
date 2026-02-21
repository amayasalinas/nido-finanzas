-- Script para borrar todos los usuarios y sus datos asociados en Supabase

-- 1. Borrar todos los perfiles públicos. 
-- Esto también borrará en cascada los registros en incomes, cards y loans 
-- gracias al `ON DELETE CASCADE` en esas tablas.
DELETE FROM public.profiles;

-- 2. Borrar todos los usuarios de autenticación.
-- Nota: Hacer esto sin borrar los perfiles antes causaría un error de llave foránea.
DELETE FROM auth.users;
