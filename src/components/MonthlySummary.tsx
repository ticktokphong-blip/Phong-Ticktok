import React, { useState, useMemo } from 'react';
import { Transaction, DebtItem } from '../types';
import { formatBaht, formatThaiMonthYear, DEBT_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/formatters';
import { getTenantPaymentBreakdown } from '../utils/debtCalculations';
import { TenantPdfReportModal } from './TenantPdfReportModal';
import { PieChart, BarChart, Calendar, ArrowUpRight, ArrowDownRight, CreditCard, Download, ChevronLeft, ChevronRight, UserCheck, Copy, Check, ChevronDown, ChevronUp, FileText, Building2 } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MonthlySummaryProps {
  transactions: Transaction[];
  debts: DebtItem[];
  onOpenAddPayment: () => void;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({
  transactions,
  debts,
  onOpenAddPayment,
}) => {
  const [expandedTenantId, setExpandedTenantId] = useState<string | null>(null);
  const [copiedTenantId, setCopiedTenantId] = useState<string | null>(null);
  const [selectedPdfDebt, setSelectedPdfDebt] = useState<DebtItem | null>(null);

  // Calculate breakdown for all tenants
  const tenantBreakdowns = useMemo(() => {
    return debts.map((debt) => getTenantPaymentBreakdown(debt, transactions));
  }, [debts, transactions]);

  const handleCopyTenantSummary = async (tenantId: string, summaryText: string) => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedTenantId(tenantId);
      setTimeout(() => setCopiedTenantId(null), 2500);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  // Available YYYY-MM months from transactions or current month
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    set.add(currentYM);

    transactions.forEach((tx) => {
      if (tx.date) {
        set.add(tx.date.substring(0, 7));
      }
    });

    return Array.from(set).sort().reverse();
  }, [transactions]);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    availableMonths[0] || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );

  const [activeFilter, setActiveFilter] = useState<'all' | 'debt_payment' | 'income' | 'expense'>('all');

  // Filter transactions for selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date && tx.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Calculated metrics
  const totalIncome = useMemo(() => {
    return monthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [monthTransactions]);

  const totalExpense = useMemo(() => {
    return monthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [monthTransactions]);

  const totalRentCollected = useMemo(() => {
    return monthTransactions
      .filter((tx) => tx.type === 'debt_payment')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [monthTransactions]);

  const netSavings = totalRentCollected + totalIncome - totalExpense;

  // Filtered transactions for list view
  const filteredTxList = useMemo(() => {
    if (activeFilter === 'all') return monthTransactions;
    return monthTransactions.filter((tx) => tx.type === activeFilter);
  }, [monthTransactions, activeFilter]);

  // Chart data for Pie chart
  const pieData = [
    { name: 'รับค่าเช่า', value: totalRentCollected, color: '#10B981' },
    { name: 'รายรับอื่นๆ', value: totalIncome, color: '#3B82F6' },
    { name: 'รายจ่ายดูแลอาคาร', value: totalExpense, color: '#F43F5E' },
  ].filter((item) => item.value > 0);

  // Debt breakdown by debt category / customer
  const debtBreakdownData = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};

    monthTransactions
      .filter((tx) => tx.type === 'debt_payment')
      .forEach((tx) => {
        const titleKey = tx.debtName || tx.title || 'ค่าเช่า';
        const color = '#0284C7';

        if (!map[titleKey]) {
          map[titleKey] = { name: titleKey, value: 0, color };
        }
        map[titleKey].value += tx.amount;
      });

    return Object.values(map);
  }, [monthTransactions]);

  // Handle month prev/next
  const handlePrevMonth = () => {
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[idx + 1]);
    }
  };

  const handleNextMonth = () => {
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx > 0) {
      setSelectedMonth(availableMonths[idx - 1]);
    }
  };

  const exportSummaryText = () => {
    const reportText = `📊 สรุปรายงานการรับค่าเช่าประจำเดือน ${formatThaiMonthYear(selectedMonth)}
----------------------------------
🏢 ยอดรับชำระค่าเช่ารวม: ${formatBaht(totalRentCollected)}
🟢 รายรับอื่นๆ: ${formatBaht(totalIncome)}
🔴 รายจ่ายดูแลอาคาร: ${formatBaht(totalExpense)}
💰 รายได้สุทธิเดือนนี้: ${formatBaht(netSavings)}

ประวัติรับชำระค่าเช่ารายคนเดือนนี้:
${monthTransactions
  .filter((tx) => tx.type === 'debt_payment')
  .map((tx) => `- ${tx.title}: ${formatBaht(tx.amount)} (ยอดคงเหลือใหม่ ${formatBaht(tx.newBalance || 0)})`)
  .join('\n') || '- ไม่มีรายการ'}

สรุปจากระบบ RentTracker Mobile`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(reportText);
      alert('คัดลอกรายงานสรุปผลการรับค่าเช่าเรียบร้อยแล้ว!');
    } else {
      alert(reportText);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Month Selector Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-sm flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          disabled={availableMonths.indexOf(selectedMonth) >= availableMonths.length - 1}
          className="p-1.5 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-sky-600" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent font-bold text-slate-900 text-sm focus:outline-none cursor-pointer"
          >
            {availableMonths.map((ym) => (
              <option key={ym} value={ym}>
                {formatThaiMonthYear(ym)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleNextMonth}
          disabled={availableMonths.indexOf(selectedMonth) <= 0}
          className="p-1.5 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Rent Collected Card (Highlight) */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-3.5 shadow-sm col-span-2 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-emerald-100 font-bold flex items-center gap-1">
              <CreditCard className="w-4 h-4 text-emerald-200" /> ยอดรับชำระค่าเช่ารวมเดือนนี้
            </span>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white border border-white/20">
              รับชำระ {monthTransactions.filter((tx) => tx.type === 'debt_payment').length} ครั้ง
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-0.5">
            {formatBaht(totalRentCollected)}
          </div>
          <p className="text-[11px] text-emerald-100/90 mt-1">
            รับตรงเวลาประจำเดือน {formatThaiMonthYear(selectedMonth)}
          </p>
        </div>

        {/* Other Income Card */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-500 font-medium">รายรับอื่นๆ</span>
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-extrabold text-blue-700">
            {formatBaht(totalIncome)}
          </div>
        </div>

        {/* Building Expense Card */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-500 font-medium">รายจ่ายดูแลอาคาร</span>
            <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-extrabold text-rose-700">
            {formatBaht(totalExpense)}
          </div>
        </div>

        {/* Net Income Card */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm col-span-2 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">รายได้สุทธิประจำเดือน (ค่าเช่า + รายรับอื่น - รายจ่าย)</p>
            <p className={`text-xl font-extrabold mt-0.5 ${netSavings >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatBaht(netSavings)}
            </p>
          </div>
          <button
            onClick={exportSummaryText}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition shrink-0"
            title="คัดลอกสรุปผล"
          >
            <Download className="w-4 h-4" />
            <span>คัดลอกสรุป</span>
          </button>
        </div>
      </div>

      {/* Visual Chart Section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
          <PieChart className="w-4 h-4 text-sky-600" />
          <span>สัดส่วนการเงินค่าเช่าในเดือนนี้</span>
        </h3>

        {pieData.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            ยังไม่มีบันทึกข้อมูลในเดือนนี้
          </div>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatBaht(Number(value)), 'จำนวนเงิน']}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-3 text-[11px] font-medium flex-wrap">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}:</span>
                  <span className="font-bold text-slate-900">{formatBaht(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Debt Breakdown Chart */}
      {debtBreakdownData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <BarChart className="w-4 h-4 text-emerald-600" />
            <span>ยอดรับชำระค่าเช่าจำแนกรายคน</span>
          </h3>
          <div className="space-y-2">
            {debtBreakdownData.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">{item.name}</span>
                  <span className="text-emerald-700">{formatBaht(item.value)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: item.color,
                      width: `${Math.min(100, Math.round((item.value / (totalRentCollected || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comprehensive Tenant Payment Breakdown Summary Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>สรุปงวดการชำระเงินแยกรายคน ({tenantBreakdowns.length} ผู้เช่า)</span>
          </h3>
          <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
            ข้อมูล Real-time
          </span>
        </div>

        <div className="space-y-2.5">
          {tenantBreakdowns.map((tb) => {
            const isExpanded = expandedTenantId === tb.debt.id;
            const isCopied = copiedTenantId === tb.debt.id;
            const tenantName = tb.debt.customerName || tb.debt.name;

            return (
              <div
                key={tb.debt.id}
                className="bg-slate-50/80 rounded-xl p-3 border border-slate-200 space-y-2 transition hover:border-emerald-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-sky-600" />
                        {tenantName} {tb.debt.roomNo ? `(${tb.debt.roomNo})` : ''}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ชำระแล้ว {tb.monthsPaidCount} งวด
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      รวมชำระแล้ว <strong className="text-emerald-700">{formatBaht(tb.totalPaidAmount)}</strong> |
                      คงเหลือ <strong className="text-amber-700">{formatBaht(tb.remainingAmount)}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setSelectedPdfDebt(tb.debt)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition border border-slate-700 flex items-center gap-1 shadow-2xs"
                      title="ออกรายงาน PDF / พิมพ์สรุปการชำระเงิน"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">PDF</span>
                    </button>

                    <button
                      onClick={() => handleCopyTenantSummary(tb.debt.id, tb.summaryText)}
                      className={`p-1.5 rounded-lg text-xs font-semibold transition border ${
                        isCopied
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border-slate-200'
                      }`}
                      title="คัดลอกสรุปข้อความส่งลูกค้าทาง LINE"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => setExpandedTenantId(isExpanded ? null : tb.debt.id)}
                      className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg text-xs transition border border-slate-200 flex items-center gap-0.5"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, tb.stats.percentPaid)}%` }}
                  />
                </div>

                {/* Expanded installments breakdown list */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-xs animate-fadeIn">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>งวดที่ชำระทั้งหมด</span>
                      <span>จำนวนเงิน</span>
                    </div>

                    {tb.installments.length === 0 ? (
                      <p className="text-[11px] text-slate-400 py-1 italic">ยังไม่มีบันทึกการชำระเงินในระบบ</p>
                    ) : (
                      tb.installments.map((inst) => (
                        <div
                          key={inst.id}
                          className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 mr-1.5">
                              งวดที่ {inst.installmentNo}
                            </span>
                            <span className="text-slate-600">{inst.formattedDate}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-emerald-600">{inst.formattedAmount}</span>
                            <span className="text-[10px] text-slate-400 block">สะสม {formatBaht(inst.runningTotal)}</span>
                          </div>
                        </div>
                      ))
                    )}

                    <button
                      onClick={() => handleCopyTenantSummary(tb.debt.id, tb.summaryText)}
                      className="w-full mt-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>คัดลอกข้อความสรุปเรียบร้อย!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>คัดลอกสรุปข้อความ {tenantName} (ส่ง LINE)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction List Section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            รายการรับเงิน/จ่ายเงินเดือนนี้ ({monthTransactions.length})
          </h3>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({monthTransactions.length})
          </button>
          <button
            onClick={() => setActiveFilter('debt_payment')}
            className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition ${
              activeFilter === 'debt_payment'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            รับค่าเช่า ({monthTransactions.filter((t) => t.type === 'debt_payment').length})
          </button>
          <button
            onClick={() => setActiveFilter('income')}
            className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition ${
              activeFilter === 'income'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            รายรับอื่น ({monthTransactions.filter((t) => t.type === 'income').length})
          </button>
          <button
            onClick={() => setActiveFilter('expense')}
            className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition ${
              activeFilter === 'expense'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            รายจ่าย ({monthTransactions.filter((t) => t.type === 'expense').length})
          </button>
        </div>

        {/* Transaction Items */}
        {filteredTxList.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            ไม่พบรายการในหมวดหมู่นี้
          </div>
        ) : (
          <div className="space-y-2.5 divide-y divide-slate-100">
            {filteredTxList.map((tx) => (
              <div key={tx.id} className="pt-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'debt_payment'
                        ? 'bg-emerald-100 text-emerald-700'
                        : tx.type === 'income'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {tx.type === 'debt_payment' ? (
                      <CreditCard className="w-4 h-4" />
                    ) : tx.type === 'income' ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{tx.title}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span>{tx.date}</span>
                      {tx.type === 'debt_payment' && tx.newBalance !== undefined && (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                          คงเหลือใหม่ {formatBaht(tx.newBalance)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`text-sm font-extrabold text-right shrink-0 ${
                    tx.type === 'debt_payment' || tx.type === 'income'
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}
                >
                  {tx.type === 'expense' ? '-' : '+'}
                  {formatBaht(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tenant PDF Payment Report Modal */}
      <TenantPdfReportModal
        isOpen={Boolean(selectedPdfDebt)}
        onClose={() => setSelectedPdfDebt(null)}
        debt={selectedPdfDebt}
        transactions={transactions}
      />
    </div>
  );
};
