import React from 'react';

interface ExcelExporterProps {
  onExport: () => void;
}

export function ExcelExporter({ onExport }: ExcelExporterProps) {
  return (
    <button
      type="button"
      onClick={onExport}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
    >
      Export Excel
    </button>
  );
}
