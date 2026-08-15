-- Run after multi-region-rls.sql in Supabase SQL Editor.
-- Central admin accounts shared by every branch deployment.

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  full_name text not null,
  department text not null,
  role text not null check (role in ('system_admin', 'hr_coordinator', 'hr_supervisor', 'secretary', 'regional_manager', 'it_technician')),
  region_id uuid not null references public.regions(id),
  password_hash text not null,
  status text not null default 'active' check (status in ('active', 'locked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_users_region_id_idx on public.admin_users(region_id);
create index if not exists admin_users_role_idx on public.admin_users(role);

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from anon, authenticated;
grant all on table public.admin_users to service_role;

-- The API uses the service role and applies role/branch authorization before writes.
-- Do not grant browser users direct access to this table.

insert into public.admin_users (username, full_name, department, role, region_id, password_hash)
select
  'NWC01',
  'System Administrator',
  'Administration',
  'system_admin',
  regions.id,
  'BOOTSTRAP_REQUIRED'
from public.regions
where regions.code = 'ALL'
and not exists (select 1 from public.admin_users where username = 'NWC01');

-- Ensure legacy single admin record exists for the primary admin used by the branch-local API
insert into public.admin_credentials (id, email, password_hash, region_id)
select
  'primary',
  coalesce(current_setting('admin.email', true), 'admin@nairobi.local'),
  'BOOTSTRAP_REQUIRED',
  regions.id
from public.regions as regions
where regions.code = 'ALL'
and not exists (select 1 from public.admin_credentials where id = 'primary');
