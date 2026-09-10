import { ServiceOrder, FinancialTransaction, StoreConfig, UserAccount } from '../types';

export const defaultStoreConfig: StoreConfig = {
  storeName: 'AZ-ZAHRA SERVICE',
  tagline: 'Pusat Spesialis Service Smartphone & Tablet Bergaransi',
  address: 'Jl. Riau No. 45B, Kota Bandung, Jawa Barat 40115',
  phone: '081234567890',
  email: 'az9618064@gmail.com',
  operationalHours: 'Senin - Sabtu: 09.00 - 21.00 WIB | Minggu: 10.00 - 18.00 WIB',
  termsMasuk: [
    'Tanda terima ini wajib dibawa saat pengambilan unit smartphone.',
    'Toko tidak bertanggung jawab atas data di dalam memori internal/eksternal. Pelanggan disarankan telah melakukan backup sebelum perbaikan.',
    'Unit yang tidak diambil dalam waktu 45 (empat puluh lima) hari sejak konfirmasi selesai, toko tidak bertanggung jawab atas kehilangan atau kerusakan unit.',
    'Pembatalan sepihak setelah unit dalam proses pengerjaan atau sparepart telah dibeli akan dikenakan biaya pembatalan / pengetesan sebesar Rp 35.000.',
    'Pola atau sandi layar hanya digunakan untuk pengetesan fungsi hardware (speaker, mic, touch, kamera) setelah perbaikan.'
  ],
  termsKeluar: [
    'Garansi berlaku sesuai masa hari yang tertera di nota ini terhitung sejak tanggal unit diserahkan.',
    'Garansi hanya mencakup sparepart yang diganti dan jasa perbaikan yang tertera di nota.',
    'Garansi HANGUS jika: Segel toko rusak/robek, unit terkena cairan/air, layar retak/pecah fisik baru, atau unit dibongkar pihak lain.',
    'Klaim garansi wajib membawa fisik nota asli atau foto nota digital yang jelas.'
  ]
};

export const initialUsers: UserAccount[] = [
  {
    id: 'USR-001',
    username: 'owner',
    password: 'admin123',
    fullName: 'H. Ahmad Fauzi (Owner)',
    role: 'owner',
    phone: '081298765432',
    isActive: true,
    createdAt: '2025-01-01'
  },
  {
    id: 'USR-002',
    username: 'kasir',
    password: 'kasir123',
    fullName: 'Rian Pratama (Kasir Frontdesk)',
    role: 'petugas',
    phone: '081211112222',
    isActive: true,
    createdAt: '2025-01-05'
  },
  {
    id: 'USR-003',
    username: 'teknisi',
    password: 'teknisi123',
    fullName: 'Kang Asep (Teknisi Hardware)',
    role: 'teknisi',
    phone: '085733334444',
    isActive: true,
    createdAt: '2025-01-10'
  },
  {
    id: 'USR-004',
    username: 'dimas',
    password: 'teknisi123',
    fullName: 'Dimas Aditya (Teknisi Software & IC)',
    role: 'teknisi',
    phone: '085877778888',
    isActive: true,
    createdAt: '2025-02-01'
  }
];

