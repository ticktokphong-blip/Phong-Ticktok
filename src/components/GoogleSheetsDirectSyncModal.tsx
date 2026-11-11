import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, Copy, Check, Link2, RefreshCw, HelpCircle, ExternalLink, Download, Upload, ShieldCheck, Zap } from 'lucide-react';
import { DebtItem, Transaction } from '../types';
import { GOOGLE_APPS_SCRIPT_CODE, syncWithAppsScriptWebApp, fetchFromAppsScriptWebApp } from '../lib/googleSheets';

interface GoogleSheetsDirectSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: DebtItem[];
  transactions: Transaction[];
  webAppUrl: string;
  setWebAppUrl: (url: string) => void;
  onImportData: (data: { tenants: DebtItem[]; transactions: Transaction[] }) => void;
}

export const GoogleSheetsDirectSyncModal: React.FC<GoogleSheetsDirectSyncModalProps> = ({
  isOpen,
  onClose,
  tenants,
  transactions,
  webAppUrl,
  setWebAppUrl,
  onImportData,
}) => {
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>(webAppUrl);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  useEffect(() => {
    setUrlInput(webAppUrl);
  }, [webAppUrl]);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleSaveAndSync = async () => {
    const clean = urlInput.trim();
    if (!clean) {
      setStatusMessage({ type: 'error', text: 'กรุณากรอก URL ของ Google Apps Script Web App' });
      return;
    }
    if (!clean.startsWith('https://script.google.com/macros/s/')) {
      setStatusMessage({ type: 'error', text: 'URL ไม่ถูกต้อง ต้องขึ้นต้นด้วย https://script.google.com/macros/s/...' });
      return;
    }

    try {
      setIsTesting(true);
      setStatusMessage(null);

      // Save URL to localStorage
      localStorage.setItem('apps_script_web_app_url', clean);
      setWebAppUrl(clean);

      // Trigger sync
      await syncWithAppsScriptWebApp(clean, tenants, transactions);

      setStatusMessage({ type: 'success', text: 'เชื่อมต่อและบันทึกข้อมูลลง Google Sheet สำเร็จเรียบร้อย!' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบ URL และการอนุญาตสิทธิ์' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFetchFromSheet = async () => {
    const clean = urlInput.trim();
    if (!clean) return;

    try {
      setIsTesting(true);
      setStatusMessage(null);
      const data = await fetchFromAppsScriptWebApp(clean);
      if (data.tenants.length > 0 || data.transactions.length > 0) {
        onImportData(data);
        setStatusMessage({ type: 'success', text: `ดึงข้อมูลจาก Google Sheet สำเร็จ (${data.tenants.length} ผู้เช่า, ${data.transactions.length} รายการ)` });
      } else {
        setStatusMessage({ type: 'error', text: 'ไม่พบข้อมูลใน Google Sheet หรือตารางยังว่างอยู่' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'ดึงข้อมูลจากชีทไม่สำเร็จ' });
    } finally {
      setIsTesting(false);
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      tenants,
      transactions,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_rent_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCsv = () => {
    let csv = '\uFEFF'; // UTF-8 BOM for Excel Thai language support
    csv += '=== รายชื่อผู้เช่า ===\n';
    csv += 'ID,ชื่อ,ชื่อห้อง/ลูกค้า,เลขห้อง,เบอร์โทร,ยอดสัญญารวม,ยอดคงเหลือ,ชำระแล้ว,ค่าเช่าต่อเดือน\n';
    tenants.forEach((t) => {
      csv += `"${t.id}","${t.name}","${t.customerName || ''}","${t.roomNo || ''}","${t.phone || ''}",${t.originalBalance},${t.currentBalance},${t.totalPaid || 0},${t.minPayment}\n`;
    });

    csv += '\n=== ประวัติการชำระเงิน ===\n';
    csv += 'ID,ประเภท,จำนวนเงิน,วันที่,รายการ,ผู้เช่า,ช่องทางชำระ,หมายเหตุ\n';
    transactions.forEach((tx) => {
      csv += `"${tx.id}","${tx.type}",${tx.amount},"${tx.date}","${tx.title}","${tx.debtName || ''}","${tx.paymentMethod || ''}","${tx.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายงานค่าเช่า_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-200 text-slate-900 text-xs">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <span>เชื่อมต่อ Google Sheets ไม่ต้องใช้อยู่ในระบบ (No Login)</span>
              </h2>
              <p className="text-[10px] text-slate-400">
                ส่งข้อมูลตรงเข้า Google Sheets ของคุณได้เลย 100% ไม่ติดปัญหาโดเมน/ล็อกอิน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Web App URL Input Section */}
          <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>วาง Web App URL ของ Google Sheets คุณ:</span>
              </label>
              {webAppUrl && (
                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                  เชื่อมต่อแล้ว
                </span>
              )}
            </div>

            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={handleFetchFromSheet}
                disabled={isTesting || !urlInput.trim()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition border border-slate-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>ดึงข้อมูลจาก Google Sheet</span>
              </button>

              <button
                onClick={handleSaveAndSync}
                disabled={isTesting || !urlInput.trim()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                {isTesting ? (
                  <span>กำลังทดสอบ...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>บันทึก & ซิงค์ทันที</span>
                  </>
                )}
              </button>
            </div>

            {statusMessage && (
              <div
                className={`p-2 rounded-lg text-[11px] font-medium border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}
              >
                {statusMessage.text}
              </div>
            )}
          </div>

          {/* Toggle Instructions Button */}
          <div className="border-t border-slate-200 pt-3 space-y-2">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-between transition"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-sky-600" />
                <span>วิธีเอา Web App URL จาก Google Sheets (ทำเพียงครั้งเดียว 2 นาที)</span>
              </span>
              <span className="text-xs text-sky-700 underline">
                {showInstructions ? 'ซ่อนคำแนะนำ' : 'ดูวิธีทำ'}
              </span>
            </button>

            {showInstructions && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 text-slate-700">
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                  <li>
                    เปิด Google Sheet ของคุณ แล้วไปที่เมนู <strong>ส่วนขยาย (Extensions)</strong> &gt; <strong>Apps Script</strong>
                  </li>
                  <li>
                    ลบโค้ดเดิมออก แล้วกดปุ่มคัดลอกโค้ดด้านล่างนี้ไปวาง:
                    <div className="mt-1 flex items-center justify-between gap-2 bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[10px]">
                      <span>โค้ดเชื่อมต่อ Google Sheets อัตโนมัติ</span>
                      <button
                        onClick={handleCopyCode}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-sans text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}</span>
                      </button>
                    </div>
                  </li>
                  <li>
                    กดปุ่ม <strong>ทําการใช้อุปกรณ์ (Deploy)</strong> มุมขวาบน &gt; เลือก <strong>การทําการใช้งานใหม่ (New deployment)</strong>
                  </li>
                  <li>
                    เลือกประเภทเป็น <strong>เว็บแอป (Web App)</strong> แล้วตั้งค่าดังนี้:
                    <ul className="list-disc list-inside ml-4 text-[11px] text-slate-600 mt-1 space-y-0.5">
                      <li>สิทธิ์การเรียกใช้ (Execute as): <strong>ฉัน (Me)</strong></li>
                      <li>ผู้ที่มีสิทธิ์เข้าถึง (Who has access): <strong>ทุกคน (Anyone)</strong></li>
                    </ul>
                  </li>
                  <li>
                    กดปุ่ม <strong>Deploy</strong> จากนั้นคัดลอก <strong>Web App URL</strong> นำมาวางในช่องด้านบนแล้วกดบันทึกได้เลย!
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Backup / Export Options */}
          <div className="border-t border-slate-200 pt-3 space-y-2">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Download className="w-4 h-4 text-slate-600" />
              <span>ดาวน์โหลดไฟล์สำรองข้อมูล (CSV / Excel / JSON)</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportCsv}
                className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>ดาวน์โหลดไฟล์ Excel / CSV</span>
              </button>

              <button
                onClick={handleExportBackup}
                className="py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-xl border border-sky-200 flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-4 h-4 text-sky-600" />
                <span>สำรองข้อมูลแบบ JSON</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
