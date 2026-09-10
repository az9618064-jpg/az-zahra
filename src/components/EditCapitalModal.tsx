import React, { useState } from 'react';
import { X, Wallet, ShieldCheck, ArrowUpRight, ArrowDownRight, Check, AlertCircle, Sparkles } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface EditCapitalModalProps {
  currentCapital: number;
  currentUser: string;
  onSave: (newAmount: number, reason: string) => void;
  onClose: () => void;
}

const PRESET_REASONS = [
  'Suntik Modal Operasional Kasir Bulanan',
  'Tambah Saldo Kas Laci Kasir',
  'Penyesuaian Fisik Kas Opname Toko',
  'Tarik Sebagian Modal Cadangan Toko',
  'Penyesuaian Modal Awal Awal Tahun'
];

export const EditCapitalModal: React.FC<EditCapitalModalProps> = ({
  currentCapital,
  currentUser,
  onSave,
  onClose
}) => {
  const [newAmount, setNewAmount] = useState<number | ''>(currentCapital);
  const [reason, setReason] = useState('Suntik Modal Operasional Kasir Bulanan');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numericNewAmount = Number(newAmount) || 0;
  const diff = numericNewAmount - currentCapital;
  const isIncrease = diff >= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAmount === '' || numericNewAmount < 0) {
      setErrorMsg('Nominal modal harus bernilai minimal Rp 0.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Harap masukkan alasan perubahan modal untuk keperluan audit log.');
      return;
    }
    if (numericNewAmount === currentCapital) {
      setErrorMsg('Nominal modal baru sama dengan nominal saat ini.');
      return;
    }

    onSave(numericNewAmount, reason.trim());
    onClose();
  };

  const handleQuickAdd = (additional: number) => {
    const current = Number(newAmount) || 0;
    setNewAmount(current + additional);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full border border-stone-200 dark:border-stone-700 shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="p-5 bg-blue-900 text-white flex items-center justify-between border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-400 text-stone-950 rounded-2xl shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-800 text-yellow-300 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                Otorisasi Khusus Owner
              </div>
              <h3 className="text-base font-black text-white">
                Perbarui Modal Awal Toko
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Perbandingan Modal */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700">
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Modal Saat Ini
              </span>
              <p className="text-base font-bold font-mono text-stone-700 dark:text-stone-300 mt-0.5">
                {formatRupiah(currentCapital)}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Selisih Perubahan
              </span>
              <p className={`text-base font-bold font-mono mt-0.5 flex items-center gap-1 ${
                diff === 0 
                  ? 'text-stone-500' 
                  : isIncrease 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-red-600 dark:text-red-400'
              }`}>
                {diff !== 0 && (isIncrease ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />)}
                {diff === 0 ? 'Rp 0' : `${isIncrease ? '+' : ''}${formatRupiah(diff)}`}
              </p>
            </div>
          </div>

          {/* Input Nominal Baru */}
          <div className="space-y-1.5">
            <label className="block font-bold text-stone-800 dark:text-stone-200">
              Nominal Modal Awal Baru (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold font-mono text-stone-400">
                Rp
              </span>
              <input
                type="number"
                min={0}
                step={50000}
                required
                value={newAmount}
                onChange={(e) => {
                  setErrorMsg(null);
                  setNewAmount(e.target.value === '' ? '' : Number(e.target.value));
                }}
                className="w-full pl-11 pr-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-blue-600"
                placeholder="Contoh: 20000000"
              />
            </div>

            {/* Quick Increment Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-stone-400 font-medium">Tambah Cepat:</span>
              {[1000000, 2500000, 5000000, 10000000].map((addVal) => (
                <button
                  key={addVal}
                  type="button"
                  onClick={() => handleQuickAdd(addVal)}
                  className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 border border-stone-200 dark:border-stone-700 rounded-md font-mono text-[10px] font-semibold text-stone-600 dark:text-stone-300 cursor-pointer transition-colors"
                >
                  +{formatRupiah(addVal)}
                </button>
              ))}
            </div>
          </div>

          {/* Catatan / Alasan Perubahan (Audit Log) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-stone-800 dark:text-stone-200">
              Alasan Perubahan / Catatan Audit Log *
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => {
                setErrorMsg(null);
                setReason(e.target.value);
              }}
              placeholder="Jelaskan tujuan perubahan modal (contoh: Suntik Modal Operasional Kasir Bulanan)"
              className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-blue-600"
            />

            {/* Preset Reason Chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                    reason === preset
                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 font-bold'
                      : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Info Audit Perubahan */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Audit Keamanan:</strong> Perubahan ini akan dicatat ke log riwayat finansial dengan identitas pelaksana: <strong>{currentUser}</strong> pada {new Date().toLocaleString('sv-SE').substring(0, 16)}.
            </div>
          </div>

          {/* BUTTONS */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Simpan & Catat Log
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