export const initialServiceOrders: ServiceOrder[] = [
  {
    id: 'srv-1',
    notaNumber: 'SRV-2025-0101',
    customerName: 'Budi Santoso',
    customerPhone: '081298765432',
    deviceBrand: 'Apple',
    deviceModel: 'iPhone 13 Pro Max',
    imei: '354892109845123',
    screenLockType: 'pin',
    screenLockValue: '280495',
    completeness: ['Unit HP', 'Softcase'],
    completenessNotes: 'Kondisi fisik ada lecet pemakaian di bezel kanan',
    damageDetails: 'Layar blank putih (white screen issue), touch tidak respon setelah update iOS',
    estimatedCost: 1450000,
    estimatedDate: '2025-05-12',
    receivedDate: '2025-05-10 10:30',
    receivedBy: 'Rian (Kasir)',
    status: 'selesai',
    technicianName: 'Kang Asep (Teknisi)',
    diagnosisNotes: 'Jumper jalur display flex LCD OLED sukses, TrueTone dan sensor auto brightness normal.',
    repairActionDetails: 'Jumper pin flex display OLED + Re-seal lem waterproofing',
    replacedParts: [
      { id: 'p-1', name: 'Flexible Display Jumper Kit', qty: 1, costPrice: 85000, sellingPrice: 350000 },
      { id: 'p-2', name: 'Seal Waterproof iPhone 13 Pro Max', qty: 1, costPrice: 20000, sellingPrice: 75000 }
    ],
    technicianFee: 450000,
    totalCost: 875000,
    discount: 0,
    depositPaid: 200000,
    paymentStatus: 'dp',
    warrantyDays: 30,
    warrantyEndDate: '2025-06-11',
    history: [
      { id: 'h-1', timestamp: '2025-05-10 10:30', status: 'diterima', note: 'Unit masuk diterima oleh kasir', actor: 'Rian (Kasir)' },
      { id: 'h-2', timestamp: '2025-05-10 14:00', status: 'pengecekan', note: 'Pengecekan konsumsi arus baterai dan flex screen', actor: 'Kang Asep' },
      { id: 'h-3', timestamp: '2025-05-11 11:20', status: 'pengerjaan', note: 'Proses micro-soldering jumper display flex', actor: 'Kang Asep' },
      { id: 'h-4', timestamp: '2025-05-11 16:45', status: 'selesai', note: 'Selesai run test QC 4 jam, layar normal. Siap diambil.', actor: 'Kang Asep' }
    ]
  },
  {
    id: 'srv-2',
    notaNumber: 'SRV-2025-0102',
    customerName: 'Siti Aminah',
    customerPhone: '085712348899',
    deviceBrand: 'Samsung',
    deviceModel: 'Galaxy S22 Ultra',
    imei: '864219054321987',
    screenLockType: 'pola',
    screenLockValue: 'L (1-4-7-8-9)',
    completeness: ['Unit HP', 'SIM Card Tray', 'Stylus S-Pen'],
    completenessNotes: 'S-pen terpasang, SIM card di dalam slot 1',
    damageDetails: 'Mati total tiba-tiba saat dicas semalaman, lampu indikator mati',
    estimatedCost: 1800000,
    estimatedDate: '2025-05-14',
    receivedDate: '2025-05-11 13:15',
    receivedBy: 'Rian (Kasir)',
    status: 'tunggu_part',
    technicianName: 'Dimas (Teknisi)',
    diagnosisNotes: 'Short pada IC PMIC Power Management. Perlu order IC PMIC Original.',
    history: [
      { id: 'h-21', timestamp: '2025-05-11 13:15', status: 'diterima', note: 'Unit diterima untuk cek mati total', actor: 'Rian (Kasir)' },
      { id: 'h-22', timestamp: '2025-05-11 15:30', status: 'pengecekan', note: 'Diagnosa short di vbat power line', actor: 'Dimas' },
      { id: 'h-23', timestamp: '2025-05-12 09:10', status: 'tunggu_part', note: 'Menunggu kiriman IC PMIC dari supplier', actor: 'Dimas' }
    ],
    replacedParts: [],
    technicianFee: 500000,
    totalCost: 1550000,
    paymentStatus: 'belum_bayar',
    warrantyDays: 30
  },
  {
    id: 'srv-3',
    notaNumber: 'SRV-2025-0103',
    customerName: 'Hendro Wijaya',
    customerPhone: '081388776655',
    deviceBrand: 'Xiaomi',
    deviceModel: 'Redmi Note 12 Pro 5G',
    imei: '861094056782341',
    screenLockType: 'pin',
    screenLockValue: '199021',
    completeness: ['Unit HP', 'Kepala Charger', 'Kabel Data Type-C'],
    completenessNotes: 'Charger bawaan 67W original disertakan untuk test',
    damageDetails: 'Port charger kendor, tidak bisa fast charging dan harus digoyang baru masuk',
    estimatedCost: 250000,
    estimatedDate: '2025-05-12',
    receivedDate: '2025-05-11 16:00',
    receivedBy: 'Rian (Kasir)',
    status: 'keluar',
    technicianName: 'Kang Asep (Teknisi)',
    diagnosisNotes: 'Pin konektor Type C patah di dalam. Ganti papan board charging original sub-board.',
    repairActionDetails: 'Penggantian 1 set Sub-board Charging Dock Mic Redmi Note 12 Pro',
    replacedParts: [
      { id: 'p-3', name: 'Sub-Board Charging Dock Redmi Note 12', qty: 1, costPrice: 65000, sellingPrice: 150000 }
    ],
    technicianFee: 100000,
    totalCost: 250000,
    paymentStatus: 'lunas',
    paymentMethod: 'qris',
    outDate: '2025-05-12 11:30',
    warrantyDays: 14,
    warrantyEndDate: '2025-05-26',
    handoverNotes: 'Diserahkan langsung ke pemilik, ditest fast charge Turbo 67W menyala.',
    history: [
      { id: 'h-31', timestamp: '2025-05-11 16:00', status: 'diterima', note: 'Unit masuk', actor: 'Rian' },
      { id: 'h-32', timestamp: '2025-05-12 09:00', status: 'pengerjaan', note: 'Ganti sub-board charging', actor: 'Kang Asep' },
      { id: 'h-33', timestamp: '2025-05-12 10:15', status: 'selesai', note: 'Tes fungsi pengisian daya dan mic normal', actor: 'Kang Asep' },
      { id: 'h-34', timestamp: '2025-05-12 11:30', status: 'keluar', note: 'Unit diambil pemilik, pembayaran lunas via QRIS', actor: 'Rian (Kasir)' }
    ]
  },
  {
    id: 'srv-4',
    notaNumber: 'SRV-2025-0104',
    customerName: 'Dewi Lestari',
    customerPhone: '087822334455',
    deviceBrand: 'Oppo',
    deviceModel: 'Reno 8 5G',
    imei: '869234051287654',
    screenLockType: 'pola',
    screenLockValue: 'Z (1-2-3-5-7-8-9)',
    completeness: ['Unit HP'],
    damageDetails: 'Baterai cepat habis (drop) drastis dari 80% langsung 10%, tutup belakang sedikit terangkat (baterai kembung)',
    estimatedCost: 380000,
    receivedDate: '2025-05-12 09:45',
    receivedBy: 'Rian (Kasir)',
    status: 'pengerjaan',
    technicianName: 'Dimas (Teknisi)',
    diagnosisNotes: 'Baterai lithium sudah bunting / kembung level 2. Berbahaya jika ditekan.',
    repairActionDetails: 'Penggantian Baterai Original BLP921 Oppo Reno 8',
    replacedParts: [
      { id: 'p-4', name: 'Baterai Original BLP921 Oppo Reno 8', qty: 1, costPrice: 160000, sellingPrice: 280000 }
    ],
    technicianFee: 100000,
    totalCost: 380000,
    paymentStatus: 'belum_bayar',
    warrantyDays: 30,
    history: [
      { id: 'h-41', timestamp: '2025-05-12 09:45', status: 'diterima', note: 'Unit masuk baterai kembung', actor: 'Rian' },
      { id: 'h-42', timestamp: '2025-05-12 10:30', status: 'pengerjaan', note: 'Bongkar backcover, pasang baterai baru', actor: 'Dimas' }
    ]
  }
];

