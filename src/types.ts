export type EmployeeStatus = 'Active' | 'Inactive' | 'On Leave';
export type CheckInStatus = 'ON TIME' | 'GRACE PERIOD' | 'LATE';
export type AttendanceWindowStatus = CheckInStatus | 'CLOSED';
export type Tab = 'attendance' | 'dashboard' | 'admin' | 'reports';

export interface Employee {
  id: string; // e.g. "NW-1045"
  name: string;
  email: string;
  department: string;
  position: string;
  status: EmployeeStatus;
  imageUrl: string;
  verified: boolean;
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
}

export interface DashboardStats {
  totalEmployees: number;
  checkedIn: number;
  onTime: number;
  gracePeriod: number;
  lateArrivals: number;
  unaccounted: number;
}
