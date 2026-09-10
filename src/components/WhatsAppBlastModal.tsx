import React, { useState } from 'react';
import { X, Send, Copy, Check, MessageSquare, PhoneCall, Sparkles, ExternalLink } from 'lucide-react';
import { ServiceOrder, StoreConfig } from '../types';
import { formatRupiah, sanitizePhoneForWA } from '../utils/formatters';

interface WhatsAppBlastModalProps {
  order: ServiceOrder;
  config: StoreConfig;
  onClose: () => void;
}

export const WhatsAppBlastModal: React.FC<WhatsAppBlastModalProps> = ({
  order,
  config,
  onClose
}) => {
  const [templateType, setTemplateType] = useState<'masuk' | 'konfirmasi' | 'selesai' | 'garansi'>(
    order.status === 'selesai' ? 'selesai' :
    order.status === 'pengecekan' || order.status === 'tunggu_part' ? 'konfirmasi' :
    order.status === 'keluar' ? 'garansi' : 'masuk'
  );

  const [copied, setCopied] = useState(false);

  // Generate dynamic message based on template
  const generateMessage = () => {
    const sapaan = `Halo Kak *${order.customerName}*, salam dari *${config.storeName}* 🙏`;

    if (templateType === 'masuk') {
      return `${sapaan}

Pemberitahuan Servis Masuk:
Kami menginformasikan bahwa smartphone Kakak telah berhasil terdaftar di antrean perbaikan kami.

📋 *Detail Tanda Terima Servis:*
• No. Registrasi: *${order.notaNumber}*
• Unit: *${order.deviceBrand} ${order.deviceModel}*
• Keluhan: _${order.damageDetails}_
• Estimasi Biaya: *${order.estimatedCost > 0 ? formatRupiah(order.estimatedCost) : 'Sedang dalam analisa teknisi'}*
• Tanggal Masuk: ${order.receivedDate}

Teknisi kami sedang melakukan pengecekan mendalam. Kami akan mengabari kembali setelah diagnosa selesai. Simpan no. registrasi ini untuk pengecekan status ya Kak.

📍 *${config.storeName}*
${config.address}
WA Customer Care: ${config.phone}`;
    }

    if (templateType === 'konfirmasi') {
      return `${sapaan}

Update Hasil Pengecekan Unit (*${order.notaNumber}*):
Unit *${order.deviceBrand} ${order.deviceModel}* telah selesai dianalisa oleh teknisi kami.

🔍 *Hasil Diagnosa Teknisi:*
_${order.diagnosisNotes || 'Dibutuhkan penggantian komponen sparepart dan perbaikan jalur mesin.'}_

💰 *Konfirmasi Estimasi Biaya:*
Total estimasi biaya: *${formatRupiah(order.totalCost || order.estimatedCost || 0)}*

Mohon konfirmasi apakah perbaikan dapat kami lanjutkan ke tahap pengerjaan? Balas *SETUJU* jika setuju atau infokan bila ada pertanyaan ya Kak. Terima kasih! 🙏`;
    }

    if (templateType === 'selesai') {
      return `${sapaan}

Kabar Baik! 🎉
Smartphone Kakak telah *SELESAI DIPERBAIKI* dan telah lolos uji fungsi hardware (Quality Control).

📱 *Detail Unit:*
• No. Nota: *${order.notaNumber}*
• Unit: *${order.deviceBrand} ${order.deviceModel}*
• Tindakan: _${order.repairActionDetails || 'Perbaikan hardware dan pengetesan'}
• Total Biaya Servis: *${formatRupiah(order.totalCost)}*
${order.depositPaid && order.depositPaid > 0 ? `• Sisa yang Harus Dibayar: *${formatRupiah(order.totalCost - order.depositPaid)}* (DP tercatat: ${formatRupiah(order.depositPaid)})` : '• Status: Siap Pelunasan di Kasir'}

Unit sudah dapat diambil di toko kami. Mohon membawa bukti tanda terima servis atau menunjukkan pesan ini saat serah terima di kasir ya Kak.

⏰ *Jam Buka Toko:*
${config.operationalHours}

📍 *Alamat Toko:*
${config.address}`;
    }

    // template: garansi / keluar
    return `${sapaan}

Terima kasih banyak telah mempercayakan perbaikan smartphone di *${config.storeName}*! ✨

🛡️ *Informasi Garansi Resmi:*
• No. Nota: *${order.notaNumber}*
• Unit: *${order.deviceBrand} ${order.deviceModel}*
• Masa Garansi: *${order.warrantyDays} Hari* (Berlaku s/d: *${order.warrantyEndDate || '30 hari kedepan'}*)
• Status Pembayaran: *LUNAS*

*Ketentuan Garansi:*
Garansi berlaku untuk sparepart yang diganti dan jasa perbaikan. Pastikan segel toko tetap utuh dan unit tidak terkena air atau jatuh fisik.

Semoga unit smartphone Kakak awet dan lancar dipakai kembali! Jika ada kendala, hubungi kami di nomor ini ya Kak. 🙏`;
  };

  const messageText = generateMessage();

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWA = () => {
    const waPhone = sanitizePhoneForWA(order.customerPhone);
    const encodedText = encodeURIComponent(messageText);
    const waUrl = `https://wa.me/${waPhone}?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-center items-center p-3 sm:p-5">
      <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-emerald-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-lg text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Draft Pesan WhatsApp Otomatis</h2>
              <p className="text-xs text-emerald-100">
                Penerima: <span className="font-semibold">{order.customerName}</span> ({order.customerPhone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          
          {/* Template Selector Pills */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Pilih Template Status WA:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'masuk', label: '1. Unit Masuk' },
                { id: 'konfirmasi', label: '2. Konfirmasi Biaya' },
                { id: 'selesai', label: '3. Siap Diambil' },
                { id: 'garansi', label: '4. Info Garansi' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateType(t.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                    templateType === t.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp Chat Simulation Card */}
          <div className="rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 shadow-inner">
            <div className="bg-emerald-900 text-white px-4 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-[11px]">
                  {order.customerName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold">{order.customerName}</p>
                  <p className="text-[10px] text-emerald-200 font-mono">{order.customerPhone}</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded text-emerald-100">
                Official WA Customer
              </span>
            </div>

            {/* Chat message bubble */}
            <div className="p-4 bg-stone-100 dark:bg-stone-950/80 min-h-[200px] flex flex-col justify-end">
              <div className="max-w-[92%] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-stone-800 dark:text-stone-100 p-3.5 rounded-2xl rounded-tl-xs text-xs whitespace-pre-wrap leading-relaxed font-sans shadow-xs">
                {messageText}
                <div className="text-right text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
                  Sekarang • <Check className="w-3 h-3 inline" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Pesan otomatis terformat dengan nomor WhatsApp: <strong className="font-mono text-stone-800 dark:text-stone-200">{sanitizePhoneForWA(order.customerPhone)}</strong>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                Tersalin ke Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Salin Teks Pesan
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenWA}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Kirim Langsung via WhatsApp Web / App
          </button>
        </div>

      </div>
    </div>
  );
};
