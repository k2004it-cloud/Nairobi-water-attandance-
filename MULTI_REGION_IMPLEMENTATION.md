# Secure Multi-Region Data Isolation Implementation Guide

## Overview

This document describes the implementation of secure multi-region data isolation using Supabase Row Level Security (RLS). The system ensures that data from one region is NEVER visible or accessible to users from another region, with the database serving as the security boundary.

## Architecture

```
AUTHENTICATED USER
        ↓
USER PROFILE (region_id)
        ↓
ROW LEVEL SECURITY POLICIES
        ↓
┌──────────────────────────────────────┐
│  REGION-ISOLATED DATA TABLES         │
├──────────────────────────────────────┤
│ • employees (region_id FK)           │
│ • checkins/attendance (region_id FK) │
│ • admin_credentials (region_id FK)   │
│ • region_audit_log (audit trail)     │
└──────────────────────────────────────┘
```

## Database Changes

### 1. New Tables Created

#### `regions` Table
- **Purpose**: Canonical region registry with UUID identifiers
- **Columns**:
  - `id` (UUID): Primary key
  - `name` (text): Region display name (e.g., "Nairobi")
  - `code` (text): Unique region code (e.g., "NRB") for backward compatibility
  - `status` (text): 'active' or 'inactive'
  - `created_at`, `updated_at` (timestamps)

- **Data Seeded**:
  ```
  ALL        → All Regions
  NRB        → Nairobi
  CEN        → Central
  CST        → Coast
  WST        → Western
  RFT        → Rift Valley
  ```

#### `region_audit_log` Table
- **Purpose**: Audit trail for region-sensitive operations
- **Columns**:
  - `id` (UUID): Primary key
  - `admin_id` (text): Reference to admin_credentials.id
  - `action` (text): login, create, update, delete
  - `table_name` (text): Table affected
  - `record_id` (text): Record ID
  - `region_id` (UUID): Region affected
  - `details` (jsonb): Additional context
  - `ip_address` (text): IP address of requester
  - `user_agent` (text): User agent
  - `created_at` (timestamp)

### 2. Tables Modified

#### `admin_credentials`
- **Added Column**: `region_id` (UUID, non-null)
- **Foreign Key**: `region_id → regions.id`
- **Semantic Change**: Each admin is now scoped to a specific region
  - `region_id = UUID('ALL')` → Can access all regions (System Admin)
  - `region_id = UUID('NRB')` → Can only access Nairobi region (Regional Admin)

#### `employees`
- **Added Column**: `region_id` (UUID, non-null)
- **Foreign Key**: `region_id → regions.id`
- **Backward Compatibility**: `region` (text) column preserved
- **Data Migration**: Existing region text values mapped to UUIDs:
  - "Nairobi" → NRB UUID
  - "Central" → CEN UUID
  - etc.

#### `checkins`
- **Added Column**: `region_id` (UUID, non-null)
- **Foreign Key**: `region_id → regions.id`
- **Data Migration**: Populated from employee's region_id

### 3. Indices Added

- `regions_code_idx` on `regions(code)` - Fast region lookups by code
- `employees_region_id_idx` on `employees(region_id)` - Region filtering
- `checkins_region_id_idx` on `checkins(region_id)` - Region filtering
- `checkins_region_employeeid_idx` on `checkins(region_id, employeeId)` - Combined queries
- `region_audit_log_*_idx` - Audit trail queries

## Row Level Security (RLS) Policies

### Critical Security Rule
**RLS is the PRIMARY security mechanism. Frontend filtering is only for UX convenience.**

### `regions` Table
- ✅ **SELECT**: All authenticated users can read regions
- ❌ **INSERT/UPDATE/DELETE**: Service role only (no user modifications)

### `employees` Table
- ✅ **SELECT**: Users can see employees in their assigned region
  - System Admin (region_id = 'ALL'): Sees all employees
  - Regional Admin: Sees only their region's employees
  - Authenticated users via service role: Full access
