import React, { useState } from 'react';
import { 
  Printer, X, ShieldCheck, CheckCircle2, PhoneCall, 
  MapPin, Smartphone, KeyRound, Wrench, RefreshCw, ExternalLink 
} from 'lucide-react';
import { ServiceOrder, StoreConfig } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { printA4Document } from '../utils/printA4';

interface A4PrintModalProps {
  order: ServiceOrder;
  config: StoreConfig;
  initialType?: 'masuk' | 'keluar';
  onClose: () => void;
}

export const A4PrintModal: React.FC<A4PrintModalProps> = ({
  order,
  config,
  initialType = 'masuk',
  onClose
}) => {
  const [docType, setDocType] = useState<'masuk' | 'keluar'>(
    order.status === 'keluar' || order.status === 'selesai' ? initialType : 'masuk'
  );
  const [isPrinting, setIsPrinting] = useState(false);
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);

  const handlePrint = () => {
    setIsPrinting(true);
    setPrintFeedback('Membuka jendela cetak A4...');

    const docTitle = `Nota_${order.notaNumber}_${docType === 'masuk' ? 'Masuk' : 'Keluar'}_${order.customerName.replace(/[^a-zA-Z0-9]/g, '_')}`;

    printA4Document({
      elementId: 'a4-printable-document',
      documentTitle: docTitle,
      onSuccess: () => {
        setPrintFeedback('Jendela cetak berhasil dibuka & perintah cetak terkirim!');
        setTimeout(() => {
          setIsPrinting(false);
          setPrintFeedback(null);
        }, 3500);
      },
      onError: (err) => {
        setPrintFeedback(`Gagal: ${err.message}`);
        setIsPrinting(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:fixed-none print:inset-auto">
      <div className="relative w-full max-w-4xl bg-stone-100 dark:bg-stone-900 rounded-2xl shadow-2xl flex flex-col my-auto print:my-0 print:shadow-none print:bg-white print:w-full print:max-w-none">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                Cetak Nota Resmi Standar A4
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                No. Registrasi: <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{order.notaNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Switcher */}
            <div className="inline-flex p-1 bg-stone-100 dark:bg-stone-700 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setDocType('masuk')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  docType === 'masuk'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                Nota Tanda Terima Masuk
              </button>
              <button
                type="button"
                onClick={() => setDocType('keluar')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  docType === 'keluar'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                Nota Pelunasan & Garansi
              </button>
            </div>

            <button
              onClick={handlePrint}
              id="btn-trigger-print"
              type="button"
              disabled={isPrinting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-75"
            >
              {isPrinting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mencetak...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Print A4</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              type="button"
              aria-label="Tutup Pratinjau"
              className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK STATUS BAR JIKA DIBUTUHKAN */}
        {printFeedback && (
          <div className="no-print bg-blue-50 dark:bg-blue-950/60 border-b border-blue-200 dark:border-blue-900 px-4 py-2 text-xs font-medium text-blue-900 dark:text-blue-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {printFeedback}
            </span>
            <button
              type="button"
              onClick={handlePrint}
              className="underline text-blue-700 hover:text-blue-800 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              Klik jika jendela cetak belum terbuka
            </button>
          </div>
        )}

        {/* Paper Preview Canvas Area */}
        <div className="p-3 sm:p-6 overflow-x-auto flex justify-center bg-stone-200 dark:bg-stone-950/60 print:p-0 print:bg-white">
          
          {/* Printable Sheet (Simulated A4 Proportion on Screen: 210mm x 297mm) */}
          <div 
            id="a4-printable-document" 
            className="print-container bg-white text-stone-900 shadow-xl print:shadow-none mx-auto w-[210mm] min-h-[285mm] p-8 sm:p-10 flex flex-col justify-between border border-stone-300 print:border-none print:p-0"
            style={{ boxSizing: 'border-box' }}
          >
            <div>
              {/* HEADER / KOP TOKO RESMI */}
              <div className="border-b-2 border-stone-800 pb-4 mb-5">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <div className="w-14 h-14 bg-stone-900 text-white rounded-xl flex items-center justify-center font-black text-xl tracking-wider shadow-xs">
                      <Smartphone className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-stone-900">
                        {config.storeName}
                      </h1>
                      <p className="text-xs font-semibold text-blue-700 tracking-wide">
                        {config.tagline}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-stone-600 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {config.address}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <PhoneCall className="w-3 h-3" /> WA: {config.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DOCUMENT BADGE */}
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 bg-stone-900 text-white font-bold text-xs uppercase tracking-wider rounded-sm mb-1">
                      {docType === 'masuk' ? 'Tanda Terima Servis Masuk' : 'Faktur Servis & Kartu Garansi'}
                    </div>
                    <div className="text-sm font-mono font-black text-stone-800 tracking-wider">
                      {order.notaNumber}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Tgl: {docType === 'masuk' ? formatDateIndo(order.receivedDate) : formatDateIndo(order.outDate || order.receivedDate)}
                    </div>
                  </div>
                </div>
              </div>

              {/* GRID DATA: PELANGGAN & UNIT HP */}
              <div className="grid grid-cols-2 gap-4 mb-5 text-xs">
                {/* Kotak Data Pelanggan */}
                <div className="border border-stone-300 rounded-md p-3 bg-stone-50/50">
                  <div className="font-bold text-stone-800 border-b border-stone-200 pb-1 mb-2 flex items-center justify-between">
                    <span className="uppercase text-[11px] tracking-wider text-stone-500">Informasi Pelanggan</span>
                    <span className="text-[10px] text-stone-400">ID: CUST-{order.customerPhone.slice(-4)}</span>
                  </div>
                  <table className="w-full text-[11px] leading-relaxed">
                    <tbody>
                      <tr>
                        <td className="w-24 text-stone-500 py-0.5">Nama Pelanggan</td>
                        <td className="font-bold text-stone-900 py-0.5">: {order.customerName}</td>
                      </tr>
                      <tr>
                        <td className="text-stone-500 py-0.5">Nomor WhatsApp</td>
                        <td className="font-semibold text-stone-800 py-0.5">: {order.customerPhone}</td>
                      </tr>
                      <tr>
                        <td className="text-stone-500 py-0.5">Petugas Penerima</td>
                        <td className="text-stone-800 py-0.5">: {order.receivedBy}</td>
                      </tr>
                      {order.technicianName && (
                        <tr>
                          <td className="text-stone-500 py-0.5">Teknisi PJ</td>
                          <td className="font-medium text-blue-900 py-0.5">: {order.technicianName}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Kotak Spesifikasi Unit HP */}
                <div className="border border-stone-300 rounded-md p-3 bg-stone-50/50">
                  <div className="font-bold text-stone-800 border-b border-stone-200 pb-1 mb-2 flex items-center justify-between">
                    <span className="uppercase text-[11px] tracking-wider text-stone-500">Spesifikasi Unit Smartphone</span>
                    <span className="font-mono text-[10px] bg-stone-200 px-1.5 py-0.5 rounded text-stone-700">IMEI TERVERIFIKASI</span>
                  </div>
                  <table className="w-full text-[11px] leading-relaxed">
                    <tbody>
                      <tr>
                        <td className="w-24 text-stone-500 py-0.5">Merek / Tipe</td>
                        <td className="font-bold text-stone-900 py-0.5">: {order.deviceBrand} {order.deviceModel}</td>
                      </tr>
                      <tr>
                        <td className="text-stone-500 py-0.5">Nomor IMEI</td>
                        <td className="font-mono font-semibold text-stone-800 py-0.5">: {order.imei || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-stone-500 py-0.5">Kunci Layar</td>
                        <td className="text-stone-900 py-0.5 font-medium flex items-center gap-1">
                          : <KeyRound className="w-3 h-3 text-stone-400 inline" />
                          <span className="uppercase text-[10px] px-1 bg-stone-200 rounded font-bold">
                            {order.screenLockType}
                          </span>
                          <span className="font-mono font-bold text-blue-700">
                            {order.screenLockValue || '(Tidak Ada)'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-stone-500 py-0.5">Kelengkapan</td>
                        <td className="text-stone-800 py-0.5">
                          : {order.completeness.length > 0 ? order.completeness.join(', ') : 'Hanya Unit HP'}
                          {order.completenessNotes ? ` (${order.completenessNotes})` : ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RINCIAN MASUK VS RINCIAN KELUAR */}
              {docType === 'masuk' ? (
                /* TABEL NOTA MASUK */
                <div className="space-y-4 mb-5 text-xs">
                  <div className="border border-stone-300 rounded-md overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-800 text-white text-[11px] uppercase tracking-wider font-semibold">
                          <th className="py-2 px-3 w-10 text-center">No</th>
                          <th className="py-2 px-3">Keluhan Kerusakan / Masalah Unit</th>
                          <th className="py-2 px-3 w-40 text-right">Estimasi Biaya</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        <tr>
                          <td className="py-3 px-3 text-center align-top font-mono">1</td>
                          <td className="py-3 px-3 align-top">
                            <p className="font-semibold text-stone-900">{order.damageDetails}</p>
                            <p className="text-[11px] text-stone-500 mt-1 italic">
                              * Kerusakan pasti dan ketersediaan sparepart akan dikonfirmasi setelah proses pembongkaran & diagnosa teknisi.
                            </p>
                          </td>
                          <td className="py-3 px-3 text-right align-top font-bold text-stone-900 font-mono text-sm">
                            {order.estimatedCost > 0 ? formatRupiah(order.estimatedCost) : 'Menunggu Diagnosa'}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="bg-stone-100 font-bold border-t border-stone-300 text-stone-800">
                          <td colSpan={2} className="py-2 px-3 text-right uppercase text-[10px] tracking-wider">
                            Perkiraan Total Biaya Sementara:
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-stone-900 text-sm">
                            {order.estimatedCost > 0 ? formatRupiah(order.estimatedCost) : '-'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* KOTAK ESTIMASI SELESAI & STATUS */}
                  <div className="flex justify-between items-center bg-blue-50 border border-blue-200 p-3 rounded-md text-[11px]">
                    <div>
                      <span className="font-bold text-blue-950">Target Selesai Estimasi: </span>
                      <span className="font-semibold text-blue-800">
                        {order.estimatedDate ? formatDateIndo(order.estimatedDate) : '1 - 3 Hari Kerja'}
                      </span>
                    </div>
                    <div className="text-right font-mono text-[10px] text-blue-700">
                      STATUS PENERIMAAN: <strong className="uppercase">{order.status}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                /* TABEL NOTA KELUAR / PELUNASAN / GARANSI */
                <div className="space-y-4 mb-5 text-xs">
                  <div className="border border-stone-300 rounded-md overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-800 text-white text-[11px] uppercase tracking-wider font-semibold">
                          <th className="py-2 px-3 w-8 text-center">No</th>
                          <th className="py-2 px-3">Rincian Tindakan Perbaikan / Sparepart Baru</th>
                          <th className="py-2 px-3 w-16 text-center">Qty</th>
                          <th className="py-2 px-3 w-32 text-right">Harga Satuan</th>
                          <th className="py-2 px-3 w-32 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 text-[11px]">
                        {order.replacedParts && order.replacedParts.length > 0 ? (
                          order.replacedParts.map((part, idx) => (
                            <tr key={part.id || idx}>
                              <td className="py-2 px-3 text-center font-mono">{idx + 1}</td>
                              <td className="py-2 px-3 font-medium text-stone-800">
                                {part.name}
                              </td>
                              <td className="py-2 px-3 text-center font-mono">{part.qty || 1}</td>
                              <td className="py-2 px-3 text-right font-mono text-stone-600">
                                {formatRupiah(part.sellingPrice)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-semibold text-stone-900">
                                {formatRupiah(part.sellingPrice * (part.qty || 1))}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="py-2 px-3 text-center font-mono">1</td>
                            <td className="py-2 px-3 font-medium text-stone-800">
                              {order.repairActionDetails || 'Jasa Perbaikan / Pemulihan Hardware Tanpa Ganti Part'}
                            </td>
                            <td className="py-2 px-3 text-center font-mono">1</td>
                            <td className="py-2 px-3 text-right font-mono text-stone-600">-</td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-stone-900">-</td>
                          </tr>
                        )}

                        {/* Ongkos Jasa Teknisi */}
                        <tr className="bg-stone-50/80">
                          <td className="py-2 px-3 text-center font-mono font-semibold text-blue-700">
                            <Wrench className="w-3.5 h-3.5 mx-auto" />
                          </td>
                          <td colSpan={3} className="py-2 px-3 font-semibold text-stone-800">
                            Biaya Jasa Pengerjaan & Analisa Teknisi ({order.technicianName || 'Teknisi Handal'})
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-stone-900">
                            {formatRupiah(order.technicianFee || 0)}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-stone-300 font-semibold text-stone-700">
                          <td colSpan={4} className="py-1.5 px-3 text-right text-[10px] uppercase">
                            Total Biaya Perbaikan:
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono text-stone-900">
                            {formatRupiah(order.totalCost)}
                          </td>
                        </tr>
                        {order.depositPaid && order.depositPaid > 0 ? (
                          <tr className="text-stone-600">
                            <td colSpan={4} className="py-1.5 px-3 text-right text-[10px] uppercase">
                              Uang Muka / DP Sebelumnya:
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono text-red-600">
                              - {formatRupiah(order.depositPaid)}
                            </td>
                          </tr>
                        ) : null}
                        <tr className="bg-stone-900 text-white font-bold text-sm">
                          <td colSpan={4} className="py-2 px-3 text-right uppercase tracking-wider text-xs">
                            Sisa Pembayaran / Total Lunas:
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-green-400">
                            {formatRupiah(order.totalCost - (order.depositPaid || 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* KOTAK GARANSI RESMI */}
                  <div className="flex items-center justify-between p-3 border-2 border-green-600/60 bg-green-50/60 rounded-md">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-8 h-8 text-green-700 shrink-0" />
                      <div>
                        <div className="font-black text-green-950 text-xs uppercase tracking-wide flex items-center gap-2">
                          GARANSI RESMI TOKO: {order.warrantyDays} HARI
                          <span className="px-2 py-0.5 bg-green-700 text-white rounded text-[10px] font-bold">
                            AKTIF
                          </span>
                        </div>
                        <p className="text-[11px] text-green-800">
                          Berlaku s/d: <strong className="font-bold underline">{order.warrantyEndDate ? formatDateIndo(order.warrantyEndDate) : '30 Hari sejak nota ini dibuat'}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] text-stone-800 uppercase px-2.5 py-1 bg-white border border-stone-300 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        Status: {order.paymentStatus === 'lunas' ? 'LUNAS' : 'DP TERCATAT'} ({order.paymentMethod || 'TUNAI'})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SYARAT DAN KETENTUAN SERVICE */}
              <div className="border border-stone-300 rounded-md p-3 bg-stone-50 text-[10px] mb-6 page-break-inside-avoid">
                <h4 className="font-bold text-stone-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
                  Syarat & Ketentuan Servis {docType === 'masuk' ? 'Penerimaan Unit' : 'Klaim Garansi'}:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-stone-600 leading-normal">
                  {(docType === 'masuk' ? config.termsMasuk : config.termsKeluar).map((term, index) => (
                    <li key={index} className="text-justify">{term}</li>
                  ))}
                </ol>
              </div>
            </div>

            {/* AREA TANDA TANGAN (DUAL SIGNATURES) */}
            <div className="page-break-inside-avoid border-t border-stone-300 pt-4 mt-4">
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                {/* Tanda Tangan Pelanggan */}
                <div>
                  <p className="text-stone-600 text-[11px] mb-1">
                    {docType === 'masuk' ? 'Pemilik / Penyerah Unit,' : 'Penerima Unit & Puas Hasil Servis,'}
                  </p>
                  <p className="text-[10px] text-stone-400 italic">Menyetujui syarat & ketentuan</p>
                  <div className="h-16 flex items-end justify-center">
                    <span className="text-[10px] text-stone-300 select-none">(Tanda Tangan Asli)</span>
                  </div>
                  <div className="border-t border-stone-400 mx-8 pt-1">
                    <p className="font-bold text-stone-900 uppercase text-[11px]">{order.customerName}</p>
                    <p className="text-[10px] text-stone-500">Pelanggan</p>
                  </div>
                </div>

                {/* Tanda Tangan Petugas Toko */}
                <div>
                  <p className="text-stone-600 text-[11px] mb-1">
                    {docType === 'masuk' ? 'Hormat Kami, Petugas Penerima,' : 'Hormat Kami, Teknisi Penanggung Jawab,'}
                  </p>
                  <p className="text-[10px] text-stone-400 italic">{config.storeName}</p>
                  <div className="h-16 flex items-end justify-center">
                    <div className="w-20 h-10 border border-dashed border-blue-400 rounded flex items-center justify-center text-[9px] text-blue-600 font-bold uppercase tracking-wider bg-blue-50/50">
                      STEMPEL TOKO
                    </div>
                  </div>
                  <div className="border-t border-stone-400 mx-8 pt-1">
                    <p className="font-bold text-stone-900 uppercase text-[11px]">
                      {docType === 'masuk' ? (order.receivedBy || 'Petugas Kasir') : (order.technicianName || 'Tim Teknisi')}
                    </p>
                    <p className="text-[10px] text-stone-500">Official Staff</p>
                  </div>
                </div>
              </div>

              {/* FOOTER NOTA */}
              <div className="text-center text-[9px] text-stone-400 mt-5 border-t border-stone-200 pt-2 flex justify-between">
                <span>Dokumen dicetak otomatis oleh Sistem Manajemen Service HP & Keuangan</span>
                <span>Halaman 1 dari 1 (Layout Resmi Ukuran Kertas A4: 210 x 297 mm)</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
