# Branch Access Links - Multi-Region Setup

## Current Setup (Nairobi Only)

```
Reception Desk (Nairobi):
https://nairobi-water-attandance.vercel.app
```

---

## For Other Branches (When Expanded)

### Option 1: Single URL with Region Selector (Current Design)

All branches use same URL:
```
Nairobi Branch:    https://nairobi-water-attandance.vercel.app
Central Branch:    https://nairobi-water-attandance.vercel.app (select Central)
Coast Branch:      https://nairobi-water-attandance.vercel.app (select Coast)
Western Branch:    https://nairobi-water-attandance.vercel.app (select Western)
Rift Valley Branch: https://nairobi-water-attandance.vercel.app (select Rift Valley)
```

**How it works:**
- Reception desk logs in with their regional credentials
- System automatically shows their branch only (e.g., "Reception region • Central")
- Data locked to their region

---

### Option 2: Separate Subdomain Links (If You Want)

Create separate URLs per branch:
```
Nairobi:     https://nairobi.nairobi-water-attandance.vercel.app
Central:     https://central.nairobi-water-attandance.vercel.app
Coast:       https://coast.nairobi-water-attandance.vercel.app
Western:     https://western.nairobi-water-attandance.vercel.app
Rift Valley: https://riftvalley.nairobi-water-attandance.vercel.app
```

**Requires:** Deploy multiple instances (5 separate deployments)

---

### Option 3: Separate Domain Links (If You Have Multiple Domains)

```
Nairobi:     https://nairobi.nwc.ke
Central:     https://central.nwc.ke
Coast:       https://coast.nwc.ke
Western:     https://western.nwc.ke
Rift Valley: https://riftvalley.nwc.ke
```

**Requires:** 5 domain names + 5 separate deployments

---

## Recommended: Option 1 (Single URL)

**Why:**
- ✅ One link to remember
- ✅ One system to maintain
- ✅ Regional staff logs in → auto-locked to their region
- ✅ Easiest to manage

**How to use for each branch:**

**Nairobi Branch Reception:**
```
1. URL: https://nairobi-water-attandance.vercel.app
2. Login: (Regional Manager for Nairobi)
   Username: NWC_NRB_MGR
   Password: ••••••••
3. System shows: "Reception region • Nairobi" (blue badge)
4. Start checking in employees
```

**Central Branch Reception (When Added):**
```
1. URL: https://nairobi-water-attandance.vercel.app (SAME URL)
2. Login: (Regional Manager for Central)
   Username: NWC_CEN_MGR
   Password: ••••••••
3. System shows: "Reception region • Central" (emerald badge)
4. Sees only Central employees
5. Can only check in Central staff
```

**Coast Branch Reception (When Added):**
```
1. URL: https://nairobi-water-attandance.vercel.app (SAME URL)
2. Login: (Regional Manager for Coast)
   Username: NWC_CST_MGR
   Password: ••••••••
3. System shows: "Reception region • Coast" (amber badge)
4. Sees only Coast employees
5. Can only check in Coast staff
```

---

## Setup for Multiple Branches

### Step 1: Run Supabase Migration (Single time - Covers all 6 regions)
```
File: supabase/multi-region-rls.sql
Regions created:
├── Nairobi (NRB)
├── Central (CEN)
├── Coast (CST)
├── Western (WST)
├── Rift Valley (RFT)
└── All Regions (ALL)
```

### Step 2: Create Regional Manager for Each Branch

**System Admin creates:**

**Central Branch Manager:**
```
Full Name: Central Branch Manager
Username: NWC_CEN_MGR
Password: [Auto-generated]
Role: regional_manager
Region: Central
```

**Coast Branch Manager:**
```
Full Name: Coast Branch Manager
Username: NWC_CST_MGR
Password: [Auto-generated]
Role: regional_manager
Region: Coast
```

**Western Branch Manager:**
```
Full Name: Western Branch Manager
Username: NWC_WST_MGR
Password: [Auto-generated]
Role: regional_manager
Region: Western
```

**Rift Valley Branch Manager:**
```
Full Name: Rift Valley Branch Manager
Username: NWC_RFT_MGR
Password: [Auto-generated]
Role: regional_manager
Region: Rift Valley
```

### Step 3: Each Branch Uses Same URL

```
https://nairobi-water-attandance.vercel.app
```

Each Regional Manager logs in with their credentials → Auto-locked to their branch data.

---

## What Happens When Each Branch Logs In

```
┌─────────────────────────────────────────────────────┐
│              Central Branch Reception                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Login: NWC_CEN_MGR                                │
│  Password: ••••••••                                │
│         ↓                                          │
│  System checks: This user is assigned to Central   │
│  Region Badge: "Central" (emerald color)          │
│                                                     │
│  Available employees: ONLY Central staff           │
│  Data visible: ONLY Central attendance             │
│  Can check in: ONLY Central employees              │
│  Cannot see: Nairobi, Coast, Western, Rift Valley │
│                                                     │
│  Even if someone tries to hack or change:         │
│  - Browser manipulation: Blocked by RLS            │
│  - Direct API call: Blocked by RLS                │
│  - Database query: RLS filters to Central only     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Summary: Branch Access (When All Setup)

| Branch | Link | Login Username | Region Shown | Data Visibility |
|--------|------|---|---|---|
| Nairobi | https://nairobi-water-attandance.vercel.app | NWC_NRB_MGR | Nairobi | Nairobi only |
| Central | https://nairobi-water-attandance.vercel.app | NWC_CEN_MGR | Central | Central only |
| Coast | https://nairobi-water-attandance.vercel.app | NWC_CST_MGR | Coast | Coast only |
| Western | https://nairobi-water-attandance.vercel.app | NWC_WST_MGR | Western | Western only |
| Rift Valley | https://nairobi-water-attandance.vercel.app | NWC_RFT_MGR | Rift Valley | Rift Valley only |

---

## Right Now (Nairobi Only)

```
Reception PC Link:
https://nairobi-water-attandance.vercel.app

Login (Optional for Reception):
Username: NWC02 (HR Coordinator - can see all data)
or NWC_NRB_MGR (when created by Super Admin)

Shows: "Reception region • Nairobi"
```

---

**For other branches in future: Same URL, different logins = Different branches locked to their own data** ✅