- ✅ **INSERT**: Can only insert employees into their assigned region
- ✅ **UPDATE**: Can only update employees in their assigned region
- ✅ **DELETE**: Can only delete employees in their assigned region

**Policy Logic** (pseudo-code):
```sql
-- For SELECT
WHERE
  auth.role() = 'service_role' OR
  region_id = (SELECT region_id FROM admin_credentials WHERE id = 'primary')
```

### `checkins` Table
- ✅ **SELECT**: Users can see attendance for their region only
- ✅ **INSERT**: Automatically enforced via employee's region_id
- ✅ **UPDATE/DELETE**: Service role only

### `admin_credentials` & `admin_password_reset_tokens` Tables
- ✅ **ALL OPERATIONS**: Service role only
- ❌ **No user access**: Tables are inaccessible to browser clients

## Frontend Changes (Minimal)

### No Breaking Changes
- Existing UI remains unchanged
- Existing attendance features continue working
- Region selector behavior updated for role-based access

### Regional User Behavior (Regional Admin)
**Before**: Could use region selector to view any region
**After**: Region selector is locked to their assigned region
- Dashboard auto-loads their assigned region
- Cannot switch to another region
- API rejects cross-region requests

### System Admin Behavior
- Can still switch between regions (if UI allows)
- Backend enforces authorization

### Employee Behavior
- No change in user experience
- Attendance features work as before
- Data isolation is transparent

## API Changes

### Server-Side Enforcement

#### `dataStore.ts` - Region-Aware Functions

1. **`getRegionIdFromName(regionName: string): Promise<string>`**
   - Maps region text names to UUID for backward compatibility
   - Caches results for performance (5-minute TTL)

2. **`addEmployee(employee: Employee)`**
   - Resolves region name to region_id before insert
   - Includes region_id in Supabase insert
   - RLS policy rejects if region_id doesn't match user's region

3. **`checkIn(employeeId: string)`**
   - Fetches employee (includes region_id)
   - Includes region_id when inserting attendance record
   - RLS policy rejects if region_id doesn't match user's region

4. **`editEmployee(employee: Employee)`**
   - Preserves employee's existing region_id
   - Cannot change an employee's region via normal edit
   - RLS policy rejects if region_id doesn't match user's region

### Database Queries
- All queries now respect region_id automatically via RLS
- No need to manually add `.eq('region_id', ...)` filters
- RLS is the enforcement layer; filters are optional UX improvements

## Deployment Steps

### Step 1: Run Supabase Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `supabase/multi-region-rls.sql`
3. Paste into the SQL Editor
4. Click "Run" to execute

**Expected Output**:
- Tables created (regions, region_audit_log)
- Columns added to existing tables (region_id)
- Foreign keys created
- RLS policies enabled
- Helper functions created
- No errors

### Step 2: Verify Migration

```sql
-- Check regions table
SELECT name, code, status FROM public.regions;

-- Check employees have region_id
SELECT id, name, region, region_id FROM public.employees LIMIT 5;

-- Check checkins have region_id
SELECT id, "employeeId", region_id FROM public.checkins LIMIT 5;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

### Step 3: Deploy Updated Application

1. Commit changes:
   ```bash
   git add -A
   git commit -m "Implement secure multi-region data isolation with RLS"
   ```

2. Push to main branch:
   ```bash
   git push origin main
   ```

3. Deploy to Vercel:
   ```bash
   vercel --prod --yes --scope water12 --project nairobi-water-attandance
   ```

### Step 4: Monitor Deployment

- Check Vercel deployment status
- Monitor error logs for any RLS-related errors
- Test with a regional user account

## CI / Deployment Notes

- This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that will:
   - Run Supabase SQL migrations (`supabase/admin-auth.sql`, `supabase/multi-region-rls.sql`, `supabase/central-admin-users.sql`) using `psql` and the `SUPABASE_DB_URL` secret.
   - Trigger a Vercel production deploy using `vercel` CLI and `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets.

