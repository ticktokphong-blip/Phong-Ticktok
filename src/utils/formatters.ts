import { DebtCategory, ExpenseCategory, IncomeCategory } from '../types';

export const formatBaht = (amount: number, showDecimals: boolean = false): string => {
  if (isNaN(amount) || amount === null) return '฿0';
  return '฿' + amount.toLocaleString('th-TH', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });
};

export const formatThaiDate = (dateString: string, shortMonth: boolean = true): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const thaiMonthsShort = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const thaiMonthsLong = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const day = date.getDate();
  const month = shortMonth ? thaiMonthsShort[date.getMonth()] : thaiMonthsLong[date.getMonth()];
  const thaiYear = date.getFullYear() + 543;

  return `${day} ${month} ${thaiYear}`;
};

export const formatThaiMonthYear = (yearMonthStr: string): string => {
  if (!yearMonthStr) return '';
  const [yearStr, monthStr] = yearMonthStr.split('-');
  const monthIndex = parseInt(monthStr, 10) - 1;
  const year = parseInt(yearStr, 10) + 543;

  const thaiMonthsLong = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  return `${thaiMonthsLong[monthIndex] || ''} พ.ศ. ${year}`;
};

export const DEBT_CATEGORIES: Record<DebtCategory, { label: string; color: string; bgColor: string }> = {
  room_rent: { label: 'ค่าเช่าห้องพัก / คอนโด', color: '#0284C7', bgColor: '#E0F2FE' },
  residential_rent: { label: 'ค่าเช่าบ้าน / อาคารอยู่อาศัย', color: '#0D9488', bgColor: '#CCFBF1' },
  commercial_rent: { label: 'ค่าเช่าร้าน / อาคารพาณิชย์', color: '#8B5CF6', bgColor: '#EDE9FE' },
  credit_card: { label: 'บัตรเครดิต', color: '#EF4444', bgColor: '#FEE2E2' },
  personal_loan: { label: 'สินเชื่อส่วนบุคคล', color: '#F59E0B', bgColor: '#FEF3C7' },
  home_loan: { label: 'สินเชื่อบ้าน/คอนโด', color: '#3B82F6', bgColor: '#DBEAFE' },
  auto_loan: { label: 'สินเชื่อรถยนต์/มอเตอร์ไซค์', color: '#10B981', bgColor: '#D1FAE5' },
  student_loan: { label: 'กู้ยืมเพื่อการศึกษา (กยศ.)', color: '#8B5CF6', bgColor: '#EDE9FE' },
  borrowed_friend: { label: 'ยืมเพื่อน/ญาติมิตร', color: '#EC4899', bgColor: '#FCE7F3' },
  informal: { label: 'หนี้นอกระบบ', color: '#DC2626', bgColor: '#FEE2E2' },
  other: { label: 'ค่าเช่า/สัญญาอื่นๆ', color: '#6B7280', bgColor: '#F3F4F6' },
};

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; color: string }> = {
  maintenance: { label: 'ค่าซ่อมบำรุง / ดูแลห้อง', color: '#F59E0B' },
  utilities: { label: 'ค่าน้ำ / ค่าไฟ / ส่วนกลาง', color: '#0284C7' },
  cleaning: { label: 'ค่าทำความสะอาด', color: '#10B981' },
  tax: { label: 'ภาษี / ค่าธรรมเนียม', color: '#EF4444' },
  food: { label: 'อาหาร & เครื่องดื่ม', color: '#F97316' },
  transport: { label: 'เดินทาง & ค่าน้ำมัน', color: '#06B6D4' },
  shopping: { label: 'ช้อปปิ้ง & ของใช้', color: '#EC4899' },
  entertainment: { label: 'บันเทิง & พักผ่อน', color: '#8B5CF6' },
  bills: { label: 'บิลค่าใช้จ่ายประจำ', color: '#6366F1' },
  health: { label: 'สุขภาพ & ยา', color: '#10B981' },
  education: { label: 'การศึกษา', color: '#F59E0B' },
  other: { label: 'อื่นๆ', color: '#6B7280' },
};

export const INCOME_CATEGORIES: Record<IncomeCategory, { label: string; color: string }> = {
  rent: { label: 'ค่าเช่ารับ (รายเดือน)', color: '#059669' },
  deposit: { label: 'เงินประกัน / มัดจำ', color: '#0284C7' },
  salary: { label: 'เงินเดือนประจำ', color: '#10B981' },
  freelance: { label: 'งานฟรีแลนซ์/เสริม', color: '#06B6D4' },
  business: { label: 'กำไรธุรกิจ', color: '#8B5CF6' },
  investment: { label: 'การลงทุน/ปันผล', color: '#3B82F6' },
  bonus: { label: 'โบนัส', color: '#F59E0B' },
  other: { label: 'รายรับอื่นๆ', color: '#6B7280' },
};

/**
 * คำนวณจำนวนวันที่เหลือก่อนถึงกำหนดชำระครบ
 */
export const getDaysRemaining = (targetDateStr: string): number => {
  if (!targetDateStr) return 0;
  const target = new Date(targetDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * คำนวณยอดผ่อนต่อเดือนที่ต้องจ่ายเพื่อให้หมดหนี้ตามกำหนด
 */
export const calculateRequiredMonthlyPayment = (
  currentBalance: number,
  targetDateStr: string,
  annualInterestRate: number = 0
): number => {
  if (currentBalance <= 0) return 0;
  const daysRemaining = getDaysRemaining(targetDateStr);
  const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30.4375));

  if (annualInterestRate === 0) {
    return Math.ceil(currentBalance / monthsRemaining);
  }

  // Simple PMT estimation formula with interest
  const r = annualInterestRate / 100 / 12;
  const n = monthsRemaining;
  const pmt = (currentBalance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  
  return isNaN(pmt) || !isFinite(pmt) ? Math.ceil(currentBalance / monthsRemaining) : Math.ceil(pmt);
};
