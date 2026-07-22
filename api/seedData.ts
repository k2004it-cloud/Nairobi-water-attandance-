import type { Employee, CheckInLog, EmployeeStatus } from '../src/types.js';

type SeedEmployee = Omit<Employee, 'email' | 'imageUrl'>;

const EMPLOYEE_BASE: SeedEmployee[] = [
  { id: 'NW-1001', name: 'Amina Hassan Ali', department: 'Human Resources', position: 'HR Associate', status: 'Active', verified: true },
  { id: 'NW-1002', name: 'John Kamau', department: 'Maintenance', position: 'Maintenance Lead', status: 'Active', verified: true },
  { id: 'NW-1003', name: 'Jane Mutua', department: 'Customer Service', position: 'Account Manager', status: 'Active', verified: true },
  { id: 'NW-1004', name: 'Omari Kenyatta', department: 'Operations', position: 'Operations Officer', status: 'Active', verified: true },
  { id: 'NW-1005', name: 'Amani Wanjiku', department: 'Finance', position: 'Financial Analyst', status: 'Active', verified: true },
  { id: 'NW-1006', name: 'Jabari Mwangi', department: 'Engineering', position: 'Technical Engineer', status: 'Inactive', verified: true },
  { id: 'NW-1007', name: 'Grace Muthoni Njeri', department: 'Billing & Revenue', position: 'Billing Specialist', status: 'Active', verified: false },
  { id: 'NW-1008', name: 'Peter Otieno Juma', department: 'Water Quality', position: 'Water Chemist', status: 'Active', verified: true },
  { id: 'NW-1009', name: 'Sarah Odhiambo', department: 'Customer Service', position: 'Service Coordinator', status: 'Active', verified: true },
  { id: 'NW-1010', name: 'David Kipruto', department: 'IT Support', position: 'Network Engineer', status: 'Active', verified: false },
  { id: 'NW-1011', name: 'Fatima Noor', department: 'Operations', position: 'Field Coordinator', status: 'Active', verified: true },
  { id: 'NW-1012', name: 'Kevin Ochieng', department: 'Logistics', position: 'Logistics Specialist', status: 'Active', verified: true },
  { id: 'NW-1013', name: 'Naomi Wangari', department: 'Human Resources', position: 'Recruitment Officer', status: 'Active', verified: true },
  { id: 'NW-1014', name: 'George Mworia', department: 'Operations', position: 'Shift Supervisor', status: 'Active', verified: true },
  { id: 'NW-1015', name: 'Susan Naliaka', department: 'Engineering', position: 'Civil Engineer', status: 'On Leave', verified: true },
  { id: 'NW-1016', name: 'Leonard Kamotho', department: 'Maintenance', position: 'Electrical Technician', status: 'Active', verified: true },
  { id: 'NW-1017', name: 'Janet Karanja', department: 'Finance', position: 'Accounts Payable', status: 'Active', verified: true },
  { id: 'NW-1018', name: 'Michael Simiyu', department: 'IT Support', position: 'Help Desk Analyst', status: 'Active', verified: false },
  { id: 'NW-1019', name: 'Esther Nyokabi', department: 'Customer Service', position: 'Client Relations', status: 'Active', verified: true },
  { id: 'NW-1020', name: 'Daniel Kiptoo', department: 'Operations', position: 'Site Inspector', status: 'Active', verified: true },
  { id: 'NW-1021', name: 'Linda Moraa', department: 'Billing & Revenue', position: 'Revenue Specialist', status: 'Active', verified: true },
  { id: 'NW-1022', name: 'Philip Ndegwa', department: 'Logistics', position: 'Fleet Coordinator', status: 'Active', verified: true },
  { id: 'NW-1023', name: 'Alice Wairimu', department: 'Human Resources', position: 'HR Manager', status: 'Active', verified: true },
  { id: 'NW-1024', name: 'Brian Maina', department: 'Engineering', position: 'Systems Engineer', status: 'Active', verified: false },
  { id: 'NW-1025', name: 'Evelyn Njeri', department: 'Customer Service', position: 'Receptionist', status: 'Active', verified: true },
  { id: 'NW-1026', name: 'Samuel Kosgei', department: 'Operations', position: 'Water Treatment Lead', status: 'Active', verified: true },
  { id: 'NW-1027', name: 'Carol Wambui', department: 'Maintenance', position: 'Safety Officer', status: 'Active', verified: true },
  { id: 'NW-1028', name: 'Vincent Mutiso', department: 'Finance', position: 'Budget Analyst', status: 'Active', verified: true },
  { id: 'NW-1029', name: 'Cecilia Atieno', department: 'Water Quality', position: 'Lab Technician', status: 'Active', verified: true },
  { id: 'NW-1030', name: 'Bernard Obiero', department: 'Logistics', position: 'Warehouse Lead', status: 'Active', verified: false },
  { id: 'NW-1031', name: 'Nancy Mabeya', department: 'Human Resources', position: 'Training Coordinator', status: 'Active', verified: true },
  { id: 'NW-1032', name: 'Dennis Kimani', department: 'Engineering', position: 'Maintenance Engineer', status: 'Active', verified: true },
  { id: 'NW-1033', name: 'Ruth Chebet', department: 'Operations', position: 'Supply Chain Officer', status: 'Active', verified: true },
  { id: 'NW-1034', name: 'Anthony Kiplagat', department: 'IT Support', position: 'Software Support', status: 'Active', verified: true },
  { id: 'NW-1035', name: 'Miriam Chepkorir', department: 'Customer Service', position: 'Help Desk Lead', status: 'Inactive', verified: true },
  { id: 'NW-1036', name: 'Patrick Karanja', department: 'Finance', position: 'Treasury Officer', status: 'Active', verified: true },
  { id: 'NW-1037', name: 'Joyce Wangui', department: 'Operations', position: 'Quality Control', status: 'Active', verified: true },
  { id: 'NW-1038', name: 'Fredrick Muriuki', department: 'Maintenance', position: 'Repair Technician', status: 'Active', verified: true },
  { id: 'NW-1039', name: 'Cynthia Nyaga', department: 'Billing & Revenue', position: 'Collections Officer', status: 'Active', verified: false },
  { id: 'NW-1040', name: 'Josephat Kibet', department: 'Water Quality', position: 'Chemical Analyst', status: 'Active', verified: true },
  { id: 'NW-1041', name: 'Sharon Naliaka', department: 'Human Resources', position: 'Payroll Specialist', status: 'Active', verified: true },
  { id: 'NW-1042', name: 'Moses Amimo', department: 'Logistics', position: 'Procurement Officer', status: 'Active', verified: true },
  { id: 'NW-1043', name: 'Brenda Wanjiru', department: 'Operations', position: 'Distribution Coordinator', status: 'Active', verified: true },
  { id: 'NW-1044', name: 'Kelvin Ouma', department: 'Engineering', position: 'Infrastructure Engineer', status: 'Active', verified: true },
  { id: 'NW-1045', name: 'Patricia Chepkoech', department: 'Customer Service', position: 'Customer Success', status: 'Active', verified: true }
];

