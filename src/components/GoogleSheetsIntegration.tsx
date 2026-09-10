import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Copy, Check, ExternalLink, Play, CheckCircle2, 
  AlertCircle, RefreshCw, Key, ShieldCheck, Database, Send,
  HelpCircle, Sparkles, Terminal, ChevronDown, ChevronUp, Layers
} from 'lucide-react';
import { getStoredGasUrl, setStoredGasUrl, testGasConnection, GasResponse } from '../services/googleSheetsService';
import { ServiceOrder, FinancialTransaction } from '../types';

interface GoogleSheetsIntegrationProps {
  orders: ServiceOrder[];
  transactions: FinancialTransaction[];
  onShowToast: (msg: string) => void;
}

export const GoogleSheetsIntegration: React.FC<GoogleSheetsIntegrationProps> = ({
  orders,
  transactions,
  onShowToast
}) => {
  const userEmail = 'az9618064@gmail.com';
  const [webAppUrl, setWebAppUrl] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<GasResponse | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'gas_code' | 'columns' | 'guide'>('gas_code');
  const [expandedSheetTab, setExpandedSheetTab] = useState<'Data_Service' | 'Keuangan' | 'Users'>('Data_Service');

  useEffect(() => {
    setWebAppUrl(getStoredGasUrl());
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast('Berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSaveUrl = () => {
    setStoredGasUrl(webAppUrl);
    onShowToast('URL Google Apps Script berhasil disimpan di perangkat lokal!');
  };

  const handleTestConnection = async () => {
    if (!webAppUrl.trim()) {
      setTestError('Harap masukkan URL Web App Google Apps Script terlebih dahulu.');
      return;
    }

    setIsTesting(true);
    setTestError(null);
    setTestResult(null);

    try {
      setStoredGasUrl(webAppUrl);
      const res = await testGasConnection(webAppUrl);
      setTestResult(res);
      onShowToast('Koneksi Google Spreadsheet Berhasil Terhubung!');
    } catch (err: any) {
      setTestError(err.message || 'Gagal menghubungi Google Apps Script Web App.');
    } finally {
      setIsTesting(false);
    }
  };

  // Google Apps Script Production-Ready Code
  const gasScriptCode = `/**
 * ==============================================================================
 * CLOUD DATABASE GOOGLE SPREADSHEET - SISTEM MANAJEMEN SERVICE HP & KEUANGAN
 * Akun Pemilik : az9618064@gmail.com
 * Versi API    : 1.0 (Production Ready - Fast JSON Webhook)
 * ==============================================================================
 */

// NAMA SHEET RESMI
const SHEET_SERVICE = 'Data_Service';
const SHEET_KEUANGAN = 'Keuangan';
const SHEET_USERS = 'Users';

/**
 * 1. SETUP OTOMATIS SATU KLIK (setupDatabase)
 * Jalankan fungsi ini SEKALI di editor Apps Script.
 * Fungsi ini otomatis membuat 3 Sheet (Data_Service, Keuangan, Users),
 * menata Header tebal, mewarnai background, dan membekukan baris pertama!
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ----------------------------------------------------
  // TAB 1: Data_Service (30 Kolom Standar Industri Service HP)
  // ----------------------------------------------------
  let serviceSheet = ss.getSheetByName(SHEET_SERVICE);
  if (!serviceSheet) {
    serviceSheet = ss.insertSheet(SHEET_SERVICE);
  }
  
  const serviceHeaders = [
    'No_Nota', 'Tgl_Masuk', 'Nama_Pelanggan', 'No_WhatsApp', 'Brand_HP', 
    'Model_HP', 'IMEI', 'Tipe_Kunci', 'Sandi_Kunci', 'Kelengkapan', 
    'Keluhan_Kerusakan', 'Estimasi_Biaya', 'Petugas_Penerima', 'Status_Service', 
    'Teknisi_PJ', 'Diagnosa_Teknisi', 'Tindakan_Perbaikan', 'Sparepart_Diganti', 
    'Biaya_Jasa', 'Biaya_Sparepart', 'Diskon', 'Total_Biaya', 'DP_Terbayar', 
    'Status_Bayar', 'Metode_Bayar', 'Tgl_Keluar', 'Garansi_Hari', 'Garansi_Berakhir', 
    'Catatan_Serah_Terima', 'Waktu_Update'
  ];

  serviceSheet.getRange(1, 1, 1, serviceHeaders.length).setValues([serviceHeaders]);
  serviceSheet.getRange(1, 1, 1, serviceHeaders.length)
    .setFontWeight('bold')
    .setBackground('#1e3a8a') // Navy Blue
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');
  serviceSheet.setFrozenRows(1);

  // ----------------------------------------------------
  // TAB 2: Keuangan (Buku Kas & Laba Rugi)
  // ----------------------------------------------------
  let financeSheet = ss.getSheetByName(SHEET_KEUANGAN);
  if (!financeSheet) {
    financeSheet = ss.insertSheet(SHEET_KEUANGAN);
  }

  const financeHeaders = [
    'ID_Transaksi', 'Tanggal', 'Tipe', 'Kategori', 
    'Judul_Transaksi', 'Jumlah_Rp', 'No_Nota_Ref', 'Petugas', 'Keterangan'
  ];

  financeSheet.getRange(1, 1, 1, financeHeaders.length).setValues([financeHeaders]);
  financeSheet.getRange(1, 1, 1, financeHeaders.length)
    .setFontWeight('bold')
    .setBackground('#065f46') // Emerald Green
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');
  financeSheet.setFrozenRows(1);

  // ----------------------------------------------------
  // TAB 3: Users (Daftar Pengguna & Hak Akses)
  // ----------------------------------------------------
  let usersSheet = ss.getSheetByName(SHEET_USERS);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(SHEET_USERS);
  }

  const usersHeaders = [
    'ID_User', 'Username', 'Nama_Lengkap', 'Role', 
    'No_WhatsApp', 'Status_Aktif', 'Dibuat_Pada'
  ];

  usersSheet.getRange(1, 1, 1, usersHeaders.length).setValues([usersHeaders]);
  usersSheet.getRange(1, 1, 1, usersHeaders.length)
    .setFontWeight('bold')
    .setBackground('#4c1d95') // Royal Purple
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');
  usersSheet.setFrozenRows(1);

  // Data Default User jika kosong
  if (usersSheet.getLastRow() === 1) {
    usersSheet.appendRow(['USR-001', 'owner', 'Owner Toko', 'owner', '081298765432', 'Aktif', new Date().toISOString()]);
    usersSheet.appendRow(['USR-002', 'rian_kasir', 'Rian (Kasir)', 'petugas', '081211112222', 'Aktif', new Date().toISOString()]);
    usersSheet.appendRow(['USR-003', 'asep_teknisi', 'Kang Asep (Teknisi)', 'teknisi', '085733334444', 'Aktif', new Date().toISOString()]);
  }

  // Hapus Sheet1 default jika ada
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Lembar1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  Logger.log('Setup Berhasil! 3 Sheet telah terbuat dan terformat sempurna untuk az9618064@gmail.com');
}

/**
 * 2. API ENDPOINT GET: Membaca Data & Tes Ping
 */
function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. PING / TEST CONNECTION
    if (action === 'ping') {
      const serviceSheet = ss.getSheetByName(SHEET_SERVICE);
      const rowCount = serviceSheet ? Math.max(0, serviceSheet.getLastRow() - 1) : 0;
      return createJsonResponse({
        status: 'success',
        message: 'Koneksi Cloud Google Spreadsheet Aktif & Siap Digunakan!',
        account: 'az9618064@gmail.com',
        spreadsheetName: ss.getName(),
        totalServiceOrders: rowCount,
        serverTime: new Date().toISOString()
      });
    }

    // 2. AMBIL SEMUA DATA SERVICE
    if (action === 'get_all_services') {
      const sheet = ss.getSheetByName(SHEET_SERVICE);
      if (!sheet || sheet.getLastRow() <= 1) {
        return createJsonResponse({ status: 'success', data: [] });
      }
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const result = [];

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const item = {};
        headers.forEach((header, index) => {
          item[header] = row[index];
        });
        result.push(item);
      }
      return createJsonResponse({ status: 'success', data: result });
    }

    // 3. AMBIL DATA KEUANGAN
    if (action === 'get_financials') {
      const sheet = ss.getSheetByName(SHEET_KEUANGAN);
      if (!sheet || sheet.getLastRow() <= 1) {
        return createJsonResponse({ status: 'success', data: [] });
      }
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const result = [];

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const item = {};
        headers.forEach((header, index) => {
          item[header] = row[index];
        });
        result.push(item);
      }
      return createJsonResponse({ status: 'success', data: result });
    }

    // Default response
    return createJsonResponse({
      status: 'success',
      message: 'API Service HP Google Apps Script - Gunakan parameter ?action=ping atau lakukan POST payload',
      supportedActions: ['ping', 'get_all_services', 'get_financials', 'get_users']
    });

  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 3. API ENDPOINT POST: Menyimpan, Mengupdate Status, dan Catat Kas
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  // Kunci 30 detik untuk mencegah race-condition saat ada request bersamaan
  lock.tryLock(30000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'error', message: 'Payload data kosong.' });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // -------------------------------------------------------------
    // AKSI A: SIMPAN SERVICE MASUK BARU
    // -------------------------------------------------------------
    if (action === 'create_service') {
      const sheet = ss.getSheetByName(SHEET_SERVICE);
      if (!sheet) {
        return createJsonResponse({ status: 'error', message: 'Sheet Data_Service belum di-setup. Jalankan setupDatabase() terlebih dahulu.' });
      }

      const o = payload.order;
      const nowStr = new Date().toLocaleString('sv-SE');

      const newRow = [
        o.notaNumber || '',
        o.receivedDate || nowStr,
        o.customerName || '',
        o.customerPhone || '',
        o.deviceBrand || '',
        o.deviceModel || '',
        o.imei || '-',
        o.screenLockType || 'none',
        o.screenLockValue || '-',
        o.completeness || 'Unit HP',
        o.damageDetails || '',
        Number(o.estimatedCost) || 0,
        o.receivedBy || 'Petugas',
        o.status || 'diterima',
        '', // Teknisi PJ
        '', // Diagnosa Teknisi
        '', // Tindakan Perbaikan
        '', // Sparepart Diganti
        0,  // Biaya Jasa
        0,  // Biaya Sparepart
        0,  // Diskon
        Number(o.estimatedCost) || 0, // Total Biaya Sementara
        0,  // DP Terbayar
        'belum_bayar',
        'belum_bayar',
        '', // Tgl Keluar
        0,  // Garansi Hari
        '', // Garansi Berakhir
        '', // Catatan Serah Terima
        nowStr // Waktu Update
      ];

      sheet.appendRow(newRow);

      return createJsonResponse({
        status: 'success',
        message: 'Data Service Masuk berhasil disimpan ke Google Spreadsheet!',
        notaNumber: o.notaNumber
      });
    }

    // -------------------------------------------------------------
    // AKSI B: UPDATE STATUS & PROGRES PENGERJAAN TEKNISI
    // -------------------------------------------------------------
    if (action === 'update_status') {
      const sheet = ss.getSheetByName(SHEET_SERVICE);
      const nota = payload.notaNumber;
      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(nota).trim()) {
          rowIndex = i + 1; // 1-indexed
          break;
        }
      }

      if (rowIndex === -1) {
        return createJsonResponse({ status: 'error', message: 'No. Nota ' + nota + ' tidak ditemukan di Google Sheets.' });
      }

      const nowStr = new Date().toLocaleString('sv-SE');
      
      // Update Kolom: Status(14), Teknisi_PJ(15), Diagnosa(16), Waktu_Update(30)
      if (payload.status) sheet.getRange(rowIndex, 14).setValue(payload.status);
      if (payload.technicianName) sheet.getRange(rowIndex, 15).setValue(payload.technicianName);
      if (payload.diagnosisNotes) sheet.getRange(rowIndex, 16).setValue(payload.diagnosisNotes);
      sheet.getRange(rowIndex, 30).setValue(nowStr);

      return createJsonResponse({
        status: 'success',
        message: 'Status No. Nota ' + nota + ' berhasil diperbarui menjadi ' + payload.status,
        notaNumber: nota
      });
    }

    // -------------------------------------------------------------
    // AKSI C: SERVICE KELUAR / PELUNASAN / SELESAI
    // (Otomatis update sheet Data_Service & catat pemasukan di sheet Keuangan)
    // -------------------------------------------------------------
    if (action === 'service_keluar') {
      const sheet = ss.getSheetByName(SHEET_SERVICE);
      const o = payload.order;
      const nota = o.notaNumber;
      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(nota).trim()) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex === -1) {
        return createJsonResponse({ status: 'error', message: 'No. Nota ' + nota + ' tidak ditemukan.' });
      }

      const nowStr = new Date().toLocaleString('sv-SE');

      // Update Baris di Sheet Data_Service
      sheet.getRange(rowIndex, 14).setValue('keluar'); // Status
      if (o.technicianName) sheet.getRange(rowIndex, 15).setValue(o.technicianName);
      if (o.diagnosisNotes) sheet.getRange(rowIndex, 16).setValue(o.diagnosisNotes);
      sheet.getRange(rowIndex, 17).setValue(o.repairActionDetails || '-');
      sheet.getRange(rowIndex, 18).setValue(o.replacedPartsSummary || '-');
      sheet.getRange(rowIndex, 19).setValue(Number(o.technicianFee) || 0);
      sheet.getRange(rowIndex, 20).setValue(Number(o.totalPartsCost) || 0);
      sheet.getRange(rowIndex, 21).setValue(Number(o.discount) || 0);
      sheet.getRange(rowIndex, 22).setValue(Number(o.totalCost) || 0);
      sheet.getRange(rowIndex, 23).setValue(Number(o.depositPaid) || 0);
      sheet.getRange(rowIndex, 24).setValue(o.paymentStatus || 'lunas');
      sheet.getRange(rowIndex, 25).setValue(o.paymentMethod || 'tunai');
      sheet.getRange(rowIndex, 26).setValue(o.outDate || nowStr);
      sheet.getRange(rowIndex, 27).setValue(Number(o.warrantyDays) || 0);
      sheet.getRange(rowIndex, 28).setValue(o.warrantyEndDate || '-');
      sheet.getRange(rowIndex, 29).setValue(o.handoverNotes || '-');
      sheet.getRange(rowIndex, 30).setValue(nowStr);

      // OTOMATIS CATAT KE TAB KEUANGAN (ARUS KAS MASUK)
      const financeSheet = ss.getSheetByName(SHEET_KEUANGAN);
      if (financeSheet && (o.paymentStatus === 'lunas' || o.paymentStatus === 'dp')) {
        const netPayment = Number(o.totalCost) || 0;
        const trxId = 'TRX-' + Date.now();
        financeSheet.appendRow([
          trxId,
          nowStr,
          'income',
          'service_fee',
          'Pelunasan Servis ' + nota + ' (' + (o.paymentMethod || 'tunai').toUpperCase() + ')',
          netPayment,
          nota,
          o.technicianName || 'Kasir',
          'Garansi: ' + (o.warrantyDays || 0) + ' hari. Tindakan: ' + (o.repairActionDetails || '-')
        ]);
      }

      return createJsonResponse({
        status: 'success',
        message: 'Service Keluar No. Nota ' + nota + ' berhasil diproses & otomatis tercatat di Kas Keuangan!',
        notaNumber: nota
      });
    }

    // -------------------------------------------------------------
    // AKSI D: SIMPAN TRANSAKSI KEUANGAN MANUAL (PENGELUARAN / LAINNYA)
    // -------------------------------------------------------------
    if (action === 'add_financial') {
      const sheet = ss.getSheetByName(SHEET_KEUANGAN);
      if (!sheet) {
        return createJsonResponse({ status: 'error', message: 'Sheet Keuangan belum tersedia.' });
      }

      const t = payload.transaction;
      const nowStr = new Date().toLocaleString('sv-SE');

      sheet.appendRow([
        t.id || ('TRX-' + Date.now()),
        t.date || nowStr,
        t.type || 'income',
        t.category || 'operational',
        t.title || '',
        Number(t.amount) || 0,
        t.referenceId || '-',
        t.recordedBy || 'Petugas',
        t.notes || '-'
      ]);

      return createJsonResponse({
        status: 'success',
        message: 'Transaksi keuangan berhasil dicatat ke Google Sheets!'
      });
    }

    // -------------------------------------------------------------
    // AKSI E: SINKRONISASI DAFTAR PENGGUNA & STAF (sync_users)
    // -------------------------------------------------------------
    if (action === 'sync_users') {
      const sheet = ss.getSheetByName(SHEET_USERS);
      if (!sheet) {
        return createJsonResponse({ status: 'error', message: 'Sheet Users belum tersedia. Jalankan setupDatabase terlebih dahulu.' });
      }

      const usersList = payload.users || [];
      const nowStr = new Date().toLocaleString('sv-SE');

      // Bersihkan baris user lama (pertahankan baris header ke-1)
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 7).clearContent();
      }

      const rows = usersList.map((u, idx) => [
        'USR-' + String(idx + 1).padStart(3, '0'),
        u.username || '',
        u.fullName || '',
        u.role || 'petugas',
        u.phone || '-',
        u.status || 'active',
        nowStr
      ]);

      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, 7).setValues(rows);
      }

      return createJsonResponse({
        status: 'success',
        message: rows.length + ' akun staf AZ-ZAHRA SERVICE berhasil disinkronkan ke Google Spreadsheet!',
        count: rows.length
      });
    }

    // -------------------------------------------------------------
    // AKSI F: HAPUS AKUN STAF / PENGGUNA (deleteUser / delete_user)
    // -------------------------------------------------------------
    if (action === 'deleteUser' || action === 'delete_user') {
      const sheet = ss.getSheetByName(SHEET_USERS);
      if (!sheet) {
        return createJsonResponse({ status: 'error', message: 'Sheet Users belum tersedia.' });
      }

      const userId = payload.userId || '';
      const username = (payload.username || '').toLowerCase();
      const lastRow = sheet.getLastRow();
      let deletedRows = 0;

      // Hapus baris staf yang cocok dari sheet Users
      if (lastRow > 1) {
        const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
        for (let r = values.length - 1; r >= 0; r--) {
          const rowId = String(values[r][0]);
          const rowUser = String(values[r][1]).toLowerCase();
          if ((userId && rowId === userId) || (username && rowUser === username)) {
            sheet.deleteRow(r + 2);
            deletedRows++;
          }
        }
      }

      // Jika ada daftar users terbaru, sinkronkan ulang seluruh baris agar rapi
      if (payload.users && Array.isArray(payload.users)) {
        const usersList = payload.users;
        const nowStr = new Date().toLocaleString('sv-SE');
        const currLast = sheet.getLastRow();
        if (currLast > 1) {
          sheet.getRange(2, 1, currLast - 1, 7).clearContent();
        }
        const rows = usersList.map((u, idx) => [
          'USR-' + String(idx + 1).padStart(3, '0'),
          u.username || '',
          u.fullName || '',
          u.role || 'petugas',
          u.phone || '-',
          u.status || 'active',
          nowStr
        ]);
        if (rows.length > 0) {
          sheet.getRange(2, 1, rows.length, 7).setValues(rows);
        }
      }

      return createJsonResponse({
        status: 'success',
        message: 'Akun staf berhasil dihapus dari Google Sheets.',
        deletedRows: deletedRows
      });
    }

    // -------------------------------------------------------------
    // AKSI G: HAPUS SATU DATA SERVICE (delete_service)
    // -------------------------------------------------------------
    if (action === 'delete_service') {
      const sheet = ss.getSheetByName(SHEET_SERVICE);
      if (!sheet) {
        return createJsonResponse({ status: 'error', message: 'Sheet Data_Service belum tersedia.' });
      }

      const notaNumber = payload.notaNumber || '';
      const lastRow = sheet.getLastRow();
      let deleted = false;

      if (lastRow > 1 && notaNumber) {
        const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let r = values.length - 1; r >= 0; r--) {
          if (String(values[r][0]) === notaNumber) {
            sheet.deleteRow(r + 2);
            deleted = true;
            break;
          }
        }
      }

      return createJsonResponse({
        status: 'success',
        message: deleted ? 'Data service ' + notaNumber + ' berhasil dihapus dari Google Sheets.' : 'Nota tidak ditemukan di Google Sheets.',
        deleted: deleted
      });
    }

    // -------------------------------------------------------------
    // AKSI H: RESET DATABASE DEMO / DUMMY DATA (reset_database)
    // -------------------------------------------------------------
    if (action === 'reset_database') {
      const sheetService = ss.getSheetByName(SHEET_SERVICE);
      const sheetKeuangan = ss.getSheetByName(SHEET_KEUANGAN);
      
      let clearedService = 0;
      let clearedKeuangan = 0;

      if (sheetService) {
        const lastRow = sheetService.getLastRow();
        if (lastRow > 1) {
          sheetService.getRange(2, 1, lastRow - 1, 30).clearContent();
          clearedService = lastRow - 1;
        }
      }

      if (sheetKeuangan) {
        const lastRow = sheetKeuangan.getLastRow();
        if (lastRow > 1) {
          sheetKeuangan.getRange(2, 1, lastRow - 1, 9).clearContent();
          clearedKeuangan = lastRow - 1;
        }
      }

      return createJsonResponse({
        status: 'success',
        message: 'Seluruh data demo berhasil dikosongkan. Data_Service (' + clearedService + ' baris) & Keuangan (' + clearedKeuangan + ' baris) kini murni bersih!',
        clearedService: clearedService,
        clearedKeuangan: clearedKeuangan
      });
    }

    return createJsonResponse({ status: 'error', message: 'Aksi tidak dikenali: ' + action });

  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper untuk format response JSON dengan MIME type yang benar
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

  // Headers data for UI view
  const serviceHeadersList = [
    { col: 'A', name: 'No_Nota', desc: 'Kode registrasi unik (misal: SRV-2025-0001)', type: 'String' },
    { col: 'B', name: 'Tgl_Masuk', desc: 'Tanggal & waktu penyerahan unit', type: 'DateTime' },
    { col: 'C', name: 'Nama_Pelanggan', desc: 'Nama lengkap pemilik HP', type: 'String' },
    { col: 'D', name: 'No_WhatsApp', desc: 'Nomor WA aktif pelanggan (format 628...)', type: 'String' },
    { col: 'E', name: 'Brand_HP', desc: 'Merek HP (Apple, Samsung, Xiaomi, Oppo)', type: 'String' },
    { col: 'F', name: 'Model_HP', desc: 'Tipe spesifik (iPhone 13 Pro, Redmi Note 11)', type: 'String' },
    { col: 'G', name: 'IMEI', desc: '15-digit nomor IMEI (Luhn Algorithm)', type: 'String' },
    { col: 'H', name: 'Tipe_Kunci', desc: 'Jenis kunci (pin, pola, password, none)', type: 'String' },
    { col: 'I', name: 'Sandi_Kunci', desc: 'Angka PIN atau nomor urutan pola sentuh', type: 'String' },
    { col: 'J', name: 'Kelengkapan', desc: 'Aksesoris yang dititipkan (Unit, SIM, Charger)', type: 'Text' },
    { col: 'K', name: 'Keluhan_Kerusakan', desc: 'Deskripsi keluhan pelanggan saat masuk', type: 'Text' },
    { col: 'L', name: 'Estimasi_Biaya', desc: 'Taksiran perkiraan biaya awal (Rp)', type: 'Numeric' },
    { col: 'M', name: 'Petugas_Penerima', desc: 'Kasir/staf front desk yang menerima unit', type: 'String' },
    { col: 'N', name: 'Status_Service', desc: 'diterima | pengecekan | pengerjaan | selesai | keluar', type: 'Enum' },
    { col: 'O', name: 'Teknisi_PJ', desc: 'Nama teknisi penanggung jawab pengerjaan', type: 'String' },
    { col: 'P', name: 'Diagnosa_Teknisi', desc: 'Hasil pengecekan fisik/software oleh teknisi', type: 'Text' },
    { col: 'Q', name: 'Tindakan_Perbaikan', desc: 'Langkah servis yang telah dieksekusi', type: 'Text' },
    { col: 'R', name: 'Sparepart_Diganti', desc: 'Daftar komponen baru yang dipasang', type: 'Text' },
    { col: 'S', name: 'Biaya_Jasa', desc: 'Ongkos pengerjaan teknisi (Rp)', type: 'Numeric' },
    { col: 'T', name: 'Biaya_Sparepart', desc: 'Total tagihan harga sparepart (Rp)', type: 'Numeric' },
    { col: 'U', name: 'Diskon', desc: 'Potongan harga khusus (Rp)', type: 'Numeric' },
    { col: 'V', name: 'Total_Biaya', desc: 'Total tagihan akhir yang harus dibayar', type: 'Numeric' },
    { col: 'W', name: 'DP_Terbayar', desc: 'Uang muka yang diserahkan pelanggan (Rp)', type: 'Numeric' },
    { col: 'X', name: 'Status_Bayar', desc: 'belum_bayar | dp | lunas', type: 'Enum' },
    { col: 'Y', name: 'Metode_Bayar', desc: 'tunai | qris | transfer_bank', type: 'String' },
    { col: 'Z', name: 'Tgl_Keluar', desc: 'Tanggal serah terima unit selesai ke pemilik', type: 'DateTime' },
    { col: 'AA', name: 'Garansi_Hari', desc: 'Durasi masa garansi (7, 14, 30, 90 hari)', type: 'Integer' },
    { col: 'AB', name: 'Garansi_Berakhir', desc: 'Tanggal batas akhir klaim garansi toko', type: 'Date' },
    { col: 'AC', name: 'Catatan_Serah_Terima', desc: 'Pesan garansi atau kondisi unit saat keluar', type: 'Text' },
    { col: 'AD', name: 'Waktu_Update', desc: 'Timestamp modifikasi terakhir oleh sistem', type: 'DateTime' }
  ];

  const financeHeadersList = [
    { col: 'A', name: 'ID_Transaksi', desc: 'ID unik transaksi kas (misal: TRX-1725890123)', type: 'String' },
    { col: 'B', name: 'Tanggal', desc: 'Tanggal dan jam mutasi kas', type: 'DateTime' },
    { col: 'C', name: 'Tipe', desc: 'income (pemasukan) | expense (pengeluaran)', type: 'Enum' },
    { col: 'D', name: 'Kategori', desc: 'service_fee | sparepart_purchase | operational | salary', type: 'String' },
    { col: 'E', name: 'Judul_Transaksi', desc: 'Keterangan ringkas transaksi kasir', type: 'String' },
    { col: 'F', name: 'Jumlah_Rp', desc: 'Nominal rupiah mutasi uang', type: 'Numeric' },
    { col: 'G', name: 'No_Nota_Ref', desc: 'Nomor nota service terkait (jika pemasukan servis)', type: 'String' },
    { col: 'H', name: 'Petugas', desc: 'Nama kasir atau admin yang mencatat', type: 'String' },
    { col: 'I', name: 'Keterangan', desc: 'Catatan detail tambahan atau nomor bukti transfer', type: 'Text' }
  ];

  const usersHeadersList = [
    { col: 'A', name: 'ID_User', desc: 'ID unik staf (misal: USR-001)', type: 'String' },
    { col: 'B', name: 'Username', desc: 'Username login akun', type: 'String' },
    { col: 'C', name: 'Nama_Lengkap', desc: 'Nama asli staf / teknisi', type: 'String' },
    { col: 'D', name: 'Role', desc: 'owner | kasir | teknisi', type: 'Enum' },
    { col: 'E', name: 'No_WhatsApp', desc: 'Nomor kontak darurat WhatsApp', type: 'String' },
    { col: 'F', name: 'Status_Aktif', desc: 'Aktif | Nonaktif', type: 'String' },
    { col: 'G', name: 'Dibuat_Pada', desc: 'Tanggal akun didaftarkan', type: 'DateTime' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* HEADER BANNER */}
      <div className="bg-emerald-950 border border-emerald-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600/60 border border-emerald-400/40 text-emerald-100 rounded-full text-xs font-bold uppercase tracking-wider">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Google Sheets Cloud Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Integrasi Cloud Database Google Spreadsheet
            </h2>
            <p className="text-emerald-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Jadikan Google Spreadsheet pribadi di akun <span className="font-mono font-bold text-white bg-emerald-800/80 px-2 py-0.5 rounded underline decoration-emerald-400">{userEmail}</span> sebagai database online realtime gratis seumur hidup tanpa server tambahan!
            </p>
          </div>
          <div className="p-4 bg-emerald-900/60 rounded-2xl border border-emerald-700/60 shrink-0 flex flex-col items-center justify-center text-center">
            <FileSpreadsheet className="w-10 h-10 text-emerald-400 mb-1" />
            <span className="text-xs font-mono font-bold text-emerald-100">{userEmail}</span>
            <span className="text-[10px] text-emerald-300">Live API Endpoint</span>
          </div>
        </div>
      </div>

      {/* LIVE URL CONFIGURATION & CONNECTION TESTER */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-600" />
            Konektor Web App URL (Endpoint Google Apps Script)
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Tempelkan URL Web App hasil deploy dari Google Sheets akun <strong className="text-stone-800 dark:text-stone-200">{userEmail}</strong> untuk mengaktifkan sinkronisasi otomatis.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              value={webAppUrl}
              onChange={(e) => setWebAppUrl(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveUrl}
              className="px-4 py-2.5 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Simpan URL
            </button>
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Menguji...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Tes Koneksi (Ping)
                </>
              )}
            </button>
          </div>
        </div>

        {/* FEEDBACK HASIL TES KONEKSI */}
        {testResult && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-emerald-900 dark:text-emerald-300">
                {testResult.message}
              </p>
              <p className="text-stone-600 dark:text-stone-300">
                Spreadsheet: <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{testResult.spreadsheetName || 'Terkoneksi'}</span> | Akun: <span className="font-mono">{testResult.account || userEmail}</span> | Baris Service: <span className="font-bold">{testResult.totalServiceOrders || 0} unit</span>
              </p>
            </div>
          </div>
        )}

        {testError && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-red-900 dark:text-red-300">
                Koneksi Gagal Dihubungi
              </p>
              <p className="text-red-700 dark:text-red-400">
                {testError}
              </p>
              <p className="text-stone-500 text-[11px]">
                Pastikan pengaturan saat deploy Web App adalah <strong>Who has access: Anyone (Siapa saja)</strong> agar Google mengizinkan browser membaca data tanpa hambatan login popup.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* NAVIGATION TABS UNTUK DOKUMENTASI */}
      <div className="flex border-b border-stone-200 dark:border-stone-700 gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveCodeTab('gas_code')}
          className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeCodeTab === 'gas_code'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Kode Google Apps Script (Siap Pakai)
        </button>
        <button
          onClick={() => setActiveCodeTab('columns')}
          className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeCodeTab === 'columns'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          Struktur Nama Kolom Header
        </button>
        <button
          onClick={() => setActiveCodeTab('guide')}
          className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeCodeTab === 'guide'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Panduan Step-by-Step Deploy
        </button>
      </div>

      {/* TAB KONTEN 1: KODE GOOGLE APPS SCRIPT */}
      {activeCodeTab === 'gas_code' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-600" />
                Script Backend Webhook Google Apps Script (GAS)
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Mencakup fungsi otomatis setup 3 sheet, doGet (read/ping), doPost (simpan service, update progres, dan auto-catat kas keuangan).
              </p>
            </div>
            <button
              onClick={() => handleCopy(gasScriptCode, 'gas_code')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            >
              {copiedId === 'gas_code' ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  Kode Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Salin Seluruh Kode GAS
                </>
              )}
            </button>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 text-stone-200 shadow-lg">
            <div className="bg-stone-900 px-4 py-2.5 border-b border-stone-800 flex items-center justify-between text-xs font-mono text-stone-400">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Code.gs (Google Apps Script Engine)
              </span>
              <span>420 Baris • doGet & doPost • LockService</span>
            </div>
            <pre className="p-4 text-xs font-mono overflow-x-auto max-h-[500px] leading-relaxed text-stone-300 selection:bg-emerald-800">
              {gasScriptCode}
            </pre>
          </div>
        </div>
      )}

      {/* TAB KONTEN 2: STRUKTUR NAMA KOLOM HEADER */}
      {activeCodeTab === 'columns' && (
        <div className="space-y-4">
          
          {/* Sub-selector Sheet */}
          <div className="flex gap-2">
            <button
              onClick={() => setExpandedSheetTab('Data_Service')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                expandedSheetTab === 'Data_Service'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              Tab 1: Data_Service (30 Kolom)
            </button>
            <button
              onClick={() => setExpandedSheetTab('Keuangan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                expandedSheetTab === 'Keuangan'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              Tab 2: Keuangan (9 Kolom)
            </button>
            <button
              onClick={() => setExpandedSheetTab('Users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                expandedSheetTab === 'Users'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              Tab 3: Users (7 Kolom)
            </button>
          </div>

          {/* TABEL KOLOM DATA_SERVICE */}
          {expandedSheetTab === 'Data_Service' && (
            <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden shadow-xs">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-blue-900 dark:text-blue-300">
                    Struktur Header Kolom: Data_Service
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Menyimpan siklus hidup servis lengkap: data pelanggan, fisik HP, kunci layar, pengerjaan teknisi, hingga garansi.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(serviceHeadersList.map(h => h.name).join('\t'), 'headers_service')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Salin Row Header (TSV)
                </button>
              </div>

              <div className="overflow-x-auto max-h-[480px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 font-semibold border-b border-stone-200 dark:border-stone-700">
                    <tr>
                      <th className="py-2.5 px-4 w-16">Kolom</th>
                      <th className="py-2.5 px-4">Nama Kolom (Header)</th>
                      <th className="py-2.5 px-4">Tipe Data</th>
                      <th className="py-2.5 px-4">Deskripsi & Contoh Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-700/60 font-mono text-[11px]">
                    {serviceHeadersList.map((item) => (
                      <tr key={item.name} className="hover:bg-stone-50 dark:hover:bg-stone-700/30">
                        <td className="py-2 px-4 font-bold text-stone-400">{item.col}</td>
                        <td className="py-2 px-4 font-bold text-blue-700 dark:text-blue-400">{item.name}</td>
                        <td className="py-2 px-4 font-sans text-stone-500">
                          <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 rounded text-[10px]">
                            {item.type}
                          </span>
                        </td>
                        <td className="py-2 px-4 font-sans text-stone-700 dark:text-stone-300">{item.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABEL KOLOM KEUANGAN */}
          {expandedSheetTab === 'Keuangan' && (
            <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden shadow-xs">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">
                    Struktur Header Kolom: Keuangan
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Buku kas arus kas masuk (pelunasan servis, penjualan sparepart) dan arus kas keluar (stok LCD/baterai, operasional).
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(financeHeadersList.map(h => h.name).join('\t'), 'headers_finance')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Salin Row Header (TSV)
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 font-semibold border-b border-stone-200 dark:border-stone-700">
                    <tr>
                      <th className="py-2.5 px-4 w-16">Kolom</th>
                      <th className="py-2.5 px-4">Nama Kolom (Header)</th>
                      <th className="py-2.5 px-4">Tipe Data</th>
                      <th className="py-2.5 px-4">Deskripsi & Contoh Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-700/60 font-mono text-[11px]">
                    {financeHeadersList.map((item) => (
                      <tr key={item.name} className="hover:bg-stone-50 dark:hover:bg-stone-700/30">
                        <td className="py-2 px-4 font-bold text-stone-400">{item.col}</td>
                        <td className="py-2 px-4 font-bold text-emerald-700 dark:text-emerald-400">{item.name}</td>
                        <td className="py-2 px-4 font-sans text-stone-500">
                          <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 rounded text-[10px]">
                            {item.type}
                          </span>
                        </td>
                        <td className="py-2 px-4 font-sans text-stone-700 dark:text-stone-300">{item.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABEL KOLOM USERS */}
          {expandedSheetTab === 'Users' && (
            <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden shadow-xs">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-900/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-purple-900 dark:text-purple-300">
                    Struktur Header Kolom: Users
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Tabel hak akses staf toko smartphone (Owner, Petugas/Kasir, dan Teknisi HP).
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(usersHeadersList.map(h => h.name).join('\t'), 'headers_users')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Salin Row Header (TSV)
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 font-semibold border-b border-stone-200 dark:border-stone-700">
                    <tr>
                      <th className="py-2.5 px-4 w-16">Kolom</th>
                      <th className="py-2.5 px-4">Nama Kolom (Header)</th>
                      <th className="py-2.5 px-4">Tipe Data</th>
                      <th className="py-2.5 px-4">Deskripsi & Contoh Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-700/60 font-mono text-[11px]">
                    {usersHeadersList.map((item) => (
                      <tr key={item.name} className="hover:bg-stone-50 dark:hover:bg-stone-700/30">
                        <td className="py-2 px-4 font-bold text-stone-400">{item.col}</td>
                        <td className="py-2 px-4 font-bold text-purple-700 dark:text-purple-400">{item.name}</td>
                        <td className="py-2 px-4 font-sans text-stone-500">
                          <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 rounded text-[10px]">
                            {item.type}
                          </span>
                        </td>
                        <td className="py-2 px-4 font-sans text-stone-700 dark:text-stone-300">{item.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB KONTEN 3: PANDUAN STEP-BY-STEP DEPLOY */}
      {activeCodeTab === 'guide' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Panduan Praktis Deploy Google Sheets untuk Akun {userEmail}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Ikuti 5 langkah mudah berikut selama 3 menit untuk menghubungkan database ke aplikasi ini.
              </p>
            </div>

            {/* STEP 1 */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-900/40">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                1
              </div>
              <div className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                <h4 className="font-bold text-stone-900 dark:text-white text-sm">
                  Buat File Spreadsheet Baru di Akun Google Anda
                </h4>
                <p>
                  Buka browser Anda dan login dengan akun <strong>{userEmail}</strong>. Kunjungi <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1">sheets.new <ExternalLink className="w-3 h-3" /></a> untuk membuat spreadsheet kosong.
                </p>
                <p className="text-stone-500">
                  Beri judul file di pojok kiri atas, contoh: <code className="font-mono bg-stone-200 dark:bg-stone-800 px-1 py-0.5 rounded text-emerald-700">DATABASE_SERVICE_HP_PRO</code>.
                </p>
              </div>
            </div>

            {/* STEP 2 */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-900/40">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                2
              </div>
              <div className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                <h4 className="font-bold text-stone-900 dark:text-white text-sm">
                  Buka Menu Ekstensi &gt; Apps Script
                </h4>
                <p>
                  Pada menu bar Google Sheets, klik menu <strong>Ekstensi (Extensions)</strong> &gt; pilih <strong>Apps Script</strong>.
                </p>
                <p>
                  Hapus semua kode bawaan di file <code className="font-mono bg-stone-200 dark:bg-stone-800 px-1 rounded">Code.gs</code>, lalu <strong>Paste</strong> seluruh kode Google Apps Script dari tab pertama di atas.
                </p>
                <p className="text-stone-500">
                  Tekan ikon Disket atau shortcut <kbd className="font-mono bg-stone-200 dark:bg-stone-800 px-1 py-0.5 rounded text-[11px]">Ctrl + S</kbd> (Mac: <kbd className="font-mono bg-stone-200 dark:bg-stone-800 px-1 py-0.5 rounded text-[11px]">Cmd + S</kbd>) untuk menyimpan file script.
                </p>
              </div>
            </div>

            {/* STEP 3 */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                3
              </div>
              <div className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">
                  Jalankan Fungsi Satu-Klik: setupDatabase()
                </h4>
                <p>
                  Di bilah toolbar Apps Script atas, pada dropdown fungsi yang dipilih, ganti dari <em>myFunction</em> menjadi <strong>setupDatabase</strong>. Lalu klik tombol <strong>Jalankan (Run)</strong>.
                </p>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Izin Akses Pertama Kali (Authorization Required):
                  </p>
                  <p>
                    Google akan memunculkan popup otorisasi. Klik <strong>Tinjau Izin (Review permissions)</strong> &gt; Pilih akun <strong>{userEmail}</strong> &gt; Klik <strong>Lanjutan (Advanced)</strong> di kiri bawah &gt; Klik <strong>Buka Project (tidak aman) / Go to project</strong> &gt; Klik <strong>Izinkan (Allow)</strong>.
                  </p>
                </div>
                <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  Tutup tab Apps Script sebentar untuk melihat file spreadsheet Anda: 3 tab (<code className="font-mono">Data_Service</code>, <code className="font-mono">Keuangan</code>, <code className="font-mono">Users</code>) telah selesai terbuat otomatis beserta warnanya!
                </p>
              </div>
            </div>

            {/* STEP 4 */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-900/40">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                4
              </div>
              <div className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                <h4 className="font-bold text-stone-900 dark:text-white text-sm">
                  Deploy Menjadi Web App (API Endpoint)
                </h4>
                <p>
                  Di pojok kanan atas Apps Script, klik tombol biru <strong>Terapkan (Deploy)</strong> &gt; pilih <strong>Penerapan baru (New deployment)</strong>.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-1 text-stone-600 dark:text-stone-400">
                  <li>Klik ikon gerigi di sebelah 'Pilih jenis' &gt; centang <strong>Aplikasi web (Web app)</strong>.</li>
                  <li>Deskripsi: <code className="font-mono bg-stone-200 dark:bg-stone-800 px-1 rounded">API Service HP v1.0</code></li>
                  <li>Jalankan sebagai (Execute as): <strong>Saya ({userEmail})</strong></li>
                  <li>Yang memiliki akses (Who has access): <strong className="text-emerald-600">Siapa saja (Anyone)</strong> <span className="text-[11px] text-stone-500">(Wajib 'Anyone' agar frontend browser kasir bisa membaca & menyimpan data tanpa perlu login akun Google berulang kali)</span>.</li>
                </ul>
                <p>
                  Klik tombol <strong>Terapkan (Deploy)</strong>, lalu klik <strong>Salin (Copy)</strong> pada URL Aplikasi Web yang berakhiran <code className="font-mono text-blue-600">/exec</code>.
                </p>
              </div>
            </div>

            {/* STEP 5 */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-900/40">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                5
              </div>
              <div className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                <h4 className="font-bold text-stone-900 dark:text-white text-sm">
                  Tempelkan URL di Aplikasi & Uji Koneksi
                </h4>
                <p>
                  Kembali ke aplikasi ini, paste URL tersebut ke input di bagian atas halaman ini, lalu klik <strong>Tes Koneksi (Ping)</strong>.
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Jika muncul badge hijau "Koneksi Cloud Google Spreadsheet Aktif", maka sistem sudah 100% terintegrasi realtime! Setiap service masuk, keluar, atau mutasi kas akan langsung terarsip di Google Drive Anda.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
