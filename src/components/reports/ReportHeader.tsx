import React from 'react';

interface ReportHeaderProps {
  reportDate: string;
  reportTime: string;
  printedBy: string;
  pageNumber: string;
}

export function ReportHeader({ reportDate, reportTime, printedBy, pageNumber }: ReportHeaderProps) {
  return (
    <div className="report-header rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.75fr] lg:items-center">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-300 bg-slate-50">
              <img src="/logo-nairobi-cropped.png" alt="Nairobi Water logo" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Nairobi City Water & Sewerage Company Ltd</p>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">Attendance Report</p>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Head Office</p>
            <p>P.O. Box 30656-00100, Nairobi, Kenya</p>
            <p>Tel: 020 272 9071-5</p>
            <p>Email: info@nairobiwater.co.ke</p>
            <p>Website: www.nairobiwater.co.ke</p>
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <div className="flex justify-between gap-3">
            <span className="font-semibold text-slate-900">Report Date</span>
            <span>{reportDate}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="font-semibold text-slate-900">Report Time</span>
            <span>{reportTime}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="font-semibold text-slate-900">Printed By</span>
            <span>{printedBy}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="font-semibold text-slate-900">Page</span>
            <span>{pageNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
