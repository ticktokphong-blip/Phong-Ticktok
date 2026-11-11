import React, { useState } from 'react';
import { DebtItem, Transaction } from '../types';
import {
  formatBaht,
  formatThaiDate,
  DEBT_CATEGORIES,
  getDaysRemaining,
} from '../utils/formatters';
import {
  getTenantCalculatedStats,
  getTenantPayments,
  getTenantPaymentBreakdown,
} from '../utils/debtCalculations';
import { TenantPdfReportModal } from './TenantPdfReportModal';
import {
  Calendar,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  PlusCircle,
  TrendingDown,
  User,
  Phone,
  History,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Building2,
  Copy,
  Check,
  FileSpreadsheet,
  FileText,
  ListOrdered,
  Download,
} from 'lucide-react';

interface DebtCardProps {
  debt: DebtItem;
  transactions?: Transaction[];
  onPayDebt: (debt: DebtItem) => void;
  onEditDebt: (debt: DebtItem) => void;
  onDeleteDebt: (debtId: string) => void;
}

export const DebtCard: React.FC<DebtCardProps> = ({
  debt,
  transactions = [],
  onPayDebt,
  onEditDebt,
  onDeleteDebt,
}) => {
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  const categoryInfo = DEBT_CATEGORIES[debt.category] || DEBT_CATEGORIES.other;

  // Calculate real-time stats and structured breakdown from transactions
  const stats = getTenantCalculatedStats(debt, transactions);
  const { paidAmount, originalBalance, currentBalance, percentPaid, isPaidOff } = stats;

  const breakdown = getTenantPaymentBreakdown(debt, transactions);
  const daysRemaining = getDaysRemaining(debt.targetPayoffDate);

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(breakdown.summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl p-4 border transition-all shadow-sm hover:shadow-md ${
        isPaidOff
          ? 'border-emerald-300 bg-emerald-50/20'
          : 'border-slate-200/90'
      }`}
    >
      {/* Top Header Row with Customer Name and Room */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span
              className="px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1"
              style={{
                backgroundColor: categoryInfo.bgColor,
                color: categoryInfo.color,
              }}
            >
              <Building2 className="w-3 h-3" />
              {debt.roomNo || categoryInfo.label}
            </span>

            {debt.monthlyDueDate && (
              <span className="text-[10px] text-sky-800 font-semibold px-2 py-0.5 bg-sky-50 rounded border border-sky-100">
                กำหนดชำระทุกวันที่ {debt.monthlyDueDate} ของเดือน
              </span>
            )}

            {isPaidOff && (
              <span className="text-[11px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> ชำระครบตามสัญญาแล้ว 🎉
              </span>
            )}
          </div>

          <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
            <User className="w-4 h-4 text-sky-600" />
            <span>{debt.customerName || debt.name}</span>
          </h3>

          {debt.phone && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{debt.phone}</span>
            </p>
          )}
        </div>

        {/* Action Menu (Edit/Delete) */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => onEditDebt(debt)}
            className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-slate-100 transition"
            title="แก้ไขข้อมูลลูกค้า"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`คุณต้องการลบข้อมูลลูกค้า "${debt.customerName || debt.name}" ใช่หรือไม่?`)) {
                onDeleteDebt(debt.id);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
            title="ลบข้อมูลลูกค้า"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Balance & Paid Display */}
      <div className="my-3 grid grid-cols-2 gap-2">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[11px] text-slate-500 font-medium">ยอดคงเหลือปัจจุบัน</p>
          <div className="text-lg font-extrabold text-slate-900 mt-0.5">
            {formatBaht(currentBalance)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">จากสัญญารวม {formatBaht(originalBalance)}</p>
        </div>

        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
          <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-emerald-600" /> ยอดที่ชำระไปแล้ว
          </p>
          <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
            {formatBaht(paidAmount)}
          </div>
          <p className="text-[10px] text-emerald-600/80 mt-0.5">
            ชำระแล้ว <strong className="text-emerald-800">{breakdown.monthsPaidCount} งวด</strong> ({formatBaht(debt.minPayment)}/เดือน)
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between text-[11px] font-semibold text-slate-600">
          <span className="flex items-center gap-1 text-emerald-600">
            ชำระไปแล้ว {percentPaid}% ({breakdown.monthsPaidCount} งวด)
          </span>
          <span>คงเหลืออีก {100 - percentPaid}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, percentPaid))}%` }}
          />
        </div>
      </div>

      {/* Target Completion Date info */}
      <div className="pt-2.5 border-t border-slate-100 text-xs space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 flex items-center gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5 text-sky-600" /> กำหนดชำระครบสัญญา:
          </span>
          <span className="font-bold text-slate-800">
            {formatThaiDate(debt.targetPayoffDate)}
          </span>
        </div>

        {!isPaidOff && (
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              {daysRemaining > 0 ? (
                <span>เหลือเวลาสัญญา <strong className="text-amber-700">{daysRemaining} วัน</strong></span>
              ) : (
                <span className="text-rose-600 font-bold">เลยกำหนดวันที่ชำระครบสัญญาแล้ว</span>
              )}
            </span>
            <span className="text-sky-900 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
              ค่าเช่ารายเดือน {formatBaht(debt.minPayment)}
            </span>
          </div>
        )}
      </div>

      {/* Copy Summary & PDF Download Quick Action Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap sm:flex-nowrap">
        <button
          onClick={handleCopySummary}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition border ${
            copied
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200 hover:border-emerald-300'
          }`}
          title="คัดลอกข้อความสรุปการชำระเพื่อส่ง LINE/ข้อความให้ลูกค้า"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>คัดลอกข้อความสรุปแล้ว!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-emerald-600" />
              <span>คัดลอกส่ง LINE</span>
            </>
          )}
        </button>

        <button
          onClick={() => setIsPdfModalOpen(true)}
          className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition border border-slate-700 shrink-0 shadow-2xs active:scale-95"
          title="ดาวน์โหลดหรือพิมพ์รายงาน PDF สรุปประวัติชำระเงิน"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>รายงาน PDF</span>
        </button>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition border border-sky-200 shrink-0"
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>{showHistory ? 'ซ่อน' : `งวด (${breakdown.installments.length})`}</span>
          {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Payment Breakdown by Installment / Month */}
      {showHistory && (
        <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              สรุปงวดการชำระเงินรายบุคคล
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              ชำระแล้ว {breakdown.monthsPaidCount} งวด
            </span>
          </div>

          {/* Breakdown summary metrics */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500">รวมรับชำระสะสม:</span>
              <p className="font-extrabold text-emerald-600 text-xs">{formatBaht(paidAmount)}</p>
            </div>
            <div>
              <span className="text-slate-500">คงเหลือค้างชำระ:</span>
              <p className="font-extrabold text-amber-700 text-xs">{formatBaht(currentBalance)}</p>
            </div>
          </div>

          {/* List of installments */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {breakdown.installments.length === 0 ? (
              <p className="text-center text-slate-400 py-3">ยังไม่มีประวัติการชำระเงินสำหรับลูกค้ารายนี้</p>
            ) : (
              breakdown.installments.map((inst) => (
                <div
                  key={inst.id}
                  className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-1 hover:border-emerald-300 transition"
                >
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span className="text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded text-[11px] border border-sky-100">
                      งวดที่ {inst.installmentNo}
                    </span>
                    <span className="text-emerald-600 font-extrabold text-xs">
                      + {inst.formattedAmount}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                    <span>วันที่: {inst.formattedDate}</span>
                    <span className="text-slate-600">สะสม: {formatBaht(inst.runningTotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5 border-t border-slate-100">
                    <span>ช่องทาง: {inst.paymentMethod}</span>
                    {inst.notes && <span className="italic text-slate-600 truncate max-w-[150px]">"{inst.notes}"</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Copy button inside history drawer */}
          <button
            onClick={handleCopySummary}
            className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>คัดลอกประวัติส่งลูกค้าเรียบร้อยแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>คัดลอกสรุปงวดการชำระทั้งหมด (สำหรับส่ง LINE)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Primary Action Button */}
      {!isPaidOff && (
        <div className="mt-3 pt-2">
          <button
            onClick={() => onPayDebt(debt)}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>บันทึกรับชำระค่าเช่า (ระบุจำนวนเงิน)</span>
          </button>
        </div>
      )}

      {/* PDF Report Generation Modal */}
      <TenantPdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        debt={debt}
        transactions={transactions}
      />
    </div>
  );
};

