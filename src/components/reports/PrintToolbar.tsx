import React from 'react';
import { Download, FileText, Mail, RefreshCcw, Printer } from 'lucide-react';

interface PrintToolbarProps {
  onPrint: () => void;
  onDownloadPdf: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onSendEmail: () => void;
  onRefresh: () => void;
}

export function PrintToolbar({ onPrint, onDownloadPdf, onExportExcel, onExportCsv, onSendEmail, onRefresh }: PrintToolbarProps) {
  const buttonClass =
    'inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50';

  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      <button type="button" onClick={onPrint} className={buttonClass}>
        <Printer className="h-4 w-4" />
        Print Report
      </button>
      <button type="button" onClick={onDownloadPdf} className={buttonClass}>
        <FileText className="h-4 w-4" />
        Download PDF
      </button>
      <button type="button" onClick={onExportExcel} className={buttonClass}>
        <Download className="h-4 w-4" />
        Export Excel
      </button>
      <button type="button" onClick={onExportCsv} className={buttonClass}>
        <Download className="h-4 w-4" />
        Export CSV
      </button>
      <button type="button" onClick={onSendEmail} className={buttonClass}>
        <Mail className="h-4 w-4" />
        Email Report
      </button>
      <button type="button" onClick={onRefresh} className={buttonClass}>
        <RefreshCcw className="h-4 w-4" />
        Refresh Report
      </button>
    </div>
  );
}
