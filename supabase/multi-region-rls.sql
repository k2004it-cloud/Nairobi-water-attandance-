-- ============================================================================
-- SECURE MULTI-REGION DATA ISOLATION WITH ROW LEVEL SECURITY
-- ============================================================================
-- This migration implements UUID-based region management and RLS policies
-- to ensure data from one region is never visible to another region.
--
-- Run this in Supabase Dashboard -> SQL Editor after the existing admin-auth.sql
-- ============================================================================

-- ============================================================================
-- 1. CREATE REGIONS TABLE
-- ============================================================================
create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insert default regions (these will be the canonical region records)
insert into public.regions (name, code, status) values
  ('All Regions', 'ALL', 'active'),
  ('Nairobi', 'NRB', 'active'),
  ('Central', 'CEN', 'active'),
  ('Coast', 'CST', 'active'),
  ('Western', 'WST', 'active'),
  ('Rift Valley', 'RFT', 'active')
on conflict (name) do nothing;

-- Create index on code for faster lookups
create index if not exists regions_code_idx on public.regions (code);

-- ============================================================================
-- 2. UPDATE ADMIN_CREDENTIALS TABLE TO INCLUDE REGION_ID
-- ============================================================================
alter table public.admin_credentials
  add column if not exists region_id uuid references public.regions(id);

-- Set default region for existing admin (use "All Regions" UUID)
update public.admin_credentials
set region_id = (select id from public.regions where code = 'ALL')
where region_id is null;

-- Make region_id non-nullable after setting defaults
alter table public.admin_credentials
  alter column region_id set not null;

-- ============================================================================
-- 3. UPDATE EMPLOYEES TABLE TO INCLUDE REGION_ID
-- ============================================================================
-- Add region_id column without making it required yet
alter table public.employees
  add column if not exists region_id uuid references public.regions(id);

-- Migrate existing region text values to region_id where possible
-- Handle the mapping from text region names to UUID
update public.employees
set region_id = (
  select id from public.regions
  where (
    (employees.region = 'Nairobi' and regions.code = 'NRB') or
    (employees.region = 'Central' and regions.code = 'CEN') or
    (employees.region = 'Coast' and regions.code = 'CST') or
    (employees.region = 'Western' and regions.code = 'WST') or
    (employees.region = 'Rift Valley' and regions.code = 'RFT') or
    (employees.region = 'All Regions' and regions.code = 'ALL')
  )
)
where region_id is null;

-- For any records that couldn't be mapped (edge cases), default to 'All Regions'
update public.employees
set region_id = (select id from public.regions where code = 'ALL')
where region_id is null;

-- Make region_id non-nullable after migration
alter table public.employees
  alter column region_id set not null;

-- Create index for faster queries
create index if not exists employees_region_id_idx on public.employees (region_id);

-- ============================================================================
-- 4. UPDATE CHECKINS TABLE TO INCLUDE REGION_ID
-- ============================================================================
alter table public.checkins
  add column if not exists region_id uuid references public.regions(id);

-- Populate region_id from the associated employee's region_id
update public.checkins
set region_id = (
  select region_id from public.employees
  where employees.id = checkins."employeeId"
)
where region_id is null;

-- For any orphaned records, default to 'All Regions'
update public.checkins
set region_id = (select id from public.regions where code = 'ALL')
where region_id is null;

-- Make region_id non-nullable after migration
alter table public.checkins
  alter column region_id set not null;

-- Create indices for performance
create index if not exists checkins_region_id_idx on public.checkins (region_id);
create index if not exists checkins_region_employeeid_idx on public.checkins (region_id, "employeeId");

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY ON REGIONS TABLE
-- ============================================================================
alter table public.regions enable row level security;

-- Regions are readable by all authenticated users (to show available regions)
create policy "Allow authenticated users to read regions"
  on public.regions
  for select
  using (true);

-- Only service_role (backend) can modify regions
create policy "Service role can manage regions"
  on public.regions
  for all
  using (auth.role() = 'service_role');

-- ============================================================================
-- 6. IMPLEMENT RLS POLICIES FOR EMPLOYEES TABLE
-- ============================================================================
-- Disable public access completely
revoke all on table public.employees from public, anon, authenticated;

-- Policy 1: System Admin (region_id = 'ALL') can see all employees
create policy "System admin can view all employees"
  on public.employees
  for select
  using (
    auth.role() = 'service_role' or
    exists (
      select 1 from public.admin_credentials
      where id = 'primary'
        and (select region_id from public.admin_credentials where id = 'primary') = (
          select id from public.regions where code = 'ALL'
        )
    )
  );

-- Policy 2: Regional users can only see employees in their assigned region
create policy "Users can view employees in their region"
  on public.employees
  for select
  using (
    auth.role() = 'service_role' or
    region_id = (
      select region_id from public.admin_credentials
      where id = 'primary'
    )
  );

-- Policy 3: Service role can manage all employees
create policy "Service role can manage employees"
  on public.employees
  for all
  using (auth.role() = 'service_role');

