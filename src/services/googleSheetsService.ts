// Google Sheets API Service via Google Apps Script (GAS) Web App
import { ServiceOrder, FinancialTransaction, UserAccount } from '../types';

export interface GasResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  timestamp?: string;
}

export const getStoredGasUrl = (): string => {
  return localStorage.getItem('servis_hp_gas_url') || '';
};

export const setStoredGasUrl = (url: string): void => {
  localStorage.setItem('servis_hp_gas_url', url.trim());
};

/**
 * Ping test to verify Google Apps Script endpoint
 */
export async function testGasConnection(webAppUrl: string): Promise<GasResponse> {
  if (!webAppUrl) {
    throw new Error('URL Google Apps Script belum dimasukkan.');
  }

  const cleanUrl = webAppUrl.trim();
  const testUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=ping&_t=${Date.now()}`;

  const response = await fetch(testUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Koneksi HTTP gagal (${response.status}: ${response.statusText})`);
  }

  const json = await response.json();
  return json;
}

/**
 * Send Service Masuk to Google Sheets
 */
export async function syncServiceMasukToSheets(webAppUrl: string, order: ServiceOrder): Promise<GasResponse> {
  if (!webAppUrl) {
    return { status: 'error', message: 'URL Google Apps Script tidak aktif' };
  }

  const payload = {
    action: 'create_service',
    order: {
      notaNumber: order.notaNumber,
      receivedDate: order.receivedDate,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deviceBrand: order.deviceBrand,
      deviceModel: order.deviceModel,
      imei: order.imei || '-',
      screenLockType: order.screenLockType,
      screenLockValue: order.screenLockValue || '-',
      completeness: order.completeness.join(', ') + (order.completenessNotes ? ` (${order.completenessNotes})` : ''),
      damageDetails: order.damageDetails,
      estimatedCost: order.estimatedCost || 0,
      receivedBy: order.receivedBy,
      status: order.status
    }
  };

  const response = await fetch(webAppUrl.trim(), {
    method: 'POST',
    // Using text/plain avoids CORS preflight OPTIONS rejection in Google Apps Script
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  return await response.json();
}

/**
 * Update Service Progress & Status to Google Sheets
 */
export async function syncStatusUpdateToSheets(
  webAppUrl: string, 
  notaNumber: string, 
  newStatus: string, 
  technicianName: string, 
  diagnosisNotes: string
): Promise<GasResponse> {
  if (!webAppUrl) {
    return { status: 'error', message: 'URL Google Apps Script tidak aktif' };
  }

  const payload = {
    action: 'update_status',
    notaNumber,
    status: newStatus,
    technicianName: technicianName || '-',
    diagnosisNotes: diagnosisNotes || '-'
  };

  const response = await fetch(webAppUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  return await response.json();
}

/**
 * Complete Service & Release (Service Keluar) to Google Sheets
 * Also automatically logs income into 'Keuangan' sheet!
 */
export async function syncServiceKeluarToSheets(webAppUrl: string, order: ServiceOrder): Promise<GasResponse> {
  if (!webAppUrl) {
    return { status: 'error', message: 'URL Google Apps Script tidak aktif' };
  }

  const totalPartsCost = order.replacedParts.reduce((acc, p) => acc + (p.sellingPrice * p.qty), 0);
  const partsSummary = order.replacedParts.map(p => `${p.name} (x${p.qty})`).join('; ') || '-';

  const payload = {
    action: 'service_keluar',
    order: {
      notaNumber: order.notaNumber,
      status: order.status,
      technicianName: order.technicianName || '-',
      diagnosisNotes: order.diagnosisNotes || '-',
      repairActionDetails: order.repairActionDetails || '-',
      replacedPartsSummary: partsSummary,
      technicianFee: order.technicianFee || 0,
      totalPartsCost: totalPartsCost,
      discount: order.discount || 0,
      totalCost: order.totalCost || 0,
      depositPaid: order.depositPaid || 0,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod || 'tunai',
      outDate: order.outDate || new Date().toISOString(),
      warrantyDays: order.warrantyDays || 0,
      warrantyEndDate: order.warrantyEndDate || '-',
      handoverNotes: order.handoverNotes || '-'
    }
  };

  const response = await fetch(webAppUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  return await response.json();
}

/**
 * Sync Financial Transaction to Google Sheets
 */
export async function syncFinancialToSheets(webAppUrl: string, trx: FinancialTransaction): Promise<GasResponse> {
  if (!webAppUrl) {
    return { status: 'error', message: 'URL Google Apps Script tidak aktif' };
  }

  const payload = {
    action: 'add_financial',
    transaction: {
      id: trx.id,
      date: trx.date,
      type: trx.type,
      category: trx.category,
      title: trx.title,
      amount: trx.amount,
      referenceId: trx.referenceId || '-',
      recordedBy: trx.recordedBy,
      notes: trx.notes || '-'
    }
  };

  const response = await fetch(webAppUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  return await response.json();
}

/**
 * Sync All Users & Staff to Google Sheets
 */
export async function syncUsersToSheets(webAppUrl: string, users: UserAccount[]): Promise<GasResponse> {
  if (!webAppUrl) {
    return { status: 'error', message: 'URL Google Apps Script tidak aktif' };
  }

  const payload = {
    action: 'sync_users',
    users: users.map(u => ({
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      status: u.isActive ? 'active' : 'inactive',
      phone: u.phone || '-'
    }))
  };

  const response = await fetch(webAppUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  return await response.json();
}

/**
 * Delete User / Staff from Google Sheets
 */
export async function deleteUserFromSheets(
  webAppUrl: string, 
  userToDelete: { id: string; username: string; fullName: string },
  remainingUsers: UserAccount[]
): Promise<GasResponse> {
  if (!webAppUrl) {
    return { status: 'error', message: 'URL Google Apps Script tidak aktif' };
  }

  const payload = {
    action: 'deleteUser',
    userId: userToDelete.id,
    username: userToDelete.username,
    fullName: userToDelete.fullName,
    users: remainingUsers.map(u => ({
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      status: u.isActive ? 'active' : 'inactive',
      phone: u.phone || '-'
    }))
  };

  const response = await fetch(webAppUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  return await response.json();
}

/**
 * Delete Service Order from Google Sheets
 */
export async function deleteServiceFromSheets(
  webAppUrl: string,
  notaNumber: string
): Promise<GasResponse> {
  if (!webAppUrl) {
    return { status: 'error', message: 'URL Google Apps Script tidak aktif' };
  }

  const payload = {
    action: 'delete_service',
    notaNumber
  };

  const response = await fetch(webAppUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  return await response.json();
}

/**
 * Reset & Kosongkan Seluruh Data Demo di Google Sheets (Data_Service & Keuangan)
 */
export async function resetDatabaseSheets(webAppUrl: string): Promise<GasResponse> {
  if (!webAppUrl) {
    return { status: 'error', message: 'URL Google Apps Script tidak aktif' };
  }

  const payload = {
    action: 'reset_database'
  };

  const response = await fetch(webAppUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  return await response.json();
}


