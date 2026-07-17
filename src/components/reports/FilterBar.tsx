import React from 'react';

interface FilterBarProps {
  searchValue: string;
  departmentValue: string;
  statusValue: string;
  onSearchChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRefresh: () => void;
}

const departments = ['All Departments', 'Operations', 'Customer Service', 'Finance', 'Engineering'];
const statuses = ['All Statuses', 'PRESENT', 'LATE', 'ABSENT'];

export function FilterBar({ searchValue, departmentValue, statusValue, onSearchChange, onDepartmentChange, onStatusChange, onRefresh }: FilterBarProps) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] items-end">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Date</label>
          <input
            type="date"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-slate-300"
            value={new Date().toISOString().slice(0, 10)}
            readOnly
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Department</label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-slate-300"
            value={departmentValue}
            onChange={(event) => onDepartmentChange(event.target.value)}
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Status</label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-slate-300"
            value={statusValue}
            onChange={(event) => onStatusChange(event.target.value)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-1">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Search Employee</label>
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Employee name or staff number"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-[#0b5ed7] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0a58ca]"
        >
          Refresh Report
        </button>
      </div>
    </div>
  );
}
