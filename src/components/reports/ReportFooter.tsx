import React from 'react';

interface ReportFooterProps {
  preparedBy: string;
  approvedBy: string;
  printedOn: string;
}

export function ReportFooter({ preparedBy, approvedBy, printedOn }: ReportFooterProps) {
  return (
    <div className="report-footer print:block hidden rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm print:border-none print:shadow-none print:rounded-none print:mt-8">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 items-end">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">HR Sign</p>
          <div className="h-10 rounded-xl border-b border-slate-300" />
          <p className="text-xs font-semibold uppercase text-slate-900">{approvedBy}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Name</p>
          <div className="h-10 rounded-xl border-b border-slate-300" />
          <p className="text-xs font-semibold uppercase text-slate-900">{preparedBy}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Signature</p>
          <div className="h-10 rounded-xl border-b border-slate-300" />
          <p className="text-xs text-slate-500">{printedOn}</p>
        </div>
      </div>
    </div>
  );
}
