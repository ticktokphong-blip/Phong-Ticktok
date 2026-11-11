export type DebtCategory =
  | 'residential_rent'
  | 'commercial_rent'
  | 'room_rent'
  | 'credit_card'
  | 'personal_loan'
  | 'home_loan'
  | 'auto_loan'
  | 'student_loan'
  | 'borrowed_friend'
  | 'informal'
  | 'other';

export type TransactionType = 'debt_payment' | 'income' | 'expense';

export type ExpenseCategory =
  | 'maintenance'
  | 'utilities'
  | 'cleaning'
  | 'tax'
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'bills'
  | 'health'
  | 'education'
  | 'other';

export type IncomeCategory =
  | 'rent'
  | 'deposit'
  | 'salary'
  | 'freelance'
  | 'business'
  | 'investment'
  | 'bonus'
  | 'other';

export interface DebtItem {
  id: string;
  name: string;                // ชื่อลูกค้า / ชื่อรายการค่าเช่า
  customerName?: string;       // ชื่อลูกค้า (แยกชัดเจน)
  roomNo?: string;             // เลขห้อง / สถานที่เช่า
  phone?: string;              // เบอร์โทรศัพท์ลูกค้า
  category: DebtCategory;
  originalBalance: number;    // ยอดค่าเช่ารวมสัญญา / ยอดตั้งต้น
  currentBalance: number;     // ยอดคงเหลือปัจจุบันที่ต้องชำระ
  totalPaid?: number;         // ยอดที่ชำระไปแล้วสะสม
  interestRate: number;       // ดอกเบี้ย / ค่าปรับชำระล่าช้า (% ต่อปี)
  minPayment: number;         // ยอดส่งรายเดือน / ค่าเช่าต่อเดือน
  monthlyDueDate?: number;    // วันกำหนดชำระรายเดือน (เช่น ทุกวันที่ 5)
  targetPayoffDate: string;   // กำหนดวันที่ชำระครบ (YYYY-MM-DD)
  color?: string;
  createdAt: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;               // YYYY-MM-DD
  title: string;
  debtId?: string;            // ระบุลูกค้า/รายการค่าเช่า
  debtName?: string;
  previousBalance?: number;   // ยอดคงเหลือก่อนชำระ
  newBalance?: number;        // ยอดคงเหลือหลังชำระ
  category: string;
  notes?: string;
  paymentMethod?: string;     // e.g., โอนเงินผ่านธนาคาร, เงินสด
}

export interface DebtCategoryInfo {
  id: DebtCategory;
  label: string;
  iconName: string;
  color: string;
}

export interface MonthlySummaryData {
  yearMonth: string;          // YYYY-MM
  totalIncome: number;
  totalExpense: number;       // รายจ่ายทั่วไป
  totalDebtPaid: number;      // ยอดชำระค่าเช่า/หนี้สิน
  netSavings: number;         // คงเหลือสุทธิ
  debtPaidCount: number;
}
