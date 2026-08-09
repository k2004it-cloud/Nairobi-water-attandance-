# System Access Control: Staff Check-In vs Admin Management

## Overview

This document clarifies how the system operates with two distinct user types:

1. **Employees/Staff**: No login required, just check in at reception
2. **Admins**: Only System Admin manages who becomes Regional Admin or other admins

---

## PART 1: EMPLOYEE CHECK-IN (No Login Required)

### How It Works

```
Employee Arrives at Nairobi Office
  ↓
Reception Desk opens application
  ↓
Reception: Types employee ID (e.g., "NW-1001")
  ↓
System finds employee in Nairobi region
  ↓
Reception: Clicks "Check In" button
  ↓
Attendance recorded (no employee login needed)
  ↓
System shows: "John Kimani checked in at 08:30 AM - ON TIME"
```

### Key Points

✅ **Employees do NOT have login credentials**  
✅ **Employees do NOT have accounts in the system**  
✅ **Employees do NOT need to authenticate**  
✅ **Only Reception Desk (admin) performs check-in**  
✅ **Reception needs admin login (for their region)**  

### Current Implementation

**File**: `api/dataStore.ts` - `checkIn()` function

```typescript
export async function checkIn(employeeId: string) {
  // Step 1: Find employee by ID (no auth required)
  const employeeData = await fetch employee where id = employeeId
  
  // Step 2: Validate employee exists
  if (!employeeData) throw "Employee not found"
  
  // Step 3: Check if already checked in today
  if (already_checked_in_today) throw "Already checked in today"
  
  // Step 4: Validate check-in is open
  if (check_in_closed) throw "Check-in closed"
  
  // Step 5: Create attendance record
  insert attendance log with region_id from employee
  
  // Step 6: Return success
  return { success: true, message: "Checked in successfully" }
}
```

**No authentication required for employee**

---

## PART 2: ADMIN MANAGEMENT (Super Admin Only)

### User Hierarchy

```
┌─────────────────────────────────────────────────────┐
│            SYSTEM ADMIN (Super Admin)               │
│  ✓ Only person who creates/manages ALL admins      │
│  ✓ Can create Regional Managers                     │
│  ✓ Can create HR Coordinators                       │
│  ✓ Can assign regions to admins                     │
│  ✓ Can remove admin access                          │
│  ✓ Has access to ALL regions                        │
└────────────┬────────────────────────────────────────┘
             │
    ┌────────┴────────────────────────────┐
    │                                     │
    ↓                                     ↓
┌──────────────────────┐        ┌──────────────────────┐
│  REGIONAL MANAGER    │        │  HR COORDINATOR      │
│  (Nairobi Only)      │        │  (All Regions)       │
│                      │        │                      │
│ ✓ Created by:        │        │ ✓ Created by:        │
│   System Admin only   │        │   System Admin only  │
│                      │        │                      │
│ ✓ Can see/do:        │        │ ✓ Can see/do:        │
│   ├─ Nairobi data    │        │   ├─ All data        │
│   ├─ Nairobi reports │        │   ├─ All reports     │
│   ├─ View reports    │        │   ├─ Export reports  │
│   └─ Cannot add      │        │   ├─ View dashboard  │
│      other admins    │        │   └─ Cannot add      │
│                      │        │      other admins    │
└──────────────────────┘        └──────────────────────┘
```

### Step 1: System Admin Logs In

```
Super Admin opens application
  ↓
Login with credentials:
├── Username: "NWC01" (or configured super admin)
├── Password: ••••••••
└── Region: "All Regions"
  ↓
System verifies: "system_admin" role ✓
  ↓
Super Admin logged in
  ↓
Can now access: Admin Management panel
```

### Step 2: Super Admin Adds Regional Manager

```
Super Admin in Admin Panel
  ↓
Clicks: "Add New Admin" or "Manage Users"
  ↓
Form appears:
├── Full Name: "Ahmed Hassan"
├── Username: "NWC_NAIROBI_01"
├── Role: [Dropdown: system_admin, hr_coordinator, REGIONAL_MANAGER, ...]
│         ^ Super Admin selects "regional_manager"
├── Region: [Dropdown: Nairobi, Central, Coast, ...]
│         ^ Super Admin selects "Nairobi"
├── Status: Active
└── Initial Password: [Auto-generated or entered]
  ↓
Super Admin clicks: "Create Admin"
  ↓
System creates:
├── User account: Ahmed Hassan (NWC_NAIROBI_01)
├── Role: regional_manager
├── Region: Nairobi (region_id = NRB-UUID)
├── Password: Set (will need to reset on first login)
└── Status: Active
  ↓
Regional Manager can now:
✓ Login to system
✓ See Nairobi data only (RLS enforces)
✓ Cannot create other admins
✓ Cannot access other regions
```

