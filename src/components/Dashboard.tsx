import React from 'react';
import { DebtItem, Transaction } from '../types';
import { formatBaht, getDaysRemaining } from '../utils/formatters';
import { getTenantCalculatedStats } from '../utils/debtCalculations';
import {
  CreditCard,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  ChevronRight,
  UserPlus,
  User,
  Building2,
} from 'lucide-react';

interface DashboardProps {
  debts: DebtItem[];
  transactions: Transaction[];
  onOpenAddPayment: () => void;
  onOpenAddPaymentWithDebt: (debt: DebtItem) => void;
  onOpenAddDebt: () => void;
  onOpenAddIncome: () => void;
  onOpenAddExpense: () => void;
  onNavigateToTab: (tab: any) => void;
  onDeleteTransaction: (txId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  debts,
  transactions,
  onOpenAddPayment,
  onOpenAddPaymentWithDebt,
  onOpenAddDebt,
  onOpenAddIncome,
  onOpenAddExpense,
  onNavigateToTab,
  onDeleteTransaction,
}) => {
  const activeDebts = debts.filter((d) => d.currentBalance > 0);

  // Get current YYYY-MM
  const currentYM = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const thisMonthTransactions = transactions.filter(
    (tx) => tx.date && tx.date.startsWith(currentYM)
  );

  const thisMonthRentCollected = thisMonthTransactions
    .filter((tx) => tx.type === 'debt_payment')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const thisMonthIncome = thisMonthTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const thisMonthExpense = thisMonthTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Recent transactions (top 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-4 pb-20">
      {/* Quick Action Grid */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={onOpenAddPayment}
          className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex flex-col items-center justify-center shadow-md shadow-emerald-600/20 active:scale-95 transition"
        >
          <CreditCard className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-bold">รับค่าเช่า</span>
        </button>

        <button
          onClick={onOpenAddIncome}
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex flex-col items-center justify-center shadow-md shadow-blue-600/20 active:scale-95 transition"
        >
          <ArrowDownRight className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-bold">+ รายรับ</span>
        </button>

        <button
          onClick={onOpenAddExpense}
          className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl flex flex-col items-center justify-center shadow-md shadow-rose-600/20 active:scale-95 transition"
        >
          <ArrowUpRight className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-bold">+ รายจ่าย</span>
        </button>

        <button
          onClick={onOpenAddDebt}
          className="p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl flex flex-col items-center justify-center shadow-md shadow-sky-600/20 active:scale-95 transition"
        >
          <UserPlus className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-bold">+ เพิ่มลูกค้า</span>
        </button>
      </div>

      {/* Monthly Fast Progress Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 font-medium">ยอดรับชำระค่าเช่ารวมเดือนนี้</span>
          <div className="text-2xl font-black text-emerald-700 mt-0.5">
            {formatBaht(thisMonthRentCollected)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            รายรับอื่นๆ {formatBaht(thisMonthIncome)} • ค่าใช้จ่ายดูแลอาคาร {formatBaht(thisMonthExpense)}
          </p>
        </div>
        <button
          onClick={() => onNavigateToTab('summary')}
          className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
        >
          <span>สรุป</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Featured Tenants & Rent Status */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-sky-600" />
            <span>สถานะลูกค้าค่าเช่า</span>
          </h3>
          <button
            onClick={() => onNavigateToTab('debts')}
            className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center"
          >
            <span>ดูลูกค้าทั้งหมด ({debts.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {debts.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            ยังไม่มีข้อมูลลูกค้า กดปุ่ม "+ เพิ่มลูกค้า" ด้านบนเพื่อเริ่มลงทะเบียน
          </div>
        ) : (
          <div className="space-y-2.5">
            {debts.map((debt) => {
              const daysRem = getDaysRemaining(debt.targetPayoffDate);
              const stats = getTenantCalculatedStats(debt, transactions);

              return (
                <div
                  key={debt.id}
                  className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 hover:bg-slate-100/80 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-sky-600" />
                        {debt.customerName || debt.name}
                      </span>
                      {debt.roomNo && (
                        <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded font-medium border border-sky-100">
                          {debt.roomNo}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-600 flex-wrap">
                      <span>
                        ส่งเดือนละ: <strong className="text-slate-900">{formatBaht(debt.minPayment)}</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>
                        ชำระแล้ว: <strong className="text-emerald-600">{formatBaht(stats.paidAmount)}</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>
                        คงเหลือ: <strong className="text-amber-700">{formatBaht(stats.currentBalance)}</strong>
                      </span>
                    </div>

                    {debt.monthlyDueDate && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3 text-sky-500" />
                        <span>กำหนดชำระทุกวันที่ {debt.monthlyDueDate} ของเดือน</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenAddPaymentWithDebt(debt)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition shrink-0 active:scale-95"
                  >
                    รับค่าเช่า
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">ประวัติการชำระเงินล่าสุด</h3>
          <button
            onClick={() => onNavigateToTab('summary')}
            className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center"
          >
            <span>ดูสรุปรายเดือน</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            ยังไม่มีรายการประวัติการชำระ
          </div>
        ) : (
          <div className="space-y-2 divide-y divide-slate-100">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="pt-2 flex items-center justify-between gap-2">
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
                    <p className="text-[10px] text-slate-500">
                      {tx.date} • {tx.paymentMethod || 'โอนเงิน'}
                      {tx.newBalance !== undefined && (
                        <span className="ml-1 text-emerald-700 font-semibold">
                          (คงเหลือ {formatBaht(tx.newBalance)})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-extrabold ${
                      tx.type === 'debt_payment' || tx.type === 'income'
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'expense' ? '-' : '+'}
                    {formatBaht(tx.amount)}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
                        onDeleteTransaction(tx.id);
                      }
                    }}
                    className="p-1 text-slate-300 hover:text-rose-600 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
