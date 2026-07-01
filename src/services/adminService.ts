import { QrisSettings, WhatsappSettings, ActivityLog, Booking } from '../types';

// Constants for default settings
export const DEFAULT_QRIS_SETTINGS: QrisSettings = {
  imageUrl: '/qris-full.png',
  bankName: 'QRIS Nasional (GPN)',
  accountName: 'ZEGAN HOMESTAY',
  instructions: 'Silakan scan QRIS di atas menggunakan e-wallet (GoPay, OVO, Dana, ShopeePay, LinkAja) atau Mobile Banking Anda. Masukkan nominal pembayaran tepat sesuai dengan total tagihan, lalu simpan bukti transfer untuk diunggah.'
};

export const DEFAULT_WHATSAPP_SETTINGS: WhatsappSettings = {
  token: 'fonnte-token-demo-xyz987',
  phoneNumber: '6285188144499',
  templateMessage: 'Halo {nama},\n\nTerima kasih, pembayaran untuk reservasi Anda telah berhasil dikonfirmasi LUNAS! 🎉\n\n🏨 Detail Reservasi:\n- Kode Booking: {kode}\n- Kamar: {kamar}\n- Check-in: {checkin}\n- Check-out: {checkout}\n- Jumlah Tamu: {tamu} orang\n- Total Pembayaran: {total}\n\nUnduh Invoice Resmi Anda di sini:\n{link_invoice}\n\nKami tidak sabar untuk menyambut kehadiran Anda di Zegan Homestay.\n\nJika ada pertanyaan lebih lanjut, silakan hubungi admin kami melalui nomor ini. Have a great day!'
};

