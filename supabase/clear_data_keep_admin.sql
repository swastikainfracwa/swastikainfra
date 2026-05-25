-- WARNING: Production cleanup script
-- This script deletes ALL application data while keeping exactly one admin user.
-- Kept admin email: adminswastika@swastika.in
-- It does NOT drop tables or schema objects.

begin;

DO $$
declare
  r record;
  v_admin_id uuid;
begin
  select id
  into v_admin_id
  from auth.users
  where lower(email) = lower('adminswastika@swastika.in')
  limit 1;

  if v_admin_id is null then
    raise exception 'Admin user adminswastika@swastika.in was not found';
  end if;

  -- Supabase blocks direct deletion from storage tables in SQL.
  -- Clear Storage buckets separately via the Storage API or the dashboard.

  -- Truncate all public app tables except profiles and extension table
  for r in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
      and tablename not in ('profiles', 'spatial_ref_sys')
  loop
    execute format(
      'truncate table %I.%I restart identity cascade',
      r.schemaname, r.tablename
    );
  end loop;

  -- Keep only selected admin profile
  delete from public.profiles
  where id <> v_admin_id;

  -- Remove all other auth users
  delete from auth.users
  where id <> v_admin_id;
end $$;

commit;

-- Optional verification queries:
-- select id, email from auth.users;
-- select id, email, role from public.profiles;
-- select count(*) as storage_objects_left from storage.objects;
