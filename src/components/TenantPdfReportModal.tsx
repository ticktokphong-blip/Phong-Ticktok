import React, { useRef, useState } from 'react';
import { X, Download, Printer, FileText, Check, AlertCircle, Building2, User, Phone, Calendar, ShieldCheck } from 'lucide-react';
import { DebtItem, Transaction } from '../types';
import { formatBaht, formatThaiDate } from '../utils/formatters';
import { getTenantPaymentBreakdown } from '../utils/debtCalculations';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TenantPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: DebtItem | null;
  transactions: Transaction[];
}

export const TenantPdfReportModal: React.FC<TenantPdfReportModalProps> = ({
  isOpen,
  onClose,
  debt,
  transactions,
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !debt) return null;

  const breakdown = getTenantPaymentBreakdown(debt, transactions);
  const tenantName = debt.customerName || debt.name;
  const roomText = debt.roomNo ? `ห้อง ${debt.roomNo}` : 'ไม่ระบุห้อง';
  const todayDate = formatThaiDate(new Date().toISOString().split('T')[0]);

  // Handle HTML to PDF generation
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    try {
      setIsGenerating(true);
      setDownloadSuccess(false);

      const element = reportRef.current;
      
      // Render HTML element to high-res canvas
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution image
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');

      // Create PDF document (A4 portrait)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Handle multi-page if content is long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Save PDF file
      const fileName = `รายงานชำระเงิน_${tenantName.replace(/\s+/g, '_')}_${debt.roomNo || 'ห้อง'}.pdf`;
      pdf.save(fileName);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle direct window print
  const handlePrint = () => {
    if (!reportRef.current) return;
    const printContent = reportRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('กรุณะอนุญาตให้เปิด Pop-up เพื่อพิมพ์รายงาน');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>รายงานประวัติการชำระเงิน - ${tenantName}</title>
          <meta charset="utf-8" />
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Sarabun', 'Prompt', sans-serif; background: white; padding: 20px; color: #0f172a; }
            @page { size: A4; margin: 10mm; }
          </style>
        </head>
        <body>
          <div>${printContent}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Modal Top Bar */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-sm text-slate-100">
              รายงานประวัติการชำระเงิน PDF ({tenantName})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-600 font-medium hidden sm:block">
            เอกสารทางการความละเอียดสูง พร้อมพิมพ์/ดาวน์โหลด
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>พิมพ์เอกสาร</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-md active:scale-95 text-white ${
                downloadSuccess
                  ? 'bg-emerald-700'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              } disabled:opacity-50`}
            >
              {isGenerating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังสร้าง PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>ดาวน์โหลด PDF แล้ว</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Printable Report View Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100">
          
          {/* Printable Element Ref */}
          <div
            ref={reportRef}
            className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm text-slate-900 font-sans max-w-xl mx-auto space-y-6"
            style={{ fontFamily: "'Prompt', 'Sarabun', sans-serif" }}
          >
            {/* 1. Header Block */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                  <Building2 className="w-5 h-5" />
                  <span>ระบบบริหารจัดการอาคารและค่าเช่า</span>
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 mt-1">
                  รายงานสรุปประวัติการชำระเงินค่าเช่า
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  RENT & DEBT PAYMENT STATEMENT REPORT
                </p>
              </div>

              <div className="text-right text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-block">
                  เลขที่เอกสาร: REP-{debt.id.replace('debt-', '').slice(-6).toUpperCase()}
                </p>
                <p>วันที่ออกรายงาน: <strong className="text-slate-800">{todayDate}</strong></p>
              </div>
            </div>

            {/* 2. Tenant Profile & Contract Info */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                  ข้อมูลผู้เช่า / ลูกค้า
                </span>
                <p className="font-bold text-slate-900 text-sm">{tenantName}</p>
                <p className="text-slate-600 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>หมายเลขห้อง: <strong className="text-slate-900">{roomText}</strong></span>
                </p>
                {debt.phone && (
                  <p className="text-slate-600 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>เบอร์โทรศัพท์: {debt.phone}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1 text-right sm:text-left border-l border-slate-200 pl-3">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                  รายละเอียดสัญญา
                </span>
                <p className="text-slate-600">
                  ค่าเช่าต่อเดือน: <strong className="text-emerald-700 font-bold">{formatBaht(debt.minPayment)}</strong>
                </p>
                <p className="text-slate-600">
                  วันเริ่มสัญญา: {debt.startDate ? formatThaiDate(debt.startDate) : 'ไม่ระบุ'}
                </p>
                <p className="text-slate-600">
                  วันสิ้นสุด/กำหนดชำระ: {debt.targetPayoffDate ? formatThaiDate(debt.targetPayoffDate) : 'ไม่ระบุ'}
                </p>
              </div>
            </div>

            {/* 3. Financial Summary Metrics Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <p className="text-[10px] text-slate-500 font-semibold">มูลค่าสัญญารวม</p>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {formatBaht(breakdown.stats.originalBalance)}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <p className="text-[10px] text-emerald-800 font-semibold">ยอดชำระแล้วสะสม</p>
                <p className="text-sm font-extrabold text-emerald-700 mt-0.5">
                  {formatBaht(breakdown.stats.paidAmount)}
                </p>
                <p className="text-[9px] text-emerald-600 font-bold mt-0.5">
                  ({breakdown.monthsPaidCount} งวด / เดือน)
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                <p className="text-[10px] text-amber-800 font-semibold">ยอดคงเหลือค้างชำระ</p>
                <p className="text-sm font-extrabold text-amber-800 mt-0.5">
                  {formatBaht(breakdown.stats.currentBalance)}
                </p>
                <p className="text-[9px] text-amber-700 font-bold mt-0.5">
                  {breakdown.stats.isPaidOff ? 'ชำระครบถ้วนแล้ว' : `คงเหลือ ${100 - breakdown.stats.percentPaid}%`}
                </p>
              </div>
            </div>

            {/* 4. Payment History Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  ตารางประวัติรายการรับชำระเงิน ({breakdown.installments.length} รายการ)
                </h3>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px]">
                      <th className="py-2 px-2.5 text-center font-semibold w-12">งวดที่</th>
                      <th className="py-2 px-2.5 font-semibold">วันที่รับชำระ</th>
                      <th className="py-2 px-2.5 font-semibold">ช่องทาง</th>
                      <th className="py-2 px-2.5 text-right font-semibold">จำนวนเงิน (บาท)</th>
                      <th className="py-2 px-2.5 text-right font-semibold">ยอดรวมสะสม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {breakdown.installments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                          ยังไม่มีประวัติการรับชำระเงินในระบบ
                        </td>
                      </tr>
                    ) : (
                      breakdown.installments.map((inst, index) => (
                        <tr key={inst.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="py-2 px-2.5 text-center font-bold text-slate-700">
                            {inst.installmentNo}
                          </td>
                          <td className="py-2 px-2.5 font-medium">
                            {inst.formattedDate}
                          </td>
                          <td className="py-2 px-2.5 text-slate-600 text-[11px]">
                            {inst.paymentMethod}
                            {inst.notes && <span className="block text-[10px] text-slate-400 italic">"{inst.notes}"</span>}
                          </td>
                          <td className="py-2 px-2.5 text-right font-extrabold text-emerald-700">
                            {inst.formattedAmount}
                          </td>
                          <td className="py-2 px-2.5 text-right font-semibold text-slate-700">
                            {formatBaht(inst.runningTotal)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {breakdown.installments.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                        <td colSpan={3} className="py-2.5 px-2.5 text-right">
                          รวมยอดรับชำระเงินทั้งหมด:
                        </td>
                        <td className="py-2.5 px-2.5 text-right text-emerald-800 text-sm">
                          {formatBaht(breakdown.stats.paidAmount)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right text-slate-600">
                          -
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* 5. Official Signatures Block */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-center text-slate-700">
              <div className="space-y-6">
                <p className="text-slate-500 font-medium">ลงชื่อ..........................................................</p>
                <div>
                  <p className="font-bold text-slate-900">(..........................................................)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">ผู้รับเงิน / ผู้จัดการอาคาร</p>
                  <p className="text-[10px] text-slate-400">วันที่ .......... / .......... / ............</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-slate-500 font-medium">ลงชื่อ..........................................................</p>
                <div>
                  <p className="font-bold text-slate-900">({tenantName})</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">ผู้เช่า / ผู้รับทราบเอกสาร</p>
                  <p className="text-[10px] text-slate-400">วันที่ .......... / .......... / ............</p>
                </div>
              </div>
            </div>

            {/* Document Footer Note */}
            <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
              เอกสารฉบับนี้ถูกสร้างขึ้นจากระบบบริหารจัดการค่าเช่าอัตโนมัติ ออก ณ วันที่ {todayDate}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
