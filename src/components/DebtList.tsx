import React, { useState } from 'react';
import { DebtItem, Transaction } from '../types';
import { DebtCard } from './DebtCard';
import { DEBT_CATEGORIES } from '../utils/formatters';
import { getTenantCalculatedStats } from '../utils/debtCalculations';
import { PlusCircle, Search, ShieldCheck, UserPlus } from 'lucide-react';

interface DebtListProps {
  debts: DebtItem[];
  transactions?: Transaction[];
  onOpenAddDebt: () => void;
  onPayDebt: (debt: DebtItem) => void;
  onEditDebt: (debt: DebtItem) => void;
  onDeleteDebt: (debtId: string) => void;
}

export const DebtList: React.FC<DebtListProps> = ({
  debts,
  transactions = [],
  onOpenAddDebt,
  onPayDebt,
  onEditDebt,
  onDeleteDebt,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredDebts = debts.filter((debt) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      debt.name.toLowerCase().includes(term) ||
      (debt.customerName && debt.customerName.toLowerCase().includes(term)) ||
      (debt.roomNo && debt.roomNo.toLowerCase().includes(term)) ||
      DEBT_CATEGORIES[debt.category]?.label.toLowerCase().includes(term);

    const stats = getTenantCalculatedStats(debt, transactions);
    if (statusFilter === 'active') return matchesSearch && !stats.isPaidOff;
    if (statusFilter === 'completed') return matchesSearch && stats.isPaidOff;
    return matchesSearch;
  });

  const activeCount = debts.filter((d) => !getTenantCalculatedStats(d, transactions).isPaidOff).length;
  const completedCount = debts.filter((d) => getTenantCalculatedStats(d, transactions).isPaidOff).length;

  return (
    <div className="space-y-4 pb-20">
      {/* Search and Action Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-sm space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า หรือเลขห้อง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <button
            onClick={onOpenAddDebt}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มลูกค้า</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 pt-1 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-xl font-bold transition ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ลูกค้าทั้งหมด ({debts.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-xl font-bold transition ${
              statusFilter === 'active'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            ยังค้างชำระ ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-xl font-bold transition ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            ชำระครบแล้ว ({completedCount})
          </button>
        </div>
      </div>

      {/* Debt Cards Grid */}
      {filteredDebts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200/90 space-y-2">
          <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-600">ไม่พบรายการลูกค้าตามที่ค้นหา</p>
          <p className="text-[11px] text-slate-400">ลองเปลี่ยนข้อความค้นหา หรือกดปุ่ม "+ เพิ่มลูกค้า" เพื่อลงทะเบียนลูกค้ารายใหม่</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              transactions={transactions}
              onPayDebt={onPayDebt}
              onEditDebt={onEditDebt}
              onDeleteDebt={onDeleteDebt}
            />
          ))}
        </div>
      )}
    </div>
  );
};
