import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, Plus, 
  ShoppingBag, Wrench, Calendar, ArrowUpRight, ArrowDownLeft,
  FileSpreadsheet, Filter, CheckCircle, Tag, X, Lock, History,
  Pencil, ShieldAlert, Trash2, AlertCircle
} from 'lucide-react';
import { FinancialTransaction, ServiceOrder, UserRole, UserAccount, CapitalHistoryLog, SecuritySettings } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { CapitalHistoryModal } from './CapitalHistoryModal';
import { EditCapitalModal } from './EditCapitalModal';

interface FinancialModuleProps {
  transactions: FinancialTransaction[];
  serviceOrders: ServiceOrder[];
  initialCapital: number;
  onUpdateCapital: (amount: number, reason: string) => void;
  onAddTransaction: (trx: FinancialTransaction) => void;
  currentRole: UserRole;
  currentUser: UserAccount | null;
  capitalLogs: CapitalHistoryLog[];
  securitySettings: SecuritySettings;
  onDeleteTransaction?: (trxId: string) => void;
}

export const FinancialModule: React.FC<FinancialModuleProps> = ({
  transactions,
  serviceOrders,
  initialCapital,
  onUpdateCapital,
  onAddTransaction,
  currentRole,
  currentUser,
  capitalLogs,
  securitySettings,
  onDeleteTransaction
}) => {
  const [activeTab, setActiveTab] = useState<'semua' | 'pemasukan' | 'pengeluaran'>('semua');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddPartSale, setShowAddPartSale] = useState(false);
  
  // Modals for Capital Edit & Audit History
  const [showEditCapitalModal, setShowEditCapitalModal] = useState(false);
  const [showCapitalHistoryModal, setShowCapitalHistoryModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<FinancialTransaction | null>(null);

  // Form states for new expense
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseCategory, setExpenseCategory] = useState<'sparepart_purchase' | 'operational' | 'salary' | 'other'>('sparepart_purchase');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Form states for direct part sale
  const [partSaleTitle, setPartSaleTitle] = useState('');
  const [partSaleAmount, setPartSaleAmount] = useState<number | ''>('');

  // Security Flags
  const isCapitalRestricted = securitySettings.restrictEditCapital && currentRole !== 'owner';
  const isNetProfitRestricted = securitySettings.restrictViewNetProfit && currentRole !== 'owner';
  const isDeleteRestricted = securitySettings.restrictDeleteService && currentRole !== 'owner';

  // Calculate totals
  // 1. Total Pendapatan: from transactions of type 'income'
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Breakdown income: Service vs Sparepart
  const serviceIncome = transactions
    .filter(t => t.type === 'income' && t.category === 'service_fee')
    .reduce((sum, t) => sum + t.amount, 0);

  const partSaleIncome = transactions
    .filter(t => t.type === 'income' && t.category === 'sparepart_sale')
    .reduce((sum, t) => sum + t.amount, 0);

  // 2. Total Pengeluaran: from transactions of type 'expense'
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const partPurchases = transactions
    .filter(t => t.type === 'expense' && t.category === 'sparepart_purchase')
    .reduce((sum, t) => sum + t.amount, 0);

  const operationalCost = transactions
    .filter(t => t.type === 'expense' && t.category === 'operational')
    .reduce((sum, t) => sum + t.amount, 0);

  // 3. Profit / Laba Bersih
  const netProfit = totalIncome - totalExpense;

  // 4. Saldo Kas Toko Saat Ini (Modal Awal + Net Profit)
  const currentCashBalance = initialCapital + netProfit;

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) return;

    const newTrx: FinancialTransaction = {
      id: 'trx-' + Date.now(),
      date: new Date().toLocaleString('sv-SE').substring(0, 16),
      type: 'expense',
      category: expenseCategory,
      title: expenseTitle.trim(),
      amount: Number(expenseAmount),
      recordedBy: currentUser?.fullName || (currentRole === 'owner' ? 'Owner Toko' : 'Petugas Kasir'),
      notes: expenseNotes.trim() || undefined
    };

    onAddTransaction(newTrx);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseNotes('');
    setShowAddExpense(false);
  };

  const handleSavePartSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partSaleTitle.trim() || !partSaleAmount) return;

    const newTrx: FinancialTransaction = {
      id: 'trx-' + Date.now(),
      date: new Date().toLocaleString('sv-SE').substring(0, 16),
      type: 'income',
      category: 'sparepart_sale',
      title: partSaleTitle.trim(),
      amount: Number(partSaleAmount),
      recordedBy: currentUser?.fullName || (currentRole === 'owner' ? 'Owner Toko' : 'Petugas Kasir')
    };

    onAddTransaction(newTrx);
    setPartSaleTitle('');
    setPartSaleAmount('');
    setShowAddPartSale(false);
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'pemasukan') return t.type === 'income';
    if (activeTab === 'pengeluaran') return t.type === 'expense';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 4 CARDS FINANCIAL METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Modal Awal Toko (Protected) */}
        <div className="bg-white dark:bg-stone-800 p-5 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Modal Awal Toko
                </span>
                {isCapitalRestricted && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <Lock className="w-2.5 h-2.5" /> Read-Only
                  </span>
                )}
              </div>
              <div className="p-2 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <p className="text-xl sm:text-2xl font-black font-mono text-stone-900 dark:text-white">
                {formatRupiah(initialCapital)}
              </p>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">Kas operasional & saldo kasir awal</p>
          </div>

          {/* Action Row: History Log & Edit Modal Button */}
          <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-700/60 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowCapitalHistoryModal(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              title="Lihat Riwayat & Audit Log Perubahan Modal"
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Modal</span>
              {capitalLogs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-mono font-bold">
                  {capitalLogs.length}
                </span>
              )}
            </button>

            {!isCapitalRestricted ? (
              <button
                type="button"
                onClick={() => setShowEditCapitalModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-yellow-700 dark:text-yellow-400 hover:text-yellow-800 bg-yellow-50 dark:bg-yellow-950/40 px-2 py-0.5 rounded-lg border border-yellow-300 dark:border-yellow-800 cursor-pointer transition-colors"
                title="Ubah Nominal Modal Awal Toko (Khusus Owner)"
              >
                <Pencil className="w-3 h-3" />
                <span>Ubah Modal</span>
              </button>
            ) : (
              <span className="text-[10px] text-stone-400 italic">
                Khusus Owner
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Total Pendapatan */}
        <div className="bg-white dark:bg-stone-800 p-5 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Total Pendapatan
              </span>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-2">
              {formatRupiah(totalIncome)}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-1 pt-2 border-t border-stone-100 dark:border-stone-700/60">
            <span>Servis: {formatRupiah(serviceIncome)}</span>
            <span>Part: {formatRupiah(partSaleIncome)}</span>
          </div>
        </div>

        {/* Card 3: Total Pengeluaran */}
        <div className="bg-white dark:bg-stone-800 p-5 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
                Total Pengeluaran
              </span>
              <div className="p-2 bg-red-100 dark:bg-red-950/50 text-red-600 rounded-xl">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono text-red-600 dark:text-red-400 mt-2">
              {formatRupiah(totalExpense)}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-1 pt-2 border-t border-stone-100 dark:border-stone-700/60">
            <span>Sparepart: {formatRupiah(partPurchases)}</span>
            <span>Ops: {formatRupiah(operationalCost)}</span>
          </div>
        </div>

        {/* Card 4: Profit / Laba Bersih (Protected from Staf) */}
        <div className="bg-linear-to-br from-stone-900 to-stone-800 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                  Profit / Laba Bersih
                </span>
                {isNetProfitRestricted && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-stone-800 text-yellow-400 border border-yellow-500/40">
                    <Lock className="w-2.5 h-2.5" /> Terkunci
                  </span>
                )}
              </div>
              <div className="p-2 bg-stone-800 text-yellow-400 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {isNetProfitRestricted ? (
              <div className="mt-3 py-1 space-y-1">
                <p className="text-xl sm:text-2xl font-black font-mono tracking-widest text-stone-400">
                  Rp ••••••••
                </p>
                <p className="text-[10px] text-yellow-300/80 flex items-center gap-1 mt-1">
                  <ShieldAlert className="w-3 h-3 shrink-0" />
                  Hanya Owner yang berwenang melihat Laba Bersih.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-black font-mono text-yellow-400 mt-2">
                  {formatRupiah(netProfit)}
                </p>
                <p className="text-[11px] text-stone-300 mt-1">
                  Saldo Kas Akhir: <strong className="text-white font-mono">{formatRupiah(currentCashBalance)}</strong>
                </p>
              </>
            )}
          </div>
        </div>

      </div>

      {/* QUICK ACTIONS & TRANSACTIONS TABLE */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden shadow-xs">
        
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex p-1 bg-stone-100 dark:bg-stone-700 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveTab('semua')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'semua'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-bold'
                    : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                Semua Mutasi ({transactions.length})
              </button>
              <button
                onClick={() => setActiveTab('pemasukan')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'pemasukan'
                    ? 'bg-white dark:bg-stone-800 text-emerald-600 font-bold shadow-xs'
                    : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                Pemasukan (+)
              </button>
              <button
                onClick={() => setActiveTab('pengeluaran')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'pengeluaran'
                    ? 'bg-white dark:bg-stone-800 text-red-600 font-bold shadow-xs'
                    : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                Pengeluaran (-)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddExpense(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Catat Pengeluaran
            </button>
            <button
              onClick={() => setShowAddPartSale(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Catat Jual Aksesoris/Part
            </button>
          </div>
        </div>

        {/* Transaction History List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-900/50 text-stone-500 font-semibold border-b border-stone-200 dark:border-stone-700">
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Kategori Mutasi</th>
                <th className="py-3 px-4">Deskripsi / No. Nota</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4 text-right">Nominal Arus Kas</th>
                <th className="py-3 px-3 text-center w-12">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-700/60">
              {filteredTransactions.map((trx) => {
                const isIncome = trx.type === 'income';
                return (
                  <tr key={trx.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-700/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-stone-600 dark:text-stone-400">
                      {formatDateIndo(trx.date)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                        trx.category === 'service_fee' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                        trx.category === 'sparepart_sale' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        trx.category === 'sparepart_purchase' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                        trx.category === 'operational' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                        'bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-300'
                      }`}>
                        <Tag className="w-3 h-3" />
                        {trx.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-stone-900 dark:text-stone-100">{trx.title}</p>
                      {trx.notes && (
                        <p className="text-[11px] text-stone-500 italic mt-0.5">{trx.notes}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-600 dark:text-stone-400 font-medium">
                      {trx.recordedBy}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                      <span className={isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        {isIncome ? '+' : '-'} {formatRupiah(trx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {onDeleteTransaction && (
                        <button
                          type="button"
                          disabled={isDeleteRestricted}
                          onClick={() => {
                            if (isDeleteRestricted) return;
                            setTransactionToDelete(trx);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDeleteRestricted
                              ? 'text-stone-300 dark:text-stone-600 cursor-not-allowed'
                              : 'text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer'
                          }`}
                          title={isDeleteRestricted ? 'Hanya Owner yang dapat menghapus transaksi' : 'Hapus transaksi ini'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* CONFIRM DELETE TRANSACTION MODAL */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-sm w-full p-5 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 dark:bg-red-950/60 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 dark:text-white text-sm">Hapus Transaksi?</h4>
                <p className="text-[11px] text-stone-500">Tindakan ini akan mempengaruhi rekap kas.</p>
              </div>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl text-xs space-y-1">
              <p className="font-semibold text-stone-800 dark:text-stone-200">{transactionToDelete.title}</p>
              <p className="font-mono font-bold text-red-600">
                {transactionToDelete.type === 'income' ? '+' : '-'} {formatRupiah(transactionToDelete.amount)}
              </p>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTransactionToDelete(null)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteTransaction && transactionToDelete) {
                    onDeleteTransaction(transactionToDelete.id);
                    setTransactionToDelete(null);
                  }
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UBAH MODAL AWAL (KHUSUS OWNER) */}
      {showEditCapitalModal && (
        <EditCapitalModal
          currentCapital={initialCapital}
          currentUser={currentUser?.fullName || 'Owner AZ-ZAHRA SERVICE'}
          onSave={onUpdateCapital}
          onClose={() => setShowEditCapitalModal(false)}
        />
      )}

      {/* MODAL RIWAYAT AUDIT LOG MODAL AWAL */}
      {showCapitalHistoryModal && (
        <CapitalHistoryModal
          logs={capitalLogs}
          currentCapital={initialCapital}
          onClose={() => setShowCapitalHistoryModal(false)}
        />
      )}

      {/* MODAL INPUT PENGELUARAN */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-5 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-stone-900 dark:text-white text-base flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-red-600" />
                Catat Pengeluaran Kas Toko
              </h3>
              <button onClick={() => setShowAddExpense(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Kategori Biaya *
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs"
                >
                  <option value="sparepart_purchase">Beli Sparepart (LCD, Baterai, IC, Timah Solder)</option>
                  <option value="operational">Operasional (Listrik, Wifi, Sewa, Kebersihan)</option>
                  <option value="salary">Gaji / Uang Makan Teknisi</option>
                  <option value="other">Pengeluaran Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Keterangan Belanja *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli 2x LCD OLED iPhone 11 di Supplier Jaya"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nominal Pengeluaran (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  placeholder="Contoh: 450000"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  placeholder="No faktur supplier, nama toko supplier, dll"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-3 py-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INPUT JUAL PART / AKSESORIS */}
      {showAddPartSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-5 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-stone-900 dark:text-white text-base flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                Catat Penjualan Sparepart / Aksesoris
              </h3>
              <button onClick={() => setShowAddPartSale(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePartSale} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nama Barang / Aksesoris *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tempered Glass Anti-Spy iPhone 13 + Pasang"
                  value={partSaleTitle}
                  onChange={(e) => setPartSaleTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nominal Penjualan (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  placeholder="Contoh: 75000"
                  value={partSaleAmount}
                  onChange={(e) => setPartSaleAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg font-mono text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPartSale(false)}
                  className="px-3 py-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Simpan Pemasukan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
