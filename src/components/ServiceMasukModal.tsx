import React, { useState } from 'react';
import { X, Smartphone, User, Phone, ShieldAlert, KeyRound, Wrench, Calendar, CheckSquare, Sparkles } from 'lucide-react';
import { ServiceOrder } from '../types';
import { generateNotaNumber } from '../utils/formatters';

interface ServiceMasukModalProps {
  orderCount: number;
  currentUser: string;
  initialOrder?: ServiceOrder;
  onSave: (order: ServiceOrder, printNow: boolean) => void;
  onClose: () => void;
}

const COMMON_BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Infinix', 'Asus ROG', 'Huawei', 'Lainnya'];
const COMPLETENESS_OPTIONS = [
  'Unit HP',
  'SIM Card',
  'Memory Card (SD)',
  'Kepala Charger',
  'Kabel Data',
  'Dusbox',
  'Casing / Softcase'
];

export const ServiceMasukModal: React.FC<ServiceMasukModalProps> = ({
  orderCount,
  currentUser,
  initialOrder,
  onSave,
  onClose
}) => {
  const isEditing = Boolean(initialOrder);
  const initialBrandIsCommon = initialOrder ? COMMON_BRANDS.includes(initialOrder.deviceBrand) : true;

  const [customerName, setCustomerName] = useState(initialOrder ? initialOrder.customerName : '');
  const [customerPhone, setCustomerPhone] = useState(initialOrder ? initialOrder.customerPhone : '');
  const [deviceBrand, setDeviceBrand] = useState(
    initialOrder 
      ? (initialBrandIsCommon ? initialOrder.deviceBrand : 'Lainnya')
      : 'Samsung'
  );
  const [customBrand, setCustomBrand] = useState(
    initialOrder && !initialBrandIsCommon ? initialOrder.deviceBrand : ''
  );
  const [deviceModel, setDeviceModel] = useState(initialOrder ? initialOrder.deviceModel : '');
  const [imei, setImei] = useState(initialOrder ? initialOrder.imei : '');
  
  // Security / Screen lock
  const [screenLockType, setScreenLockType] = useState<'none' | 'pin' | 'pola' | 'password'>(
    initialOrder ? initialOrder.screenLockType : 'pin'
  );
  const [screenLockValue, setScreenLockValue] = useState(initialOrder ? initialOrder.screenLockValue : '');
  const [patternDots, setPatternDots] = useState<number[]>([]);

  // Completeness
  const [completeness, setCompleteness] = useState<string[]>(
    initialOrder ? initialOrder.completeness : ['Unit HP']
  );
  const [completenessNotes, setCompletenessNotes] = useState(initialOrder?.completenessNotes || '');
  
  // Damage & Cost
  const [damageDetails, setDamageDetails] = useState(initialOrder ? initialOrder.damageDetails : '');
  const [estimatedCost, setEstimatedCost] = useState<number | ''>(
    initialOrder ? initialOrder.estimatedCost : ''
  );
  const [estimatedDays, setEstimatedDays] = useState('2');
  const [receivedBy, setReceivedBy] = useState(initialOrder ? initialOrder.receivedBy : currentUser);

  // Toggle completeness check
  const toggleCompleteness = (item: string) => {
    if (completeness.includes(item)) {
      setCompleteness(completeness.filter(i => i !== item));
    } else {
      setCompleteness([...completeness, item]);
    }
  };

  // Pattern click handler
  const handleDotClick = (num: number) => {
    if (!patternDots.includes(num)) {
      const next = [...patternDots, num];
      setPatternDots(next);
      setScreenLockValue(next.join('-'));
    }
  };

  const resetPattern = () => {
    setPatternDots([]);
    setScreenLockValue('');
  };

  const handleSubmit = (printNow: boolean) => {
    if (!customerName.trim() || !customerPhone.trim() || !deviceModel.trim() || !damageDetails.trim()) {
      alert('Mohon lengkapi Nama, No WhatsApp, Tipe HP, dan Detail Kerusakan terlebih dahulu.');
      return;
    }

    const now = new Date();
    const estDate = new Date();
    estDate.setDate(now.getDate() + (parseInt(estimatedDays) || 2));

    const finalBrand = deviceBrand === 'Lainnya' ? (customBrand || 'Custom Brand') : deviceBrand;

    if (initialOrder) {
      const updatedOrder: ServiceOrder = {
        ...initialOrder,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deviceBrand: finalBrand,
        deviceModel: deviceModel.trim(),
        imei: imei.trim(),
        screenLockType,
        screenLockValue: screenLockValue.trim(),
        completeness,
        completenessNotes: completenessNotes.trim() || undefined,
        damageDetails: damageDetails.trim(),
        estimatedCost: Number(estimatedCost) || 0,
        receivedBy: receivedBy.trim() || currentUser,
        history: [
          ...initialOrder.history,
          {
            id: 'h-' + Date.now(),
            timestamp: new Date().toLocaleString('sv-SE').substring(0, 16),
            status: initialOrder.status,
            note: `Informasi service diedit & diperbarui oleh ${currentUser}`,
            actor: currentUser
          }
        ]
      };
      onSave(updatedOrder, printNow);
      return;
    }

    const newOrder: ServiceOrder = {
      id: 'srv-' + Date.now(),
      notaNumber: generateNotaNumber(orderCount),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deviceBrand: finalBrand,
      deviceModel: deviceModel.trim(),
      imei: imei.trim(),
      screenLockType,
      screenLockValue: screenLockValue.trim(),
      completeness,
      completenessNotes: completenessNotes.trim() || undefined,
      damageDetails: damageDetails.trim(),
      estimatedCost: Number(estimatedCost) || 0,
      estimatedDate: estDate.toISOString().split('T')[0],
      receivedDate: new Date().toLocaleString('sv-SE').replace(' ', ' ').substring(0, 16),
      receivedBy: receivedBy.trim() || currentUser,
      status: 'diterima',
      history: [
        {
          id: 'h-' + Date.now(),
          timestamp: new Date().toLocaleString('sv-SE').substring(0, 16),
          status: 'diterima',
          note: 'Unit masuk diterima oleh petugas kasir',
          actor: receivedBy || currentUser
        }
      ],
      replacedParts: [],
      technicianFee: 0,
      totalCost: Number(estimatedCost) || 0,
      paymentStatus: 'belum_bayar',
      warrantyDays: 14
    };

    onSave(newOrder, printNow);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-center items-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-stone-900 text-white border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEditing ? `Edit Data Service (${initialOrder?.notaNumber})` : 'Input Service HP Masuk (Registrasi Baru)'}
              </h2>
              <p className="text-xs text-stone-400">
                {isEditing ? 'Perbarui identitas pelanggan, keluhan kerusakan, atau kunci layar' : 'Penerimaan unit & pencatatan keluhan pelanggan'}
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
          
          {/* BAGIAN 1: DATA PELANGGAN */}
          <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-200 dark:border-stone-700/60 space-y-3">
            <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-bold text-xs uppercase tracking-wider">
              <User className="w-4 h-4 text-blue-600" />
              1. Identitas Pelanggan
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nama Lengkap Pelanggan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nomor WhatsApp Pelanggan *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-400 text-xs">WA:</span>
                  <input
                    type="tel"
                    required
                    placeholder="0812xxxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BAGIAN 2: SPESIFIKASI UNIT SMARTPHONE & IMEI */}
          <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-200 dark:border-stone-700/60 space-y-3">
            <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-bold text-xs uppercase tracking-wider">
              <Smartphone className="w-4 h-4 text-blue-600" />
              2. Data Smartphone & Keamanan
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Merek HP
                </label>
                <select
                  value={deviceBrand}
                  onChange={(e) => setDeviceBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COMMON_BRANDS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {deviceBrand === 'Lainnya' && (
                  <input
                    type="text"
                    placeholder="Ketik Merek HP..."
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="mt-2 w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Model / Tipe HP *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: iPhone 13 Pro Max / Redmi Note 12"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nomor IMEI (15 Digit)
                </label>
                <input
                  type="text"
                  maxLength={18}
                  placeholder="869234051287654"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Kunci Layar / Sandi / Pola */}
            <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  Kunci Layar / Password Unit (Untuk Tes Hardware QC):
                </label>
                <div className="flex gap-2">
                  {(['pin', 'pola', 'password', 'none'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setScreenLockType(type); if (type === 'none') setScreenLockValue(''); }}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                        screenLockType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {screenLockType === 'pola' ? (
                <div className="bg-white dark:bg-stone-900 p-3 rounded-lg border border-stone-300 dark:border-stone-700 flex flex-col sm:flex-row items-center gap-4">
                  {/* Visual 3x3 Grid */}
                  <div className="w-32 h-32 bg-stone-100 dark:bg-stone-800 rounded-lg p-2 grid grid-cols-3 gap-2 border border-stone-300 dark:border-stone-700">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((dot) => {
                      const isSelected = patternDots.includes(dot);
                      const orderIndex = patternDots.indexOf(dot) + 1;
                      return (
                        <button
                          key={dot}
                          type="button"
                          onClick={() => handleDotClick(dot)}
                          className={`rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs scale-105'
                              : 'bg-stone-300 dark:bg-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-400'
                          }`}
                        >
                          {isSelected ? orderIndex : dot}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      Klik titik pola berurutan (1 s/d 9). Pola tersimpan:
                    </p>
                    <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm bg-stone-50 dark:bg-stone-800 px-3 py-1.5 rounded border border-stone-200 dark:border-stone-700">
                      {screenLockValue ? `Node: ${screenLockValue}` : 'Belum ada pola (klik titik)'}
                    </div>
                    <button
                      type="button"
                      onClick={resetPattern}
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Reset Pola
                    </button>
                  </div>
                </div>
              ) : screenLockType !== 'none' ? (
                <input
                  type={screenLockType === 'pin' ? 'number' : 'text'}
                  placeholder={screenLockType === 'pin' ? 'Masukkan 4 atau 6 digit PIN' : 'Ketik password layar'}
                  value={screenLockValue}
                  onChange={(e) => setScreenLockValue(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-sm"
                />
              ) : (
                <p className="text-xs text-stone-400 italic bg-stone-100 dark:bg-stone-900 p-2 rounded">
                  Unit tidak memakai kunci layar / sudah dalam keadaan terbuka.
                </p>
              )}
            </div>
          </div>

          {/* BAGIAN 3: KELENGKAPAN UNIT */}
          <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-200 dark:border-stone-700/60 space-y-2">
            <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
              3. Kelengkapan Fisik yang Dititipkan
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {COMPLETENESS_OPTIONS.map(item => {
                const checked = completeness.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleCompleteness(item)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      checked
                        ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-400 text-blue-800 dark:text-blue-200 font-semibold'
                        : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400'
                    }`}
                  >
                    <CheckSquare className={`w-3.5 h-3.5 ${checked ? 'text-blue-600' : 'text-stone-400'}`} />
                    {item}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="Catatan fisik tambahan (misal: ada lecet di backdoor, layar baret halus)..."
              value={completenessNotes}
              onChange={(e) => setCompletenessNotes(e.target.value)}
              className="mt-2 w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg"
            />
          </div>

          {/* BAGIAN 4: DETAIL KERUSAKAN & ESTIMASI BIAYA */}
          <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-200 dark:border-stone-700/60 space-y-3">
            <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-bold text-xs uppercase tracking-wider">
              <Wrench className="w-4 h-4 text-blue-600" />
              4. Detail Kerusakan & Estimasi Biaya
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Keluhan / Kerusakan Utama *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Contoh: Layar sentuh macet sebagian, layar ada garis hijau setelah jatuh, speaker telpon kresek-kresek"
                value={damageDetails}
                onChange={(e) => setDamageDetails(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Estimasi Biaya Awal (Rp)
                </label>
                <input
                  type="number"
                  placeholder="0 (atau kosongkan)"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Target Selesai (Hari)
                </label>
                <select
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-sm"
                >
                  <option value="1">1 Hari (Prioritas / Kilat)</option>
                  <option value="2">2 Hari Kerja</option>
                  <option value="3">3 - 4 Hari Kerja</option>
                  <option value="7">1 Minggu (Tunggu Part Langka)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nama Petugas Penerima
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-sm font-medium"
                />
              </div>
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
              <Sparkles className="w-4 h-4" />
              Simpan & Cetak Nota A4 Langsung
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            >
              {isEditing ? 'Simpan Perubahan Data' : 'Simpan Data Masuk'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
