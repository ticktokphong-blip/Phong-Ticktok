import { DebtItem, Transaction } from '../types';

export const SPREADSHEET_ID = '1NHUiqP4TAeWqNnk6REBYOQBUidK7QTS76xrN9yOEMEg';
export const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;

const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;

export interface SheetFetchResult {
  tenants: DebtItem[];
  transactions: Transaction[];
  sheetTitles: string[];
}

/**
 * Fetch spreadsheet metadata to inspect sheet names
 */
export async function getSpreadsheetDetails(accessToken: string) {
  const res = await fetch(BASE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Google Sheet details (${res.status})`);
  }
  const data = await res.json();
  const sheets: { title: string; sheetId: number }[] = data.sheets.map((s: any) => ({
    title: s.properties.title,
    sheetId: s.properties.sheetId,
  }));
  return sheets;
}

/**
 * Create missing sheet tabs (e.g., "Tenants", "Transactions")
 */
export async function ensureSheetTabsExist(accessToken: string, requiredTabs: string[]) {
  const existingSheets = await getSpreadsheetDetails(accessToken);
  const existingTitles = existingSheets.map((s) => s.title);

  const missingTabs = requiredTabs.filter((tab) => !existingTitles.includes(tab));

  if (missingTabs.length > 0) {
    const requests = missingTabs.map((title) => ({
      addSheet: {
        properties: { title },
      },
    }));

    await fetch(`${BASE_URL}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });
  }
}

/**
 * Read Tenants / Debt accounts from Google Sheets
 */
export async function fetchTenantsFromSheet(accessToken: string, tabName: string = 'Tenants'): Promise<DebtItem[]> {
  const range = encodeURIComponent(`${tabName}!A1:Z500`);
  const res = await fetch(`${BASE_URL}/values/${range}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];

  if (rows.length <= 1) {
    return [];
  }

  // Row 0 is headers, data starts from index 1
  const tenants: DebtItem[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue; // Skip empty rows

    tenants.push({
      id: r[0] || `debt-${Date.now()}-${i}`,
      name: r[1] || 'ไม่ระบุชื่อ',
      customerName: r[2] || r[1] || '',
      roomNo: r[3] || '',
      phone: r[4] || '',
      category: (r[5] as any) || 'room_rent',
      originalBalance: parseFloat(r[6]) || 0,
      currentBalance: parseFloat(r[7]) || 0,
      totalPaid: parseFloat(r[8]) || 0,
      minPayment: parseFloat(r[9]) || 0,
      monthlyDueDate: parseInt(r[10]) || 5,
      targetPayoffDate: r[11] || new Date().toISOString().split('T')[0],
      notes: r[12] || '',
      createdAt: r[13] || new Date().toISOString().split('T')[0],
      interestRate: 0,
      color: '#0284C7',
    });
  }

  return tenants;
}

/**
 * Read Transactions from Google Sheets
 */
export async function fetchTransactionsFromSheet(accessToken: string, tabName: string = 'Transactions'): Promise<Transaction[]> {
  const range = encodeURIComponent(`${tabName}!A1:Z1000`);
  const res = await fetch(`${BASE_URL}/values/${range}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];

  if (rows.length <= 1) {
    return [];
  }

  const transactions: Transaction[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;

    transactions.push({
      id: r[0] || `tx-${Date.now()}-${i}`,
      type: (r[1] as any) || 'debt_payment',
      amount: parseFloat(r[2]) || 0,
      date: r[3] || new Date().toISOString().split('T')[0],
      title: r[4] || 'รายการ',
      debtId: r[5] || undefined,
      debtName: r[6] || undefined,
      previousBalance: r[7] ? parseFloat(r[7]) : undefined,
      newBalance: r[8] ? parseFloat(r[8]) : undefined,
      category: r[9] || 'room_rent',
      paymentMethod: r[10] || 'โอนเงินผ่านธนาคาร',
      notes: r[11] || '',
    });
  }

  return transactions;
}

