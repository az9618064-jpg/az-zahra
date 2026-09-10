import React, { useState } from 'react';
import { 
  Users, Moon, Sun, Store, Plus, Key, Check, Trash2, 
  ShieldCheck, AlertCircle, AlertTriangle, Save, Smartphone, Phone, Mail, 
  MapPin, Clock, FileText, ToggleLeft, ToggleRight, Sparkles,
  CloudUpload, RefreshCw, Database, Lock, Wallet, History, Pencil,
  Shield, Eye, EyeOff
} from 'lucide-react';
import { UserAccount, StoreConfig, UserRole, SecuritySettings, CapitalHistoryLog } from '../types';
import { getStoredGasUrl, deleteUserFromSheets } from '../services/googleSheetsService';
import { formatRupiah } from '../utils/formatters';
import { EditCapitalModal } from './EditCapitalModal';
import { CapitalHistoryModal } from './CapitalHistoryModal';

interface SettingsViewProps {
  storeConfig: StoreConfig;
  onUpdateStoreConfig: (newConfig: StoreConfig) => void;
  users: UserAccount[];
  onUpdateUsers: (newUsers: UserAccount[]) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser: UserAccount;
  onShowToast: (msg: string) => void;
  ordersCount?: number;
  transactionsCount?: number;
  onResetDatabase?: () => void;
  securitySettings: SecuritySettings;
  onUpdateSecuritySettings: (settings: SecuritySettings) => void;
  initialCapital: number;
  onUpdateCapital: (amount: number, reason: string) => void;
  capitalLogs: CapitalHistoryLog[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  storeConfig,
  onUpdateStoreConfig,
  users,
  onUpdateUsers,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  onShowToast,
  ordersCount = 0,
  transactionsCount = 0,
  onResetDatabase,
  securitySettings,
  onUpdateSecuritySettings,
  initialCapital,
  onUpdateCapital,
  capitalLogs
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'staff' | 'store' | 'appearance' | 'security' | 'database'>('staff');

  // Reset Database State
  const [showResetDbModal, setShowResetDbModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Capital Modal States inside Settings
  const [showEditCapitalInSettings, setShowEditCapitalInSettings] = useState(false);
  const [showCapitalHistoryInSettings, setShowCapitalHistoryInSettings] = useState(false);

  // Local state for Store Config Form
  const [formData, setFormData] = useState<StoreConfig>({ ...storeConfig });

  // Add Staff Modal State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'petugas' as UserRole,
    phone: ''
  });

  // Reset Password Modal State
  const [selectedStaffForPassword, setSelectedStaffForPassword] = useState<UserAccount | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // Delete User Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Syncing to GAS
  const [isSyncingGas, setIsSyncingGas] = useState(false);