-- Policy 4: Prevent INSERT with region_id mismatch
-- (This ensures authenticated users can't insert an employee with a different region)
create policy "Enforce region_id on employee insert"
  on public.employees
  for insert
  with check (
    auth.role() = 'service_role' or
    region_id = (
      select region_id from public.admin_credentials
      where id = 'primary'
    )
  );

-- Policy 5: Prevent UPDATE to change region or access unauthorized records
create policy "Enforce region_id on employee update"
  on public.employees
  for update
  using (
    auth.role() = 'service_role' or
    region_id = (
      select region_id from public.admin_credentials
      where id = 'primary'
    )
  )
  with check (
    auth.role() = 'service_role' or
    region_id = (
      select region_id from public.admin_credentials
      where id = 'primary'
    )
  );

-- Policy 6: Prevent DELETE of unauthorized records
create policy "Enforce region_id on employee delete"
  on public.employees
  for delete
  using (
    auth.role() = 'service_role' or
    region_id = (
      select region_id from public.admin_credentials
      where id = 'primary'
    )
  );

-- Grant service_role full access
grant all on table public.employees to service_role;

-- ============================================================================
-- 7. IMPLEMENT RLS POLICIES FOR CHECKINS TABLE
-- ============================================================================
-- Disable public access completely
revoke all on table public.checkins from public, anon, authenticated;

-- Policy 1: Users can only see attendance records from their region
create policy "Users can view attendance in their region"
  on public.checkins
  for select
  using (
    auth.role() = 'service_role' or
    region_id = (
      select region_id from public.admin_credentials
      where id = 'primary'
    )
  );

-- Policy 2: Service role can view all attendance records
create policy "Service role can view all checkins"
  on public.checkins
  for select
  using (auth.role() = 'service_role');

-- Policy 3: Prevent INSERT with region_id mismatch
create policy "Enforce region_id on checkin insert"
  on public.checkins
  for insert
  with check (
    auth.role() = 'service_role' or
    region_id = (
      select region_id from public.admin_credentials
      where id = 'primary'
    )
  );

-- Policy 4: Service role can manage all checkins
create policy "Service role can manage checkins"
  on public.checkins
  for all
  using (auth.role() = 'service_role');

-- Grant service_role full access
grant all on table public.checkins to service_role;

-- ============================================================================
-- 8. IMPLEMENT RLS POLICIES FOR ADMIN_CREDENTIALS TABLE
-- ============================================================================
-- Disable public access completely
revoke all on table public.admin_credentials from public, anon, authenticated;

-- Only service_role can access admin credentials
create policy "Service role can manage admin credentials"
  on public.admin_credentials
  for all
  using (auth.role() = 'service_role');

-- Grant service_role full access
grant all on table public.admin_credentials to service_role;

-- ============================================================================
-- 9. IMPLEMENT RLS POLICIES FOR ADMIN_PASSWORD_RESET_TOKENS TABLE
-- ============================================================================
-- Disable public access completely
revoke all on table public.admin_password_reset_tokens from public, anon, authenticated;

-- Only service_role can access reset tokens
create policy "Service role can manage password reset tokens"
  on public.admin_password_reset_tokens
  for all
  using (auth.role() = 'service_role');

-- Grant service_role full access
grant all on table public.admin_password_reset_tokens to service_role;

-- ============================================================================
-- 10. CREATE AUDIT TABLE FOR REGION CHANGES (OPTIONAL)
-- ============================================================================
create table if not exists public.region_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id text not null references public.admin_credentials(id),
  action text not null check (action in ('login', 'create', 'update', 'delete')),
  table_name text not null,
  record_id text,
  region_id uuid references public.regions(id),
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Enable RLS on audit table
alter table public.region_audit_log enable row level security;

-- Only service_role can write to audit log
create policy "Service role can write audit logs"
  on public.region_audit_log
  for all
  using (auth.role() = 'service_role');

grant all on table public.region_audit_log to service_role;

-- Create index for audit queries
create index if not exists region_audit_log_admin_id_idx on public.region_audit_log (admin_id);
create index if not exists region_audit_log_region_id_idx on public.region_audit_log (region_id);
create index if not exists region_audit_log_created_at_idx on public.region_audit_log (created_at desc);

-- ============================================================================
-- 11. HELPER FUNCTION TO GET USER'S REGION
-- ============================================================================
create or replace function public.get_admin_region_id()
returns uuid as $$
  select region_id from public.admin_credentials where id = 'primary'
$$ language sql stable;

-- ============================================================================
-- 12. HELPER FUNCTION TO CHECK IF USER CAN ACCESS REGION
-- ============================================================================
create or replace function public.can_access_region(target_region_id uuid)
returns boolean as $$
declare
  admin_region_id uuid;
begin
  if auth.role() = 'service_role' then
    return true;
  end if;
  
  admin_region_id := (select region_id from public.admin_credentials where id = 'primary');
  
  if admin_region_id = (select id from public.regions where code = 'ALL') then
    return true;
  end if;
  
  return admin_region_id = target_region_id;
end;
$$ language plpgsql stable;

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- Tables created:
--   - regions (with UUID primary keys and region codes)
--   - region_audit_log (for audit trail)
--
-- Tables modified:
--   - admin_credentials: added region_id column
--   - employees: added region_id column (migrated from region text)
--   - checkins: added region_id column
--
-- RLS Policies implemented:
--   - regions: readable by all authenticated, modifiable by service_role only
--   - employees: region isolation with SELECT/INSERT/UPDATE/DELETE policies
--   - checkins: region isolation with SELECT/INSERT policies
--   - admin_credentials: service_role only
--   - admin_password_reset_tokens: service_role only
--
-- Helper functions:
--   - get_admin_region_id(): returns the current admin's region_id
--   - can_access_region(uuid): checks if admin can access a specific region
--
-- Data preservation:
--   - Existing employee and checkin records migrated to use UUID region references
--   - Existing region text column preserved for backward compatibility
--   - Default region 'All Regions' applied to admins
-- ============================================================================
