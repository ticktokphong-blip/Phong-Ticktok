import React from 'react';
import { Home, Users, PlusCircle, PieChart, Sparkles } from 'lucide-react';

export type NavTab = 'dashboard' | 'debts' | 'summary' | 'ai';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenQuickAdd,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg z-30 pb-safe">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around relative">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'dashboard'
              ? 'text-sky-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">ภาพรวม</span>
        </button>

        {/* Tab 2: Tenants / Customers */}
        <button
          onClick={() => onTabChange('debts')}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'debts'
              ? 'text-sky-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">ลูกค้าค่าเช่า</span>
        </button>

        {/* Floating Quick Add Button */}
        <div className="relative -top-5">
          <button
            onClick={onOpenQuickAdd}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-sky-600 to-emerald-500 text-white flex flex-col items-center justify-center shadow-lg shadow-sky-500/30 active:scale-95 hover:brightness-110 transition border-3 border-white"
            title="บันทึกรับชำระค่าเช่า"
          >
            <PlusCircle className="w-7 h-7" />
          </button>
        </div>

        {/* Tab 3: Monthly Summary */}
        <button
          onClick={() => onTabChange('summary')}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'summary'
              ? 'text-sky-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <PieChart className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">สรุปรายเดือน</span>
        </button>

        {/* Tab 4: AI Advisor */}
        <button
          onClick={() => onTabChange('ai')}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'ai'
              ? 'text-sky-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5 text-amber-500 fill-amber-400/20" />
          <span className="text-[11px]">วิเคราะห์ AI</span>
        </button>
      </div>
    </div>
  );
};
