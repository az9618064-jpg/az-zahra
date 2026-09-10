import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Wrench, Wallet, UserCheck, Plus, Search, 
  Printer, Send, ShieldCheck, Clock, CheckCircle2, AlertCircle,
  FileText, ArrowRight, Phone, KeyRound, Filter, RefreshCw,
  Database, User, ShieldAlert, Sparkles, ChevronRight, Layers, CreditCard,
  FileSpreadsheet, LogOut, Settings, BarChart3, Sun, Moon, TrendingUp,
  Pencil, Trash2, AlertTriangle
} from 'lucide-react';
import { ServiceOrder, UserRole, FinancialTransaction, StoreConfig, ServiceStatus, UserAccount, SecuritySettings, CapitalHistoryLog } from './types';
import { defaultStoreConfig, initialServiceOrders, initialFinancialTransactions, initialUsers } from './data/mockData';
import { formatRupiah, formatDateIndo, sanitizePhoneForWA } from './utils/formatters';
import { A4PrintModal } from './components/A4PrintModal';
import { ServiceMasukModal } from './components/ServiceMasukModal';
import { ServiceKeluarModal } from './components/ServiceKeluarModal';
import { StatusProgressionModal } from './components/StatusProgressionModal';
import { WhatsAppBlastModal } from './components/WhatsAppBlastModal';
import { FinancialModule } from './components/FinancialModule';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { GoogleSheetsIntegration } from './components/GoogleSheetsIntegration';
import { LoginScreen } from './components/LoginScreen';
import { SettingsView } from './components/SettingsView';
import { OwnerDashboard } from './components/OwnerDashboard';
import { 
  getStoredGasUrl, 
  syncServiceMasukToSheets, 
  syncServiceKeluarToSheets, 
  syncStatusUpdateToSheets,
  deleteServiceFromSheets,
  resetDatabaseSheets
} from './services/googleSheetsService';

