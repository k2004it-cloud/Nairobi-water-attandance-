import { useRef, useState } from 'react';
import { Printer, Clock, FileText, Droplet } from 'lucide-react';
import { CheckInLog, DashboardStats } from '../types';

interface ReportsTabProps {
  logs: CheckInLog[];
  stats: DashboardStats;
}

export default function ReportsTab({ logs, stats }: ReportsTabProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  
  // Custom date selection
  const [reportDate, setReportDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  });

  const handlePrint = () => {
    window.print();
  };

  const currentTimestamp = new Date().toLocaleString();

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top action header (no-print) */}
      <section className="no-print bg-white p-6 border border-[#e1e4e8] rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#d7e2ff] text-[#003f87] flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#181c1c]">Daily Register Sheet</h2>
            <p className="text-xs text-[#424752]">Generate and print physical copies for executive verification.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Custom Date Selector */}
          <div className="relative w-full sm:w-auto">
            <input 
              type="text" 
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              placeholder="Report Date"
              className="px-3 py-2 bg-white border border-[#c2c6d4] text-xs font-semibold rounded-lg focus:ring-1 focus:ring-[#003f87] outline-none text-[#181c1c]"
            />
          </div>

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#003f87] hover:bg-[#0056b3] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Printer className="w-4.5 h-4.5" />
            Print Report
          </button>
        </div>
      </section>

      {/* Main printable sheet container */}
      <main 
        ref={printAreaRef}
        className="report-sheet max-w-[1024px] mx-auto p-8 sm:p-12 bg-white shadow-md rounded-xl border border-[#e1e4e8] print:border-0 print:shadow-none print:p-7 print:m-0 print:max-w-none"
      >
        <section className="print-summary-only hidden">
          <div className="print-summary-only-card">
            <div className="print-summary-only-label">Checked In</div>
            <div className="print-summary-only-value">{stats.checkedIn}</div>
          </div>
        </section>
        {/* Report Header Section */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-[#003f87] pb-6 mb-8 print:pb-5">
          <div className="flex items-start gap-4">
            <div className="logo-tile flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f5ff] border border-[#d7e2ff]">
              <img src="/logo-nairobi-cropped.png" alt="Nairobi Water logo" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#003f87] uppercase tracking-tight leading-tight">
                Daily Attendance Register
              </h1>
              <p className="text-sm font-medium text-[#4b5563] mt-1">
                Operational Efficiency Unit • Nairobi, Kenya
              </p>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 text-left md:text-right">
            <div className="inline-flex flex-col md:items-end">
              <span className="text-[10px] font-bold text-[#424752] uppercase tracking-widest">
                Report Date
              </span>
              <span className="text-xl font-black text-[#181c1c]">{reportDate}</span>
              <div className="mt-2 bg-[#eef3ff] text-[#1f2937] px-3 py-2 rounded-2xl border border-[#c7d2fe] inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5 text-[#4f46e5]" />
                <span>
                  Window: 08:00 AM - 09:00 AM
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Overview Widgets */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 no-print">
          <div className="p-4 rounded-xl border border-[#e1e4e8] bg-[#f7faf9] flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#424752] uppercase tracking-wider">Total Staff</span>
            <span className="text-2xl font-black text-[#003f87] mt-1">{stats.totalEmployees}</span>
          </div>
          <div className="p-4 rounded-xl border border-[#e1e4e8] bg-[#f7faf9] flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#424752] uppercase tracking-wider">On Time</span>
            <span className="text-2xl font-black text-green-700 mt-1">{stats.onTime}</span>
          </div>
          <div className="p-4 rounded-xl border border-[#e1e4e8] bg-[#f7faf9] flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#424752] uppercase tracking-wider">Grace Period</span>
            <span className="text-2xl font-black text-amber-600 mt-1">{stats.gracePeriod}</span>
          </div>
          <div className="p-4 rounded-xl border border-[#e1e4e8] bg-[#f7faf9] flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#424752] uppercase tracking-wider">Late Arrivals</span>
            <span className="text-2xl font-black text-[#ba1a1a] mt-1">{stats.lateArrivals}</span>
          </div>
        </section>

        {/* Attendance Register Table */}
        <div className="overflow-hidden border border-[#e1e4e8] rounded-[1.5rem] print:rounded-none">
          <table className="w-full text-left border-collapse report-table">
            <thead>
              <tr className="bg-[#ebeeed] border-b border-[#727784]">
                <th className="p-3 text-[11px] font-bold text-[#181c1c] uppercase tracking-wider">Emp ID</th>
                <th className="p-3 text-[11px] font-bold text-[#181c1c] uppercase tracking-wider">Full Name</th>
                <th className="p-3 text-[11px] font-bold text-[#181c1c] uppercase tracking-wider">Department</th>
                <th className="p-3 text-[11px] font-bold text-[#181c1c] uppercase tracking-wider text-center">Check-In</th>
                <th className="p-3 text-[11px] font-bold text-[#181c1c] uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white text-xs text-[#181c1c] divide-y divide-[#e1e4e8]">
              {logs.map((log, index) => (
                <tr key={log.id} className={`hover:bg-[#f1f4f3]/40 transition-colors duration-150 ${index >= 40 ? 'print:hidden' : ''}`}>
                  <td className="p-3 font-bold text-[#003f87]">{log.employeeId}</td>
                  <td className="p-3 font-semibold">{log.employeeName}</td>
                  <td className="p-3 text-[#424752]">{log.department}</td>
                  <td className="p-3 text-center font-mono">{log.checkInTime}</td>
                  <td className="p-3 text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
                      log.status === 'LATE'
                        ? 'bg-red-50 text-[#ba1a1a] border-[#ffdad6]'
                        : log.status === 'GRACE PERIOD'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-green-50 text-green-800 border-green-200'
                    }`}>
                      {log.status === 'GRACE PERIOD' ? 'GRACE' : log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 40 - logs.length) }, (_, idx) => (
                <tr key={`blank-${idx}`} className="hidden print:table-row">
                  <td className="p-3 h-10">&nbsp;</td>
                  <td className="p-3 h-10">&nbsp;</td>
                  <td className="p-3 h-10">&nbsp;</td>
                  <td className="p-3 h-10">&nbsp;</td>
                  <td className="p-3 h-10">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Verification & Final Summary Footer Section */}
        <footer className="mt-12 pt-8 border-t border-[#e1e4e8]">
          <div className="flex flex-col lg:flex-row justify-between items-end gap-8">
            <div className="flex-1 w-full">
              <h4 className="text-[11px] font-bold text-[#424752] uppercase tracking-widest mb-4">
                Official Verification
              </h4>
              <div className="grid grid-cols-2 gap-8 text-left">
                <div className="border-b border-[#727784] pb-2">
                  <span className="block h-10"></span>
                  <span className="text-[10px] font-bold text-[#424752] uppercase tracking-wide">
                    HR Manager Signature
                  </span>
                </div>
                <div className="border-b border-[#727784] pb-2">
                  <span className="block h-10"></span>
                  <span className="text-[10px] font-bold text-[#424752] uppercase tracking-wide">
                    Date of Approval
                  </span>
                </div>
              </div>
            </div>

            {/* Print Summary Widget Badge */}
            <div className="w-full lg:w-auto bg-[#003f87] text-white p-6 rounded-xl flex flex-col items-end shadow-md">
              <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80 mb-2">
                Final Summary Report
              </span>
              <div className="flex gap-6 divide-x divide-[#bbd0ff]/30">
                <div className="pl-0 flex flex-col items-end">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Total</span>
                  <span className="text-xl font-bold font-mono">{stats.checkedIn}</span>
                </div>
                <div className="pl-5 flex flex-col items-end">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">On Time</span>
                  <span className="text-xl font-bold font-mono">{stats.onTime}</span>
                </div>
                <div className="pl-5 flex flex-col items-end">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Grace</span>
                  <span className="text-xl font-bold font-mono">{stats.gracePeriod}</span>
                </div>
                <div className="pl-5 flex flex-col items-end">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 text-[#ffdad6]">Late</span>
                  <span className="text-xl font-bold font-mono text-[#ffdad6]">{stats.lateArrivals}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center border-t border-[#e1e4e8]/40 pt-4">
            <p className="text-[10px] font-semibold text-[#424752] italic">
              This is an automated system-generated attendance record of Nairobi Water Company. Confidentiality rules apply.
            </p>
            <p className="text-[9px] text-[#727784] mt-1">
              Generated: {currentTimestamp} • Page 1 of 1
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
