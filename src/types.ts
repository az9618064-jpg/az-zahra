export type UserRole = 'owner' | 'teknisi' | 'petugas';

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export type ServiceStatus = 
  | 'diterima'
  | 'pengecekan'
  | 'tunggu_part'
  | 'pengerjaan'
  | 'selesai'
  | 'keluar'
  | 'dibatalkan'
  | 'retur';

export type PaymentStatus = 'belum_bayar' | 'dp' | 'lunas';

export type PaymentMethod = 'tunai' | 'qris' | 'transfer_bank' | 'belum_bayar';

export interface SparepartItem {
  id: string;
  name: string;
  qty: number;
  costPrice: number; // Harga modal/beli part
  sellingPrice: number; // Harga jual ke pelanggan
}

export interface ServiceOrder {
  id: string;
  notaNumber: string; // Auto-generated: SRV-YYYY-XXXX
  
  // 1. Service Masuk (Customer & Device Info)
  customerName: string;
  customerPhone: string; // WhatsApp number
  deviceBrand: string; // Samsung, iPhone, Xiaomi, etc.
  deviceModel: string; // iPhone 13 Pro Max, dsb.
  imei: string; // 15-digit IMEI
  screenLockType: 'none' | 'pin' | 'pola' | 'password';
  screenLockValue: string; // e.g. "123456" atau visual node list "1-2-3-5-7"
  completeness: string[]; // Unit HP, SIM card, SD card, Charger, Kabel, Box, Softcase
  completenessNotes?: string;
  damageDetails: string; // Keluhan / kerusakan awal
  estimatedCost: number; // Estimasi biaya awal
  estimatedDate?: string;
  receivedDate: string; // Tanggal Masuk (ISO)
  receivedBy: string; // Nama Petugas Penerima
  
  // 2. Service Progress & Teknisi
  status: ServiceStatus;
  cancelReason?: string; // Alasan gagal service / retur / dibatalkan
  technicianName?: string; // Nama Teknisi Penanggung Jawab
  diagnosisNotes?: string; // Catatan teknisi hasil cek
  history: Array<{
    id: string;
    timestamp: string;
    status: ServiceStatus;
    note: string;
    actor: string;
  }>;
  
  // 3. Service Keluar / Selesai
  outDate?: string; // Tanggal Keluar
  repairActionDetails?: string; // Tindakan perbaikan
  replacedParts: SparepartItem[];
  technicianFee: number; // Ongkos jasa kerja teknisi
  totalCost: number; // Total Biaya (Parts + Jasa - Diskon)
  discount?: number;
  depositPaid?: number; // DP jika ada
  
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  
  warrantyDays: number; // Hari garansi (7, 14, 30, 90 hari)
  warrantyEndDate?: string; // Tanggal berakhir garansi
  handoverNotes?: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: 'service_fee' | 'sparepart_sale' | 'sparepart_purchase' | 'operational' | 'salary' | 'other';
  title: string;
  amount: number;
  referenceId?: string; // No Nota jika ada
  recordedBy: string;
  notes?: string;
}

export interface StoreConfig {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  operationalHours: string;
  termsMasuk: string[];
  termsKeluar: string[];
}

export interface CapitalHistoryLog {
  id: string;
  timestamp: string;
  previousAmount: number;
  newAmount: number;
  changedBy: string;
  reason: string;
}

export interface SecuritySettings {
  restrictEditCapital: boolean; // Hanya Owner
  restrictDeleteService: boolean; // Hanya Owner
  restrictEditCompletedCost: boolean; // Hanya Owner & Kasir
  restrictViewNetProfit: boolean; // Hanya Owner
}
