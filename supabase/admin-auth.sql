-- Run this once in Supabase Dashboard -> SQL Editor.
-- The Vercel API uses the Supabase service-role key; browser users cannot read these tables.

create table if not exists public.admin_credentials (
  id text primary key check (id = 'primary'),
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_password_reset_tokens (
  token_hash text primary key,
  admin_id text not null references public.admin_credentials(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  "id" text primary key,
  "name" text not null,
  "email" text not null,
  "department" text not null,
  "position" text not null,
  "region" text not null default 'All Regions',
  "status" text not null default 'Active' check ("status" in ('Active', 'Inactive', 'On Leave')),
  "imageUrl" text,
  "verified" boolean not null default true,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

alter table public.employees
  add column if not exists "region" text not null default 'All Regions';

create table if not exists public.checkins (
  "id" text primary key,
  "employeeId" text not null references public.employees("id") on delete cascade,
  "employeeName" text not null,
  "department" text not null,
  "position" text,
  "checkInTime" text not null,
  "status" text not null check ("status" in ('ON TIME', 'GRACE PERIOD', 'LATE')),
  "avatarInitials" text,
  "avatarBg" text,
  "imageUrl" text,
  "remarks" text,
  "created_at" timestamptz not null default now()
);

create index if not exists admin_password_reset_tokens_expiry_idx
  on public.admin_password_reset_tokens (expires_at);

create index if not exists employees_department_idx
  on public.employees ("department");

create index if not exists checkins_employeeid_idx
  on public.checkins ("employeeId");

create index if not exists checkins_created_at_idx
  on public.checkins ("created_at" desc);

alter table public.admin_credentials enable row level security;
alter table public.admin_password_reset_tokens enable row level security;
alter table public.employees enable row level security;
alter table public.checkins enable row level security;

revoke all on table public.admin_credentials from anon, authenticated;
revoke all on table public.admin_password_reset_tokens from anon, authenticated;
revoke all on table public.employees from anon, authenticated;
revoke all on table public.checkins from anon, authenticated;
grant all on table public.admin_credentials to service_role;
grant all on table public.admin_password_reset_tokens to service_role;
grant all on table public.employees to service_role;
grant all on table public.checkins to service_role;
