import React from 'react';
import { StatusBadge } from './StatusBadge';
import type { CheckInLog } from '../../types';

interface AttendanceTableProps {
  logs: CheckInLog[];
}

const headers = [
  { label: 'No', key: 'no', printHidden: false },
  { label: 'Staff Number', key: 'staffNumber', printHidden: false },
  { label: 'Employee Name', key: 'employeeName', printHidden: false },
  { label: 'Designation', key: 'designation', printHidden: false },
  { label: 'Department', key: 'department', printHidden: false },
  { label: 'Check-In Time', key: 'checkInTime', printHidden: false },
  { label: 'Expected Time', key: 'expectedTime', printHidden: true },
  { label: 'Minutes Late', key: 'minutesLate', printHidden: true },
  { label: 'Status', key: 'status', printHidden: true },
  { label: 'Remarks', key: 'remarks', printHidden: true }
];

function formatExpectedTime() {
  return '08:00 AM';
}

function calculateLateMinutes(log: CheckInLog) {
  if (!log.checkInTime) return '-';
  const [time, period] = log.checkInTime.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let totalMinutes = (hours % 12) * 60 + minutes;
  if (period === 'PM') totalMinutes += 12 * 60;
  const expected = 8 * 60;
  const diff = totalMinutes - expected;
  return diff > 0 ? `${diff} Minutes Late` : 'On Time';
}

function getStatusValue(status: string) {
  if (status === 'LATE') return 'LATE';
  if (status === 'ON TIME' || status === 'GRACE PERIOD') return 'PRESENT';
  return 'ABSENT';
}

export function AttendanceTable({ logs }: AttendanceTableProps) {
  const visibleLogs = logs;

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-[#0b5ed7] text-white">
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key}
                  className={`whitespace-nowrap border-b border-slate-300 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${header.printHidden ? 'print:hidden' : ''}`}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleLogs.length === 0 ? (
              <tr>
                <td colSpan={headers.filter((header) => !header.printHidden).length} className="px-6 py-14 text-center text-sm text-slate-500">
                  No attendance records found for the selected filters.
                </td>
              </tr>
            ) : (
              visibleLogs.map((log, index) => (
                <tr key={log.id} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                  <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-700">{index + 1}</td>
                  <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-700">{log.employeeId}</td>
                  <td className="border-b border-slate-200 px-3 py-3 text-sm font-semibold text-slate-900">{log.employeeName}</td>
                  <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-700">{log.position || 'Employee'}</td>
                  <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-700">{log.department}</td>
                  <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-700">{log.checkInTime || '-'}</td>
                  <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-700 print:hidden">{formatExpectedTime()}</td>
                  <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-700 print:hidden">{calculateLateMinutes(log)}</td>
                  <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-700 print:hidden">
                    <StatusBadge status={getStatusValue(log.status) as 'PRESENT' | 'LATE' | 'ABSENT'} />
                  </td>
                  <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-700 print:hidden">{log.remarks || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="no-print flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Showing {visibleLogs.length} of {logs.length} records</p>
      </div>
    </div>
  );
}
