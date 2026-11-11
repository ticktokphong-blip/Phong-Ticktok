import React, { useState } from 'react';
import { DebtItem, Transaction } from '../types';
import { formatBaht, formatThaiDate, getDaysRemaining, DEBT_CATEGORIES } from '../utils/formatters';
import { getTenantCalculatedStats } from '../utils/debtCalculations';
import { Sparkles, Target, Calendar, ArrowRight, Bot, RefreshCw, User, CheckCircle2, Clock } from 'lucide-react';

interface DebtPlannerProps {
  debts: DebtItem[];
  transactions?: Transaction[];
  onOpenAddPaymentWithDebt: (debt: DebtItem) => void;
}

export const DebtPlanner: React.FC<DebtPlannerProps> = ({
  debts,
  transactions = [],
  onOpenAddPaymentWithDebt,
}) => {
  const [strategy, setStrategy] = useState<'dueDate' | 'remaining'>('dueDate');
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');

  const activeTenants = debts.filter((d) => !getTenantCalculatedStats(d, transactions).isPaidOff);

  // Sort tenants based on strategy
  const sortedTenants = [...activeTenants].sort((a, b) => {
    const statsA = getTenantCalculatedStats(a, transactions);
    const statsB = getTenantCalculatedStats(b, transactions);
    if (strategy === 'dueDate') {
      // Due date of month first
      return (a.monthlyDueDate || 5) - (b.monthlyDueDate || 5);
    } else {
      // Highest remaining balance first
      return statsB.currentBalance - statsA.currentBalance;
    }
  });

  const fetchAiAdvice = async () => {
    setIsLoadingAi(true);
    setAiError('');
    try {
      const response = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debts: activeTenants,
          selectedStrategy: strategy === 'dueDate' ? 'เรียงตามวันครบกำหนดชำระรายเดือน' : 'เรียงตามยอดคงเหลือสูงสุด',
        }),
      });

      const data = await response.json();
      if (data.error) {
        setAiError(data.error);
      } else {
        setAiAdvice(data.result);
      }
    } catch (err: any) {
      setAiError('เกิดข้อผิดพลาดในการติดต่อ AI Advisor: ' + err.toString());
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Strategy Switcher Header */}
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-base text-white">ตารางติดตามและจัดเก็บค่าเช่า</h2>
            <p className="text-xs text-sky-200/80">จัดลำดับการแจ้งเตือนชำระเงินของลูกค้าประเดือน</p>
          </div>
        </div>

        {/* Strategy Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => setStrategy('dueDate')}
            className={`p-3 rounded-xl border text-left transition ${
              strategy === 'dueDate'
                ? 'bg-sky-500/20 border-sky-400 text-white shadow-sm'
                : 'bg-white/5 border-white/10 text-sky-200 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs text-sky-300">
              <Clock className="w-4 h-4" /> เรียงตามวันส่งค่าเช่า
            </div>
            <p className="text-[10px] text-sky-200/80 mt-1">
              จัดลำดับตามวันที่ต้องชำระประจำเดือน เพื่อตามเก็บได้ตรงเวลา!
            </p>
          </button>

          <button
            onClick={() => setStrategy('remaining')}
            className={`p-3 rounded-xl border text-left transition ${
              strategy === 'remaining'
                ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm'
                : 'bg-white/5 border-white/10 text-sky-200 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
              <User className="w-4 h-4" /> เรียงตามยอดค้างชำระ
            </div>
            <p className="text-[10px] text-sky-200/80 mt-1">
              ติดตามลูกค้ารายที่ยอดค้างชำระสูงที่สุดก่อน!
            </p>
          </button>
        </div>
      </div>

      {/* Recommended Rent Collection Sequence */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
          <span>รายการลูกค้าที่ต้องติดตามจัดเก็บ</span>
          <span className="text-xs text-sky-600 font-normal">
            เรียงตาม {strategy === 'dueDate' ? 'วันที่ต้องชำระรายเดือน' : 'ยอดคงเหลือสูงสุด'}
          </span>
        </h3>

        {sortedTenants.length === 0 ? (
          <div className="p-6 text-center text-emerald-600 font-bold bg-emerald-50 rounded-xl">
            🎉 ลูกค้าทุกคนชำระค่าเช่าครบถ้วนแล้ว!
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTenants.map((tenant, index) => {
              const daysRem = getDaysRemaining(tenant.targetPayoffDate);
              const stats = getTenantCalculatedStats(tenant, transactions);

              return (
                <div
                  key={tenant.id}
                  className={`p-3.5 rounded-2xl border transition ${
                    index === 0
                      ? 'bg-sky-50/80 border-sky-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                          index === 0
                            ? 'bg-sky-600 text-white ring-2 ring-sky-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          {tenant.customerName || tenant.name} {tenant.roomNo ? `(ห้อง ${tenant.roomNo})` : ''}
                          {index === 0 && (
                            <span className="bg-sky-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                              ชำระเร็วๆ นี้ 📌
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] text-slate-500">
                          {DEBT_CATEGORIES[tenant.category]?.label} • กำหนดส่งทุกวันที่ {tenant.monthlyDueDate || 5} ของเดือน
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-amber-800 text-sm">
                        {formatBaht(stats.currentBalance)}
                      </span>
                      <p className="text-[10px] text-slate-500">
                        ค่าเช่าเดือนละ {formatBaht(tenant.minPayment)}
                      </p>
                    </div>
                  </div>

                  {/* Target Completion Date info */}
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-600 flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      วันสิ้นสุดสัญญา: <strong>{formatThaiDate(tenant.targetPayoffDate)}</strong>
                    </span>
                    <button
                      onClick={() => onOpenAddPaymentWithDebt(tenant)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1 shadow-sm"
                    >
                      <span>บันทึกการรับเงิน</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Assistant Callout */}
      <div className="bg-gradient-to-br from-sky-50 to-indigo-50/50 rounded-2xl p-4 border border-sky-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">ผู้ช่วย AI วิเคราะห์วางแผนจัดเก็บค่าเช่า</h3>
              <p className="text-[11px] text-slate-500">คำนวณข้อเสนอแนะและข้อความแจ้งเตือนชำระค่าเช่า</p>
            </div>
          </div>

          <button
            onClick={fetchAiAdvice}
            disabled={isLoadingAi}
            className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isLoadingAi ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>กำลังวิเคราะห์...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>ขอคำแนะนำ AI</span>
              </>
            )}
          </button>
        </div>

        {aiError && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
            {aiError}
          </div>
        )}

        {aiAdvice && (
          <div className="p-3.5 bg-white rounded-xl border border-sky-100 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner font-sans">
            {aiAdvice}
          </div>
        )}
      </div>
    </div>
  );
};
