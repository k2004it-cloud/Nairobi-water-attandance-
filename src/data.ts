import { Employee, CheckInLog } from './types';

export const DEPARTMENTS = ['All Departments'];
export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'NW-3988',
    name: 'John Kamau',
    email: 'john.kamau@nairobiwater.co.ke',
    department: 'Maintenance',
    position: 'Maintenance Lead',
    status: 'Active',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAL7alqy3Q6fC7Ae2CfEBn-yuHxv1kcgOVZxCBrIgDIKOvy7B5wNuAei0XhDoWHBEJPC-1koGYFVLMp6xaq6-VczqQwHykKIjomfZc4gYoJPnqxglmIvghBTC3vHcvNEgrts4DeraBlhCWNmNCWhTCjtmZhVyiQ2JodRZ8qsZLltoRdZdV0quam-Wd57o8M0tZ28Xt5QUbk68_3dAIVrdW5kwFZEsfhVQg8IBxMq02XdlR57wJ0cx2coJAC2PX5FYK4_HplsxghTdaW',
    verified: true
  },
  {
    id: 'NW-4210',
    name: 'Jane Mutua',
    email: 'jane.mutua@nairobiwater.co.ke',
    department: 'Customer Service',
    position: 'Account Manager',
    status: 'Active',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhCteYstqhVjODKX31tC8FYJVRRPXJx0Kv6iQ6ilBmbAZjip1Q05vOlpgOBfAKnxMt61DRjHU6ej18F4TvKPqeAdnyvpnDBsq6Z5TTJvkQzZ9uSGVe4UEfjy3p5GkPR9gWiFw6v5VsG-1OIZT-z_j14XOzoRSo1b9qR8AzZizUQ-nqg0xE6suwfQYJiyzMFHgA-QGxsXzaDlGFYkTgPbCt4q982j8b8b4a0TWaVEzU5RThP4AStIFs9QashP2iy1LuDACsdYhXwiZR',
    verified: true
  },
  {
    id: 'NW-7721',
    name: 'Omari Kenyatta',
    email: 'omari.k@nairobiwater.co.ke',
    department: 'Operations',
    position: 'Operations Officer',
    status: 'Active',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOdE0clXfPzyqdmYxmqd-tVK16IEh-jVGhOPpJs7rC7WcUF6QTZn1bOAQQQ0ZDNiFYOManvuUyQGtmMeHlm_JY04huTKQ0Haz53FlqlD0vkpUlO-5SOLOmcOUJW9BmRM9Bp2SdjjWbd9nBG9Z4lMzOKei7Zlz1bpZzrye7mQl5JGcn8xtit4mrgNddvOokoqX0lotgh0wXec8fMh6hV41zRkXe-18-LVy-Wlxu6msXJecOfP7maYx013hlbeHdLZ2nfebjKea_amIb',
    verified: true
  },
  {
    id: 'NW-8104',
    name: 'Amani Wanjiku',
    email: 'a.wanjiku@nairobiwater.co.ke',
    department: 'Finance',
    position: 'Financial Analyst',
    status: 'Active',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUe998_55VoJc-pz9nmmvq1oJDrovY0RBNyEvX-CINzsW3sgCEHvqjVrcmpUxZObNOLdgARokqcoLT-PqVfBMGys4ocRxPhNfhqXnRTDIJ5OvTyZdGGxEUiWYgtD9srvc8EK7AYi0yY0X-EUcA9OfwetRgSI4YjP4_WPYDdu9FUnIm0zWisCvkbBxcRBV3ZdlyNqIMmNI_E3rCWrNH51bAYaax08TNdX4t6cR781SisEPSXylo7REf0qPRVsnXQpIwvpwJ2N5tVAjb',
    verified: true
  },
  {
    id: 'NW-2955',
    name: 'Jabari Mwangi',
    email: 'j.mwangi@nairobiwater.co.ke',
    department: 'Engineering',
    position: 'Technical Engineer',
    status: 'Inactive',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtkxTX-qQBuZxON3f_zJMcz_HBFWxAehSqCm3Ms2CuQmM5FjLuD0JeJvK6q47-S0MdJJ-Fa2GlpQ0-E3TOmSWu7oMfeknivnq-Di4NfrzJAGVy0lWuns5mDN1Zeu7Xxcf0GQBEKvjcOUI8_ffwtS-cMiL2YQm_d-WD0C0jbZGynqk0A9Lxc4RBYmP3isZdTC1CLbrmuevX60o-UyRQb8VLrBmWSWbdl2Lqjzl6APdxeBtLM0uA_-vVAD6DP87jxhV_UNK5BGMjWbgx',
    verified: true
  },
  {
    id: 'NW-4105',
    name: 'Grace Muthoni Njeri',
    email: 'g.njeri@nairobiwater.co.ke',
    department: 'Billing & Revenue',
    position: 'Billing Specialist',
    status: 'Active',
    imageUrl: '',
    verified: false
  },
  {
    id: 'NW-3850',
    name: 'Peter Otieno Juma',
    email: 'peter.juma@nairobiwater.co.ke',
    department: 'Water Quality',
    position: 'Water Chemist',
    status: 'Active',
    imageUrl: '',
    verified: true
  },
  {
    id: 'NW-4211',
    name: 'Amina Hassan Ali',
    email: 'amina.ali@nairobiwater.co.ke',
    department: 'Human Resources',
    position: 'HR Associate',
    status: 'Active',
    imageUrl: '',
    verified: true
  },
  {
    id: 'NW-4001',
    name: 'John Kiprop Sang',
    email: 'john.sang@nairobiwater.co.ke',
    department: 'Operations',
    position: 'Field Supervisor',
    status: 'Active',
    imageUrl: '',
    verified: false
  },
  {
    id: 'NW-3722',
    name: 'Mary Anyango',
    email: 'mary.anyango@nairobiwater.co.ke',
    department: 'Legal Dept',
    position: 'Legal Council',
    status: 'Active',
    imageUrl: '',
    verified: true
  },
  {
    id: 'NW-3955',
    name: 'Stephen Kimani',
    email: 'stephen.kimani@nairobiwater.co.ke',
    department: 'IT Support',
    position: 'IT Specialist',
    status: 'Active',
    imageUrl: '',
    verified: false
  },
  {
    id: 'NW-2299',
    name: 'Sarah Mutua',
    email: 'sarah.mutua@nairobiwater.co.ke',
    department: 'Human Resources',
    position: 'HR Lead',
    status: 'Active',
    imageUrl: '',
    verified: true
  },
  {
    id: 'NW-1188',
    name: 'David Kamau',
    email: 'david.kamau@nairobiwater.co.ke',
    department: 'Human Resources',
    position: 'Recruiter',
    status: 'Active',
    imageUrl: '',
    verified: false
  },
  {
    id: 'NW-4411',
    name: 'Robert Onyango',
    email: 'robert.o@nairobiwater.co.ke',
    department: 'Logistics',
    position: 'Logistics Manager',
    status: 'Active',
    imageUrl: '',
    verified: true
  },
  {
    id: 'NW-3032',
    name: 'Lydia Njeri',
    email: 'lydia.njeri@nairobiwater.co.ke',
    department: 'IT Support',
    position: 'Support Analyst',
    status: 'Active',
    imageUrl: '',
    verified: true
  },
  {
    id: 'NW-5192',
    name: 'Evans Kiprotich',
    email: 'evans.k@nairobiwater.co.ke',
    department: 'Maintenance',
    position: 'Plumbing Technician',
    status: 'Active',
    imageUrl: '',
    verified: false
  }
];