// QRIS Settings
export function getQrisSettings(): QrisSettings {
  try {
    const raw = localStorage.getItem('zegan_settings_qris');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Auto-update if it is the old placeholder
      if (parsed.imageUrl && parsed.imageUrl.includes('zegan-homestay.com/payment')) {
        saveQrisSettings(DEFAULT_QRIS_SETTINGS);
        return DEFAULT_QRIS_SETTINGS;
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Error reading QRIS settings:', err);
  }
  return DEFAULT_QRIS_SETTINGS;
}

export function saveQrisSettings(settings: QrisSettings): void {
  localStorage.setItem('zegan_settings_qris', JSON.stringify(settings));
}

// QRIS EMVCo Parser, CRC16, and Dynamic Generator Helpers
export function parseQrisPayload(payload: string): Record<string, string> {
  const tags: Record<string, string> = {};
  let index = 0;
  while (index + 4 <= payload.length) {
    const tag = payload.substring(index, index + 2);
    const lengthStr = payload.substring(index + 2, index + 4);
    const length = parseInt(lengthStr, 10);
    if (isNaN(length)) break;
    const value = payload.substring(index + 4, index + 4 + length);
    tags[tag] = value;
    index += 4 + length;
  }
  return tags;
}

export function getCrc16(str: string): string {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    const code = str.charCodeAt(c);
    for (let i = 0; i < 8; i++) {
      const bit = ((code >> (7 - i)) & 1) ^ ((crc >> 15) & 1);
      crc = crc << 1;
      if (bit === 1) {
        crc ^= 0x1021;
      }
    }
  }
  crc = crc & 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function makeQrisDynamic(payload: string, amount: number): string {
  const tags = parseQrisPayload(payload);
  if (amount && amount > 0) {
    tags['54'] = Math.round(amount).toString();
    tags['01'] = '11'; // Keep as '11' (Static QR) so that banks scan it as a standard static merchant, but with a pre-filled amount tag '54'!
  } else {
    tags['01'] = '11'; // Static QR
    delete tags['54'];
  }
  delete tags['63']; // Delete old CRC to calculate a fresh one

  let reconstructed = '';
  // Sort keys in ascending order to follow EMVCo specification
  const sortedKeys = Object.keys(tags).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  for (const key of sortedKeys) {
    const val = tags[key];
    const len = val.length.toString().padStart(2, '0');
    reconstructed += key + len + val;
  }
  reconstructed += '6304';
  const crc = getCrc16(reconstructed);
  return reconstructed + crc;
}
export function getDynamicQrisImageUrl(amount: number): string {
  return '/qris-full.png';
}

// WhatsApp Settings
export function getWhatsappSettings(): WhatsappSettings {
  try {
    const raw = localStorage.getItem('zegan_settings_whatsapp');
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading WhatsApp settings:', err);
  }
  return DEFAULT_WHATSAPP_SETTINGS;
}

export function saveWhatsappSettings(settings: WhatsappSettings): void {
  localStorage.setItem('zegan_settings_whatsapp', JSON.stringify(settings));
}

// Activity Logging
export function logActivity(adminName: string, role: string, activity: string): void {
  try {
    const raw = localStorage.getItem('zegan_activity_logs');
    const logs: ActivityLog[] = raw ? JSON.parse(raw) : [];
    
    const newLog: ActivityLog = {
      id: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
      adminName,
      role: role as any,
      activity,
      timestamp: new Date().toISOString()
    };
    
    logs.unshift(newLog); // Put latest logs first
    localStorage.setItem('zegan_activity_logs', JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}

export function getActivityLogs(): ActivityLog[] {
  try {
    const raw = localStorage.getItem('zegan_activity_logs');
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to fetch activity logs:', err);
  }
  return [];
}

// Booking Expiration Checker (30 mins without proof)
export function checkBookingExpirations(): boolean {
  let changed = false;
  try {
    const rawBookings = localStorage.getItem('zegan_bookings');
    if (!rawBookings) return false;
    
    const bookings: Booking[] = JSON.parse(rawBookings);
    const now = new Date().getTime();
    
    const updatedBookings = bookings.map(b => {
      // If booking is still 'Pending' (or status 'pending' in lowercase fallback) 
      // and has no payment_proof, check if it was created more than 30 minutes ago.
      const statusLower = String(b.status).toLowerCase();
      if ((statusLower === 'pending') && !b.payment_proof) {
        const createdAtTime = new Date(b.created_at || b.check_in).getTime();
        const diffMs = now - createdAtTime;
        const diffMins = diffMs / (1000 * 60);
        
        if (diffMins >= 30) {
          changed = true;
          logActivity('System Scheduler', 'Customer', `Booking ${b.booking_code} otomatis expired karena tidak mengunggah bukti pembayaran dalam 30 menit.`);
          return {
            ...b,
            status: 'Expired' as any,
            payment_status: 'Expired' as any,
          };
        }
      }
      return b;
    });
    
    if (changed) {
      localStorage.setItem('zegan_bookings', JSON.stringify(updatedBookings));
    }
  } catch (err) {
    console.error('Error running booking expiration scheduler:', err);
  }
  return changed;
}

// Excel/CSV Exporter Helper
export function exportToCSV(data: any[], headers: string[], filename: string) {
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Add headers
  csvContent += headers.join(",") + "\n";
  
  // Add rows
  data.forEach(row => {
    const line = Object.values(row).map(val => {
      const stringVal = val === null || val === undefined ? "" : String(val);
      // Escape commas and double quotes
      if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n")) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    }).join(",");
    csvContent += line + "\n";
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Simulated Email Notification
export interface EmailSimLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  attachmentName: string;
  sentAt: string;
}

export function logSimulatedEmail(to: string, subject: string, body: string, attachmentName: string) {
  try {
    const raw = localStorage.getItem('zegan_email_logs');
    const logs: EmailSimLog[] = raw ? JSON.parse(raw) : [];
    
    const newLog: EmailSimLog = {
      id: `EMAIL-${Math.floor(100000 + Math.random() * 900000)}`,
      to,
      subject,
      body,
      attachmentName,
      sentAt: new Date().toISOString()
    };
    
    logs.unshift(newLog);
    localStorage.setItem('zegan_email_logs', JSON.stringify(logs));
  } catch (err) {
    console.warn('Error saving simulated email log:', err);
  }
}

export function getSimulatedEmailLogs(): EmailSimLog[] {
  try {
    const raw = localStorage.getItem('zegan_email_logs');
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Error fetching email logs:', err);
  }
  return [];
}
