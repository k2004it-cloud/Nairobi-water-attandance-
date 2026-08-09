export type EmployeeStatus = 'Active' | 'Inactive' | 'On Leave';
export type CheckInStatus = 'ON TIME' | 'GRACE PERIOD' | 'LATE';
export type AttendanceWindowStatus = CheckInStatus | 'CLOSED';
export type Tab = 'attendance' | 'dashboard' | 'admin' | 'reports' | 'support' | 'region';

/**
 * Region represents a geographic or organizational region.
 * Uses UUID for secure isolation via Row Level Security.
 */
export interface Region {
  id: string; // UUID
  name: string;
  code: string; // e.g. 'NRB', 'CEN', 'CST', 'WST', 'RFT', 'ALL'
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id: string; // e.g. "NW-1045"
  name: string;
  email: string;
  department: string;
  position: string;
  status: EmployeeStatus;
  imageUrl: string;
  verified: boolean;
  region?: string; // Legacy: region text name for backward compatibility
  region_id?: string; // New: UUID reference for RLS enforcement
}

export interface CheckInLog {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position?: string;
  checkInTime: string; // e.g. "08:12 AM" or exact ISO string
  status: CheckInStatus;
  avatarInitials: string;
  avatarBg: string; // Tailwind class like bg-blue-500
  imageUrl?: string;
  remarks?: string;
  dateKey?: string; // YYYY-MM-DD in Nairobi time
  region_id?: string; // New: UUID reference for RLS enforcement
}

export interface DashboardStats {
  totalEmployees: number;
  checkedIn: number;
  onTime: number;
  gracePeriod: number;
  lateArrivals: number;
  unaccounted: number;
}
