/**
 * Fonnte WhatsApp API Service
 * Handles sending WhatsApp notifications to the admin on new bookings.
 */

import { Booking } from '../types';

/**
 * Sends a WhatsApp notification to the Admin via Fonnte API when a new booking is created.
 * @param booking The Booking object
 * @param roomType Name of the booked room type
 * @returns Promise<boolean> True if sent successfully, false otherwise
 */
export async function sendAdminNotification(booking: Booking, roomType: string): Promise<boolean> {
  const token = import.meta.env.VITE_FONNTE_TOKEN;
  const adminPhone = import.meta.env.VITE_ADMIN_PHONE;

  console.log('[Fonnte Service] Preparing admin WhatsApp notification...');

  if (!token) {
    console.warn('[Fonnte Service] VITE_FONNTE_TOKEN is not defined in environment variables. Notification not sent.');
    return false;
  }

  if (!adminPhone) {
    console.warn('[Fonnte Service] VITE_ADMIN_PHONE is not defined in environment variables. Notification not sent.');
    return false;
  }

  // Format price
  const formattedPrice = new Intl.NumberFormat('id-ID').format(booking.total_price);

  // Format dates nicely
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Construct message matching user's exact specification
  const message = `🔔 BOOKING BARU

Ada customer baru yang melakukan booking.

Status :
Menunggu Pembayaran QRIS

===========================

Kode Booking :
${booking.booking_code}

Nama :
${booking.full_name}

Nomor HP :
${booking.phone}

Email :
${booking.email}

Tipe Kamar :
${roomType}

Check In :
${formatDate(booking.check_in)}

Check Out :
${formatDate(booking.check_out)}

Jumlah Tamu :
${booking.guests}

Total Pembayaran :
Rp ${formattedPrice}

Silakan menunggu pembayaran dari customer.`;

  try {
    const headers = new Headers();
    headers.append('Authorization', token);

    const formdata = new FormData();
    formdata.append('target', adminPhone);
    formdata.append('message', message);

    console.log('[Fonnte Service] Sending request to Fonnte API...');
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: headers,
      body: formdata,
    });

    const result = await response.json();
    console.log('[Fonnte Service] Fonnte Response:', result);

    if (response.ok && result && result.status === true) {
      console.log('[Fonnte Service] WhatsApp notification sent successfully to admin!');
      return true;
    } else {
      console.warn('[Fonnte Service] Could not send WhatsApp via Fonnte (device may be disconnected or token invalid):', result?.reason || JSON.stringify(result));
      return false;
    }
  } catch (error) {
    console.warn('[Fonnte Service] Exception occurred while sending Fonnte WhatsApp:', error);
    return false;
  }
}