- Required GitHub Secrets:
   - `SUPABASE_DB_URL` — a full Postgres connection string with sufficient privileges to run DDL and create RLS policies (example: `postgresql://user:pass@db.host:5432/postgres`).
   - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` — for triggering production deploys.

- Recommended Vercel Environment Variables (set in Project Settings):
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server only)
   - `ADMIN_BOOTSTRAP_PASSWORD` — bootstrap password used by `BOOTSTRAP_REQUIRED` seeded accounts
   - `ADMIN_EMAIL` — admin notification email

Notes:
- If you prefer to run migrations using Supabase CLI, replace the `psql` steps with `supabase db push` or `supabase sql` and provide the `SUPABASE_ACCESS_TOKEN` secret instead.
- The workflow assumes the SQL migrations are idempotent and safe to re-run on each push to `main`.

## Security Testing Checklist

## Super Admin: bootstrap, login, and create regional admins

- **Bootstrap password**: Set `ADMIN_BOOTSTRAP_PASSWORD` (or `ADMIN_PASSWORD`) in your environment or Vercel Project Settings. This value is used to complete initial password setup for seeded accounts marked `BOOTSTRAP_REQUIRED`.
- **Seeded accounts**:
   - Central system admin user: username `NWC01` (role `system_admin`).
   - Legacy primary admin for branch-local API: `admin_credentials.id = 'primary'` (used by `/api/admin`).

- **Login as System Admin (username/password)**:

   Example (curl):

   ```bash
   curl -s -X POST "$API_BASE/api/users" \
      -H "Content-Type: application/json" \
      -d '{"action":"login","username":"NWC01","password":"YOUR_BOOTSTRAP_PASSWORD"}'
   ```

   Response contains `user` and `session`. Save the `session` value and use it in the `Authorization` header for subsequent admin API calls:

   ```bash
   -H "Authorization: Bearer <session>"
   ```

- **Create a regional admin (as System Admin)**:

   Example (create a regional manager for Nairobi):

   ```bash
   curl -s -X POST "$API_BASE/api/users" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <session>" \
      -d '{"action":"create","username":"NRB01","fullName":"Nairobi Manager","department":"Administration","role":"regional_manager","region":"Nairobi","password":"Str0ngPass!"}'
   ```

   - If successful, the API returns the created `user` with `region_id` and permissions.
   - System Admin (`system_admin`) can create users for any region. Regional managers can only create/manage users within their own region and cannot create other `regional_manager` or `system_admin` accounts.

**Legacy single-admin login**: For branch-local installations that still use the single-admin API, you can login via `/api/admin` with the bootstrap password (environment variable `ADMIN_BOOTSTRAP_PASSWORD`). This endpoint controls the legacy `admin_credentials` singleton (`id = 'primary'`).

### Test 1: Regional User Cannot See Other Regions
```
Given: Logged in as Region A admin (region_id = NRB)
When: Query employees or attendance records
Then: ONLY Region A data is returned
And: Region B data is NEVER returned
```

### Test 2: Frontend Manipulation Fails
```
Given: Logged in as Region A admin
When: Manually modify API request to request Region B data
Then: Supabase RLS returns 0 results (not an error)
And: No error messages leak information about Region B
```

### Test 3: Cross-Region Employee Operations Denied
```
Given: Logged in as Region A admin
When: Attempt to add an employee with region_id = Region B
Then: Supabase RLS rejects the INSERT
And: Error message: "Unauthorized" or "Not permitted"
```

### Test 4: Cross-Region Attendance Operations Denied
```
Given: Logged in as Region A admin
When: Attempt to record attendance for Region B employee
Then: Supabase RLS rejects the INSERT (via region_id mismatch)
And: Application shows: "Employee not found or unauthorized"
```

### Test 5: System Admin Can Access All Regions
```
Given: Logged in as System Admin (region_id = ALL)
When: Query any region's employees or attendance
Then: All data from all regions is visible
```

### Test 6: Region Parameter Cannot Be Spoofed
```
Given: Regional user's JWT/session
When: User attempts to switch region via URL parameter or request
Then: Backend RLS enforces original region assignment
And: No region switching occurs
```

## Backward Compatibility

### Data Preservation
- ✅ Existing `region` (text) column preserved
- ✅ Existing employee records not deleted
- ✅ Existing attendance records not deleted
- ✅ Data migrated to `region_id` without loss

### Application Compatibility
- ✅ Frontend changes minimal (no breaking changes)
- ✅ Existing API endpoints work unchanged
- ✅ Region names still used in UI (mapped to UUIDs at API boundary)
- ✅ Existing localStorage data for local development untouched

### Fallback Behavior
- Local development: Works with in-memory store
- Production without Supabase: Would fail at startup (not recommended)
- Migration to regions table optional for local dev

## Troubleshooting

### Issue: "RLS policy prevents INSERT into checkins"
**Cause**: Employee's region_id doesn't match authenticated user's region_id
**Solution**: 
1. Verify employee belongs to correct region
2. Check that `region_id` is being passed in INSERT
3. Check RLS policies are correctly configured

### Issue: "Regions table not found"
**Cause**: Migration script not run
**Solution**: Run `supabase/multi-region-rls.sql` in Supabase Dashboard

### Issue: Empty results for employees/attendance
**Cause**: Region filtering is too strict
**Solution**:
1. Check user's region_id in `admin_credentials` table
2. Check employee/attendance records have matching region_id
3. Ensure region_id columns are not NULL

### Issue: "Cannot access column 'region_id' in schema cache"
**Cause**: Supabase schema cache not refreshed after migration
**Solution**:
1. Wait 1-2 minutes for cache to refresh
2. Or: Refresh Supabase connection in application
3. Or: Restart Vercel deployment

## Monitoring & Auditing

### Audit Log Table
All region-sensitive operations are logged in `region_audit_log`:

```sql
-- View recent login attempts
SELECT admin_id, action, region_id, created_at 
FROM public.region_audit_log 
WHERE action = 'login' 
ORDER BY created_at DESC 
LIMIT 20;