export const initialFinancialTransactions: FinancialTransaction[] = [
  {
    id: 'trx-0',
    date: '2025-05-01 08:00',
    type: 'income',
    category: 'other',
    title: 'Modal Awal Kas Toko Bulan Mei',
    amount: 15000000,
    recordedBy: 'Owner (Admin)',
    notes: 'Kas modal operasional dan kas register toko'
  },
  {
    id: 'trx-1',
    date: '2025-05-02 10:00',
    type: 'expense',
    category: 'sparepart_purchase',
    title: 'Beli Stok LCD & Baterai (Supplier Jaya Part)',
    amount: 3200000,
    recordedBy: 'Owner (Admin)',
    notes: 'Restock LCD Oppo, Xiaomi, Baterai iPhone 11/12/13'
  },
  {
    id: 'trx-2',
    date: '2025-05-04 11:30',
    type: 'income',
    category: 'service_fee',
    title: 'Pelunasan Servis SRV-2025-0098 (Ganti LCD Realme 8)',
    amount: 450000,
    referenceId: 'SRV-2025-0098',
    recordedBy: 'Rian (Kasir)'
  },
  {
    id: 'trx-3',
    date: '2025-05-05 14:15',
    type: 'income',
    category: 'sparepart_sale',
    title: 'Penjualan Aksesoris (Charger 33W + Tempered Glass)',
    amount: 175000,
    recordedBy: 'Rian (Kasir)'
  },
  {
    id: 'trx-4',
    date: '2025-05-06 09:00',
    type: 'expense',
    category: 'operational',
    title: 'Bayar Listrik & Internet Fiber Toko',
    amount: 650000,
    recordedBy: 'Owner (Admin)'
  },
  {
    id: 'trx-5',
    date: '2025-05-08 15:20',
    type: 'expense',
    category: 'sparepart_purchase',
    title: 'Beli Timah Cair Mechanic, Flux & Mata Solder T12',
    amount: 280000,
    recordedBy: 'Kang Asep'
  },
  {
    id: 'trx-6',
    date: '2025-05-12 11:30',
    type: 'income',
    category: 'service_fee',
    title: 'Pelunasan Servis SRV-2025-0103 (Port Cas Redmi Note 12)',
    amount: 250000,
    referenceId: 'SRV-2025-0103',
    recordedBy: 'Rian (Kasir)'
  }
];
