import React, { useState } from 'react';
import { X, ArrowRight, MessageSquare, Wrench, CheckCircle2, Clock, AlertTriangle, PackageCheck } from 'lucide-react';
import { ServiceOrder, ServiceStatus } from '../types';
import { formatRupiah } from '../utils/formatters';

interface StatusProgressionModalProps {
  order: ServiceOrder;
  currentUser: string;
  onUpdateStatus: (updatedOrder: ServiceOrder, openWA: boolean) => void;
  onClose: () => void;
}

const STATUS_STEPS: Array<{ key: ServiceStatus; label: string; desc: string; color: string }> = [
  { key: 'diterima', label: 'Unit Diterima', desc: 'Unit terdaftar di antrean masuk', color: 'bg-stone-500' },
  { key: 'pengecekan', label: 'Pengecekan', desc: 'Bongkar, ukur arus, analisa kerusakan', color: 'bg-amber-500' },
  { key: 'tunggu_part', label: 'Tunggu Sparepart', desc: 'Order part LCD/Baterai/IC ke supplier', color: 'bg-purple-500' },
  { key: 'pengerjaan', label: 'Pengerjaan / Servis', desc: 'Proses penggantian part & solder', color: 'bg-blue-500' },
  { key: 'selesai', label: 'Selesai & QC', desc: 'Lulus pengetesan fungsi, siap diambil', color: 'bg-emerald-500' },
  { key: 'keluar', label: 'Sudah Diambil', desc: 'Serah terima unit & garansi aktif', color: 'bg-green-600' },
  { key: 'dibatalkan', label: 'Gagal Service / Retur / Dibatalkan', desc: 'Unit gagal diperbaiki / part kosong / dibatalkan konsumen', color: 'bg-red-600' }
];

