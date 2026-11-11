import React from 'react';
import { FileSpreadsheet, RefreshCw, AlertCircle, Link2, Download, Zap } from 'lucide-react';

interface GoogleSheetsSyncBannerProps {
  webAppUrl: string;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
  onOpenSyncModal: () => void;
  onManualSync: () => void;
}

export const GoogleSheetsSyncBanner: React.FC<GoogleSheetsSyncBannerProps> = ({
  webAppUrl,
  isSyncing,
  lastSyncTime,
  syncError,
  onOpenSyncModal,
  onManualSync,
}) => {
  const isConnected = Boolean(webAppUrl && webAppUrl.trim().length > 0);

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 px-3 py-2 text-xs">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 overflow-hidden">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate">
            {isConnected ? (
              <div className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                <span className="font-medium text-emerald-300">ซิงค์ Google Sheets (No Login)</span>
                {lastSyncTime && (
                  <span className="text-[10px] text-slate-400 font-mono">({lastSyncTime})</span>
                )}
              </div>
            ) : (
              <div className="text-slate-300 font-medium truncate flex items-center gap-1">
                <span>บันทึกลง Google Sheets</span>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.2 rounded font-semibold">ไม่ต้องล็อกอิน</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {isConnected && (
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="px-2 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition disabled:opacity-50 active:scale-95"
              title="กดเพื่อส่งข้อมูลล่าสุดไปบันทึกที่ Google Sheet"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังบันทึก...' : 'ซิงค์ข้อมูล'}</span>
            </button>
          )}

          <button
            onClick={onOpenSyncModal}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition active:scale-95 ${
              isConnected
                ? 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isConnected ? 'ตั้งค่า Google Sheet' : 'เชื่อมต่อ Google Sheet'}</span>
          </button>
        </div>
      </div>

      {syncError && (
        <div className="mt-1.5 max-w-md mx-auto text-[10px] text-rose-300 bg-rose-950/60 p-1.5 rounded-lg border border-rose-800/50 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
          <span className="truncate">{syncError}</span>
        </div>
      )}
    </div>
  );
};

