import React from 'react';

interface ReportSummaryProps {
  totalStaff: number;
  checkedIn: number;
  lateArrivals: number;
  absent: number;
  attendancePercentage: string;
}

export function ReportSummary({ totalStaff, checkedIn, lateArrivals, absent, attendancePercentage }: ReportSummaryProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="grid gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#0f172a] font-bold">Report Details</div>
        <div className="grid gap-2 text-sm text-slate-600">
          <div className="flex justify-between gap-4">
            <span className="font-semibold text-slate-800">Report Type</span>
            <span>Daily Check-In Report</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-semibold text-slate-800">Date</span>
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-semibold text-slate-800">Department</span>
            <span>All Departments</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-semibold text-slate-800">Location</span>
            <span>Head Office - Westlands</span>
          </div>
        </div>
      </div>
      <div className="grid gap-3 rounded-[1.25rem] border border-slate-200 bg-[#f8fbff] p-5 shadow-sm">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#0f172a] font-bold">Summary</div>
        <div className="grid gap-3 text-sm text-slate-700">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Total Staff</span>
            <span className="font-semibold text-slate-900">{totalStaff}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Checked In</span>
            <span className="font-semibold text-slate-900">{checkedIn}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Late Arrivals</span>
            <span className="font-semibold text-slate-900">{lateArrivals}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Absent</span>
            <span className="font-semibold text-slate-900">{absent}</span>
          </div>
          <div className="flex justify-between gap-4 pt-3 border-t border-slate-200">
            <span className="text-slate-500">Attendance %</span>
            <span className="text-[#0f172a] font-bold">{attendancePercentage}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
