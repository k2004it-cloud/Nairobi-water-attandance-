import React from 'react';

interface StatusBadgeProps {
  status: 'PRESENT' | 'LATE' | 'ABSENT';
}

const badgeStyles: Record<StatusBadgeProps['status'], string> = {
  PRESENT: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  LATE: 'bg-amber-50 text-amber-800 border-amber-200',
  ABSENT: 'bg-red-50 text-red-800 border-red-200'
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold tracking-[0.02em] ${badgeStyles[status]}`}>
      {status}
    </span>
  );
}
