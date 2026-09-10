import React from 'react';
import { X, History, ArrowUpRight, ArrowDownRight, ShieldCheck, Calendar, User, FileText } from 'lucide-react';
import { CapitalHistoryLog } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface CapitalHistoryModalProps {
  logs: CapitalHistoryLog[];
  currentCapital: number;
  onClose: () => void;
}

export const CapitalHistoryModal: React.FC<CapitalHistoryModalProps> = ({
  logs,
  currentCapital,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full border border-stone-200 dark:border-stone-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-blue-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-400 text-stone-950 rounded-2xl shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-800 text-yellow-300 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                Audit Log Perubahan Finansial
              </div>
              <h3 className="text-lg font-black text-white">
                Riwayat Perubahan Modal Awal Toko
              </h3>
              <p className="text-xs text-blue-100">
                Catatan resmi setiap suntik modal & penyesuaian kas oleh Owner
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-blue-200 hover:text-white hover:bg-blue-800/80 rounded-xl transition-colors cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {/* Current Status Highlight */}
          <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Modal Awal Toko Saat Ini
              </span>
              <p className="text-2xl font-black font-mono text-stone-900 dark:text-white mt-0.5">
                {formatRupiah(currentCapital)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-stone-500 dark:text-stone-400">Total Mutasi Tercatat</span>
              <p className="text-base font-bold font-mono text-blue-600 dark:text-blue-400">
                {logs.length} Kali Perubahan
              </p>
            </div>
          </div>

          {/* Audit History Table */}
          {logs.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <History className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs font-medium">Belum ada riwayat perubahan modal yang tercatat.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold border-b border-stone-200 dark:border-stone-700">
                    <th className="py-3 px-3.5">Waktu & Tanggal</th>
                    <th className="py-3 px-3.5">Perubahan Modal</th>
                    <th className="py-3 px-3.5">Oleh (Owner)</th>
                    <th className="py-3 px-3.5">Catatan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-700/60">
                  {logs.map((log) => {
                    const diff = log.newAmount - log.previousAmount;
                    const isIncrease = diff >= 0;
                    return (
                      <tr key={log.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                        {/* Waktu */}
                        <td className="py-3 px-3.5 align-top whitespace-nowrap font-mono text-[11px] text-stone-600 dark:text-stone-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            <span>{log.timestamp}</span>
                          </div>
                        </td>

                        {/* Nominal & Selisih */}
                        <td className="py-3 px-3.5 align-top font-mono whitespace-nowrap">
                          <div className="font-bold text-stone-900 dark:text-white text-xs">
                            {formatRupiah(log.newAmount)}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] mt-0.5">
                            <span className="text-stone-400">Semula: {formatRupiah(log.previousAmount)}</span>
                            <span className={`inline-flex items-center font-bold px-1 rounded ${
                              isIncrease 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' 
                                : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
                            }`}>
                              {isIncrease ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                              {isIncrease ? '+' : ''}{formatRupiah(diff)}
                            </span>
                          </div>
                        </td>

                        {/* Diubah Oleh */}
                        <td className="py-3 px-3.5 align-top">
                          <div className="inline-flex items-center gap-1 font-semibold text-stone-800 dark:text-stone-200">
                            <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span>{log.changedBy}</span>
                          </div>
                        </td>

                        {/* Catatan / Alasan */}
                        <td className="py-3 px-3.5 align-top">
                          <p className="text-stone-700 dark:text-stone-300 italic">
                            "{log.reason}"
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex justify-end bg-stone-50 dark:bg-stone-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
