-- =============================================
-- AUTOMATIZACIÓN (CRON JOBS) - Módulo RF-16
-- =============================================

-- 1. Habilitar la extensión pg_cron (Requiere permisos de superusuario o dashboard Supabase)
-- NOTA: Si esto falla, debes habilitar la extensión 'pg_cron' desde Database -> Extensions en el Dashboard.
create extension if not exists pg_cron;

-- 2. Función para Duplicar Gastos Recurrentes
-- Se ejecuta el día 1 de cada mes.
create or replace function public.generate_recurring_expenses()
returns void as $$
begin
  -- Insertar nuevos gastos basados en los recurrentes activos
  insert into public.expenses (
    user_id,
    responsible_id,
    title,
    category,
    amount,
    due_date,
    is_recurring,
    recurrence_type,
    bill_arrival_day,
    payment_url,
    status, -- Siempre nacen pendientes
    created_at
  )
  select
    user_id,
    responsible_id,
    title,
    category,
    -- Si es VARIABLE, el monto nace en 0. Si es FIJO, mantiene el monto.
    case 
      when recurrence_type = 'variable' then 0 
      else amount 
    end as amount,
    -- Fecha de vencimiento: Mismo día, pero del mes actual
    (date_trunc('month', now()) + (extract(day from due_date) - 1 || ' days')::interval)::date as due_date,
    true as is_recurring,
    recurrence_type,
    bill_arrival_day,
    payment_url,
    'pending' as status,
    now()
  from public.expenses
  where is_recurring = true
    -- Evitar duplicados si ya se corrió hoy (Opcional, lógica simple)
    and id not in (
       select id from public.expenses where created_at >= date_trunc('month', now())
    );
    
end;
$$ language plpgsql;

-- 3. Programar el Job (1ro de cada mes a las 00:00 AM)
-- select cron.schedule('generate-monthly-expenses', '0 0 1 * *', $$select public.generate_recurring_expenses()$$);

-- NOTA IMPORTANTE:
-- Para activar el cron, descomenta la línea de arriba (select cron.schedule...) si tienes permisos.
-- En proyectos Free/Pro de Supabase, pg_cron está disponible pero requiere habilitación manual en dashboard.
