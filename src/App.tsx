import React, { useState, useEffect, useCallback } from 'react';
import { DebtItem, Transaction, TransactionType } from './types';
import { INITIAL_DEBTS, INITIAL_TRANSACTIONS } from './data/initialData';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { DebtList } from './components/DebtList';
import { MonthlySummary } from './components/MonthlySummary';
import { DebtPlanner } from './components/DebtPlanner';
import { QuickAddModal } from './components/QuickAddModal';
import { DebtModal } from './components/DebtModal';
import { GoogleSheetsSyncBanner } from './components/GoogleSheetsSyncBanner';
import { GoogleSheetsDirectSyncModal } from './components/GoogleSheetsDirectSyncModal';
import { getTenantCalculatedStats } from './utils/debtCalculations';
import { initAuth, googleSignIn, logoutGoogle } from './lib/firebaseAuth';
import {
  fetchTenantsFromSheet,
  fetchTransactionsFromSheet,
  saveTenantsToSheet,
  saveTransactionsToSheet,
  ensureSheetTabsExist,
  syncWithAppsScriptWebApp,
  SPREADSHEET_URL,
} from './lib/googleSheets';
import { User } from 'firebase/auth';

export default function App() {
  // LocalStorage / Google Sheet state
  const [debts, setDebts] = useState<DebtItem[]>(() => {
    try {
      const saved = localStorage.getItem('rent_tracker_debts');
      return saved ? JSON.parse(saved) : INITIAL_DEBTS;
    } catch {
      return INITIAL_DEBTS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('rent_tracker_txs');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // Google Apps Script Web App URL (No Login Required!)
  const [webAppUrl, setWebAppUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('apps_script_web_app_url') || '';
    } catch {
      return '';
    }
  });
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  // Google OAuth Auth & Sync state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Modal controls
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickAddType, setQuickAddType] = useState<TransactionType>('debt_payment');
  const [quickAddDebtId, setQuickAddDebtId] = useState<string | undefined>(undefined);

  const [isDebtModalOpen, setIsDebtModalOpen] = useState<boolean>(false);
  const [debtToEdit, setDebtToEdit] = useState<DebtItem | null>(null);

  // Cache to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('rent_tracker_debts', JSON.stringify(debts));
    } catch (e) {
      console.error('Failed to save debts to localStorage:', e);
    }
  }, [debts]);

  useEffect(() => {
    try {
      localStorage.setItem('rent_tracker_txs', JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to localStorage:', e);
    }
  }, [transactions]);

  // Sync to Google Apps Script Web App (No Login)
  const syncToAppsScript = useCallback(async (urlToSync?: string, currentDebts?: DebtItem[], currentTxs?: Transaction[]) => {
    const url = urlToSync || webAppUrl;
    if (!url || !url.trim()) return;

    setIsSyncing(true);
    setSyncError(null);
    try {
      await syncWithAppsScriptWebApp(url, currentDebts || debts, currentTxs || transactions);
      setLastSyncTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      console.error('Apps Script auto sync error:', err);
      setSyncError(err.message || 'บันทึกไปยัง Google Sheet ไม่สำเร็จ');
    } finally {
      setIsSyncing(false);
    }
  }, [webAppUrl, debts, transactions]);

  // Save current data to Google Sheets (OAuth or Apps Script)
  const triggerAutoSync = useCallback((currentDebts: DebtItem[], currentTxs: Transaction[]) => {
    if (webAppUrl && webAppUrl.trim()) {
      syncToAppsScript(webAppUrl, currentDebts, currentTxs);
    } else if (googleToken) {
      (async () => {
        setIsSyncing(true);
        try {
          await ensureSheetTabsExist(googleToken, ['Tenants', 'Transactions']);
          await Promise.all([
            saveTenantsToSheet(googleToken, currentDebts, 'Tenants'),
            saveTransactionsToSheet(googleToken, currentTxs, 'Transactions'),
          ]);
          setLastSyncTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
        } catch (err: any) {
          setSyncError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลไปยัง Google Sheets');
        } finally {
          setIsSyncing(false);
        }
      })();
    }
  }, [webAppUrl, googleToken, syncToAppsScript]);

  // Initialize Firebase Auth Listener (optional fallback)
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Manual refresh trigger
  const handleManualSync = () => {
    triggerAutoSync(debts, transactions);
  };

  // Totals calculations
  const totalCurrentDebt = debts.reduce((sum, d) => sum + getTenantCalculatedStats(d, transactions).currentBalance, 0);
  const totalOriginalDebt = debts.reduce((sum, d) => sum + getTenantCalculatedStats(d, transactions).originalBalance, 0);

  // Handlers for transactions
  const handleAddTransaction = (newTxData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...newTxData,
      id: 'tx-' + Date.now(),
    };

    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);

    // If it's a debt payment, automatically update debt balance in state
    let updatedDebts = debts;
    if (newTx.type === 'debt_payment' && newTx.debtId && newTx.newBalance !== undefined) {
      updatedDebts = debts.map((d) =>
        d.id === newTx.debtId
          ? { ...d, currentBalance: Math.max(0, newTx.newBalance!) }
          : d
      );
      setDebts(updatedDebts);
    }

    triggerAutoSync(updatedDebts, updatedTxs);
  };

  const handleDeleteTransaction = (txId: string) => {
    const txToDelete = transactions.find((t) => t.id === txId);
    if (!txToDelete) return;

    if (!window.confirm(`ยืนยันการลบรายการ "${txToDelete.title}"?`)) {
      return;
    }

    let updatedDebts = debts;
    if (txToDelete.type === 'debt_payment' && txToDelete.debtId) {
      if (confirm('ต้องการคืนยอดหนี้คงเหลือที่ชำระไปในรายการนี้ด้วยหรือไม่?')) {
        updatedDebts = debts.map((d) =>
          d.id === txToDelete.debtId
            ? { ...d, currentBalance: d.currentBalance + txToDelete.amount }
            : d
        );
        setDebts(updatedDebts);
      }
    }

    const updatedTxs = transactions.filter((t) => t.id !== txId);
    setTransactions(updatedTxs);

    triggerAutoSync(updatedDebts, updatedTxs);
  };

  // Handlers for debts/tenants
  const handleSaveDebt = (debtData: Omit<DebtItem, 'id' | 'createdAt'>, editId?: string) => {
    if (editId) {
      const updatedDebts = debts.map((d) => (d.id === editId ? { ...d, ...debtData } : d));
      setDebts(updatedDebts);
      triggerAutoSync(updatedDebts, transactions);
    } else {
      const newDebt: DebtItem = {
        ...debtData,
        id: 'debt-' + Date.now(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updatedDebts = [...debts, newDebt];
      setDebts(updatedDebts);
      triggerAutoSync(updatedDebts, transactions);
    }
  };

  const handleDeleteDebt = (debtId: string) => {
    const debtToDelete = debts.find((d) => d.id === debtId);
    if (!debtToDelete) return;

    if (!window.confirm(`ยืนยันการลบข้อมูลลูกค้า "${debtToDelete.customerName || debtToDelete.name}"?`)) {
      return;
    }

    const updatedDebts = debts.filter((d) => d.id !== debtId);
    setDebts(updatedDebts);
    triggerAutoSync(updatedDebts, transactions);
  };

  // Import data handler from Google Sheet
  const handleImportData = (data: { tenants: DebtItem[]; transactions: Transaction[] }) => {
    if (data.tenants && data.tenants.length > 0) {
      setDebts(data.tenants);
    }
    if (data.transactions && data.transactions.length > 0) {
      setTransactions(data.transactions);
    }
  };

  // Open modals helper functions
  const openPayDebtModal = (debt?: DebtItem) => {
    setQuickAddType('debt_payment');
    setQuickAddDebtId(debt ? debt.id : undefined);
    setIsQuickAddOpen(true);
  };

  const openIncomeModal = () => {
    setQuickAddType('income');
    setQuickAddDebtId(undefined);
    setIsQuickAddOpen(true);
  };

  const openExpenseModal = () => {
    setQuickAddType('expense');
    setQuickAddDebtId(undefined);
    setIsQuickAddOpen(true);
  };

  const openAddDebtModal = () => {
    setDebtToEdit(null);
    setIsDebtModalOpen(true);
  };

  const openEditDebtModal = (debt: DebtItem) => {
    setDebtToEdit(debt);
    setIsDebtModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Container wrapper for centered mobile app preview on wider screens */}
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen flex flex-col shadow-2xl relative border-x border-slate-200">
        {/* Google Sheets Sync Banner */}
        <GoogleSheetsSyncBanner
          webAppUrl={webAppUrl}
          isSyncing={isSyncing}
          lastSyncTime={lastSyncTime}
          syncError={syncError}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          onManualSync={handleManualSync}
        />

        {/* App Header */}
        <Header
          totalCurrentDebt={totalCurrentDebt}
          totalOriginalDebt={totalOriginalDebt}
          onOpenAddPayment={() => openPayDebtModal()}
          onOpenAddDebt={openAddDebtModal}
        />

        {/* Main Content Area based on Active Tab */}
        <main className="flex-1 p-3">
          {!webAppUrl && (
            <div className="mb-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm text-xs text-emerald-950 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                  </svg>
                  บันทึกข้อมูลลง Google Sheets โดยไม่ต้องล็อกอิน
                </span>
                <button
                  onClick={() => setIsSyncModalOpen(true)}
                  className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold transition"
                >
                  เชื่อมต่อทันที
                </button>
              </div>
              <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                คุณสามารถเชื่อมต่อไฟล์ Google Sheet ส่วนตัวเพื่อบันทึกทุกยอดชำระเงินและข้อมูลผู้เช่าได้แบบเรียลไทม์ <strong>โดยไม่ต้องผ่านระบบล็อกอินหรือ Firebase</strong> เลี่ยงปัญหาติดบล็อกโดเมนใน Netlify และเบราว์เซอร์ LINE ได้ 100%!
              </p>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              debts={debts}
              transactions={transactions}
              onOpenAddPayment={() => openPayDebtModal()}
              onOpenAddPaymentWithDebt={(debt) => openPayDebtModal(debt)}
              onOpenAddDebt={openAddDebtModal}
              onOpenAddIncome={openIncomeModal}
              onOpenAddExpense={openExpenseModal}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'debts' && (
            <DebtList
              debts={debts}
              transactions={transactions}
              onOpenAddDebt={openAddDebtModal}
              onPayDebt={(debt) => openPayDebtModal(debt)}
              onEditDebt={openEditDebtModal}
              onDeleteDebt={handleDeleteDebt}
            />
          )}

          {activeTab === 'summary' && (
            <MonthlySummary
              transactions={transactions}
              debts={debts}
              onOpenAddPayment={() => openPayDebtModal()}
            />
          )}

          {activeTab === 'ai' && (
            <DebtPlanner
              debts={debts}
              transactions={transactions}
              onOpenAddPaymentWithDebt={(debt) => openPayDebtModal(debt)}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onOpenQuickAdd={() => openPayDebtModal()}
        />

        {/* Modals */}
        <QuickAddModal
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
          debts={debts}
          transactions={transactions}
          onAddTransaction={handleAddTransaction}
          initialType={quickAddType}
          initialDebtId={quickAddDebtId}
        />

        <DebtModal
          isOpen={isDebtModalOpen}
          onClose={() => setIsDebtModalOpen(false)}
          debtToEdit={debtToEdit}
          onSaveDebt={handleSaveDebt}
        />

        <GoogleSheetsDirectSyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          tenants={debts}
          transactions={transactions}
          webAppUrl={webAppUrl}
          setWebAppUrl={setWebAppUrl}
          onImportData={handleImportData}
        />
      </div>
    </div>
  );
}