  // Handle save store config
  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStoreConfig(formData);
    onShowToast('Informasi Toko AZ-ZAHRA SERVICE & Pengaturan Nota A4 berhasil disimpan!');
  };

  // Handle add new staff
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.username.trim() || !newStaff.password.trim() || !newStaff.fullName.trim()) {
      onShowToast('Harap lengkapi semua kolom wajib staf.');
      return;
    }

    // Check duplicate username
    if (users.some(u => u.username.toLowerCase() === newStaff.username.trim().toLowerCase())) {
      onShowToast('Username sudah dipakai oleh staf lain.');
      return;
    }

    const created: UserAccount = {
      id: 'USR-' + String(users.length + 1).padStart(3, '0'),
      username: newStaff.username.trim().toLowerCase(),
      password: newStaff.password.trim(),
      fullName: newStaff.fullName.trim(),
      role: newStaff.role,
      phone: newStaff.phone.trim() || '-',
      isActive: true,
      createdAt: new Date().toISOString().substring(0, 10)
    };

    onUpdateUsers([...users, created]);
    setShowAddStaffModal(false);
    setNewStaff({
      username: '',
      password: '',
      fullName: '',
      role: 'petugas',
      phone: ''
    });
    onShowToast(`Staf baru "${created.fullName}" berhasil ditambahkan.`);
  };

  // Handle change password
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForPassword || !newPasswordValue.trim()) return;

    const updated = users.map(u => {
      if (u.id === selectedStaffForPassword.id) {
        return { ...u, password: newPasswordValue.trim() };
      }
      return u;
    });

    onUpdateUsers(updated);
    onShowToast(`Password untuk staf ${selectedStaffForPassword.fullName} berhasil diperbarui.`);
    setSelectedStaffForPassword(null);
    setNewPasswordValue('');
  };

  // Toggle user active status
  const handleToggleUserStatus = (userId: string) => {
    if (userId === currentUser.id) {
      onShowToast('Anda tidak dapat menonaktifkan akun yang sedang digunakan saat ini.');
      return;
    }

    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, isActive: !u.isActive };
      }
      return u;
    });
    onUpdateUsers(updated);
    onShowToast('Status staf berhasil diperbarui.');
  };

  // Request delete user with safety checks
  const handleRequestDeleteUser = (user: UserAccount) => {
    if (user.id === currentUser.id) {
      onShowToast('Akun yang sedang aktif digunakan dilindungi dan tidak dapat dihapus.');
      return;
    }
    if (user.role === 'owner') {
      onShowToast('Akun dengan peran Owner/Pemilik dilindungi dan tidak dapat dihapus.');
      return;
    }
    setUserToDelete(user);
  };

  // Confirm delete user handler with instant UI update & Google Sheets sync
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;

    if (userToDelete.id === currentUser.id) {
      onShowToast('Akun Anda sendiri dilindungi dan tidak dapat dihapus.');
      setUserToDelete(null);
      return;
    }
    if (userToDelete.role === 'owner') {
      onShowToast('Akun Owner dilindungi dan tidak dapat dihapus.');
      setUserToDelete(null);
      return;
    }

    setIsDeletingUser(true);
    const target = userToDelete;
    const remainingUsers = users.filter(u => u.id !== target.id);

    // 1. Perbarui state data staf di UI secara instant
    onUpdateUsers(remainingUsers);
    onShowToast(`Staf "${target.fullName}" (@${target.username}) berhasil dihapus.`);
    setUserToDelete(null);

    // 2. Sinkronisasi Database Google Sheets (az9618064@gmail.com) jika terhubung
    const gasUrl = getStoredGasUrl();
    if (gasUrl) {
      try {
        const res = await deleteUserFromSheets(gasUrl, {
          id: target.id,
          username: target.username,
          fullName: target.fullName
        }, remainingUsers);

        if (res.status === 'success') {
          onShowToast(`Database Google Sheets (az9618064@gmail.com) berhasil disinkronkan: ${res.message || 'Akun staf terhapus'}`);
        } else {
          console.warn('Google Sheets response:', res);
        }
      } catch (err: any) {
        console.error('Error sync delete user to Google Sheets:', err);
        onShowToast(`Staf terhapus lokal, namun gagal menghubungi Google Sheets: ${err.message || 'Koneksi terputus'}`);
      }
    }

    setIsDeletingUser(false);
  };

  // Sync users to Google Sheets
  const handleSyncUsersToSheets = async () => {
    const gasUrl = getStoredGasUrl();
    if (!gasUrl) {
      onShowToast('URL Web App Google Sheets belum diatur. Silakan buka tab Cloud Google Sheets.');
      return;
    }

    setIsSyncingGas(true);
    try {
      // Send webhook to GAS
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'sync_users',
          users: users
        })
      });
      const data = await res.json();
      onShowToast('Data staf berhasil disinkronkan ke tab "Users" Google Sheets!');
    } catch (err: any) {
      onShowToast('Gagal sinkron staf ke Google Sheets: ' + (err.message || 'Periksa koneksi'));
    } finally {
      setIsSyncingGas(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* HEADER SETTINGS BANNER (Biru Dominan dengan Aksen Kuning & Merah) */}
      <div className="bg-blue-800 border-2 border-blue-700 text-white p-6 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400 text-stone-950 font-black rounded-full text-xs uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Panel Khusus Owner & Administrator
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Pengaturan Sistem & Manajemen Staf
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl">
              Kelola data staf toko, hak akses operasional kasir/teknisi, profil identitas toko <strong className="text-yellow-300">AZ-ZAHRA SERVICE</strong>, serta pengaturan cetak nota A4 resmi.
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={onToggleDarkMode}
              className="px-4 py-2.5 bg-blue-900/80 hover:bg-blue-950 text-yellow-300 border border-blue-600 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-yellow-400" />
                  Mode Terang
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-300" />
                  Mode Gelap
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex border-b border-stone-200 dark:border-stone-700 gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('staff')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeSubTab === 'staff'
              ? 'border-blue-700 text-blue-700 dark:text-blue-400 font-black'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          Manajemen Tim Staf ({users.length})
        </button>

        <button
          onClick={() => setActiveSubTab('store')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeSubTab === 'store'
              ? 'border-blue-700 text-blue-700 dark:text-blue-400 font-black'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
          }`}
        >
          <Store className="w-4 h-4 text-blue-600" />
          Profil Toko & Aturan Nota A4
        </button>

        <button
          onClick={() => setActiveSubTab('appearance')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeSubTab === 'appearance'
              ? 'border-blue-700 text-blue-700 dark:text-blue-400 font-black'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
          }`}
        >
          {isDarkMode ? <Moon className="w-4 h-4 text-blue-500" /> : <Sun className="w-4 h-4 text-yellow-500" />}
          Tampilan & Tema Warna
        </button>

        {currentUser.role === 'owner' && (
          <button
            onClick={() => setActiveSubTab('security')}
            className={`pb-3 px-4 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeSubTab === 'security'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-black'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            Proteksi & Keamanan Sensitif
          </button>
        )}

        {currentUser.role === 'owner' && (
          <button
            onClick={() => setActiveSubTab('database')}
            className={`pb-3 px-4 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeSubTab === 'database'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-black'
                : 'border-transparent text-stone-500 hover:text-red-600 dark:hover:text-red-400'
            }`}
          >
            <Database className="w-4 h-4 text-red-600" />
            Reset Database
            {(ordersCount > 0 || transactionsCount > 0) && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-[10px]">
                {ordersCount + transactionsCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* SUB-TAB 1: MANAJEMEN STAF */}
      {activeSubTab === 'staff' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-700" />
                Daftar Staf & Akun Hak Akses Toko
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Atur peran operasional: Owner (Akses Penuh), Kasir (Input Servis & Keuangan), dan Teknisi (Antrean Pengerjaan & Diagnosa).
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSyncUsersToSheets}
                disabled={isSyncingGas}
                className="px-3 py-2 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Kirim daftar staf ke Google Sheets Tab Users"
              >
                {isSyncingGas ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5 text-emerald-600" />}
                Sync ke Sheet
              </button>

              <button
                onClick={() => setShowAddStaffModal(true)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-yellow-300" />
                Tambah Staf Baru
              </button>
            </div>
          </div>

          {/* Tabel Staf */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-blue-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 font-bold border-b border-stone-200 dark:border-stone-700">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Role / Hak Akses</th>
                    <th className="py-3 px-4">WhatsApp</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-700/60">
                  {users.map((user) => {
                    const isSelf = user.id === currentUser.id;
                    const isOwner = user.role === 'owner';
                    const isProtected = isSelf || isOwner;
                    return (
                      <tr key={user.id} className="hover:bg-stone-50 dark:hover:bg-stone-700/30">
                        <td className="py-3 px-4 font-mono font-bold text-stone-500">{user.id}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-stone-900 dark:text-white text-xs">{user.fullName}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 rounded text-[9px] font-bold">
                                Akun Anda
                              </span>
                            )}
                            {isOwner && !isSelf && (
                              <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300 rounded text-[9px] font-bold">
                                Owner
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-700 dark:text-stone-300">
                          @{user.username}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            user.role === 'owner'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : user.role === 'petugas'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}>
                            {user.role === 'owner' ? 'Owner / Admin' : user.role === 'petugas' ? 'Kasir' : 'Teknisi'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-600 dark:text-stone-400">{user.phone || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                            user.isActive ? 'text-emerald-600' : 'text-stone-400'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                            {user.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStaffForPassword(user);
                                setNewPasswordValue('');
                              }}
                              className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg transition-colors cursor-pointer"
                              title="Ganti / Reset Password"
                            >
                              <Key className="w-3.5 h-3.5 text-blue-600" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(user.id)}
                              disabled={isProtected}
                              className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                              title={isProtected ? 'Akun Owner / Akun Aktif Dilindungi' : (user.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun')}
                            >
                              {user.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-stone-400" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRequestDeleteUser(user)}
                              disabled={isProtected}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isProtected
                                  ? 'opacity-25 cursor-not-allowed text-stone-400'
                                  : 'hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 cursor-pointer'
                              }`}
                              title={
                                isSelf 
                                  ? 'Akun Anda sedang aktif (Dilindungi)' 
                                  : isOwner 
                                  ? 'Akun Owner Toko (Dilindungi)' 
                                  : `Hapus Akun Staf ${user.fullName}`
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PROFIL TOKO & ATURAN NOTA A4 */}
      {activeSubTab === 'store' && (
        <form onSubmit={handleSaveStore} className="space-y-5">
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-700" />
              Informasi Resmi Toko (Muncul pada Kop Nota A4 & Footer)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Nama Toko
                </label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-300 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Slogan / Tagline (Sub-Header Nota A4)
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Alamat Lengkap Workshop
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  No. WhatsApp Resmi Toko
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-mono text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Email Toko
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-mono text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Jam Operasional Toko
                </label>
                <input
                  type="text"
                  value={formData.operationalHours}
                  onChange={(e) => setFormData({ ...formData, operationalHours: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>
          </div>

          {/* Aturan & Klausul Nota A4 */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" />
              Syarat & Ketentuan yang Dicetak pada Lembar Nota A4
            </h3>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                Klausul Nota Service Masuk (Tanda Terima) - 1 baris per poin:
              </label>
              <textarea
                rows={4}
                value={formData.termsMasuk.join('\n')}
                onChange={(e) => setFormData({ ...formData, termsMasuk: e.target.value.split('\n').filter(Boolean) })}
                className="w-full p-3 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-sans text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                Klausul Nota Service Keluar & Kartu Garansi - 1 baris per poin:
              </label>
              <textarea
                rows={4}
                value={formData.termsKeluar.join('\n')}
                onChange={(e) => setFormData({ ...formData, termsKeluar: e.target.value.split('\n').filter(Boolean) })}
                className="w-full p-3 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-sans text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-700/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 text-yellow-300" />
              Simpan Informasi Toko & Perbarui Nota A4
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 3: TAMPILAN & TEMA WARNA */}
      {activeSubTab === 'appearance' && (
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-500" />
              Pilihan Mode Tampilan (Dark / Light Mode)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Ubah gaya tampilan antarmuka sesuai kenyamanan mata di meja kasir maupun meja kerja teknisi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => { if (isDarkMode) onToggleDarkMode(); }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                !isDarkMode
                  ? 'border-blue-700 bg-blue-50/50 shadow-md ring-2 ring-blue-600/20'
                  : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold text-sm text-stone-900 dark:text-white">Mode Terang (Light Mode)</span>
                </div>
                {!isDarkMode && <Check className="w-5 h-5 text-blue-700" />}
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Tampilan bersih cerah dengan latar putih & abu lembut, teks hitam tajam (high contrast), dan aksen biru-merah-kuning khas AZ-ZAHRA SERVICE. Direkomendasikan untuk pencetakan nota & operasional siang hari.
              </p>
            </div>

            <div
              onClick={() => { if (!isDarkMode) onToggleDarkMode(); }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                isDarkMode
                  ? 'border-blue-500 bg-stone-900 shadow-md ring-2 ring-blue-500/20'
                  : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-sm text-stone-900 dark:text-white">Mode Gelap (Dark Mode)</span>
                </div>
                {isDarkMode && <Check className="w-5 h-5 text-blue-400" />}
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Tampilan gelap elegan yang meredam silau cahaya monitor, sangat nyaman untuk mata teknisi saat melakukan micro-soldering atau pengecekan skematik di ruangan minim cahaya.
              </p>
            </div>
          </div>

          {/* PALET WARNA IDENTITAS TOKO */}
          <div className="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
              Palet Identitas Visual Toko AZ-ZAHRA SERVICE
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-blue-700 text-white rounded-xl space-y-1">
                <span className="font-bold block">Biru Utama</span>
                <span className="text-[10px] text-blue-200">Header, Navigasi & Card</span>
              </div>
              <div className="p-3 bg-red-600 text-white rounded-xl space-y-1">
                <span className="font-bold block">Merah Aksen</span>
                <span className="text-[10px] text-red-200">Aksi Tegas & Status Kritis</span>
              </div>
              <div className="p-3 bg-yellow-400 text-stone-950 rounded-xl space-y-1">
                <span className="font-bold block">Kuning Emas</span>
                <span className="text-[10px] text-stone-800">Badge & Sorotan Kasir</span>
              </div>
              <div className="p-3 bg-stone-900 text-white rounded-xl space-y-1">
                <span className="font-bold block">Hitam Tegas</span>
                <span className="text-[10px] text-stone-300">Teks Kontras Tinggi (Anti Silau)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: RESET DATABASE (DATA BERSIH KHUSUS OWNER) */}
      {activeSubTab === 'database' && currentUser.role === 'owner' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs">
            <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-red-600" />
              Pembersihan & Reset Database Sistem (Data Bersih)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Gunakan fitur ini untuk membersihkan seluruh data bawaan / demo antrean service dan transaksi keuangan sebelum aplikasi dipakai resmi untuk pelanggan toko <strong className="text-blue-600">AZ-ZAHRA SERVICE</strong>.
            </p>
          </div>

          {/* Status Data Saat Ini */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">Antrean Service</span>
                <span className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-xl">
                  <Smartphone className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-stone-900 dark:text-white mt-2">{ordersCount}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Unit tercatat di sistem</p>
            </div>

            <div className="p-4 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">Buku Kas Keuangan</span>
                <span className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-stone-900 dark:text-white mt-2">{transactionsCount}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Entri kas masuk & keluar</p>
            </div>

            <div className="p-4 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">Akun Staf Terdaftar</span>
                <span className="p-2 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 rounded-xl">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-stone-900 dark:text-white mt-2">{users.length}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">✓ Dilindungi (Tidak Dihapus)</p>
            </div>

            <div className="p-4 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">Format Nota A4 & Toko</span>
                <span className="p-2 bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-400 rounded-xl">
                  <Store className="w-4 h-4" />
                </span>
              </div>
              <p className="text-sm font-black text-stone-900 dark:text-white mt-2">AZ-ZAHRA SERVICE</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">✓ Dilindungi (Tidak Dihapus)</p>
            </div>
          </div>

          {/* PERINGATAN & TOMBOL EKSEKUSI RESET */}
          <div className="p-6 bg-red-50 dark:bg-red-950/30 rounded-3xl border-2 border-red-300 dark:border-red-900/60 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-600 text-white rounded-2xl shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-red-900 dark:text-red-300">
                  Zona Bahaya: Reset Database Demo / Dummy Data
                </h4>
                <p className="text-xs text-red-800/80 dark:text-red-400/90 leading-relaxed">
                  Menjalankan aksi ini akan <strong>menghapus permanen seluruh data antrean service ({ordersCount} unit)</strong> dan <strong>buku kas ({transactionsCount} catatan)</strong> dari memori browser lokal serta mengosongkan baris data di tab <em>Data_Service</em> dan <em>Keuangan</em> di Google Sheets.
                </p>
                <p className="text-xs text-stone-700 dark:text-stone-300 font-medium pt-1">
                  Setelah dieksekusi, database akan menjadi <strong>murni 0 data</strong>, bersih untuk input transaksi riil toko Anda.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-red-200 dark:border-red-900/60">
              <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Memerlukan otorisasi & konfirmasi sandi Owner</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setConfirmInput('');
                  setShowResetDbModal(true);
                }}
                className="w-full sm:w-auto px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Kosongkan Semua Data Demo / Dummy Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: PROTEKSI & KEAMANAN SENSITIF (KHUSUS OWNER) */}
      {activeSubTab === 'security' && currentUser.role === 'owner' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                <Shield className="w-3 h-3" />
                Sistem Otoritas Keamanan Toko
              </div>
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                Proteksi & Pembatasan Area Sensitif
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-2xl mt-0.5">
                Lindungi integritas finansial dan cegah manipulasi data dengan mengunci fitur-fitur kritis agar hanya bisa diakses oleh peran berwenang.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Otoritas Penuh: Owner
              </span>
            </div>
          </div>

          {/* 4 Security Toggles */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Daftar Aturan Pembatasan Hak Akses (Role-Based Access Control)
              </h4>
              <span className="text-[11px] text-stone-400 italic">
                Simulasi role di header dapat digunakan untuk melihat sudut pandang staf
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Toggle 1: Restriksi Ubah Modal Awal */}
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-900/40 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-xs text-stone-900 dark:text-white">
                      Restriksi Ubah Modal Awal
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Hanya Owner
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                    Kunci kolom modal di Rekap Keuangan agar staf Kasir/Teknisi hanya melihat indikator read-only. Perubahan modal wajib melalui dialog verifikasi Owner.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !securitySettings.restrictEditCapital;
                    onUpdateSecuritySettings({
                      ...securitySettings,
                      restrictEditCapital: next
                    });
                    onShowToast(`Restriksi Ubah Modal Awal ${next ? 'Diaktifkan (Kunci Staf)' : 'Dinonaktifkan'}`);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    securitySettings.restrictEditCapital ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    securitySettings.restrictEditCapital ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 2: Restriksi Hapus Transaction / Nota Service */}
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-900/40 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="font-bold text-xs text-stone-900 dark:text-white">
                      Restriksi Hapus Transaksi & Nota
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                      Hanya Owner
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                    Mencegah staf Kasir/Teknisi menghapus nota antrean service atau data transaksi mutasi keuangan kas demi mencegah resiko fraud.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !securitySettings.restrictDeleteService;
                    onUpdateSecuritySettings({
                      ...securitySettings,
                      restrictDeleteService: next
                    });
                    onShowToast(`Restriksi Hapus Transaksi & Nota ${next ? 'Diaktifkan (Kunci Staf)' : 'Dinonaktifkan'}`);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    securitySettings.restrictDeleteService ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    securitySettings.restrictDeleteService ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 3: Restriksi Edit Biaya Service Selesai */}
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-900/40 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-xs text-stone-900 dark:text-white">
                      Restriksi Edit Biaya Service Selesai
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      Owner & Kasir
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                    Kunci perubahan biaya jasa, sparepart, dan diskon pada nota yang sudah selesai agar tidak dapat diubah sembarangan oleh teknisi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !securitySettings.restrictEditCompletedCost;
                    onUpdateSecuritySettings({
                      ...securitySettings,
                      restrictEditCompletedCost: next
                    });
                    onShowToast(`Restriksi Edit Biaya Selesai ${next ? 'Diaktifkan (Kunci Teknisi)' : 'Dinonaktifkan'}`);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    securitySettings.restrictEditCompletedCost ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    securitySettings.restrictEditCompletedCost ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 4: Restriksi Lihat Total Laba Bersih */}
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-900/40 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-xs text-stone-900 dark:text-white">
                      Restriksi Lihat Total Laba Bersih
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      Hanya Owner
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                    Samarkan angka Laba Bersih toko dan Saldo Kas Akhir menjadi Rp •••••••• saat akun staf (Kasir/Teknisi) mengakses antarmuka.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !securitySettings.restrictViewNetProfit;
                    onUpdateSecuritySettings({
                      ...securitySettings,
                      restrictViewNetProfit: next
                    });
                    onShowToast(`Restriksi Lihat Laba Bersih ${next ? 'Diaktifkan (Khusus Owner)' : 'Dinonaktifkan'}`);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    securitySettings.restrictViewNetProfit ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    securitySettings.restrictViewNetProfit ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

            </div>
          </div>

          {/* Section 2: Quick Management of Capital Awal Toko for Owner */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-700 pb-3">
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  Pengelolaan Modal Awal Toko & Saldo Kasir
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Perubahan modal di sini akan langsung dicatat secara otomatis ke Audit Log Riwayat Perubahan Modal.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCapitalHistoryInSettings(true)}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-blue-600" />
                  <span>Riwayat Modal ({capitalLogs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEditCapitalInSettings(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Ubah Modal Awal</span>
                </button>
              </div>
            </div>

            {/* Modal Awal Display & Recent Logs Snippet */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">
                  Nominal Modal Awal Saat Ini
                </span>
                <p className="text-2xl font-black font-mono text-stone-900 dark:text-white mt-1">
                  {formatRupiah(initialCapital)}
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Tersimpan di Local Storage & Cloud Synchronizer
                </p>
              </div>

              <div className="sm:col-span-2 p-4 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">
                    Log Perubahan Terakhir
                  </span>
                  {capitalLogs.length > 0 && (
                    <span className="text-[10px] text-stone-500 font-mono">
                      {capitalLogs[0]?.timestamp}
                    </span>
                  )}
                </div>

                {capitalLogs.length > 0 ? (
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {capitalLogs[0].changedBy}
                      </span>
                      <span className="text-stone-400">mengubah modal ke:</span>
                      <strong className="font-mono text-blue-600 dark:text-blue-400">
                        {formatRupiah(capitalLogs[0].newAmount)}
                      </strong>
                    </div>
                    <p className="text-stone-600 dark:text-stone-400 italic text-[11px]">
                      "{capitalLogs[0].reason}"
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 italic">Belum ada riwayat perubahan tercatat.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UBAH MODAL AWAL DARI SETTINGS */}
      {showEditCapitalInSettings && (
        <EditCapitalModal
          currentCapital={initialCapital}
          currentUser={currentUser.fullName}
          onSave={onUpdateCapital}
          onClose={() => setShowEditCapitalInSettings(false)}
        />
      )}

      {/* MODAL RIWAYAT MODAL DARI SETTINGS */}
      {showCapitalHistoryInSettings && (
        <CapitalHistoryModal
          logs={capitalLogs}
          currentCapital={initialCapital}
          onClose={() => setShowCapitalHistoryInSettings(false)}
        />
      )}

      {/* MODAL KONFIRMASI KEAMANAN RESET DATABASE */}
      {showResetDbModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-700 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="p-2.5 bg-red-100 dark:bg-red-950/60 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-black text-base text-stone-900 dark:text-white">
                  Konfirmasi Reset Database
                </h3>
                <p className="text-xs text-stone-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-stone-700 dark:text-stone-300">
              <p>
                Anda akan menghapus seluruh data riwayat antrean service dan transaksi keuangan bawaan:
              </p>
              <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/50 space-y-1 font-semibold text-red-800 dark:text-red-300">
                <div>• {ordersCount} data unit service akan dihapus</div>
                <div>• {transactionsCount} transaksi kas masuk & keluar akan dihapus</div>
                <div className="text-emerald-700 dark:text-emerald-400 font-bold">• Akun staf & pengaturan toko tetap aman</div>
              </div>

              <div>
                <label className="block font-bold text-stone-900 dark:text-white mb-1.5">
                  Ketik kata <span className="font-mono bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded text-red-600 font-black">KOSONGKAN</span> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  placeholder="Ketik KOSONGKAN"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-center font-black tracking-wider text-sm focus:ring-2 focus:ring-red-500 outline-hidden"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setShowResetDbModal(false)}
                disabled={isResetting}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={confirmInput.trim().toUpperCase() !== 'KOSONGKAN' || isResetting}
                onClick={async () => {
                  if (confirmInput.trim().toUpperCase() !== 'KOSONGKAN') return;
                  setIsResetting(true);
                  if (onResetDatabase) {
                    await onResetDatabase();
                  }
                  setIsResetting(false);
                  setShowResetDbModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Mengosongkan Database...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Ya, Kosongkan Database Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH STAF BARU */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-700 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-700" />
                Tambah Staf / Pengguna Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Nama Lengkap Staf *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Gunawan"
                  value={newStaff.fullName}
                  onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    placeholder="misal: budi_teknisi"
                    value={newStaff.username}
                    onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Peran / Hak Akses (Role) *
                </label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-semibold"
                >
                  <option value="petugas">Kasir / Frontdesk (Input Masuk & Keluar)</option>
                  <option value="teknisi">Teknisi (Antrean Pengerjaan & Diagnosa)</option>
                  <option value="owner">Owner / Admin (Akses Penuh Seluruh Modul)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Nomor WhatsApp Staf
                </label>
                <input
                  type="text"
                  placeholder="0812..."
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GANTI PASSWORD STAF */}
      {selectedStaffForPassword && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-700 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-700" />
                Ganti Password Staf
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Ubah password login untuk: <strong className="text-stone-800 dark:text-stone-200">{selectedStaffForPassword.fullName}</strong> (@{selectedStaffForPassword.username})
              </p>
            </div>

            <form onSubmit={handleSaveNewPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  placeholder="Masukkan password baru"
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-mono"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStaffForPassword(null)}
                  className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Perbarui Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS STAF (SWEETALERT / DIALOG STYLE) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-red-200 dark:border-red-900/60 max-w-md w-full p-6 shadow-2xl space-y-4">
            
            {/* Header Dialog */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-800 shadow-xs">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-black text-base text-stone-900 dark:text-white leading-snug">
                  Konfirmasi Hapus Akun Staf
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Apakah Anda yakin ingin menghapus akun staf ini?
                </p>
              </div>
            </div>

            {/* Detail Akun Staf Yang Akan Dihapus */}
            <div className="p-4 bg-red-50/60 dark:bg-red-950/20 rounded-2xl border border-red-200/70 dark:border-red-900/40 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400 font-medium">ID Staf:</span>
                <span className="font-mono font-bold text-stone-800 dark:text-stone-200">{userToDelete.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400 font-medium">Nama Lengkap:</span>
                <span className="font-bold text-stone-900 dark:text-white">{userToDelete.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400 font-medium">Username Login:</span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-400">@{userToDelete.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400 font-medium">Peran / Jabatan:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200">
                  {userToDelete.role === 'petugas' ? 'Petugas Kasir' : userToDelete.role === 'teknisi' ? 'Teknisi Handal' : 'Owner'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400 font-medium">No. WhatsApp:</span>
                <span className="font-mono text-stone-700 dark:text-stone-300">{userToDelete.phone || '-'}</span>
              </div>
            </div>

            {/* Indikator Sinkronisasi Database Cloud Google Sheets */}
            <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700 text-[11px] text-stone-600 dark:text-stone-400 flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {getStoredGasUrl()
                  ? 'Data di tab "Users" Google Sheets (az9618064@gmail.com) akan otomatis diperbarui dan dihapus.'
                  : 'Data akan langsung dihapus dari penyimpanan lokal sistem.'}
              </span>
            </div>

            <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold leading-relaxed">
              ⚠️ Perhatian: Tindakan ini bersifat permanen. Akun staf ini tidak akan dapat digunakan lagi untuk login ke sistem AZ-ZAHRA SERVICE.
            </p>

            {/* Tombol Aksi Modal */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isDeletingUser}
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeletingUser ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-yellow-300" />
                    Ya, Hapus Staf Ini
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}


    </div>
  );
};
