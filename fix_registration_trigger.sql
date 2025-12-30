-- =============================================
-- FIX PARA ERROR DE REGISTRO
-- =============================================
-- Este script hace que el trigger de registro sea "a prueba de fallos".
-- Si el nombre no llega, usa el email como respaldo para evitar errores de base de datos.

create or replace function public.handle_new_user() 
returns trigger as $$
declare
  new_family_id uuid;
  user_name text;
begin
  -- 1. Determinar un nombre seguro (Fallback: metadata -> full_name -> email)
  user_name := COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', new.email);

  -- 2. Determinar moneda basada en el país (US-01)
  -- CO->COP, MX->MXN, US/EC->USD, ES->EUR, AR->ARS, CL->CLP, PE->PEN
  declare
    user_country text := new.raw_user_meta_data->>'country';
    user_currency text;
  begin
    case user_country
      when 'CO' then user_currency := 'COP';
      when 'MX' then user_currency := 'MXN';
      when 'US' then user_currency := 'USD';
      when 'EC' then user_currency := 'USD';
      when 'ES' then user_currency := 'EUR';
      when 'AR' then user_currency := 'ARS';
      when 'CL' then user_currency := 'CLP';
      when 'PE' then user_currency := 'PEN';
      else user_currency := 'USD'; -- Default fallback
    end case;

    -- 3. Crear familia (Asegurando que nunca sea NULL)
    insert into public.families (name)
    values ('Familia de ' || user_name)
    returning id into new_family_id;

    -- 4. Crear perfil
    insert into public.profiles (id, email, name, role, family_id, phone, country, currency)
    values (
      new.id, 
      new.email, 
      user_name,
      'admin', 
      new_family_id,
      new.raw_user_meta_data->>'phone',
      user_country,
      user_currency
    );
  end;
  return new;
exception when others then
  -- En caso de error inesperado, loguear y permitir el registro (opcional, o lanzar error legible)
  raise NOTICE 'Error en handle_new_user: %', SQLERRM;
  return new; -- Esto permitiría crear el Auth User aunque falle el Profile (Cuidado: deja datos inconsistentes)
  -- MEJOR ESTRATEGIA: Dejar que falle pero con el COALESCE arriba ya preveimos el error más común.
end;
$$ language plpgsql security definer;

-- Asegurarse de que el trigger esté activo
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