/**
 * Save / Overwrite Tenants to Google Sheets
 */
export async function saveTenantsToSheet(accessToken: string, tenants: DebtItem[], tabName: string = 'Tenants') {
  const headers = [
    'ID',
    'Name',
    'CustomerName',
    'RoomNo',
    'Phone',
    'Category',
    'OriginalBalance',
    'CurrentBalance',
    'TotalPaid',
    'MinPayment',
    'MonthlyDueDate',
    'TargetPayoffDate',
    'Notes',
    'CreatedAt',
  ];

  const valueRows = tenants.map((t) => [
    t.id,
    t.name,
    t.customerName || '',
    t.roomNo || '',
    t.phone || '',
    t.category,
    t.originalBalance.toString(),
    t.currentBalance.toString(),
    (t.totalPaid || 0).toString(),
    t.minPayment.toString(),
    (t.monthlyDueDate || 5).toString(),
    t.targetPayoffDate || '',
    t.notes || '',
    t.createdAt || new Date().toISOString().split('T')[0],
  ]);

  const allValues = [headers, ...valueRows];

  // Clear sheet first
  await fetch(`${BASE_URL}/values/${encodeURIComponent(tabName + '!A1:Z500')}:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // Write new values
  await fetch(`${BASE_URL}/values/${encodeURIComponent(tabName + '!A1')}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: allValues,
    }),
  });
}

/**
 * Save / Overwrite Transactions to Google Sheets
 */
export async function saveTransactionsToSheet(accessToken: string, transactions: Transaction[], tabName: string = 'Transactions') {
  const headers = [
    'ID',
    'Type',
    'Amount',
    'Date',
    'Title',
    'DebtId',
    'DebtName',
    'PreviousBalance',
    'NewBalance',
    'Category',
    'PaymentMethod',
    'Notes',
  ];

  const valueRows = transactions.map((tx) => [
    tx.id,
    tx.type,
    tx.amount.toString(),
    tx.date,
    tx.title,
    tx.debtId || '',
    tx.debtName || '',
    tx.previousBalance !== undefined ? tx.previousBalance.toString() : '',
    tx.newBalance !== undefined ? tx.newBalance.toString() : '',
    tx.category,
    tx.paymentMethod || '',
    tx.notes || '',
  ]);

  const allValues = [headers, ...valueRows];

  // Clear sheet first
  await fetch(`${BASE_URL}/values/${encodeURIComponent(tabName + '!A1:Z1000')}:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // Write new values
  await fetch(`${BASE_URL}/values/${encodeURIComponent(tabName + '!A1')}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: allValues,
    }),
  });
}

/**
 * Sync data using Google Apps Script Web App URL (100% No Login Required!)
 */
export async function syncWithAppsScriptWebApp(
  webAppUrl: string,
  tenants: DebtItem[],
  transactions: Transaction[]
): Promise<{ success: boolean; message?: string }> {
  try {
    const cleanUrl = webAppUrl.trim();
    if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
      throw new Error('URL ไม่ถูกต้อง ต้องขึ้นต้นด้วย https://script.google.com/macros/s/...');
    }

    const payload = {
      action: 'sync_all',
      tenants,
      transactions,
    };

    // Google Apps Script requires no-cors or standard text output
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      // Ignore if response is redirect or opaque text
    }

    if (data.status === 'error') {
      throw new Error(data.message || 'ส่งข้อมูลไม่สำเร็จ');
    }

    return { success: true };
  } catch (err: any) {
    console.error('Apps Script Sync Error:', err);
    throw new Error(err.message || 'ไม่สามารถเชื่อมต่อกับ Google Apps Script Web App ได้');
  }
}

/**
 * Fetch data from Google Apps Script Web App URL
 */
