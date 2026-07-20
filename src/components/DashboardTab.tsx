import { useState } from 'react';
import {
  Users,
  UserCheck,
  Timer,
  Hourglass,
  AlertTriangle,
  UserX,
  Clock,
  TrendingUp,
  Info
} from 'lucide-react';
import { Employee, CheckInLog, DashboardStats, Tab } from '../types';

type TrendDay = 'Today' | 'Yesterday';

const TREND_DATA: Record<TrendDay, { hour: string; value: number }[]> = {
  Today: [
    { hour: '06:00', value: 20 },
    { hour: '07:00', value: 45 },
    { hour: '08:00', value: 95 },
    { hour: '09:00', value: 60 },
    { hour: '10:00', value: 30 },
    { hour: '11:00', value: 15 },
    { hour: '12:00', value: 10 }
  ],
  Yesterday: [
    { hour: '06:00', value: 15 },
    { hour: '07:00', value: 50 },
    { hour: '08:00', value: 85 },
    { hour: '09:00', value: 70 },
    { hour: '10:00', value: 40 },
    { hour: '11:00', value: 20 },
    { hour: '12:00', value: 15 }
  ]
};

interface DashboardTabProps {
  employees: Employee[];
  logs: CheckInLog[];
  stats: DashboardStats;
  onNavigateToTab: (tab: Tab) => void;
  onShowDetail: (section: 'roster' | 'active' | 'recorded' | 'pending') => void;
}

