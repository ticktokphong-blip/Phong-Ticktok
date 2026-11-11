import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, AlertCircle, ShieldAlert, Clock, User, Home, Phone, Building2 } from 'lucide-react';
import { DebtItem, DebtCategory } from '../types';
import { DEBT_CATEGORIES, formatBaht, getDaysRemaining } from '../utils/formatters';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtToEdit?: DebtItem | null;
  onSaveDebt: (debt: Omit<DebtItem, 'id' | 'createdAt'>, editId?: string) => void;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  onClose,
  debtToEdit,
  onSaveDebt,
}) => {
  const [customerName, setCustomerName] = useState<string>('');
  const [roomNo, setRoomNo] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [category, setCategory] = useState<DebtCategory>('room_rent');
  const [minPayment, setMinPayment] = useState<string>('3500');
  const [monthlyDueDate, setMonthlyDueDate] = useState<number>(5);
  const [originalBalance, setOriginalBalance] = useState<string>('42000');
  const [currentBalance, setCurrentBalance] = useState<string>('21000');
  const [totalPaid, setTotalPaid] = useState<string>('21000');
  const [targetPayoffDate, setTargetPayoffDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (debtToEdit) {
        setCustomerName(debtToEdit.customerName || debtToEdit.name);
        setRoomNo(debtToEdit.roomNo || '');
        setPhone(debtToEdit.phone || '');
        setCategory(debtToEdit.category);
        setMinPayment(debtToEdit.minPayment.toString());
        setMonthlyDueDate(debtToEdit.monthlyDueDate || 5);
        setOriginalBalance(debtToEdit.originalBalance.toString());
        setCurrentBalance(debtToEdit.currentBalance.toString());
        setTotalPaid((debtToEdit.totalPaid !== undefined ? debtToEdit.totalPaid : debtToEdit.originalBalance - debtToEdit.currentBalance).toString());
        setTargetPayoffDate(debtToEdit.targetPayoffDate || '');
        setNotes(debtToEdit.notes || '');
      } else {
        // Defaults for new tenant
        setCustomerName('');
        setRoomNo('');
        setPhone('');
        setCategory('room_rent');
        setMinPayment('3500');
        setMonthlyDueDate(5);
        setOriginalBalance('42000');
        setCurrentBalance('21000');
        setTotalPaid('21000');

        // Default contract end: 1 year from today
        const defaultTarget = new Date();
        defaultTarget.setFullYear(defaultTarget.getFullYear() + 1);
        setTargetPayoffDate(defaultTarget.toISOString().split('T')[0]);
        setNotes('');
      }
      setErrorMsg('');
    }
  }, [isOpen, debtToEdit]);

  if (!isOpen) return null;

  const numericCurrent = parseFloat(currentBalance) || 0;
  const numericOriginal = parseFloat(originalBalance) || numericCurrent;
  const numericMinPay = parseFloat(minPayment) || 0;
  const numericTotalPaid = parseFloat(totalPaid) || 0;

  const setTargetPresetMonths = (monthsToAdd: number) => {
    const target = new Date();
    target.setMonth(target.getMonth() + monthsToAdd);
    setTargetPayoffDate(target.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setErrorMsg('กรุณาระบุชื่อลูกค้า/ผู้เช่า');
      return;
    }
    if (numericCurrent < 0) {
      setErrorMsg('ยอดคงเหลือต้องไม่ติดลบ');
      return;
    }

    const displayName = roomNo.trim() ? `ค่าเช่า - ${customerName.trim()} (${roomNo.trim()})` : `ค่าเช่า - ${customerName.trim()}`;

    onSaveDebt(
      {
        name: displayName,
        customerName: customerName.trim(),
        roomNo: roomNo.trim(),
        phone: phone.trim(),
        category,
        originalBalance: Math.max(numericCurrent, numericOriginal),
        currentBalance: numericCurrent,
        totalPaid: numericTotalPaid,
        interestRate: 0,
        minPayment: numericMinPay,
        monthlyDueDate,
        targetPayoffDate,
        color: DEBT_CATEGORIES[category]?.color || '#0284C7',
        notes,
      },
      debtToEdit ? debtToEdit.id : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <User className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-base text-white">
              {debtToEdit ? 'แก้ไขข้อมูลลูกค้าค่าเช่า' : 'เพิ่มลงทะเบียนลูกค้าใหม่'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Customer Name & Room */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อลูกค้า / ผู้เช่า <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น คุณสมชาย ใจดี"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขห้อง
              </label>
              <input
                type="text"
                placeholder="เช่น 101"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-sky-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                placeholder="081-234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ประเภทการเช่า
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DebtCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {Object.entries(DEBT_CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly Rent & Monthly Due Day */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-sky-50/60 rounded-2xl border border-sky-100">
            <div>
              <label className="block text-xs font-bold text-sky-900 mb-1">
                ค่าเช่าต่อเดือน (บาท) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="3500"
                value={minPayment}
                onChange={(e) => setMinPayment(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs font-extrabold text-sky-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sky-900 mb-1">
                กำหนดส่งทุกวันที่
              </label>
              <select
                value={monthlyDueDate}
                onChange={(e) => setMonthlyDueDate(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs font-bold text-sky-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    วันที่ {d} ของทุกเดือน
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Balances: Total Contract, Total Paid, Remaining Balance */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              สถานะยอดเงินตามสัญญา
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">
                  ยอดรวมตามสัญญา
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={originalBalance}
                  onChange={(e) => setOriginalBalance(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-emerald-700 font-semibold mb-1">
                  ยอดที่ชำระแล้ว
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={totalPaid}
                  onChange={(e) => setTotalPaid(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-amber-700 font-semibold mb-1">
                  ยอดคงเหลือ
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* TARGET PAYOFF COMPLETION DATE */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-600" />
                <span>กำหนดวันสิ้นสุดสัญญา / ชำระครบ</span>
              </label>
            </div>

            <input
              type="date"
              value={targetPayoffDate}
              onChange={(e) => setTargetPayoffDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
              <span className="text-[10px] text-slate-500 font-semibold shrink-0">สัญญา:</span>
              <button
                type="button"
                onClick={() => setTargetPresetMonths(6)}
                className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-medium rounded-lg border border-slate-200 shrink-0"
              >
                6 เดือน
              </button>
              <button
                type="button"
                onClick={() => setTargetPresetMonths(12)}
                className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-medium rounded-lg border border-slate-200 shrink-0"
              >
                1 ปี
              </button>
              <button
                type="button"
                onClick={() => setTargetPresetMonths(24)}
                className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-medium rounded-lg border border-slate-200 shrink-0"
              >
                2 ปี
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หมายเหตุ / บันทึกเพิ่มเติม
            </label>
            <input
              type="text"
              placeholder="เช่น เงินประกัน 2 เดือน, วันเริ่มเข้าอยู่"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-600/20 transition flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Check className="w-5 h-5" />
              <span>{debtToEdit ? 'บันทึกการแก้ไขข้อมูลผู้เช่า' : 'ลงทะเบียนลูกค้าค่าเช่าใหม่'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
