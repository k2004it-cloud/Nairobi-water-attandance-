import React from 'react';

interface ReportHeaderProps {
  reportDate: string;
  reportTime: string;
  printedBy: string;
  pageNumber: string;
}

export function ReportHeader({ reportDate, reportTime, printedBy, pageNumber }: ReportHeaderProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr] border-b border-slate-300 pb-6">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-300 bg-slate-50">
          <img src="/logo-nairobi-cropped.png" alt="Nairobi Water logo" className="h-10 w-10 object-contain" />
        </div>
        <div className="space-y-1">
          <p className="text-[13px] font-black uppercase tracking-[0.35em] text-[#0f172a]" style={{ fontFamily: 'Times New Roman, serif' }}>
            NAIROBI CITY WATER & SEWERAGE COMPANY LTD
          </p>
          <p className="text-[12px] text-slate-600">P.O. Box 30656-00100 Nairobi, Kenya</p>
          <p className="text-[12px] text-slate-600">Telephone: 020 272 9071-5</p>
          <p className="text-[12px] text-slate-600">Email: info@nairobibwater.co.ke</p>
          <p className="text-[12px] text-slate-600">Website: www.nairobibwater.co.ke</p>
        </div>
      </div>
      <div className="hidden print:grid gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
        <div className="grid grid-cols-[1fr_1.35fr] gap-x-4">
          <span className="font-semibold text-slate-900">Report Date</span>
          <span className="text-right">{reportDate}</span>
        </div>
        <div className="grid grid-cols-[1fr_1.35fr] gap-x-4">
          <span className="font-semibold text-slate-900">Report Time</span>
          <span className="text-right">{reportTime}</span>
        </div>
        <div className="grid grid-cols-[1fr_1.35fr] gap-x-4">
          <span className="font-semibold text-slate-900">Printed By</span>
          <span className="text-right">{printedBy}</span>
        </div>
        <div className="grid grid-cols-[1fr_1.35fr] gap-x-4">
          <span className="font-semibold text-slate-900">Page Number</span>
          <span className="text-right">{pageNumber}</span>
        </div>
      </div>
    </div>
  );
}