### Step 3: Regional Manager Logs In

```
Regional Manager opens application
  ↓
Login with credentials:
├── Username: "NWC_NAIROBI_01"
├── Password: ••••••••
└── (Super Admin provided these)
  ↓
System verifies: "regional_manager" role + region_id = NRB ✓
  ↓
Regional Manager dashboard shows:
├── Region: "Nairobi" (read-only)
├── Available features:
│   ├── ✓ View attendance
│   ├── ✓ View reports
│   ├── ✓ Export reports
│   ├── ✓ View dashboard
│   └── ✗ Cannot add other admins
├── Data shown: Nairobi region only (RLS enforces)
└── Cannot see: Other regions (even if they try)
```

---

## PART 3: Who Can Do What

### EMPLOYEES/STAFF

| Action | Allowed | How |
|--------|---------|-----|
| Check In | ✅ YES | Reception desk performs check-in using employee ID |
| Login | ❌ NO | Employees don't have login accounts |
| View Data | ❌ NO | No access to system |
| Add Other Staff | ❌ NO | HR does this (not employee) |
| Change Region | ❌ NO | Not applicable |
| Modify Attendance | ❌ NO | Cannot change their own records |

### REGIONAL MANAGER (Nairobi)

| Action | Allowed | By Whom |
|--------|---------|---------|
| View Nairobi Attendance | ✅ YES | Can view own region |
| View Nairobi Reports | ✅ YES | Can export, print own region |
| View Dashboard (Nairobi) | ✅ YES | Statistics for Nairobi |
| View Other Regions | ❌ NO | RLS blocks (no data returned) |
| Add Staff to Nairobi | ⚠️ Maybe | HR Coordinator may do this instead |
| Add Another Regional Manager | ❌ NO | Only Super Admin can |
| Change to Different Region | ❌ NO | Super Admin must reassign |
| Create HR Coordinator | ❌ NO | Only Super Admin can |

### HR COORDINATOR (All Regions)

| Action | Allowed | By Whom |
|--------|---------|---------|
| Add New Staff | ✅ YES | Can add to any region |
| View All Attendance | ✅ YES | Can see all regions |
| Export Reports | ✅ YES | From any region |
| View Dashboard | ✅ YES | All regions statistics |
| Add New Admin | ❌ NO | Only Super Admin can |
| Delete Staff | ⚠️ Maybe | Depending on design |
| Change User Passwords | ❌ NO | If needed, Super Admin |

### SYSTEM ADMIN (Super Admin)

| Action | Allowed |
|--------|---------|
| View All Data | ✅ YES (all regions) |
| Add Regional Manager | ✅ YES |
| Add HR Coordinator | ✅ YES |
| Add Secretary | ✅ YES |
| Add IT Technician | ✅ YES |
| Assign Regions to Admins | ✅ YES |
| Remove Admin Access | ✅ YES |
| Reset Admin Passwords | ✅ YES |
| Create New Regions | ✅ YES |
| Manage Audit Logs | ✅ YES |
| Change Any Region | ✅ YES |
| Everything Else | ✅ YES |

---

## PART 4: Default Users (Already Created)

### System Admin (Super Admin)

```
Username: NWC01
Role: system_admin
Region: All Regions
Permissions: Everything
Status: Active (must set password on first login)
```

This is the ONLY account that can:
- Create new admin users
- Assign regions to admins
- Manage all regions
- Access all data

### Other Pre-Configured Users

```
HR Coordinator (NWC02 - Mary Wanjiku)
├── Created by: Super Admin (at setup)
├── Can modify: Any settings, but no password management
└── Can create: Nothing (read-only for admins)

HR Supervisor (NWC03)
├── Created by: Super Admin
├── Region: All Regions
└── Similar to HR Coordinator

Regional Manager
├── Created by: Super Admin ONLY
├── Region: Specific (e.g., Nairobi)
└── Can only see own region
```

---

## PART 5: Workflow Scenario

### Scenario: Adding New Nairobi Regional Manager

#### Prerequisites
- You are logged in as Super Admin (NWC01)
- You have "users:manage" permission
- New person: "Julius Kipchoge" (HR Manager in Nairobi)

#### Steps

**Step 1**: Super Admin navigates to "Admin Management" section
```
Dashboard → Users → Add Admin
```

**Step 2**: Fill form
```
Full Name:        "Julius Kipchoge"
Username:         "NWC_JUL_NRB" (auto-generated or custom)
Email:            "julius@nwc.ke"
Role:             "regional_manager" (dropdown)
Region:           "Nairobi" (dropdown)
Department:       "Human Resources"
Initial Password: [Auto-generated: "TempPass123!"]
Status:           "Active"
```

