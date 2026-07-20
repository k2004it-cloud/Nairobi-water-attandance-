import React from 'react';

interface ReportSummaryProps {
  reportType: string;
  reportDate: string;
  totalStaff: number;
  checkedIn: number;
  lateArrivals: number;
  absent: number;
  attendancePercentage: string;
}

export function ReportSummary({ reportType, reportDate, totalStaff, checkedIn, lateArrivals, absent, attendancePercentage }: ReportSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500 font-semibold mb-4">Report details</div>
        <dl className="grid gap-3 text-sm text-slate-700">
          <div className="flex justify-between gap-4">
            <dt className="font-semibold text-slate-900">Report</dt>
            <dd>{reportType}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="font-semibold text-slate-900">Date</dt>
            <dd>{reportDate}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="font-semibold text-slate-900">Department</dt>
            <dd>All Departments</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500 font-semibold mb-4">Summary</div>
        <dl className="grid gap-3 text-sm text-slate-700">
          <div className="flex justify-between gap-4">
            <dt>Total Staff</dt>
            <dd className="font-semibold text-slate-900">{totalStaff}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Checked In</dt>
            <dd className="font-semibold text-slate-900">{checkedIn}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Late Arrivals</dt>
            <dd className="font-semibold text-slate-900">{lateArrivals}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Absent</dt>
            <dd className="font-semibold text-slate-900">{absent}</dd>
          </div>
          <div className="flex justify-between gap-4 pt-4 border-t border-slate-200">
            <dt className="font-semibold text-slate-900">Attendance %</dt>
            <dd className="font-bold text-slate-900">{attendancePercentage}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