export default function App() {
  // 1. User Accounts & Authentication State
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('servis_hp_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('servis_hp_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Current Active Role & Navigation
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return currentUser?.role || 'owner';
  });

  const [activeNav, setActiveNav] = useState<'owner_dashboard' | 'service' | 'keuangan' | 'sheets' | 'settings' | 'arsitektur'>(() => {
    return currentUser?.role === 'owner' ? 'owner_dashboard' : 'service';
  });

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('servis_hp_dark_mode') === 'true';
  });

  // Sync dark mode class on document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('servis_hp_dark_mode', isDarkMode.toString());
  }, [isDarkMode]);

  // Sync users list to localStorage
  useEffect(() => {
    localStorage.setItem('servis_hp_users', JSON.stringify(users));
  }, [users]);
  
  // Data States with LocalStorage Persistence
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(() => {
    const saved = localStorage.getItem('servis_hp_store_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old store name if present
      if (parsed.storeName?.includes('MAJU JAYA')) {
        parsed.storeName = 'AZ-ZAHRA SERVICE';
        parsed.tagline = 'Pusat Spesialis Service Smartphone & Tablet Bergaransi';
        parsed.email = 'az9618064@gmail.com';
      }
      return parsed;
    }
    return defaultStoreConfig;
  });

  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    const saved = localStorage.getItem('servis_hp_orders');
    return saved ? JSON.parse(saved) : initialServiceOrders;
  });

  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    const saved = localStorage.getItem('servis_hp_transactions');
    return saved ? JSON.parse(saved) : initialFinancialTransactions;
  });

  const [initialCapital, setInitialCapital] = useState<number>(() => {
    const saved = localStorage.getItem('servis_hp_capital');
    return saved ? Number(saved) : 15000000;
  });

  // Security & Permissions Settings State (RBAC Protection)
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => {
    const saved = localStorage.getItem('servis_hp_security_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      restrictEditCapital: true,
      restrictDeleteService: true,
      restrictEditCompletedCost: true,
      restrictViewNetProfit: true
    };
  });

  // Audit Log Riwayat Perubahan Modal Awal Toko
  const [capitalLogs, setCapitalLogs] = useState<CapitalHistoryLog[]>(() => {
    const saved = localStorage.getItem('servis_hp_capital_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'cap-init-1',
        timestamp: '2026-03-01 08:30:00',
        previousAmount: 10000000,
        newAmount: 15000000,
        changedBy: 'Owner AZ-ZAHRA SERVICE',
        reason: 'Suntik Modal Operasional Kasir & Belanja Sparepart Awal Bulan'
      }
    ];
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [showMasukModal, setShowMasukModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [selectedOrderForKeluar, setSelectedOrderForKeluar] = useState<ServiceOrder | null>(null);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<ServiceOrder | null>(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<{ order: ServiceOrder; type: 'masuk' | 'keluar' } | null>(null);
  const [selectedOrderForWA, setSelectedOrderForWA] = useState<ServiceOrder | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handler: Update / Edit existing service order
  const handleSaveEditOrder = (updatedOrder: ServiceOrder) => {
    setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setEditingOrder(null);
    showToast(`Data servis ${updatedOrder.notaNumber} berhasil diperbarui!`);

    const gasUrl = getStoredGasUrl();
    if (gasUrl) {
      syncServiceMasukToSheets(gasUrl, updatedOrder)
        .then(res => {
          if (res.status === 'success') {
            showToast(`Pembaruan ${updatedOrder.notaNumber} tersinkron ke Google Sheets!`);
          }
        })
        .catch(() => {});
    }
  };

  // Handler: Delete service order
  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const nota = orderToDelete.notaNumber;
    setIsDeletingOrder(true);
    try {
      const newOrders = orders.filter(o => o.id !== orderToDelete.id);
      setOrders(newOrders);
      localStorage.setItem('servis_hp_orders', JSON.stringify(newOrders));

      const gasUrl = getStoredGasUrl();
      if (gasUrl) {
        await deleteServiceFromSheets(gasUrl, nota);
      }
      showToast(`Data servis ${nota} berhasil dihapus.`);
    } catch (e: any) {
      showToast(`Data lokal terhapus. Sinkronisasi sheets: ${e.message || 'selesai'}`);
    } finally {
      setIsDeletingOrder(false);
      setOrderToDelete(null);
    }
  };

  // Handler: Reset Database
  const handleResetDatabase = async () => {
    setOrders([]);
    setTransactions([]);
    localStorage.setItem('servis_hp_orders', '[]');
    localStorage.setItem('servis_hp_transactions', '[]');
    showToast('Database sistem berhasil dikosongkan (0 antrean service & 0 transaksi keuangan)');

    const gasUrl = getStoredGasUrl();
    if (gasUrl) {
      try {
        const res = await resetDatabaseSheets(gasUrl);
        if (res.status === 'success') {
          showToast('Google Sheets (Tab Data_Service & Keuangan) juga telah dikosongkan!');
        } else {
          showToast(`Info Sheets: ${res.message}`);
        }
      } catch (err: any) {
        console.error('Reset sheets error:', err);
      }
    }
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('servis_hp_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('servis_hp_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('servis_hp_capital', initialCapital.toString());
  }, [initialCapital]);

  useEffect(() => {
    localStorage.setItem('servis_hp_security_settings', JSON.stringify(securitySettings));
  }, [securitySettings]);

  useEffect(() => {
    localStorage.setItem('servis_hp_capital_logs', JSON.stringify(capitalLogs));
  }, [capitalLogs]);

  // Handler: Update Modal Awal Toko dengan pencatatan audit log
  const handleUpdateCapital = (newAmount: number, reason: string) => {
    const prev = initialCapital;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const newLog: CapitalHistoryLog = {
      id: `cap-${Date.now()}`,
      timestamp: dateStr,
      previousAmount: prev,
      newAmount,
      changedBy: currentUser?.fullName || (currentRole === 'owner' ? 'Owner AZ-ZAHRA SERVICE' : 'Petugas Kasir'),
      reason: reason.trim() || 'Penyesuaian Modal Operasional'
    };

    setInitialCapital(newAmount);
    setCapitalLogs(prevLogs => [newLog, ...prevLogs]);
    showToast(`Modal Awal Toko berhasil diperbarui menjadi ${formatRupiah(newAmount)}`);
  };

  // Handler: Delete transaction mutasi kas
  const handleDeleteTransaction = (transactionId: string) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    showToast('Transaksi kas berhasil dihapus.');
  };

  // Handler: Update security settings
  const handleUpdateSecuritySettings = (newSettings: SecuritySettings) => {
    setSecuritySettings(newSettings);
  };

  // Handler: Add new service order (Masuk)
  const handleSaveMasuk = (newOrder: ServiceOrder, printNow: boolean) => {
    setOrders([newOrder, ...orders]);
    setShowMasukModal(false);
    showToast(`Unit ${newOrder.deviceBrand} ${newOrder.deviceModel} berhasil didaftarkan (${newOrder.notaNumber})`);
    
    // Auto sync to Google Sheets if configured
    const gasUrl = getStoredGasUrl();
    if (gasUrl) {
      syncServiceMasukToSheets(gasUrl, newOrder)
        .then(res => {
          if (res.status === 'success') {
            showToast(`Data ${newOrder.notaNumber} berhasil diarsipkan ke Google Sheets!`);
          }
        })
        .catch(() => {});
    }

    if (printNow) {
      setSelectedOrderForPrint({ order: newOrder, type: 'masuk' });
    }
  };

  // Handler: Complete service & release unit (Keluar)
  const handleSaveKeluar = (updatedOrder: ServiceOrder, printNow: boolean) => {
    setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setSelectedOrderForKeluar(null);

    // Auto-record to Financial Transactions if paid
    if (updatedOrder.paymentStatus === 'lunas' || updatedOrder.paymentStatus === 'dp') {
      const netPaid = updatedOrder.totalCost - (updatedOrder.depositPaid && updatedOrder.paymentStatus === 'lunas' ? 0 : 0);
      const newTrx: FinancialTransaction = {
        id: 'trx-' + Date.now(),
        date: new Date().toLocaleString('sv-SE').substring(0, 16),
        type: 'income',
        category: 'service_fee',
        title: `Pelunasan Servis ${updatedOrder.notaNumber} (${updatedOrder.deviceBrand} ${updatedOrder.deviceModel} - ${updatedOrder.customerName})`,
        amount: netPaid,
        referenceId: updatedOrder.notaNumber,
        recordedBy: currentRole === 'owner' ? 'Owner (Admin)' : 'Kasir',
        notes: `Tindakan: ${updatedOrder.repairActionDetails || '-'}. Garansi: ${updatedOrder.warrantyDays} hari.`
      };
      setTransactions([newTrx, ...transactions]);
    }

    // Auto sync to Google Sheets if configured
    const gasUrl = getStoredGasUrl();
    if (gasUrl) {
      syncServiceKeluarToSheets(gasUrl, updatedOrder)
        .then(res => {
          if (res.status === 'success') {
            showToast(`Service Keluar ${updatedOrder.notaNumber} tersinkronisasi di Google Sheets & Kas!`);
          }
        })
        .catch(() => {});
    }

    showToast(`Unit ${updatedOrder.notaNumber} berhasil diserahterimakan & dicatat ke keuangan`);

    if (printNow) {
      setSelectedOrderForPrint({ order: updatedOrder, type: 'keluar' });
    }
  };

  // Handler: Update progress / status
  const handleUpdateStatus = (updatedOrder: ServiceOrder, openWA: boolean) => {
    setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setSelectedOrderForStatus(null);
    showToast(`Status servis ${updatedOrder.notaNumber} diubah menjadi: ${updatedOrder.status.toUpperCase()}`);

    // Auto sync to Google Sheets if configured
    const gasUrl = getStoredGasUrl();
    if (gasUrl) {
      syncStatusUpdateToSheets(
        gasUrl,
        updatedOrder.notaNumber,
        updatedOrder.status,
        updatedOrder.technicianName || '',
        updatedOrder.diagnosisNotes || ''
      ).then(res => {
        if (res.status === 'success') {
          showToast(`Status ${updatedOrder.notaNumber} terupdate di Google Sheets!`);
        }
      }).catch(() => {});
    }

    if (openWA) {
      setSelectedOrderForWA(updatedOrder);
    }
  };

  // Filtered orders list
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery) ||
      order.deviceBrand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.deviceModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.notaNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.imei && order.imei.includes(searchQuery));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    // Role specific visibility adjustments (Teknisi prioritizes active repair queue)
    return matchesSearch && matchesStatus;
  });

  // Metric counts for quick badges
  const activeQueueCount = orders.filter(o => o.status !== 'keluar' && o.status !== 'dibatalkan').length;
  const readyToPickCount = orders.filter(o => o.status === 'selesai').length;
  const inProgressCount = orders.filter(o => o.status === 'pengerjaan' || o.status === 'pengecekan').length;

  // SCREEN GUARD: Show dedicated Login Screen if no active session
  if (!currentUser) {
    return (
      <LoginScreen
        storeConfig={storeConfig}
        users={users}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentRole(user.role);
          localStorage.setItem('servis_hp_active_user', JSON.stringify(user));
          if (user.role === 'owner') {
            setActiveNav('owner_dashboard');
          } else {
            setActiveNav('service');
          }
          showToast(`Selamat datang, ${user.fullName}!`);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-slate-900 text-stone-900 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-stone-700 animate-fade-in text-xs sm:text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOPBAR / APP HEADER - TEMA KHAS BIRU DOMINAN AZ-ZAHRA SERVICE */}
      <header className="sticky top-0 z-30 bg-blue-800 text-white border-b border-blue-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Brand Logo & Name (AZ-ZAHRA SERVICE) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-yellow-300 border border-blue-700 flex items-center justify-center shadow-md">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-white text-base sm:text-lg tracking-tight leading-none">
                  {storeConfig.storeName || 'AZ-ZAHRA SERVICE'}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-black bg-yellow-400 text-stone-950 rounded shadow-2xs uppercase">
                  Service HP Pro
                </span>
              </div>
              <p className="text-[11px] text-blue-200 mt-0.5 hidden sm:block font-medium">
                {storeConfig.tagline || 'Pusat Spesialis Service Smartphone & Tablet Bergaransi'}
              </p>
            </div>
          </div>

          {/* User Profile & Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Active User Information Chip */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-900/80 border border-blue-700 rounded-xl text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div className="text-left">
                <p className="font-bold text-white text-[11px] leading-tight">
                  {currentUser.fullName}
                </p>
                <p className="text-[9px] text-yellow-300 font-mono uppercase font-bold">
                  {currentRole === 'owner' ? 'Owner / Admin' : currentRole === 'petugas' ? 'Petugas Kasir' : 'Teknisi Handal'}
                </p>
              </div>
            </div>

            {/* Quick Perspective Switcher (Khusus Owner untuk melihat UI staf) */}
            {currentUser.role === 'owner' && (
              <div className="hidden lg:flex items-center bg-blue-900/90 p-1 rounded-xl border border-blue-700 text-xs">
                <span className="text-[9px] font-bold text-blue-200 uppercase px-1.5">
                  Simulasi Role:
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentRole('owner')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    currentRole === 'owner'
                      ? 'bg-yellow-400 text-stone-950 shadow-xs'
                      : 'text-blue-200 hover:text-white'
                  }`}
                >
                  Owner
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentRole('petugas')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    currentRole === 'petugas'
                      ? 'bg-yellow-400 text-stone-950 shadow-xs'
                      : 'text-blue-200 hover:text-white'
                  }`}
                >
                  Kasir
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentRole('teknisi')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    currentRole === 'teknisi'
                      ? 'bg-yellow-400 text-stone-950 shadow-xs'
                      : 'text-blue-200 hover:text-white'
                  }`}
                >
                  Teknisi
                </button>
              </div>
            )}

            {/* Dark Mode Quick Toggle */}
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 bg-blue-900/80 hover:bg-blue-950 text-yellow-300 border border-blue-700 rounded-xl transition-colors cursor-pointer"
              title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick Button Input HP Masuk (Warna Merah Aksen) */}
            {(currentRole === 'petugas' || currentRole === 'owner') && (
              <button
                type="button"
                onClick={() => setShowMasukModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-yellow-300" />
                <span className="hidden sm:inline">Terima HP Masuk</span>
                <span className="sm:hidden">Masuk</span>
              </button>
            )}

            {/* Tombol Logout Aman */}
            <button
              type="button"
              onClick={() => {
                setCurrentUser(null);
                localStorage.removeItem('servis_hp_active_user');
                showToast('Anda telah logout dari sistem.');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-950/80 hover:bg-red-600 text-white border border-blue-700 hover:border-red-500 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Keluar dari akun sistem"
            >
              <LogOut className="w-3.5 h-3.5 text-yellow-300" />
              <span className="hidden sm:inline">Keluar</span>
            </button>

          </div>

        </div>

        {/* Primary Navigation Tabs */}
        <div className="bg-blue-900/90 border-t border-blue-700/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto text-xs font-bold scrollbar-none py-1">
            
            {/* Tab 1: Dashboard Statistik Owner (Khusus Owner) */}
            {currentRole === 'owner' && (
              <button
                onClick={() => setActiveNav('owner_dashboard')}
                className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeNav === 'owner_dashboard'
                    ? 'bg-yellow-400 text-stone-950 font-black shadow-xs'
                    : 'text-blue-100 hover:bg-blue-800/80 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Dashboard Owner
              </button>
            )}

            {/* Tab 2: Antrean & Data Service HP */}
            <button
              onClick={() => setActiveNav('service')}
              className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeNav === 'service'
                  ? 'bg-yellow-400 text-stone-950 font-black shadow-xs'
                  : 'text-blue-100 hover:bg-blue-800/80 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Antrean Service HP
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeNav === 'service' ? 'bg-stone-950 text-yellow-300' : 'bg-blue-800 text-yellow-300'
              }`}>
                {activeQueueCount}
              </span>
            </button>

            {/* Tab 3: Rekap Keuangan & Laba Bersih */}
            {(currentRole === 'owner' || currentRole === 'petugas') && (
              <button
                onClick={() => setActiveNav('keuangan')}
                className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeNav === 'keuangan'
                    ? 'bg-yellow-400 text-stone-950 font-black shadow-xs'
                    : 'text-blue-100 hover:bg-blue-800/80 hover:text-white'
                }`}
              >
                <Wallet className="w-4 h-4" />
                Rekap Keuangan & Laba
              </button>
            )}

            {/* Tab 4: Cloud Google Sheets */}
            <button
              onClick={() => setActiveNav('sheets')}
              className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeNav === 'sheets'
                  ? 'bg-yellow-400 text-stone-950 font-black shadow-xs'
                  : 'text-blue-100 hover:bg-blue-800/80 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Cloud Google Sheets
              <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded text-[9px] font-mono">
                API
              </span>
            </button>

            {/* Tab 5: Pengaturan Sistem (Khusus Owner) */}
            {currentRole === 'owner' && (
              <button
                onClick={() => setActiveNav('settings')}
                className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeNav === 'settings'
                    ? 'bg-yellow-400 text-stone-950 font-black shadow-xs'
                    : 'text-blue-100 hover:bg-blue-800/80 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                Pengaturan Sistem & Staf
              </button>
            )}

            {/* Tab 6: Blueprint Arsitektur */}
            <button
              onClick={() => setActiveNav('arsitektur')}
              className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeNav === 'arsitektur'
                  ? 'bg-yellow-400 text-stone-950 font-black shadow-xs'
                  : 'text-blue-100 hover:bg-blue-800/80 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              Blueprint Skema DB
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* VIEW 0: DASHBOARD STATISTIK EKSEKUTIF OWNER */}
        {activeNav === 'owner_dashboard' && (
          <OwnerDashboard
            orders={orders}
            transactions={transactions}
            users={users}
            onShowToast={showToast}
            securitySettings={securitySettings}
            currentRole={currentRole}
          />
        )}
        
        {/* VIEW 1: MODUL SERVICE HP */}
        {activeNav === 'service' && (
          <div className="space-y-5">
            
            {/* Summary Statistics Pill Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-stone-800 p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 shadow-2xs">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Total Masuk Aktif</span>
                <p className="text-xl font-black font-mono text-stone-900 dark:text-white mt-0.5">
                  {activeQueueCount} <span className="text-xs font-normal text-stone-400">Unit</span>
                </p>
              </div>

              <div className="bg-white dark:bg-stone-800 p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 shadow-2xs">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Dalam Pengerjaan</span>
                <p className="text-xl font-black font-mono text-blue-600 mt-0.5">
                  {inProgressCount} <span className="text-xs font-normal text-stone-400">Unit</span>
                </p>
              </div>

              <div className="bg-white dark:bg-stone-800 p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Selesai / Siap Ambil</span>
                <p className="text-xl font-black font-mono text-emerald-600 mt-0.5">
                  {readyToPickCount} <span className="text-xs font-normal text-stone-400">Unit</span>
                </p>
              </div>

              <div className="bg-white dark:bg-stone-800 p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 shadow-2xs">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Role Aktif</span>
                <p className="text-sm font-bold capitalize text-stone-800 dark:text-stone-200 mt-1 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  {currentRole === 'owner' ? 'Owner / Admin' : currentRole === 'teknisi' ? 'Teknisi Handal' : 'Petugas Kasir'}
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-stone-800 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari nama pelanggan, nomor WA, tipe HP, IMEI, atau No. Nota..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
                <span className="text-[11px] text-stone-400 font-semibold mr-1 shrink-0">Filter:</span>
                {[
                  { id: 'all', label: 'Semua Status' },
                  { id: 'diterima', label: 'Diterima' },
                  { id: 'pengecekan', label: 'Pengecekan' },
                  { id: 'pengerjaan', label: 'Pengerjaan' },
                  { id: 'selesai', label: 'Siap Ambil' },
                  { id: 'keluar', label: 'Sudah Keluar' },
                  { id: 'dibatalkan', label: 'Gagal / Retur' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                      statusFilter === f.id
                        ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold shadow-2xs'
                        : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

            </div>

            {/* Service Orders Table */}
            <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-900/60 text-stone-500 border-b border-stone-200 dark:border-stone-700 font-semibold">
                      <th className="py-3 px-4">No. Registrasi</th>
                      <th className="py-3 px-4">Pelanggan & WhatsApp</th>
                      <th className="py-3 px-4">Unit Smartphone & Kunci</th>
                      <th className="py-3 px-4">Keluhan & Diagnosa</th>
                      <th className="py-3 px-4">Status & Teknisi</th>
                      <th className="py-3 px-4 text-right">Biaya / Pembayaran</th>
                      <th className="py-3 px-4 text-center">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-700/60">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-stone-400">
                          <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          Tidak ada data service yang cocok dengan pencarian atau filter.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        return (
                          <tr 
                            key={order.id} 
                            className="hover:bg-stone-50/80 dark:hover:bg-stone-700/20 transition-colors"
                          >
                            {/* No Nota & Tanggal */}
                            <td className="py-3.5 px-4 align-top">
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block text-xs">
                                {order.notaNumber}
                              </span>
                              <span className="text-[10px] text-stone-400 font-mono">
                                Masuk: {order.receivedDate}
                              </span>
                              <div className="mt-1">
                                <span className="text-[10px] bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-1.5 py-0.5 rounded">
                                  Petugas: {order.receivedBy}
                                </span>
                              </div>
                            </td>

                            {/* Pelanggan */}
                            <td className="py-3.5 px-4 align-top">
                              <p className="font-bold text-stone-900 dark:text-white text-xs">
                                {order.customerName}
                              </p>
                              <a
                                href={`https://wa.me/${sanitizePhoneForWA(order.customerPhone)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono hover:underline inline-flex items-center gap-1 mt-0.5"
                              >
                                <Phone className="w-3 h-3" />
                                {order.customerPhone}
                              </a>
                            </td>

                            {/* Unit Smartphone & Kunci Layar */}
                            <td className="py-3.5 px-4 align-top">
                              <p className="font-bold text-stone-800 dark:text-stone-200">
                                {order.deviceBrand} {order.deviceModel}
                              </p>
                              <p className="text-[10px] text-stone-400 font-mono">
                                IMEI: {order.imei || '-'}
                              </p>
                              <div className="flex items-center gap-1 mt-1 text-[10px]">
                                <KeyRound className="w-3 h-3 text-amber-500" />
                                <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                                  {order.screenLockType.toUpperCase()}: {order.screenLockValue || 'None'}
                                </span>
                              </div>
                            </td>

                            {/* Kerusakan & Diagnosa */}
                            <td className="py-3.5 px-4 align-top max-w-xs">
                              <p className="text-stone-800 dark:text-stone-200 line-clamp-2">
                                <strong className="font-semibold">Keluhan:</strong> {order.damageDetails}
                              </p>
                              {order.diagnosisNotes && (
                                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-1 italic line-clamp-1">
                                  Teknisi: {order.diagnosisNotes}
                                </p>
                              )}
                              {order.completeness.length > 0 && (
                                <p className="text-[10px] text-stone-400 mt-1">
                                  Kelengkapan: {order.completeness.join(', ')}
                                </p>
                              )}
                            </td>

                            {/* Status & Teknisi PJ */}
                            <td className="py-3.5 px-4 align-top">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                order.status === 'diterima' ? 'bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-300' :
                                order.status === 'pengecekan' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                                order.status === 'tunggu_part' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                                order.status === 'pengerjaan' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                                order.status === 'selesai' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                                order.status === 'dibatalkan' || order.status === 'retur' ? 'bg-red-600 text-white shadow-xs' :
                                'bg-green-700 text-white'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {order.status === 'dibatalkan' ? 'GAGAL / RETUR' : order.status.replace('_', ' ')}
                              </span>
                              {order.cancelReason && (
                                <p className="text-[10px] text-red-600 dark:text-red-400 font-medium mt-1 italic">
                                  Alasan: {order.cancelReason}
                                </p>
                              )}
                              <p className="text-[10px] text-stone-500 mt-1">
                                PJ: {order.technicianName || 'Belum Ditugaskan'}
                              </p>
                            </td>

                            {/* Biaya & Pembayaran */}
                            <td className="py-3.5 px-4 align-top text-right font-mono">
                              <p className="font-bold text-stone-900 dark:text-white text-xs">
                                {formatRupiah(order.totalCost || order.estimatedCost || 0)}
                              </p>
                              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-sans font-bold uppercase mt-1 ${
                                order.paymentStatus === 'lunas' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                                order.paymentStatus === 'dp' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                                'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300'
                              }`}>
                                {order.paymentStatus.toUpperCase()}
                              </span>
                              {order.warrantyDays > 0 && order.status === 'keluar' && (
                                <p className="text-[10px] text-green-600 dark:text-green-400 font-sans mt-0.5">
                                  Garansi {order.warrantyDays} hari
                                </p>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 align-top text-center">
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                
                                {/* Tombol Print Nota A4 */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForPrint({ order, type: order.status === 'keluar' ? 'keluar' : 'masuk' })}
                                  className="p-1.5 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
                                  title="Cetak Nota Ukuran A4"
                                >
                                  <Printer className="w-4 h-4 text-blue-600" />
                                </button>

                                {/* Tombol WhatsApp Blast */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForWA(order)}
                                  className="p-1.5 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
                                  title="Generate Draft Pesan WhatsApp"
                                >
                                  <Send className="w-4 h-4 text-emerald-600" />
                                </button>

                                {/* Tombol Edit Data Service */}
                                {(currentRole === 'owner' || currentRole === 'petugas') && (
                                  <button
                                    type="button"
                                    onClick={() => setEditingOrder(order)}
                                    className="p-1.5 text-stone-700 dark:text-stone-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Data Service"
                                  >
                                    <Pencil className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </button>
                                )}

                                {/* Tombol Update Progress Teknisi */}
                                {(currentRole === 'teknisi' || currentRole === 'owner') && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForStatus(order)}
                                    className="p-1.5 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
                                    title="Update Status Pengerjaan Teknisi"
                                  >
                                    <Wrench className="w-4 h-4 text-amber-600" />
                                  </button>
                                )}

                                {/* Tombol Serah Terima Keluar / Pelunasan */}
                                {(currentRole === 'petugas' || currentRole === 'owner') && order.status !== 'keluar' && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForKeluar(order)}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-[10px] font-bold shadow-2xs cursor-pointer"
                                    title="Proses Serah Terima & Pelunasan Kasir"
                                  >
                                    Keluar
                                  </button>
                                )}

                                {/* Tombol Hapus Service */}
                                {(!securitySettings.restrictDeleteService || currentRole === 'owner') && (
                                  <button
                                    type="button"
                                    onClick={() => setOrderToDelete(order)}
                                    className="p-1.5 text-stone-700 dark:text-stone-300 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                                    title={currentRole === 'owner' ? "Hapus Data Service (Khusus Owner)" : "Hapus Data Service"}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                )}

                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: MODUL REKAP KEUANGAN */}
        {activeNav === 'keuangan' && (
          <FinancialModule
            transactions={transactions}
            serviceOrders={orders}
            initialCapital={initialCapital}
            onUpdateCapital={handleUpdateCapital}
            onAddTransaction={(newTrx) => {
              setTransactions([newTrx, ...transactions]);
              showToast(`Transaksi ${newTrx.title} (${formatRupiah(newTrx.amount)}) berhasil dicatat`);
            }}
            currentRole={currentRole}
            currentUser={currentUser}
            capitalLogs={capitalLogs}
            securitySettings={securitySettings}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {/* VIEW 3: CLOUD GOOGLE SHEETS */}
        {activeNav === 'sheets' && (
          <GoogleSheetsIntegration
            orders={orders}
            transactions={transactions}
            onShowToast={showToast}
          />
        )}

        {/* VIEW 4: ARSITEKTUR & SKEMA DATABASE */}
        {activeNav === 'arsitektur' && (
          <ArchitectureDocs />
        )}

        {/* VIEW 5: PENGATURAN TOKO & MANAJEMEN STAF (KHUSUS OWNER) */}
        {activeNav === 'settings' && (
          <SettingsView
            storeConfig={storeConfig}
            onUpdateStoreConfig={(newCfg) => {
              setStoreConfig(newCfg);
              localStorage.setItem('servis_hp_store_config', JSON.stringify(newCfg));
              showToast('Konfigurasi toko AZ-ZAHRA SERVICE berhasil diperbarui');
            }}
            users={users}
            onUpdateUsers={(newUsers) => {
              setUsers(newUsers);
              localStorage.setItem('servis_hp_users', JSON.stringify(newUsers));
            }}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            currentUser={currentUser || users[0]}
            onShowToast={showToast}
            ordersCount={orders.length}
            transactionsCount={transactions.length}
            onResetDatabase={handleResetDatabase}
            securitySettings={securitySettings}
            onUpdateSecuritySettings={handleUpdateSecuritySettings}
            initialCapital={initialCapital}
            onUpdateCapital={handleUpdateCapital}
            capitalLogs={capitalLogs}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-bold text-stone-700 dark:text-stone-300">{storeConfig.storeName} • {storeConfig.tagline}</span>
          <span className="font-mono text-[11px] text-stone-400">Pusat Servis Smartphone & Tablet Bergaransi Resmi</span>
        </div>
      </footer>

      {/* ALL MODALS */}
      
      {/* 1. Modal Service Masuk */}
      {showMasukModal && (
        <ServiceMasukModal
          orderCount={orders.length}
          currentUser={currentUser?.fullName || (currentRole === 'owner' ? 'Owner Toko' : 'Petugas Kasir')}
          onSave={handleSaveMasuk}
          onClose={() => setShowMasukModal(false)}
        />
      )}

      {/* 1.5. Modal Edit Service */}
      {editingOrder && (
        <ServiceMasukModal
          orderCount={orders.length}
          currentUser={currentUser?.fullName || (currentRole === 'owner' ? 'Owner Toko' : 'Petugas Kasir')}
          initialOrder={editingOrder}
          onSave={handleSaveEditOrder}
          onClose={() => setEditingOrder(null)}
        />
      )}

      {/* 1.8. Modal Konfirmasi Hapus Data Service */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-700 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="p-2.5 bg-red-100 dark:bg-red-950/60 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900 dark:text-white">
                  Hapus Data Service?
                </h3>
                <p className="text-xs text-stone-500">Otorisasi Khusus Owner Toko</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-stone-700 dark:text-stone-300">
              <p>
                Apakah Anda yakin ingin menghapus data service antrean berikut?
              </p>
              <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl space-y-1 font-mono text-stone-900 dark:text-stone-200">
                <div><strong>No. Nota:</strong> {orderToDelete.notaNumber}</div>
                <div><strong>Unit:</strong> {orderToDelete.deviceBrand} {orderToDelete.deviceModel}</div>
                <div><strong>Pelanggan:</strong> {orderToDelete.customerName} ({orderToDelete.customerPhone})</div>
              </div>
              <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                Data ini akan dihapus permanen dari antrean dan Google Sheets jika tersambung.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={isDeletingOrder}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteOrder}
                disabled={isDeletingOrder}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingOrder ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Hapus Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Service Keluar & Serah Terima */}
      {selectedOrderForKeluar && (
        <ServiceKeluarModal
          order={selectedOrderForKeluar}
          currentUser={currentUser?.fullName || (currentRole === 'owner' ? 'Owner Toko' : 'Petugas Kasir')}
          onSave={handleSaveKeluar}
          onClose={() => setSelectedOrderForKeluar(null)}
        />
      )}

      {/* 3. Modal Update Status Teknisi */}
      {selectedOrderForStatus && (
        <StatusProgressionModal
          order={selectedOrderForStatus}
          currentUser={currentUser?.fullName || (currentRole === 'teknisi' ? 'Teknisi Handal' : 'Owner')}
          onUpdateStatus={handleUpdateStatus}
          onClose={() => setSelectedOrderForStatus(null)}
        />
      )}

      {/* 4. Modal Cetak Dokumen A4 Resmi */}
      {selectedOrderForPrint && (
        <A4PrintModal
          order={selectedOrderForPrint.order}
          config={storeConfig}
          initialType={selectedOrderForPrint.type}
          onClose={() => setSelectedOrderForPrint(null)}
        />
      )}

      {/* 5. Modal WhatsApp Blast Generator */}
      {selectedOrderForWA && (
        <WhatsAppBlastModal
          order={selectedOrderForWA}
          config={storeConfig}
          onClose={() => setSelectedOrderForWA(null)}
        />
      )}

    </div>
  );
}