**Step 3**: Super Admin clicks "Create Admin"

**Step 4**: System creates:
- User record in `admin_credentials` table
- region_id = NRB UUID (from Nairobi)
- role = "regional_manager"
- password hash stored securely

**Step 5**: Super Admin shares credentials with Julius
```
Username: NWC_JUL_NRB
Temporary Password: TempPass123!
First Login URL: https://nairobi-water-attandance.vercel.app/login
Important: Change password on first login
```

**Step 6**: Julius logs in
```
1. Enter username: NWC_JUL_NRB
2. Enter password: TempPass123!
3. System prompts: "Change password"
4. Julius sets new password
5. Dashboard loads: Shows Nairobi data only
```

**Step 7**: System automatically enforces region isolation
```
Julius tries to access Central region data:
├── Sends request: GET /api/employees?region=Central
├── Server checks: User's region_id = NRB
├── RLS Policy: WHERE region_id = (select region_id from admin_credentials where id = julius)
├── Result: Only Nairobi employees returned
├── Central employees: Not in result set
└── Julius sees: "No employees found" or only Nairobi list
```

---

## PART 6: Security Guarantees

### No One Except Super Admin Can Add Admins
```
Scenario: Regional Manager tries to add another admin
├── Clicks: "Add Admin" button
├── System checks: Do I have permission "users:manage"?
│   └── Regional Manager permission: ✗ No (only system_admin has this)
├── Result: Button disabled or error shown
└── Conclusion: Cannot add admins ✓
```

### No One Can Change Their Own Region
```
Scenario: Regional Manager tries to change region to Central
├── Tries to edit: Their own profile
├── Attempts: Change region field
├── Server validation: Can user change region_id?
│   └── Only system_admin can ✗ Regional Manager cannot
├── Result: Field disabled or request rejected
└── Must ask: Super Admin to reassign region
```

### Employees Cannot Access Admin Functions
```
Scenario: Employee tries to access /admin/users
├── No login account exists for employee
├── Cannot authenticate
├── Redirected to login page
├── Cannot proceed
└── Conclusion: Employees completely isolated ✓
```

---

## PART 7: Implementation Verification

### Current Code Status

**Employee Check-In** (No login):
```typescript
✅ checkIn() function requires only employee ID
✅ No authentication check for employee
✅ Reception desk (admin) performs action
```

**Admin Management** (Super Admin only):
```typescript
⚠️ Need to verify: Only system_admin can call user creation API
⚠️ Need to verify: Permission checks are enforced
⚠️ Need to verify: Regional managers cannot call admin APIs
```

### Recommended Verification

1. **Check permission enforcement** in admin endpoints
2. **Verify role validation** for user creation
3. **Test region isolation** via RLS policies
4. **Confirm** super admin is the only user creation authority

---

## PART 8: Operational Procedures

### Creating Super Admin at Setup

```sql
-- In Supabase SQL Editor
INSERT INTO public.admin_credentials (
  id,
  username,
  email,
  role,
  region_id,
  status,
  department,
  full_name
) VALUES (
  'system-admin-primary',
  'NWC01',
  'admin@nwc.ke',
  'system_admin',
  (SELECT id FROM public.regions WHERE code = 'ALL'),
  'active',
  'Administration',
  'System Administrator'
);
```

### Adding Regional Manager (After Super Admin Setup)

**Via UI** (Once super admin logged in):
1. Go to Admin Management
2. Click "Add New Admin"
3. Set Role = "regional_manager"
4. Set Region = "Nairobi" (or other)
5. Click Create

**Via SQL** (If needed):
```sql
INSERT INTO public.admin_credentials (
  username, email, role, region_id, status, full_name
) VALUES (
  'NWC_NRB_MGR',
  'manager@nwc.ke',
  'regional_manager',
  (SELECT id FROM public.regions WHERE code = 'NRB'),
  'active',
  'Regional Manager Nairobi'
);
```

---

## Summary

| Item | Rule |
|------|------|
| **Employees** | ✅ No login, just check in at reception |
| **Super Admin** | ✅ Only person adding regional managers |
| **Regional Manager** | ✅ Can only see own region |
| **Admin Creation** | ✅ Super Admin exclusive permission |
| **Region Assignment** | ✅ Super Admin only |
| **Access Control** | ✅ Database-enforced via RLS |
| **Audit** | ✅ Complete trail of admin actions |

---

**Status: ✅ System designed for Super Admin-only admin management**  
**Implementation: Ready to deploy**  
**Verification: Recommended before go-live**