export const INITIAL_LOGS: CheckInLog[] = [
  {
    id: 'LOG-001',
    employeeId: 'NW-2299',
    employeeName: 'Sarah Mutua',
    department: 'Human Resources',
    checkInTime: '08:12 AM',
    status: 'ON TIME',
    avatarInitials: 'SM',
    avatarBg: 'bg-blue-500'
  },
  {
    id: 'LOG-002',
    employeeId: 'NW-1188',
    employeeName: 'David Kamau',
    department: 'Human Resources',
    checkInTime: '08:05 AM',
    status: 'ON TIME',
    avatarInitials: 'DK',
    avatarBg: 'bg-orange-500'
  },
  {
    id: 'LOG-003',
    employeeId: 'NW-4411',
    employeeName: 'Robert Onyango',
    department: 'Logistics',
    checkInTime: '07:58 AM',
    status: 'LATE', // Warn/late in the logs screenshot 1
    avatarInitials: 'RO',
    avatarBg: 'bg-red-500'
  },
  {
    id: 'LOG-004',
    employeeId: 'NW-3032',
    employeeName: 'Lydia Njeri',
    department: 'IT Support',
    checkInTime: '07:45 AM',
    status: 'ON TIME',
    avatarInitials: 'LN',
    avatarBg: 'bg-indigo-500'
  },
  {
    id: 'LOG-005',
    employeeId: 'NW-5192',
    employeeName: 'Evans Kiprotich',
    department: 'Maintenance',
    checkInTime: '07:40 AM',
    status: 'ON TIME',
    avatarInitials: 'EK',
    avatarBg: 'bg-teal-500'
  },
  {
    id: 'LOG-006',
    employeeId: 'NW-4012',
    employeeName: 'Sarah Odhiambo',
    department: 'Customer Service',
    checkInTime: '07:45 AM',
    status: 'ON TIME',
    avatarInitials: 'SO',
    avatarBg: 'bg-emerald-500',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMDH0w9Og2CFX6aurHf2LOVG46wxVRBpY68HNICCro9EJoHNp4ywx2U9Y6QdEXvVaSiF-PVboXriYteZdxNDiv8N1vMy-BFQl4DyvJdnqS4ONQ2PVUBvmauTMlHO2Y8kX-ByzzDH-ipN1tJGIrd4n4XvmsjisqPE2fV77sBfJ7dSQwZy2bArpMdefdr_b-R9cKxX6zD2xesAG7eeu9dCJYVmLSk0tZ3ejPZLRovarhQQUIdHzy1SOBbQ-h67kUIb__5NrhM-KBZR-S'
  },
  {
    id: 'LOG-007',
    employeeId: 'NW-3988',
    employeeName: 'John Kamau',
    department: 'Maintenance',
    checkInTime: '08:12 AM',
    status: 'GRACE PERIOD',
    avatarInitials: 'JK',
    avatarBg: 'bg-amber-500',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAL7alqy3Q6fC7Ae2CfEBn-yuHxv1kcgOVZxCBrIgDIKOvy7B5wNuAei0XhDoWHBEJPC-1koGYFVLMp6xaq6-VczqQwHykKIjomfZc4gYoJPnqxglmIvghBTC3vHcvNEgrts4DeraBlhCWNmNCWhTCjtmZhVyiQ2JodRZ8qsZLltoRdZdV0quam-Wd57o8M0tZ28Xt5QUbk68_3dAIVrdW5kwFZEsfhVQg8IBxMq02XdlR57wJ0cx2coJAC2PX5FYK4_HplsxghTdaW'
  },
  {
    id: 'LOG-008',
    employeeId: 'NW-4210',
    employeeName: 'Jane Mutua',
    department: 'Customer Service',
    checkInTime: '08:45 AM',
    status: 'LATE',
    avatarInitials: 'JM',
    avatarBg: 'bg-red-400',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhCteYstqhVjODKX31tC8FYJVRRPXJx0Kv6iQ6ilBmbAZjip1Q05vOlpgOBfAKnxMt61DRjHU6ej18F4TvKPqeAdnyvpnDBsq6Z5TTJvkQzZ9uSGVe4UEfjy3p5GkPR9gWiFw6v5VsG-1OIZT-z_j14XOzoRSo1b9qR8AzZizUQ-nqg0xE6suwfQYJiyzMFHgA-QGxsXzaDlGFYkTgPbCt4q982j8b8b4a0TWaVEzU5RThP4AStIFs9QashP2iy1LuDACsdYhXwiZR'
  }
];