const imageUrls = EMPLOYEE_BASE.map((_, index) => `https://i.pravatar.cc/150?img=${(index % 70) + 1}`);

function createEmail(name: string) {
  return `${name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .replace(/\s+/g, '.')
  }@nairobiwater.co.ke`;
}

export const INITIAL_EMPLOYEES: Employee[] = EMPLOYEE_BASE.map(
  (employee: SeedEmployee, index): Employee => ({
    ...employee,
    email: createEmail(employee.name),
    imageUrl: imageUrls[index],
    status: employee.status as EmployeeStatus
  })
);

export const INITIAL_LOGS: CheckInLog[] = [
  {
    id: 'LOG-001',
    employeeId: 'NW-1001',
    employeeName: 'Amina Hassan Ali',
    department: 'Human Resources',
    position: 'HR Associate',
    checkInTime: '08:12 AM',
    status: 'LATE',
    avatarInitials: 'AH',
    avatarBg: 'bg-blue-500',
    imageUrl: imageUrls[0]
  },
  {
    id: 'LOG-002',
    employeeId: 'NW-1002',
    employeeName: 'John Kamau',
    department: 'Maintenance',
    position: 'Maintenance Lead',
    checkInTime: '08:25 AM',
    status: 'LATE',
    avatarInitials: 'JK',
    avatarBg: 'bg-amber-500',
    imageUrl: imageUrls[1]
  },
  {
    id: 'LOG-003',
    employeeId: 'NW-1003',
    employeeName: 'Jane Mutua',
    department: 'Customer Service',
    position: 'Account Manager',
    checkInTime: '09:05 AM',
    status: 'LATE',
    avatarInitials: 'JM',
    avatarBg: 'bg-red-500',
    imageUrl: imageUrls[2]
  },
  {
    id: 'LOG-004',
    employeeId: 'NW-1004',
    employeeName: 'Omari Kenyatta',
    department: 'Operations',
    position: 'Operations Officer',
    checkInTime: '07:58 AM',
    status: 'ON TIME',
    avatarInitials: 'OK',
    avatarBg: 'bg-emerald-500',
    imageUrl: imageUrls[3]
  },
  {
    id: 'LOG-005',
    employeeId: 'NW-1005',
    employeeName: 'Amani Wanjiku',
    department: 'Finance',
    position: 'Financial Analyst',
    checkInTime: '08:00 AM',
    status: 'ON TIME',
    avatarInitials: 'AW',
    avatarBg: 'bg-indigo-500',
    imageUrl: imageUrls[4]
  },
  {
    id: 'LOG-006',
    employeeId: 'NW-1006',
    employeeName: 'Jabari Mwangi',
    department: 'Engineering',
    position: 'Technical Engineer',
    checkInTime: '08:30 AM',
    status: 'LATE',
    avatarInitials: 'JM',
    avatarBg: 'bg-sky-500',
    imageUrl: imageUrls[5]
  },
  {
    id: 'LOG-007',
    employeeId: 'NW-1007',
    employeeName: 'Grace Muthoni Njeri',
    department: 'Billing & Revenue',
    position: 'Billing Specialist',
    checkInTime: '08:42 AM',
    status: 'LATE',
    avatarInitials: 'GN',
    avatarBg: 'bg-rose-500',
    imageUrl: imageUrls[6]
  },
  {
    id: 'LOG-008',
    employeeId: 'NW-1008',
    employeeName: 'Peter Otieno Juma',
    department: 'Water Quality',
    position: 'Water Chemist',
    checkInTime: '07:50 AM',
    status: 'ON TIME',
    avatarInitials: 'PO',
    avatarBg: 'bg-lime-500',
    imageUrl: imageUrls[7]
  },
  {
    id: 'LOG-009',
    employeeId: 'NW-1009',
    employeeName: 'Sarah Odhiambo',
    department: 'Customer Service',
    position: 'Service Coordinator',
    checkInTime: '08:10 AM',
    status: 'LATE',
    avatarInitials: 'SO',
    avatarBg: 'bg-fuchsia-500',
    imageUrl: imageUrls[8]
  },
  {
    id: 'LOG-010',
    employeeId: 'NW-1010',
    employeeName: 'David Kipruto',
    department: 'IT Support',
    position: 'Network Engineer',
    checkInTime: '09:20 AM',
    status: 'LATE',
    avatarInitials: 'DK',
    avatarBg: 'bg-cyan-500',
    imageUrl: imageUrls[9]
  },
  {
    id: 'LOG-011',
    employeeId: 'NW-1011',
    employeeName: 'Fatima Noor',
    department: 'Operations',
    position: 'Field Coordinator',
    checkInTime: '08:03 AM',
    status: 'LATE',
    avatarInitials: 'FN',
    avatarBg: 'bg-violet-500',
    imageUrl: imageUrls[10]
  },
  {
    id: 'LOG-012',
    employeeId: 'NW-1012',
    employeeName: 'Kevin Ochieng',
    department: 'Logistics',
    position: 'Logistics Specialist',
    checkInTime: '08:35 AM',
    status: 'LATE',
    avatarInitials: 'KO',
    avatarBg: 'bg-emerald-700',
    imageUrl: imageUrls[11]
  }
];