export async function fetchFromAppsScriptWebApp(
  webAppUrl: string
): Promise<{ tenants: DebtItem[]; transactions: Transaction[] }> {
  const cleanUrl = webAppUrl.trim();
  if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
    throw new Error('URL ไม่ถูกต้อง ต้องขึ้นต้นด้วย https://script.google.com/macros/s/...');
  }

  const res = await fetch(cleanUrl, { method: 'GET' });
  const text = await res.text();
  const data = JSON.parse(text);

  if (data.status === 'error') {
    throw new Error(data.message || 'ดึงข้อมูลไม่สำเร็จ');
  }

  return {
    tenants: data.tenants || [],
    transactions: data.transactions || [],
  };
}

export const GOOGLE_APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var contents = JSON.parse(e.postData.contents);
    
    if (contents.tenants) {
      var tenantSheet = sheet.getSheetByName("Tenants") || sheet.insertSheet("Tenants");
      tenantSheet.clear();
      tenantSheet.appendRow(["ID", "Name", "CustomerName", "RoomNo", "Phone", "Category", "OriginalBalance", "CurrentBalance", "TotalPaid", "MinPayment", "MonthlyDueDate", "TargetPayoffDate", "Notes", "CreatedAt"]);
      contents.tenants.forEach(function(t) {
        tenantSheet.appendRow([t.id, t.name, t.customerName||"", t.roomNo||"", t.phone||"", t.category, t.originalBalance, t.currentBalance, t.totalPaid||0, t.minPayment, t.monthlyDueDate||5, t.targetPayoffDate||"", t.notes||"", t.createdAt||""]);
      });
    }

    if (contents.transactions) {
      var txSheet = sheet.getSheetByName("Transactions") || sheet.insertSheet("Transactions");
      txSheet.clear();
      txSheet.appendRow(["ID", "Type", "Amount", "Date", "Title", "DebtId", "DebtName", "PreviousBalance", "NewBalance", "Category", "PaymentMethod", "Notes"]);
      contents.transactions.forEach(function(tx) {
        txSheet.appendRow([tx.id, tx.type, tx.amount, tx.date, tx.title, tx.debtId||"", tx.debtName||"", tx.previousBalance||"", tx.newBalance||"", tx.category, tx.paymentMethod||"", tx.notes||""]);
      });
    }

    return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var tenantSheet = sheet.getSheetByName("Tenants");
    var txSheet = sheet.getSheetByName("Transactions");
    
    var tenants = [];
    if (tenantSheet) {
      var tData = tenantSheet.getDataRange().getValues();
      for (var i = 1; i < tData.length; i++) {
        var r = tData[i];
        if (r[0]) {
          tenants.push({
            id: String(r[0]),
            name: String(r[1] || ''),
            customerName: String(r[2] || r[1] || ''),
            roomNo: String(r[3] || ''),
            phone: String(r[4] || ''),
            category: String(r[5] || 'room_rent'),
            originalBalance: Number(r[6]) || 0,
            currentBalance: Number(r[7]) || 0,
            totalPaid: Number(r[8]) || 0,
            minPayment: Number(r[9]) || 0,
            monthlyDueDate: Number(r[10]) || 5,
            targetPayoffDate: String(r[11] || ''),
            notes: String(r[12] || ''),
            createdAt: String(r[13] || '')
          });
        }
      }
    }

    var transactions = [];
    if (txSheet) {
      var xData = txSheet.getDataRange().getValues();
      for (var j = 1; j < xData.length; j++) {
        var r = xData[j];
        if (r[0]) {
          transactions.push({
            id: String(r[0]),
            type: String(r[1] || 'debt_payment'),
            amount: Number(r[2]) || 0,
            date: String(r[3] || ''),
            title: String(r[4] || ''),
            debtId: String(r[5] || ''),
            debtName: String(r[6] || ''),
            previousBalance: r[7] !== "" ? Number(r[7]) : undefined,
            newBalance: r[8] !== "" ? Number(r[8]) : undefined,
            category: String(r[9] || 'room_rent'),
            paymentMethod: String(r[10] || ''),
            notes: String(r[11] || '')
          });
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({status: "success", tenants: tenants, transactions: transactions})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`;

