import { DebtItem, Transaction } from '../types';
import { formatBaht, formatThaiDate } from './formatters';

export interface TenantCalculatedStats {
  paidAmount: number;
  originalBalance: number;
  currentBalance: number;
  percentPaid: number;
  isPaidOff: boolean;
  paymentCount: number;
}

export interface PaymentInstallment {
  installmentNo: number;
  id: string;
  date: string;
  formattedDate: string;
  amount: number;
  formattedAmount: string;
  paymentMethod: string;
  notes: string;
  runningTotal: number;
}

export interface TenantPaymentBreakdown {
  debt: DebtItem;
  stats: TenantCalculatedStats;
  installments: PaymentInstallment[];
  monthsPaidCount: number;
  totalPaidAmount: number;
  remainingAmount: number;
  monthlyRent: number;
  summaryText: string;
}

/**
 * Calculates real-time total paid amount and current remaining balance
 * for a tenant/customer by aggregating debt_payment transactions.
 */
export function getTenantCalculatedStats(
  debt: DebtItem,
  transactions: Transaction[] = []
): TenantCalculatedStats {
  const customerNameClean = (debt.customerName || '').trim().toLowerCase();
  const nameClean = (debt.name || '').trim().toLowerCase();

  // Filter all debt_payment transactions for this customer
  const customerPayments = transactions.filter((tx) => {
    if (tx.type !== 'debt_payment') return false;

    // 1. Direct ID match
    if (tx.debtId && debt.id && tx.debtId === debt.id) return true;

    // 2. Debt name match
    const txDebtNameClean = (tx.debtName || '').trim().toLowerCase();
    if (txDebtNameClean) {
      if (txDebtNameClean === nameClean) return true;
      if (customerNameClean && txDebtNameClean === customerNameClean) return true;
    }

    // 3. Title match fallback
    const txTitleClean = (tx.title || '').trim().toLowerCase();
    if (customerNameClean && customerNameClean.length > 1 && txTitleClean.includes(customerNameClean)) return true;
    if (nameClean && nameClean.length > 1 && txTitleClean.includes(nameClean)) return true;

    return false;
  });

  // Calculate total paid amount from matching transactions
  const paidAmount = customerPayments.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  // Contract total original balance
  let originalBalance = Number(debt.originalBalance) || 0;

  // Fallback if originalBalance wasn't set or is less than paid amount
  if (originalBalance <= 0) {
    const rawCurrent = Number(debt.currentBalance) || 0;
    originalBalance = rawCurrent + paidAmount;
  }

  // Calculate remaining balance dynamically
  const currentBalance = Math.max(0, originalBalance - paidAmount);

  // Percentage paid calculation
  const percentPaid = originalBalance > 0
    ? Math.min(100, Math.round((paidAmount / originalBalance) * 100))
    : 100;

  const isPaidOff = currentBalance <= 0;

  return {
    paidAmount,
    originalBalance,
    currentBalance,
    percentPaid,
    isPaidOff,
    paymentCount: customerPayments.length,
  };
}

/**
 * Helper to get customer-specific payment transactions
 */
export function getTenantPayments(
  debt: DebtItem,
  transactions: Transaction[] = []
): Transaction[] {
  const customerNameClean = (debt.customerName || '').trim().toLowerCase();
  const nameClean = (debt.name || '').trim().toLowerCase();

  return transactions.filter((tx) => {
    if (tx.type !== 'debt_payment') return false;
    if (tx.debtId && debt.id && tx.debtId === debt.id) return true;

    const txDebtNameClean = (tx.debtName || '').trim().toLowerCase();
    if (txDebtNameClean) {
      if (txDebtNameClean === nameClean) return true;
      if (customerNameClean && txDebtNameClean === customerNameClean) return true;
    }

    const txTitleClean = (tx.title || '').trim().toLowerCase();
    if (customerNameClean && customerNameClean.length > 1 && txTitleClean.includes(customerNameClean)) return true;
    if (nameClean && nameClean.length > 1 && txTitleClean.includes(nameClean)) return true;

    return false;
  });
}

/**
 * Generates structured installment breakdown and text summary for a tenant
 */
export function getTenantPaymentBreakdown(
  debt: DebtItem,
  transactions: Transaction[] = []
): TenantPaymentBreakdown {
  const stats = getTenantCalculatedStats(debt, transactions);
  const rawPayments = getTenantPayments(debt, transactions);

  // Sort chronologically (oldest first) to assign installment numbers 1, 2, 3...
  const sortedPayments = [...rawPayments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let runningTotal = 0;
  const installments: PaymentInstallment[] = sortedPayments.map((pmt, idx) => {
    runningTotal += Number(pmt.amount) || 0;
    return {
      installmentNo: idx + 1,
      id: pmt.id,
      date: pmt.date,
      formattedDate: formatThaiDate(pmt.date),
      amount: Number(pmt.amount) || 0,
      formattedAmount: formatBaht(pmt.amount),
      paymentMethod: pmt.paymentMethod || 'โอนเงิน',
      notes: pmt.notes || '',
      runningTotal,
    };
  });

  const tenantName = debt.customerName || debt.name;
  const roomText = debt.roomNo ? ` (ห้อง ${debt.roomNo})` : '';

  // Generate text for sharing/copying
  let summaryText = `📋 สรุปประวัติการชำระค่าเช่า\n`;
  summaryText += `👤 ผู้เช่า: ${tenantName}${roomText}\n`;
  summaryText += `📊 จำนวนงวดที่ชำระแล้ว: ${installments.length} งวด (${installments.length} เดือน)\n`;
  summaryText += `💰 ยอดรวมชำระแล้วสะสม: ${formatBaht(stats.paidAmount)}\n`;
  summaryText += `🏢 ยอดสัญญารวม: ${formatBaht(stats.originalBalance)}\n`;
  summaryText += `📌 ยอดคงเหลือค้างชำระ: ${formatBaht(stats.currentBalance)}\n`;

  if (installments.length > 0) {
    summaryText += `\nรายละเอียดการรับชำระแต่ละงวด:\n`;
    installments.forEach((inst) => {
      summaryText += `• งวดที่ ${inst.installmentNo} (${inst.formattedDate}): ${inst.formattedAmount} [${inst.paymentMethod}]\n`;
    });
  } else {
    summaryText += `\nยังไม่มีรายการชำระเงินในระบบ\n`;
  }

  summaryText += `\nขอบคุณครับ/ค่ะ 🙏`;

  return {
    debt,
    stats,
    installments,
    monthsPaidCount: installments.length,
    totalPaidAmount: stats.paidAmount,
    remainingAmount: stats.currentBalance,
    monthlyRent: debt.minPayment,
    summaryText,
  };
}

