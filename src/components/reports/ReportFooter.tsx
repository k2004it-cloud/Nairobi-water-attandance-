import React from 'react';

interface ReportFooterProps {
  preparedBy: string;
  approvedBy: string;
  printedOn: string;
}

export function ReportFooter({ preparedBy, approvedBy, printedOn }: ReportFooterProps) {
  return (
    <div className="report-footer rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm mt-8">
      <div className="flex flex-col gap-4 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Prepared by</p>
          <p className="mt-2 font-semibold text-slate-900">{preparedBy}</p>
        </div>

        <div className="flex-1 border-t border-slate-200 pt-4 text-center md:border-t-0 md:pt-0">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Signature</p>
          <div className="mt-3 h-px w-full bg-slate-300" />
        </div>

        <div className="flex-1 text-right">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Date</p>
          <p className="mt-2 text-slate-600">{printedOn}</p>
        </div>
      </div>
    </div>
  );
}
