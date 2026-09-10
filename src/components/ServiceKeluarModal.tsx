import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, Plus, Trash2, Printer, Send, CreditCard, DollarSign } from 'lucide-react';
import { ServiceOrder, SparepartItem, PaymentStatus, PaymentMethod } from '../types';
import { formatRupiah } from '../utils/formatters';

interface ServiceKeluarModalProps {
  order: ServiceOrder;
  currentUser: string;
  onSave: (updatedOrder: ServiceOrder, printNow: boolean) => void;
  onClose: () => void;
}

export const ServiceKeluarModal: React.FC<ServiceKeluarModalProps> = ({
  order,
  currentUser,
  onSave,
  onClose
}) => {
  const [technicianName, setTechnicianName] = useState(order.technicianName || 'Kang Asep (Teknisi)');
  const [repairActionDetails, setRepairActionDetails] = useState(
    order.repairActionDetails || order.diagnosisNotes || 'Penggantian part & kalibrasi hardware'
  );

  // Spareparts list
  const [replacedParts, setReplacedParts] = useState<SparepartItem[]>(
    order.replacedParts && order.replacedParts.length > 0
      ? order.replacedParts
      : [{ id: 'p-' + Date.now(), name: 'LCD / Sparepart HP', qty: 1, costPrice: 200000, sellingPrice: 350000 }]
  );

  // Fees & Costs
  const [technicianFee, setTechnicianFee] = useState<number>(order.technicianFee || 100000);
  const [discount, setDiscount] = useState<number>(order.discount || 0);
  const [depositPaid, setDepositPaid] = useState<number>(order.depositPaid || 0);

  // Payment
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    order.paymentStatus === 'lunas' ? 'lunas' : 'lunas'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod || 'qris');

  // Warranty
  const [warrantyDays, setWarrantyDays] = useState<number>(order.warrantyDays || 30);
  const [handoverNotes, setHandoverNotes] = useState(
    order.handoverNotes || 'Unit telah ditest bersama pelanggan dalam kondisi normal dan siap pakai.'
  );

  // Calculated totals
  const totalPartsPrice = replacedParts.reduce((acc, curr) => acc + (curr.sellingPrice * curr.qty), 0);
  const grossTotal = totalPartsPrice + technicianFee - discount;
  const remainingToPay = Math.max(0, grossTotal - depositPaid);

  const addSparepartRow = () => {
    setReplacedParts([
      ...replacedParts,
      { id: 'p-' + Date.now(), name: '', qty: 1, costPrice: 0, sellingPrice: 0 }
    ]);
  };

  const removeSparepartRow = (index: number) => {
    setReplacedParts(replacedParts.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: keyof SparepartItem, val: any) => {
    const updated = [...replacedParts];
    updated[index] = { ...updated[index], [field]: val };
    setReplacedParts(updated);
  };

  const handleSubmit = (printNow: boolean) => {
    const now = new Date();
    const warrantyEnd = new Date();
    warrantyEnd.setDate(now.getDate() + warrantyDays);

    const updatedOrder: ServiceOrder = {
      ...order,
      status: 'keluar',
      outDate: new Date().toLocaleString('sv-SE').substring(0, 16),
      technicianName,
      repairActionDetails,
      replacedParts,
      technicianFee,
      discount,
      depositPaid,
      totalCost: grossTotal,
      paymentStatus,
      paymentMethod,
      warrantyDays,
      warrantyEndDate: warrantyEnd.toISOString().split('T')[0],
      handoverNotes,
      history: [
        ...order.history,
        {
          id: 'h-' + Date.now(),
          timestamp: new Date().toLocaleString('sv-SE').substring(0, 16),
          status: 'keluar',
          note: `Unit diambil pemilik. Status pembayaran: ${paymentStatus.toUpperCase()} (${paymentMethod}). Garansi: ${warrantyDays} hari.`,
          actor: currentUser
        }
      ]
    };

    onSave(updatedOrder, printNow);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-center items-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-stone-900 text-white border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg text-white">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Input Service Keluar & Serah Terima</h2>
              <p className="text-xs text-stone-400">
                Nota: <span className="font-mono text-blue-400 font-bold">{order.notaNumber}</span> • {order.deviceBrand} {order.deviceModel} ({order.customerName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }} className="p-5 overflow-y-auto space-y-5 text-sm">
          
          {/* Tindakan & Teknisi PJ */}
          <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-200 dark:border-stone-700/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nama Teknisi Penanggung Jawab *
                </label>
                <input
                  type="text"
                  required
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Masa Garansi Toko *
                </label>
                <select
                  value={warrantyDays}
                  onChange={(e) => setWarrantyDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-sm font-semibold text-green-700 dark:text-green-400"
                >
                  <option value={7}>7 Hari (Tes Pakai Standar)</option>
                  <option value={14}>14 Hari (2 Minggu)</option>
                  <option value={30}>30 Hari (1 Bulan - Rekomendasi)</option>
                  <option value={60}>60 Hari (2 Bulan)</option>
                  <option value={90}>90 Hari (3 Bulan - Part Original)</option>
                  <option value={180}>180 Hari (6 Bulan)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Detail Tindakan Perbaikan *
              </label>
              <textarea
                required
                rows={2}
                value={repairActionDetails}
                onChange={(e) => setRepairActionDetails(e.target.value)}
                placeholder="Rincian perbaikan yang dilakukan teknisi..."
                className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Rincian Sparepart yang Diganti */}
          <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-200 dark:border-stone-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                Sparepart yang Diganti & Biaya Part
              </label>
              <button
                type="button"
                onClick={addSparepartRow}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Baris Part
              </button>
            </div>

            <div className="space-y-2">
              {replacedParts.map((part, index) => (
                <div key={part.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white dark:bg-stone-900 p-2.5 rounded-lg border border-stone-200 dark:border-stone-700">
                  <input
                    type="text"
                    placeholder="Nama sparepart (misal: LCD OLED Original)"
                    value={part.name}
                    onChange={(e) => updatePart(index, 'name', e.target.value)}
                    className="flex-1 min-w-[150px] px-2.5 py-1.5 text-xs bg-transparent border border-stone-300 dark:border-stone-700 rounded-md"
                  />
                  <div className="w-16">
                    <input
                      type="number"
                      min={1}
                      title="Jumlah (Qty)"
                      placeholder="Qty"
                      value={part.qty}
                      onChange={(e) => updatePart(index, 'qty', Math.max(1, Number(e.target.value)))}
                      className="w-full px-2 py-1.5 text-xs font-mono text-center bg-transparent border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="Harga Jual (Rp)"
                      title="Harga Jual ke Pelanggan"
                      value={part.sellingPrice}
                      onChange={(e) => updatePart(index, 'sellingPrice', Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs font-mono text-right bg-transparent border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSparepartRow(index)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Ongkos Jasa Teknisi & Kalkulasi */}
            <div className="pt-2 border-t border-stone-200 dark:border-stone-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Ongkos Jasa Perbaikan (Rp) *
                </label>
                <input
                  type="number"
                  min={0}
                  value={technicianFee}
                  onChange={(e) => setTechnicianFee(Number(e.target.value))}
                  className="w-full px-3 py-2 font-mono text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Potongan Diskon (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 font-mono text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg"
                />
              </div>
            </div>

            {/* Ringkasan Total Box */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-900 dark:text-blue-300">Total Biaya Service (Part + Jasa):</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  DP Sebelumnya: {formatRupiah(depositPaid)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-500 uppercase tracking-wider block">Sisa Bayar:</span>
                <span className="text-lg font-mono font-black text-blue-700 dark:text-blue-400">
                  {formatRupiah(remainingToPay)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Pembayaran & Serah Terima */}
          <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-200 dark:border-stone-700/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Status Pembayaran *
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg font-bold text-stone-900 dark:text-white"
                >
                  <option value="lunas">LUNAS (Unit Diambil)</option>
                  <option value="dp">Uang Muka (DP Ditambah)</option>
                  <option value="belum_bayar">Belum Bayar (Tempo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg"
                >
                  <option value="qris">QRIS (BCA, Mandiri, GoPay, OVO)</option>
                  <option value="tunai">Tunai / Cash Kasir</option>
                  <option value="transfer_bank">Transfer Bank Langsung</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Catatan Serah Terima Unit
              </label>
              <input
                type="text"
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="Catatan kondisi serah terima..."
                className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-sm hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Simpan & Cetak Faktur A4 Pelunasan
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            >
              Konfirmasi Selesai & Serah Terima
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
