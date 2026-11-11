import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard, ArrowUpRight, ArrowDownRight, Sparkles, AlertCircle, Calendar, User, Building2 } from 'lucide-react';
import { DebtItem, Transaction, TransactionType, ExpenseCategory, IncomeCategory } from '../types';
import { formatBaht, formatThaiDate, DEBT_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/formatters';
import { getTenantCalculatedStats } from '../utils/debtCalculations';
import confetti from 'canvas-confetti';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  debts: DebtItem[];
  transactions?: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  initialType?: TransactionType;
  initialDebtId?: string;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  debts,
  transactions = [],
  onAddTransaction,
  initialType = 'debt_payment',
  initialDebtId,
}) => {
  const [txType, setTxType] = useState<TransactionType>(initialType);
  const [selectedDebtId, setSelectedDebtId] = useState<string>(initialDebtId || (debts[0]?.id || ''));
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>('rent');
  const [paymentMethod, setPaymentMethod] = useState<string>('โอนเงินผ่านธนาคาร');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTxType(initialType);
      if (initialDebtId) {
        setSelectedDebtId(initialDebtId);
      } else if (debts.length > 0) {
        setSelectedDebtId(debts[0].id);
      }
      setAmount('');
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setErrorMsg('');
    }
  }, [isOpen, initialType, initialDebtId, debts]);

  if (!isOpen) return null;

  const selectedDebt = debts.find((d) => d.id === selectedDebtId);
  const selectedDebtStats = selectedDebt ? getTenantCalculatedStats(selectedDebt, transactions) : null;
  const numericAmount = parseFloat(amount) || 0;

  // Real-time calculation of new balance after payment
  const currentDebtBalance = selectedDebtStats ? selectedDebtStats.currentBalance : 0;
  const newBalanceAfterPayment = Math.max(0, currentDebtBalance - numericAmount);
  const isPayoffComplete = selectedDebt && numericAmount > 0 && newBalanceAfterPayment === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) {
      setErrorMsg('กรุณาระบุจำนวนเงินที่ถูกต้อง (มากกว่า 0)');
      return;
    }

    if (txType === 'debt_payment') {
      if (!selectedDebt) {
        setErrorMsg('กรุณาเลือกลูกค้าที่ต้องการบันทึกการชำระ');
        return;
      }

      const customerLabel = selectedDebt.customerName || selectedDebt.name;
      const txTitle = title.trim() || `รับชำระค่าเช่า - ${customerLabel}`;

      onAddTransaction({
        type: 'debt_payment',
        amount: numericAmount,
        date,
        title: txTitle,
        debtId: selectedDebt.id,
        debtName: selectedDebt.name,
        previousBalance: selectedDebt.currentBalance,
        newBalance: newBalanceAfterPayment,
        category: selectedDebt.category,
        paymentMethod,
        notes,
      });

      // Fire confetti celebration if rent paid off entirely according to contract!
      if (newBalanceAfterPayment === 0) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore if canvas fail
        }
      }
    } else if (txType === 'income') {
      onAddTransaction({
        type: 'income',
        amount: numericAmount,
        date,
        title: title.trim() || 'รายรับอื่นๆ',
        category: category as IncomeCategory,
        paymentMethod,
        notes,
      });
    } else {
      onAddTransaction({
        type: 'expense',
        amount: numericAmount,
        date,
        title: title.trim() || 'รายจ่ายดูแลอาคาร',
        category: category as ExpenseCategory,
        paymentMethod,
        notes,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CreditCard className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-base text-white">บันทึกรับชำระค่าเช่า / รายการ</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Selector Switcher */}
        <div className="p-3 bg-slate-50 border-b border-slate-100">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/80 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setTxType('debt_payment');
                setErrorMsg('');
              }}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                txType === 'debt_payment'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>รับค่าเช่า</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTxType('income');
                setErrorMsg('');
              }}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                txType === 'income'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>รายรับอื่น</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTxType('expense');
                setErrorMsg('');
              }}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                txType === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>รายจ่าย</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* RENT PAYMENT SPECIFIC UI */}
          {txType === 'debt_payment' && (
            <>
              {/* 1. Select Tenant Customer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ระบุชื่อลูกค้าที่ชำระ <span className="text-rose-500">*</span>
                </label>
                {debts.length === 0 ? (
                  <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                    ยังไม่มีข้อมูลลูกค้า กรุณาเพิ่มลูกค้ารายใหม่ก่อนทำรายการรับชำระ
                  </div>
                ) : (
                  <select
                    value={selectedDebtId}
                    onChange={(e) => setSelectedDebtId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {debts.map((debt) => {
                      const debtBal = getTenantCalculatedStats(debt, transactions).currentBalance;
                      return (
                        <option key={debt.id} value={debt.id}>
                          {debt.customerName || debt.name} {debt.roomNo ? `(${debt.roomNo})` : ''} - ยอดคงเหลือ {formatBaht(debtBal)}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* 2. Specify Payment Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ยอดเงินที่ชำระ (บาท) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                    ฿
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-emerald-50/50 border-2 border-emerald-500/40 rounded-xl text-xl font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                    autoFocus
                  />
                </div>
                {/* Quick amount suggestion chips */}
                {selectedDebt && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setAmount(selectedDebt.minPayment.toString())}
                      className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-300"
                    >
                      ค่าเช่าประจำเดือน ({formatBaht(selectedDebt.minPayment)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmount(currentDebtBalance.toString())}
                      className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-800 text-[11px] font-bold rounded-lg border border-sky-300"
                    >
                      ชำระคงเหลือทั้งหมด ({formatBaht(currentDebtBalance)})
                    </button>
                  </div>
                )}
              </div>

              {/* 3. SHOW CURRENT & NEW REMAINING BALANCE (REAL-TIME CALCULATION) */}
              {selectedDebt && (
                <div className="p-3.5 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl border border-slate-800 space-y-2 shadow-inner">
                  <div className="flex justify-between items-center text-xs text-sky-200">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-sky-300" /> ชื่อลูกค้า:
                    </span>
                    <span className="font-semibold text-white px-2 py-0.5 rounded bg-sky-900/60 border border-sky-700/50">
                      {selectedDebt.customerName || selectedDebt.name} {selectedDebt.roomNo && `(${selectedDebt.roomNo})`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">ยอดค้างชำระเดิม:</span>
                    <span className="font-bold text-slate-100 text-sm">
                      {formatBaht(selectedDebt.currentBalance)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-300 font-medium">ยอดรับชำระครั้งนี้:</span>
                    <span className="font-bold text-emerald-300 text-sm">
                      - {formatBaht(numericAmount)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> ยอดคงเหลือใหม่หลังรับชำระ:
                    </span>
                    <span className={`text-lg font-extrabold ${newBalanceAfterPayment === 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                      {formatBaht(newBalanceAfterPayment)}
                    </span>
                  </div>

                  {/* Target Completion Date Reminder */}
                  <div className="pt-1 flex justify-between items-center text-[11px] text-sky-200/80">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-sky-400" /> กำหนดชำระครบสัญญา:
                    </span>
                    <span className="font-medium text-white">
                      {formatThaiDate(selectedDebt.targetPayoffDate)}
                    </span>
                  </div>

                  {isPayoffComplete && (
                    <div className="mt-2 p-2 bg-emerald-500/20 text-emerald-300 text-xs rounded-xl text-center font-bold border border-emerald-500/40 animate-bounce">
                      🎉 ยอดคงเหลือเป็น 0! ลูกค้ารายนี้ชำระครบตามสัญญาแล้ว!
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* INCOME SPECIFIC UI */}
          {txType === 'income' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ประเภทรายรับ
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {Object.entries(INCOME_CATEGORIES).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  จำนวนเงิน (บาท) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                    ฿
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-blue-50/50 border-2 border-blue-500/40 rounded-xl text-xl font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>
            </>
          )}

          {/* EXPENSE SPECIFIC UI */}
          {txType === 'expense' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ประเภทรายจ่าย
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  จำนวนเงิน (บาท) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                    ฿
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-rose-50/50 border-2 border-rose-500/40 rounded-xl text-xl font-extrabold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>
            </>
          )}

          {/* COMMON FIELDS: Title, Date, Payment Method, Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หัวข้อ / รายละเอียดสั้นๆ
            </label>
            <input
              type="text"
              placeholder={
                txType === 'debt_payment'
                  ? 'เช่น ชำระค่าเช่าประจำเดือนสิงหาคม'
                  : 'เช่น ซื้ออุปกรณ์ซ่อมก๊อกน้ำ / ค่าส่วนกลาง'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่ชำระ
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ช่องทางชำระ
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="โอนเงินผ่านธนาคาร">โอนเงินผ่านธนาคาร</option>
                <option value="เงินสด">เงินสด</option>
                <option value="พร้อมเพย์">พร้อมเพย์</option>
                <option value="บัตรเดบิต/เครดิต">บัตรเดบิต/เครดิต</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หมายเหตุเพิ่มเติม
            </label>
            <input
              type="text"
              placeholder="บันทึกข้อความกันลืม..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.98] ${
                txType === 'debt_payment'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                  : txType === 'income'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30'
                  : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-600/30'
              }`}
            >
              <Check className="w-5 h-5" />
              <span>
                {txType === 'debt_payment'
                  ? 'ยืนยันบันทึกรับชำระค่าเช่า'
                  : txType === 'income'
                  ? 'บันทึกรายรับ'
                  : 'บันทึกรายจ่าย'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