-- View all modifications to employees table
SELECT * FROM public.region_audit_log 
WHERE table_name = 'employees' 
ORDER BY created_at DESC;
```

### Monitoring Queries
```sql
-- Check for cross-region access attempts
SELECT admin_id, action, count(*) 
FROM public.region_audit_log 
WHERE region_id != (SELECT region_id FROM public.admin_credentials WHERE id = 'primary')
GROUP BY admin_id, action;

-- Check employee count by region
SELECT r.name, COUNT(e.id) as employee_count
FROM public.regions r
LEFT JOIN public.employees e ON r.id = e.region_id
GROUP BY r.name;
```

## Performance Considerations

### Indices
All region-based queries have dedicated indices:
- `employees.region_id` - Scans only one region
- `checkins.region_id` - Attendance queries by region
- `regions.code` - Fast region lookups

### Query Performance
- ✅ Queries on `region_id` are fast (indexed)
- ✅ RLS policies add minimal overhead
- ✅ In-memory caching of region mappings

### Caching Strategy
- Region ID→Name mappings cached for 5 minutes
- Reduces Supabase queries for high-traffic operations
- Cache invalidation on deployment restart

## Future Enhancements

1. **Admin Region Assignment UI**
   - Allow super admin to assign users to regions
   - Current: Must be done via SQL

2. **Audit Log Dashboard**
   - Visual audit trail of region access
   - Alert on suspicious cross-region attempts

3. **Multi-Department Within Region**
   - Add department-level isolation
   - Combine region_id + department_id in RLS policies

4. **Regional Reports**
   - Pre-aggregate attendance by region
   - Materialized views for performance

5. **Cross-Region Consolidation**
   - Super admin dashboard showing all regions
   - Filtered audit reports

## References

- Supabase Documentation: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- JWT Claims: https://supabase.com/docs/guides/auth/custom-claims

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review RLS policies in `supabase/multi-region-rls.sql`
3. Check application logs for RLS errors
4. Consult Supabase documentation

---

**Implementation Date**: 2026-08-09
**Status**: Ready for Production
**Testing Required**: ✓ Security validation needed before full rollout
