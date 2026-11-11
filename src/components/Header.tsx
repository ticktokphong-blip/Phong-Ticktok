import React from 'react';
import { Building2, ShieldCheck, CheckCircle2, PlusCircle, UserPlus } from 'lucide-react';
import { formatBaht } from '../utils/formatters';

interface HeaderProps {
  totalCurrentDebt: number;
  totalOriginalDebt: number;
  onOpenAddPayment: () => void;
  onOpenAddDebt: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCurrentDebt,
  totalOriginalDebt,
  onOpenAddPayment,
  onOpenAddDebt,
}) => {
  const totalPaid = Math.max(0, totalOriginalDebt - totalCurrentDebt);
  const percentPaid = totalOriginalDebt > 0 ? Math.round((totalPaid / totalOriginalDebt) * 100) : 0;

  return (
    <header className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white pt-4 pb-6 px-4 rounded-b-3xl shadow-lg border-b border-sky-900/40">
      <div className="max-w-md mx-auto">
        {/* Top bar with branding */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-600/90 flex items-center justify-center shadow-md shadow-sky-500/20 border border-sky-400/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                RentTracker <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">เก็บค่าเช่า</span>
              </h1>
              <p className="text-xs text-sky-200/80">ระบบบันทึกค่าเช่า & รับชำระรายเดือน</p>
            </div>
          </div>

          <button
            onClick={onOpenAddDebt}
            className="text-xs font-medium bg-sky-800/60 hover:bg-sky-700/80 text-sky-100 px-3 py-1.5 rounded-xl border border-sky-500/30 transition flex items-center gap-1.5 shadow-sm"
            title="เพิ่มลูกค้ารายใหม่"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>เพิ่มลูกค้า</span>
          </button>
        </div>

        {/* Total Rent Summary Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shadow-inner">
          <div className="flex justify-between items-start mb-1.5">
            <div>
              <span className="text-xs text-sky-200 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-300" /> ยอดคงเหลือค้างชำระรวมทั้งหมด
              </span>
              <div className="text-2xl font-extrabold text-white mt-0.5 tracking-tight">
                {formatBaht(totalCurrentDebt)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ชำระแล้ว {percentPaid}%
              </span>
              <p className="text-[11px] text-sky-200/70 mt-1">
                รับชำระแล้ว {formatBaht(totalPaid)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden p-0.5 border border-white/10">
              <div
                className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 h-full rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${Math.min(100, Math.max(0, percentPaid))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-sky-200/70 mt-1">
              <span>มูลค่าสัญญารวม {formatBaht(totalOriginalDebt)}</span>
              <span>ชำระครบแล้ว {formatBaht(totalPaid)}</span>
            </div>
          </div>

          {/* Direct CTA to pay rent */}
          <div className="mt-3.5 pt-3 border-t border-white/10 flex gap-2">
            <button
              onClick={onOpenAddPayment}
              className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-900/30 flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>บันทึกรับชำระค่าเช่า (ตัดยอด)</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
