import React, { useState } from 'react';
import { 
  Database, Server, Shield, Printer, Code2, 
  Copy, Check, Layers, Cpu, CheckCircle2, Lock, ExternalLink 
} from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const sqlSchemaCode = `-- ==========================================================
-- STRUKTUR BASIS DATA RELASIONAL (PostgreSQL Production Ready)
-- SISTEM MANAJEMEN SERVICE HP, INVENTORY & KEUANGAN
-- ==========================================================

-- 1. ENUM TIPE DATA
CREATE TYPE user_role AS ENUM ('owner', 'kasir', 'teknisi');
CREATE TYPE service_status AS ENUM ('diterima', 'pengecekan', 'tunggu_part', 'pengerjaan', 'selesai', 'keluar', 'dibatalkan');
CREATE TYPE payment_status AS ENUM ('belum_bayar', 'dp', 'lunas');
CREATE TYPE lock_type AS ENUM ('none', 'pin', 'pola', 'password');
CREATE TYPE trx_type AS ENUM ('income', 'expense');

-- 2. TABEL USERS & HAK AKSES
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt / argon2id
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'kasir',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL DATA PELANGGAN (CRM)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(25) NOT NULL, -- Format standard 628xxxxxxxx
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_customers_phone ON customers(phone);

-- 4. TABEL SERVICE ORDERS (UTAMA)
CREATE TABLE service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nota_number VARCHAR(30) UNIQUE NOT NULL, -- Contoh: SRV-2025-0012
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    
    -- Spesifikasi Unit
    device_brand VARCHAR(50) NOT NULL,
    device_model VARCHAR(100) NOT NULL,
    imei VARCHAR(20), -- 15-digit IMEI (wajib di-index)
    
    -- Keamanan & Sandi (Dianjurkan dienkripsi AES-256 pada level aplikasi)
    screen_lock_type lock_type DEFAULT 'none',
    screen_lock_encrypted TEXT, -- Disimpan terenkripsi dengan secret key server
    
    -- Kelengkapan & Kerusakan
    completeness JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['Unit', 'SIM', 'Charger']
    completeness_notes TEXT,
    damage_complaint TEXT NOT NULL,
    
    -- Biaya & Estimasi
    estimated_cost NUMERIC(12,2) DEFAULT 0,
    estimated_completion_date DATE,
    received_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    received_by_user_id UUID REFERENCES users(id),
    
    -- Progres & Teknisi
    status service_status NOT NULL DEFAULT 'diterima',
    technician_id UUID REFERENCES users(id),
    technician_diagnosis TEXT,
    repair_action_details TEXT,
    
    -- Penyelesaian & Biaya
    technician_fee NUMERIC(12,2) DEFAULT 0,
    discount NUMERIC(12,2) DEFAULT 0,
    deposit_paid NUMERIC(12,2) DEFAULT 0,
    total_cost NUMERIC(12,2) DEFAULT 0,
    
    payment_status payment_status NOT NULL DEFAULT 'belum_bayar',
    payment_method VARCHAR(30), -- 'tunai', 'qris', 'transfer'
    
    -- Garansi & Serah Terima
    warranty_days INT DEFAULT 30,
    warranty_end_date DATE,
    out_date TIMESTAMP WITH TIME ZONE,
    handover_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_nota ON service_orders(nota_number);
CREATE INDEX idx_service_imei ON service_orders(imei);
CREATE INDEX idx_service_status ON service_orders(status);

-- 5. TABEL RINCIAN SPAREPART YANG DIPAKAI SERVIS
CREATE TABLE service_replaced_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    part_name VARCHAR(150) NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,    -- Harga modal toko
    selling_price NUMERIC(12,2) NOT NULL DEFAULT 0, -- Harga yang dibebankan ke nota
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABEL INVENTORY MASTER SPAREPART
CREATE TABLE sparepart_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(150) NOT NULL,
    compatible_models TEXT, -- 'iPhone 11, iPhone XR'
    cost_price NUMERIC(12,2) NOT NULL,
    selling_price NUMERIC(12,2) NOT NULL,
    stock_qty INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 2
);

-- 7. TABEL KEUANGAN & ARUS KAS (CASH FLOW)
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    type trx_type NOT NULL, -- 'income' atau 'expense'
    category VARCHAR(50) NOT NULL, -- 'service_fee', 'sparepart_sale', 'sparepart_purchase', 'operational'
    title VARCHAR(200) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    service_order_id UUID REFERENCES service_orders(id) ON DELETE SET NULL,
    created_by_user_id UUID REFERENCES users(id),
    notes TEXT
);
CREATE INDEX idx_trx_date ON financial_transactions(transaction_date);

-- 8. TABEL AUDIT LOG (KEAMANAN & RIWAYAT PERUBAHAN)
CREATE TABLE service_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    status_from service_status,
    status_to service_status,
    notes TEXT,
    actor_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`;

  const cssPrintSnippet = `/* ==========================================================
   CSS PRINT LAYOUT KHUSUS NOTA UKURAN A4 (210mm x 297mm)
   Standar Cetak Printer Inkjet / Laser Tanpa Terpotong
   ========================================================== */

@media print {
  /* 1. Pengaturan Ukuran Halaman & Margin Fisik Kertas A4 */
  @page {
    size: A4 portrait;
    /* Margin standar aman printer (10mm atas-bawah, 12mm kiri-kanan) */
    margin: 10mm 12mm; 
  }

  /* 2. Reset Background & Warna Agar Tajam Saat Dicetak */
  body {
    background: #ffffff !important;
    color: #000000 !important;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.4;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* 3. Sembunyikan Tombol Navigasi, Header & Sidebar Aplikasi */
  .no-print, nav, header, aside, .floating-btn, button {
    display: none !important;
  }

  /* 4. Tampilkan Khusus Elemen Kertas Cetak */
  .print-only {
    display: block !important;
  }

  /* 5. Kontainer Lembar A4 (Pas 100% Lebar Kertas Tanpa Scrollbar) */
  .print-container {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
  }

  /* 6. Mencegah Pemotongan Tabel / Tanda Tangan ke Halaman 2 (Page Break) */
  .page-break-avoid, table, .signature-box, .terms-box {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  /* 7. Garis Tabel Hitam Tipis Kontras Tinggi */
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    border: 1px solid #333333;
    padding: 6px 8px;
    font-size: 10pt;
  }
  th {
    background-color: #f0f0f0 !important;
    font-weight: bold;
  }
}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      
      {/* HEADER BLUEPRINT */}
      <div className="bg-stone-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold uppercase tracking-wider inline-block">
              Architectural Specification Document
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Blueprint Arsitektur & Database Service HP
            </h2>
            <p className="text-stone-300 text-sm max-w-2xl leading-relaxed">
              Panduan teknis arsitektur perangkat lunak spesialis bengkel & counter smartphone: desain skema database relasional aman, print layout presisi A4, proteksi IMEI & privasi kunci layar, serta rekomendasi stack deployment.
            </p>
          </div>
          <div className="p-4 bg-stone-800 rounded-2xl border border-stone-700 shrink-0 flex flex-col items-center justify-center">
            <Database className="w-10 h-10 text-blue-400 mb-1" />
            <span className="text-xs font-mono font-bold text-stone-300">PostgreSQL Ready</span>
          </div>
        </div>
      </div>

      {/* SEKSI 1: STRUKTUR BASIS DATA */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-700 pb-4">
          <div>
            <h3 className="font-bold text-lg text-stone-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              1. Skema Database Relasional Aman (PostgreSQL DDL)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Desain 3NF dengan relasi referensial utuh, auditing log, dan perlindungan privasi nomor IMEI & sandi HP.
            </p>
          </div>
          <button
            onClick={() => handleCopy(sqlSchemaCode, 'sql')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {copiedSection === 'sql' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                DDL SQL Tersalin!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Salin Skema SQL
              </>
            )}
          </button>
        </div>

        {/* Keamanan Data Service HP Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-1">
            <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              Enkripsi Pola / PIN Layar
            </div>
            <p className="text-stone-600 dark:text-stone-400 leading-normal">
              PIN atau pola layar pelanggan tidak boleh disimpan dalam plaintext di DB publik. Gunakan enkripsi simetris (AES-256-GCM) dengan secret key yang diinjeksi via environment variable server.
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl space-y-1">
            <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              Perlindungan & Indeks IMEI
            </div>
            <p className="text-stone-600 dark:text-stone-400 leading-normal">
              Nomor IMEI wajib divalidasi format 15 digit (Luhn Algorithm) dan dibuatkan B-Tree Index untuk pencarian cepat riwayat servis ulang (klaim garansi berulang).
            </p>
          </div>

          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-1">
            <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              Tabel Audit Log & Riwayat
            </div>
            <p className="text-stone-600 dark:text-stone-400 leading-normal">
              Tiap pergeseran status (misal dari "Pengecekan" ke "Selesai") wajib dicatat di tabel <code className="font-mono font-bold">service_audit_logs</code> mencakup nama teknisi, timestamp, dan catatan fisik.
            </p>
          </div>
        </div>

        {/* Code Box */}
        <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-950 text-stone-200">
          <div className="bg-stone-900 px-4 py-2 border-b border-stone-800 flex items-center justify-between text-xs font-mono text-stone-400">
            <span>schema_service_hp.sql (PostgreSQL 14+)</span>
            <span>8 Tables • Enums & Foreign Keys</span>
          </div>
          <pre className="p-4 text-xs font-mono overflow-x-auto max-h-96 leading-relaxed text-stone-300 selection:bg-blue-800">
            {sqlSchemaCode}
          </pre>
        </div>
      </div>

      {/* SEKSI 2: PRINT LAYOUT KHUSUS A4 */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-700 pb-4">
          <div>
            <h3 className="font-bold text-lg text-stone-900 dark:text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-600" />
              2. Panduan & CSS Print Layout Nota Ukuran A4
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Kunci teknis agar nota tercetak pas 1 lembar A4 tanpa terpotong atau menimbulkan halaman kosong kedua.
            </p>
          </div>
          <button
            onClick={() => handleCopy(cssPrintSnippet, 'css')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {copiedSection === 'css' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                CSS Print Tersalin!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Salin CSS Print A4
              </>
            )}
          </button>
        </div>

        {/* 4 Poin Penting Cetak A4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1">
            <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Dimensi Fisik Kertas: 210mm x 297mm
            </h4>
            <p className="text-stone-600 dark:text-stone-400 leading-normal">
              Gunakan aturan <code className="font-mono bg-stone-200 dark:bg-stone-800 px-1 py-0.5 rounded text-blue-600">@page &#123; size: A4 portrait; margin: 10mm 12mm; &#125;</code>. Margin ini menjamin area printable tidak terpotong oleh roller mekanik printer Epson/Canon standar.
            </p>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1">
            <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Mencegah Page Break yang Membelah Dokumen
            </h4>
            <p className="text-stone-600 dark:text-stone-400 leading-normal">
              Gunakan properti CSS <code className="font-mono bg-stone-200 dark:bg-stone-800 px-1 py-0.5 rounded text-blue-600">break-inside: avoid;</code> pada kotak syarat ketentuan, tabel sparepart, dan kolom tanda tangan agar dokumen tetap utuh di 1 lembar.
            </p>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1">
            <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Color Adjust: Exact
            </h4>
            <p className="text-stone-600 dark:text-stone-400 leading-normal">
              Tambahkan <code className="font-mono bg-stone-200 dark:bg-stone-800 px-1 py-0.5 rounded text-blue-600">print-color-adjust: exact;</code> agar warna badge status, logo toko, dan watermark garansi tetap tercetak tajam tanpa diubah putih polos oleh browser.
            </p>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1">
            <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Dual Copy Layout (Opsional)
            </h4>
            <p className="text-stone-600 dark:text-stone-400 leading-normal">
              Untuk menghemat kertas, 1 lembar A4 portrait dapat dibagi menjadi 2 potong A5 (atas untuk arsip toko, bawah untuk dibawa pulang pelanggan) menggunakan garis perforasi putus-putus (<code className="font-mono">border-dashed</code>).
            </p>
          </div>
        </div>

        {/* Code snippet */}
        <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-950 text-stone-200">
          <div className="bg-stone-900 px-4 py-2 border-b border-stone-800 flex items-center justify-between text-xs font-mono text-stone-400">
            <span>print-a4-style.css</span>
            <span>Ready to use with window.print()</span>
          </div>
          <pre className="p-4 text-xs font-mono overflow-x-auto max-h-72 leading-relaxed text-stone-300">
            {cssPrintSnippet}
          </pre>
        </div>
      </div>

      {/* SEKSI 3: REKOMENDASI TECH STACK & CARA DEPLOY */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 shadow-xs space-y-5">
        <div>
          <h3 className="font-bold text-lg text-stone-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            3. Rekomendasi Tech Stack & Arsitektur Deployment
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Kombinasi teknologi yang modern, cepat, stabil untuk operasional kasir harian, dan sangat mudah dideploy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Stack Option 1 */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-blue-900 dark:text-blue-300">
                Pilihan A: Next.js + PostgreSQL (Supabase / Neon)
              </span>
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                Paling Direkomendasikan
              </span>
            </div>
            <ul className="space-y-1.5 text-stone-700 dark:text-stone-300">
              <li>• <strong>Frontend & API:</strong> Next.js 14+ (App Router) + Tailwind CSS + Lucide Icons</li>
              <li>• <strong>Database:</strong> PostgreSQL hosted di Supabase (Free tier handal + built-in auth)</li>
              <li>• <strong>ORM:</strong> Prisma atau Drizzle ORM (type-safe query)</li>
              <li>• <strong>Deployment:</strong> Vercel (Frontend/Serverless) atau Railway (Container)</li>
              <li>• <strong>Kelebihan:</strong> Zero-maintenance server, auto-scaling, backup database harian otomatis, dan dukungan print PDF server-side.</li>
            </ul>
          </div>

          {/* Stack Option 2 */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-stone-900 dark:text-white">
                Pilihan B: Node.js (Express) + React SPA + Docker VPS
              </span>
              <span className="px-2 py-0.5 bg-stone-700 text-white rounded text-[10px] font-bold">
                Self-Hosted / On-Premise
              </span>
            </div>
            <ul className="space-y-1.5 text-stone-700 dark:text-stone-300">
              <li>• <strong>Frontend:</strong> Vite + React 18 + Tailwind CSS (Single Page App)</li>
              <li>• <strong>Backend:</strong> Express.js / Fastify dengan TypeScript</li>
              <li>• <strong>Database:</strong> PostgreSQL container lokal via Docker Compose</li>
              <li>• <strong>Deployment:</strong> VPS (Biznet Gio / IDCloudHost / DigitalOcean) via NGINX Reverse Proxy</li>
              <li>• <strong>Kelebihan:</strong> Biaya bulanan sangat flat dan tetap, dapat diakses di jaringan lokal (LAN) toko meskipun koneksi internet mati.</li>
            </ul>
          </div>

        </div>

        {/* WhatsApp Gateway Integration Guide */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl space-y-2 text-xs">
          <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-600" />
            Integrasi WhatsApp Notifikasi Otomatis (Background Automation):
          </div>
          <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
            Pada tahap awal, sistem menyediakan tombol <strong>1-Klik URL Scheme (`https://wa.me/62...`)</strong> yang langsung membuka WhatsApp Web/Desktop kasir tanpa biaya langganan gateway API.
            Untuk tahap lanjut agar pesan terkirim 100% otomatis di background saat teknisi klik tombol "Selesai", gunakan:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
            <div className="p-2 bg-white dark:bg-stone-900 rounded border border-emerald-200 dark:border-emerald-800">
              <strong>1. Fonnte / Wablas API:</strong> REST API siap pakai lokal Indonesia (Rp 75rb/bln)
            </div>
            <div className="p-2 bg-white dark:bg-stone-900 rounded border border-emerald-200 dark:border-emerald-800">
              <strong>2. Baileys / WPPConnect:</strong> Library open-source Node.js (gratis via scan QR di VPS toko)
            </div>
            <div className="p-2 bg-white dark:bg-stone-900 rounded border border-emerald-200 dark:border-emerald-800">
              <strong>3. Meta Cloud API:</strong> Akun resmi WhatsApp Business API (centang hijau)
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