export const StatusProgressionModal: React.FC<StatusProgressionModalProps> = ({
  order,
  currentUser,
  onUpdateStatus,
  onClose
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ServiceStatus>(order.status);
  const [technicianName, setTechnicianName] = useState(order.technicianName || currentUser || 'Kang Asep');
  const [diagnosisNotes, setDiagnosisNotes] = useState(order.diagnosisNotes || '');
  const [cancelReason, setCancelReason] = useState(order.cancelReason || '');
  const [returCostMode, setReturCostMode] = useState<'free' | 'checking' | 'custom'>(() => {
    if (order.totalCost === 0) return 'free';
    if (order.totalCost === 25000 || order.totalCost === 35000) return 'checking';
    return 'custom';
  });
  const [returCustomCost, setReturCustomCost] = useState<number>(() => {
    if (order.status === 'dibatalkan' || order.status === 'retur') return order.totalCost || 0;
    return 0;
  });
  const [newNote, setNewNote] = useState('');

  const isReturOrCancel = selectedStatus === 'dibatalkan' || selectedStatus === 'retur';

  const handleSave = (openWA: boolean) => {
    const now = new Date().toLocaleString('sv-SE').substring(0, 16);
    
    // Hitung penyesuaian biaya jika status retur/gagal service
    let finalTotalCost = order.totalCost;
    if (isReturOrCancel) {
      if (returCostMode === 'free') finalTotalCost = 0;
      else if (returCostMode === 'checking') finalTotalCost = 25000;
      else finalTotalCost = Number(returCustomCost) || 0;
    }

    const updatedOrder: ServiceOrder = {
      ...order,
      status: selectedStatus,
      technicianName,
      diagnosisNotes,
      cancelReason: isReturOrCancel ? cancelReason : order.cancelReason,
      totalCost: finalTotalCost,
      history: [
        ...order.history,
        {
          id: 'h-' + Date.now(),
          timestamp: now,
          status: selectedStatus,
          note: isReturOrCancel
            ? `Status diubah: GAGAL SERVICE / RETUR. Alasan: "${cancelReason || 'Tanpa keterangan'}". Total Biaya disesuaikan: ${formatRupiah(finalTotalCost)}`
            : (newNote.trim() || `Status diubah menjadi ${selectedStatus.toUpperCase()}`),
          actor: currentUser
        }
      ]
    };

    onUpdateStatus(updatedOrder, openWA);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-center items-center p-3 sm:p-5">
      <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Update Status & Progress Servis</h2>
              <p className="text-xs text-stone-400">
                {order.notaNumber} • {order.deviceBrand} {order.deviceModel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          
          {/* Status Progression Timeline Options */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Pilih Tahap Status Unit:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STATUS_STEPS.map((step) => {
                const isActive = selectedStatus === step.key;
                const isFail = step.key === 'dibatalkan';
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setSelectedStatus(step.key)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isActive
                        ? isFail
                          ? 'border-red-500 bg-red-50/80 dark:bg-red-950/50 ring-2 ring-red-500/30'
                          : 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                        : isFail
                        ? 'border-red-200/60 dark:border-red-900/40 hover:border-red-400 bg-red-50/20 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600 bg-white dark:bg-stone-800/40'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${step.color}`} />
                    <div>
                      <div className={`font-bold text-xs flex items-center gap-1.5 ${
                        isFail ? 'text-red-700 dark:text-red-400' : 'text-stone-900 dark:text-white'
                      }`}>
                        {step.label}
                        {isActive && (
                          <CheckCircle2 className={`w-3.5 h-3.5 inline ${isFail ? 'text-red-600' : 'text-blue-600'}`} />
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FORM KHUSUS GAGAL SERVICE / RETUR / DIBATALKAN */}
          {isReturOrCancel && (
            <div className="p-4 bg-red-50/80 dark:bg-red-950/30 rounded-2xl border-2 border-red-300 dark:border-red-900/60 space-y-3.5 animate-fade-in">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Pengaturan Gagal Service / Retur Unit</span>
              </div>

              {/* Input Alasan Gagal Service / Retur */}
              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Alasan Gagal / Retur / Pembatalan <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Contoh: IC RAM tidak ada pasokan, jalur PCB short parah / unit terbakar, atau pelanggan membatalkan servis karena biaya..."
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-red-300 dark:border-red-800 rounded-xl text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-red-500/30 outline-hidden"
                />
                
                {/* Template Alasan Cepat */}
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  <span className="text-[10px] text-stone-500 font-medium">Pilih cepat:</span>
                  {[
                    'IC RAM / CPU tidak ada pasokan',
                    'Jalur PCB short parah (korosi)',
                    'Pelanggan membatalkan servis',
                    'Biaya part melebihi plafon konsumen'
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setCancelReason(tag)}
                      className="px-2 py-0.5 bg-white dark:bg-stone-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 rounded-md text-[10px] transition-all cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Penyesuaian Biaya Total Retur (Rp 0 atau Biaya Cek) */}
              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Penyesuaian Biaya Service / Pengecekan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReturCostMode('free');
                      setReturCustomCost(0);
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      returCostMode === 'free'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-emerald-500'
                    }`}
                  >
                    <p className="font-bold text-xs">Bebas Biaya (Rp 0)</p>
                    <p className={`text-[10px] mt-0.5 ${returCostMode === 'free' ? 'text-emerald-100' : 'text-stone-400'}`}>
                      Tanpa biaya apapun
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReturCostMode('checking');
                      setReturCustomCost(25000);
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      returCostMode === 'checking'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-blue-500'
                    }`}
                  >
                    <p className="font-bold text-xs">Biaya Pengecekan</p>
                    <p className={`text-[10px] mt-0.5 ${returCostMode === 'checking' ? 'text-blue-100' : 'text-stone-400'}`}>
                      Rp 25.000 (Buka casing)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturCostMode('custom')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      returCostMode === 'custom'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-amber-500'
                    }`}
                  >
                    <p className="font-bold text-xs">Nominal Khusus</p>
                    <p className={`text-[10px] mt-0.5 ${returCostMode === 'custom' ? 'text-amber-100' : 'text-stone-400'}`}>
                      Input manual
                    </p>
                  </button>
                </div>

                {returCostMode === 'custom' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-600 dark:text-stone-400">Rp</span>
                    <input
                      type="number"
                      value={returCustomCost}
                      onChange={(e) => setReturCustomCost(Number(e.target.value) || 0)}
                      placeholder="Masukkan nominal biaya..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Teknisi & Catatan Analisa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Teknisi Penanggung Jawab
              </label>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Kunci Layar Pelanggan
              </label>
              <div className="px-3 py-2 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs font-mono font-bold text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
                {order.screenLockType.toUpperCase()}: {order.screenLockValue || '(Tidak ada kunci)'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Catatan Diagnosa / Kerusakan Riil Teknisi
            </label>
            <textarea
              rows={2}
              value={diagnosisNotes}
              onChange={(e) => setDiagnosisNotes(e.target.value)}
              placeholder="Contoh: Jalur vbat normal, short di pmic sekunder, perlu ganti kapasitor C2104"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Pesan Log Riwayat Baru
            </label>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Contoh: Selesai proses soldering, sedang proses running test speaker dan wifi..."
              className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs"
            />
          </div>

          {/* Riwayat Timeline Singkat */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Riwayat Penanganan Unit ({order.history.length} update):
            </span>
            <div className="max-h-28 overflow-y-auto space-y-1.5 mt-1.5 pr-1">
              {order.history.map((h) => (
                <div key={h.id} className="text-[11px] p-2 bg-stone-50 dark:bg-stone-800/40 rounded border border-stone-200 dark:border-stone-700/60 flex justify-between gap-2">
                  <div>
                    <span className="font-bold uppercase text-blue-600 dark:text-blue-400">[{h.status}]</span>{' '}
                    <span className="text-stone-700 dark:text-stone-300">{h.note}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 shrink-0 font-mono">{h.timestamp}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-stone-600 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg"
          >
            Batal
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Update & Buka Draft WhatsApp
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              Simpan Update Status
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