export default function DashboardTab({
  employees,
  logs,
  stats,
  onNavigateToTab,
  onShowDetail
}: DashboardTabProps) {
  const [trendDay, setTrendDay] = useState<TrendDay>('Today');

  const presentPercentage = stats.totalEmployees > 0
    ? Math.min(100, Math.round((stats.checkedIn / stats.totalEmployees) * 100))
    : 0;
  const activeTrend = TREND_DATA[trendDay];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Main Stats Overview Row */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Employees */}
        <button
          type="button"
          onClick={() => onShowDetail('roster')}
          className="bg-white p-5 rounded-xl border border-[#e1e4e8] shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-[#d7e2ff] text-[#003f87] rounded-lg">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-[#424752] text-[10px] font-bold uppercase tracking-wider">Total</span>
          </div>
          <p className="text-2xl font-black text-[#181c1c] tracking-tight">{stats.totalEmployees}</p>
          <h3 className="text-[#424752] text-xs font-semibold mt-1">Total Employees</h3>
        </button>

        {/* Checked In */}
        <button
          type="button"
          onClick={() => onShowDetail('recorded')}
          className="bg-white p-5 rounded-xl border border-[#e1e4e8] shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-[#d6e3ff] text-[#335f9d] rounded-lg">
              <UserCheck className="w-5 h-5" />
            </span>
            <span className="text-[#424752] text-[10px] font-bold uppercase tracking-wider">Active</span>
          </div>
          <p className="text-2xl font-black text-[#181c1c] tracking-tight">{stats.checkedIn}</p>
          <h3 className="text-[#424752] text-xs font-semibold mt-1">Checked In</h3>
        </button>

        {/* On Time */}
        <button
          type="button"
          onClick={() => onShowDetail('active')}
          className="bg-white p-5 rounded-xl border border-[#e1e4e8] shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-green-50 text-green-700 rounded-lg">
              <Timer className="w-5 h-5" />
            </span>
            <span className="text-[#424752] text-[10px] font-bold uppercase tracking-wider">On Time</span>
          </div>
          <p className="text-2xl font-black text-green-700 tracking-tight">{stats.onTime}</p>
          <h3 className="text-[#424752] text-xs font-semibold mt-1">Punctual Staff</h3>
        </button>

        {/* Grace Period */}
        <button
          type="button"
          onClick={() => onShowDetail('pending')}
          className="bg-white p-5 rounded-xl border border-[#e1e4e8] shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Hourglass className="w-5 h-5" />
            </span>
            <span className="text-[#424752] text-[10px] font-bold uppercase tracking-wider">Grace</span>
          </div>
          <p className="text-2xl font-black text-amber-600 tracking-tight">{stats.gracePeriod}</p>
          <h3 className="text-[#424752] text-xs font-semibold mt-1">Grace Period</h3>
        </button>

        {/* Late arrivals */}
        <button
          type="button"
          onClick={() => onShowDetail('recorded')}
          className="bg-white p-5 rounded-xl border border-[#e1e4e8] shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <span className="text-[#424752] text-[10px] font-bold uppercase tracking-wider">Alert</span>
          </div>
          <p className="text-2xl font-black text-[#ba1a1a] tracking-tight">{stats.lateArrivals}</p>
          <h3 className="text-[#424752] text-xs font-semibold mt-1">Late Arrivals</h3>
        </button>

        {/* Not checked in (Unaccounted) */}
        <button
          type="button"
          onClick={() => onShowDetail('pending')}
          className="bg-white p-5 rounded-xl border border-[#e1e4e8] shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-gray-50 text-gray-500 rounded-lg">
              <UserX className="w-5 h-5" />
            </span>
            <span className="text-[#424752] text-[10px] font-bold uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-2xl font-black text-[#727784] tracking-tight">{stats.unaccounted}</p>
          <h3 className="text-[#424752] text-xs font-semibold mt-1">Unaccounted</h3>
        </button>
      </section>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy Gauge */}
        <div className="lg:col-span-1 bg-white p-8 rounded-xl border border-[#e1e4e8] flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm">
          <h2 className="text-lg font-bold text-[#181c1c] mb-6">Attendance Coverage</h2>
          
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" aria-hidden="true">
              {/* Back Circle */}
              <circle
                className="text-[#e0e3e2]"
                cx="88"
                cy="88"
                fill="transparent"
                r="76"
                stroke="currentColor"
                strokeWidth="10"
              />
              {/* Present Circle */}
              <circle
                className="text-[#003f87] transition-all duration-1000 ease-out"
                cx="88"
                cy="88"
                fill="transparent"
                r="76"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray="477.5"
                strokeDashoffset={477.5 - (477.5 * presentPercentage) / 100}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-[#003f87] tracking-tight">{presentPercentage}%</span>
              <span className="text-[10px] font-bold text-[#424752] uppercase tracking-wider">PRESENT</span>
            </div>
          </div>

          <p className="mt-6 text-[#424752] text-xs leading-relaxed max-w-xs">
            <strong>{stats.checkedIn}</strong> of <strong>{stats.totalEmployees}</strong> total staff members have checked in for the current shift.
          </p>
        </div>

        {/* Activity Trend (SVG Bar chart) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-[#e1e4e8] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[#181c1c] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#003f87]" />
              Arrival Trend (Last 8 Hours)
            </h2>
            <div className="relative">
              <select
                value={trendDay}
                onChange={(e) => setTrendDay(e.target.value as TrendDay)}
                className="bg-[#ebeeed] text-sm text-[#181c1c] border-none rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-[#003f87] outline-none cursor-pointer"
              >
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
              </select>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 relative border-b border-[#e1e4e8]/70 px-2">
            {/* Horizontal guidelines */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-[#e1e4e8]/40 pointer-events-none"></div>
            <div className="absolute top-1/3 left-0 w-full h-[1px] bg-[#e1e4e8]/40 pointer-events-none"></div>
            <div className="absolute top-2/3 left-0 w-full h-[1px] bg-[#e1e4e8]/40 pointer-events-none"></div>

            {/* Dynamic Bars */}
            {activeTrend.map((item) => {
              const percentageHeight = `${item.value}%`;
              const isPeak = item.value > 80;

              return (
                <div key={item.hour} className="flex-1 flex flex-col items-center gap-2 group relative z-10 h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 bg-[#181c1c] text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                    {item.value} check-ins
                  </div>
                  
                  {/* Actual Bar */}
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      isPeak
                        ? 'bg-[#0056b3] group-hover:brightness-110 shadow-sm'
                        : 'bg-[#acc7ff] group-hover:bg-[#003f87]'
                    }`}
                    style={{ height: percentageHeight }}
                  ></div>
                  <span className="text-[10px] text-[#424752] font-semibold mt-1">
                    {item.hour}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Check-in Logs list */}
      <section className="bg-white rounded-xl border border-[#e1e4e8] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#e1e4e8] flex justify-between items-center bg-[#f1f4f3]/50">
          <h2 className="text-lg font-bold text-[#181c1c] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#003f87]" />
            Live Check-in Logs
          </h2>
          <div className="flex gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
              Live Stream
            </span>
          </div>
        </div>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f1f4f3] border-b border-[#e1e4e8]">
              <tr>
                <th className="px-6 py-3.5 text-xs font-bold text-[#424752] uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3.5 text-xs font-bold text-[#424752] uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3.5 text-xs font-bold text-[#424752] uppercase tracking-wider">
                  Check-in Time
                </th>
                <th className="px-6 py-3.5 text-xs font-bold text-[#424752] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-xs font-bold text-[#424752] uppercase tracking-wider text-right">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e4e8]">
              {logs.slice(0, 5).map((log) => {
                const associatedEmployee = employees.find(e => e.id === log.employeeId);
                const position = associatedEmployee ? associatedEmployee.position : 'Staff Member';

                return (
                  <tr key={log.id} className="hover:bg-[#f1f4f3]/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {log.imageUrl ? (
                          <img
                            src={log.imageUrl}
                            alt={log.employeeName}
                            className="w-10 h-10 rounded-full object-cover border border-[#e1e4e8]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full ${log.avatarBg || 'bg-blue-600'} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                            {log.avatarInitials}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-[#181c1c]">{log.employeeName}</div>
                          <div className="text-xs text-[#727784]">ID: {log.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#181c1c] font-medium">{log.department}</div>
                      <div className="text-xs text-[#727784]">{position}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-[#181c1c]">{log.checkInTime}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold ${
                        log.status === 'LATE'
                          ? 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ffdad6]'
                          : log.status === 'GRACE PERIOD'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-[#e6f4ea] text-[#1e7e34] border border-[#e6f4ea]'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigateToTab('attendance')}
                        className="text-[#0056b3] hover:bg-[#d7e2ff] p-2 rounded-full transition-colors inline-flex cursor-pointer"
                        title="View employee profile"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile-friendly list for small screens */}
        <div className="md:hidden p-4 space-y-3">
          {logs.slice(0, 5).map((log) => {
            const associatedEmployee = employees.find(e => e.id === log.employeeId);
            const position = associatedEmployee ? associatedEmployee.position : 'Staff Member';

            return (
              <div key={log.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#e1e4e8] bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  {log.imageUrl ? (
                    <img src={log.imageUrl} alt={log.employeeName} className="w-12 h-12 rounded-full object-cover border border-[#e1e4e8]" referrerPolicy="no-referrer" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full ${log.avatarBg || 'bg-blue-600'} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                      {log.avatarInitials}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-[#181c1c]">{log.employeeName}</div>
                    <div className="text-xs text-[#727784]">{log.department} • {position}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-mono text-[#181c1c]">{log.checkInTime}</div>
                  <div className={`mt-2 inline-flex px-3 py-1 rounded-full text-[11px] font-bold ${
                    log.status === 'LATE'
                      ? 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ffdad6]'
                      : log.status === 'GRACE PERIOD'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-[#e6f4ea] text-[#1e7e34] border border-[#e6f4ea]'
                  }`}>{log.status}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-[#f1f4f3]/50 text-center border-t border-[#e1e4e8]">
          <button
            type="button"
            onClick={() => onNavigateToTab('reports')}
            className="text-sm font-bold text-[#003f87] hover:underline cursor-pointer"
          >
            VIEW ALL ATTENDANCE LOGS
          </button>
        </div>
      </section>
    </div>
  );
}
