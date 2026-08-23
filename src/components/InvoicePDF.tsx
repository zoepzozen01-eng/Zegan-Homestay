import { motion } from 'motion/react';
import { X, Printer, Download, Mail, MessageSquare, Calendar, Check, ShieldCheck } from 'lucide-react';
import { Booking } from '../types';
import { getQrisSettings, getWhatsappSettings, logActivity } from '../services/adminService';

interface InvoicePDFProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  lang: 'id' | 'en';
}

export default function InvoicePDF({ booking, isOpen, onClose, lang }: InvoicePDFProps) {
  if (!isOpen) return null;

  const qris = getQrisSettings();
  const wa = getWhatsappSettings();

  // Helper calculation
  const getDaysCount = (inDate: string, outDate: string) => {
    try {
      const d1 = new Date(inDate);
      const d2 = new Date(outDate);
      const diff = d2.getTime() - d1.getTime();
      const days = Math.round(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 1;
    } catch {
      return 1;
    }
  };

  const nights = getDaysCount(booking.check_in, booking.check_out);
  const pricePerNight = Math.round(booking.total_price / nights);
  const invoiceNo = `INV/${booking.created_at ? booking.created_at.substring(0, 10).replace(/-/g, '') : new Date().toISOString().substring(0, 10).replace(/-/g, '')}/${booking.booking_code}`;

  const handlePrint = () => {
    logActivity(
      'System',
      'Customer',
      `Invoice ${booking.booking_code} dicetak / disimpan sebagai PDF.`
    );
    window.print();
  };

  const handleDownloadHTML = () => {
    // Standard approach to generate a downloadable self-contained HTML invoice
    const content = document.getElementById('printable-invoice-content')?.innerHTML;
    if (!content) return;

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${booking.booking_code} - Zegan Homestay</title>
          <meta charset="utf-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,700&family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; }
            h1, h2, .font-serif { font-family: 'Playfair Display', serif; }
          </style>
        </head>
        <body class="bg-stone-100 p-8 flex justify-center">
          <div class="bg-white p-8 max-w-2xl w-full rounded-2xl shadow-xl border border-stone-200">
            ${content}
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${booking.booking_code}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logActivity(
      'System',
      'Customer',
      `File Invoice ${booking.booking_code} diunduh.`
    );
  };

  const handleSendWA = () => {
    const text = `Halo, berikut adalah link Invoice resmi Anda untuk pesanan ${booking.booking_code} di Zegan Homestay:\n\nhttps://zegan-homestay.com/invoice/${booking.booking_code}\n\nTerima kasih!`;
    const waUrl = `https://wa.me/${wa.phoneNumber}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    logActivity(
      'System',
      'Customer',
      `Invoice ${booking.booking_code} dibagikan ke WhatsApp.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs print:p-0 print:bg-white print:relative print:z-0">
      {/* Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-brand-200 overflow-hidden relative z-10 flex flex-col max-h-[92vh] print:shadow-none print:border-none print:rounded-none print:max-h-none print:w-full"
      >
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-900 bg-brand-100/70 px-2.5 py-1 rounded-full">
              Invoice Portal
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Print"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'id' ? 'Cetak' : 'Print'}</span>
            </button>
            <button
              onClick={handleDownloadHTML}
              className="p-2 rounded-lg bg-brand-100 hover:bg-brand-200 text-brand-900 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Download HTML"
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'id' ? 'Unduh HTML' : 'Download'}</span>
            </button>
            <button
              onClick={handleSendWA}
              className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Kirim WA"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WA Link</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-stone-100 hover:bg-red-50 hover:text-red-600 text-stone-400 transition-all cursor-pointer ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Body Content */}
        <div 
          id="printable-invoice-content"
          className="p-8 sm:p-10 overflow-y-auto print:overflow-visible print:p-0 flex-1 space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-stone-200 pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏡</span>
                <span className="text-xl font-bold font-serif text-brand-950">Zegan Homestay</span>
              </div>
              <p className="text-[11px] text-stone-500 max-w-sm font-sans leading-relaxed">
                Banaran, Galur, Kulon Progo, Yogyakarta • Admin WA: +{wa.phoneNumber}
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <h2 className="text-lg font-bold font-serif tracking-tight text-stone-900 uppercase">
                {lang === 'id' ? 'INVOICE RESMI' : 'OFFICIAL INVOICE'}
              </h2>
              <div className="text-[10px] font-mono text-stone-500">{invoiceNo}</div>
              <div className="text-[11px] text-stone-600">
                {lang === 'id' ? 'Tanggal Pembayaran' : 'Payment Date'}:{' '}
                <span className="font-semibold text-stone-900">
                  {booking.payment_date ? booking.payment_date.substring(0, 10) : new Date().toISOString().substring(0, 10)}
                </span>
              </div>
            </div>
          </div>

          {/* Booking Code & Invoice Status Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-brand-900/70 uppercase tracking-wider block">
                {lang === 'id' ? 'Kode Booking Anda' : 'Your Booking Code'}
              </span>
              <span className="text-xl font-mono font-bold text-brand-950 tracking-wider mt-0.5">
                {booking.booking_code}
              </span>
              <span className="text-[9px] text-stone-400 font-sans mt-1">
                {lang === 'id' ? '*Simpan kode ini untuk melakukan cek status' : '*Use this code to search and check stay records'}
              </span>
            </div>

            <div className="border border-green-200 bg-green-50/50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-green-800 uppercase tracking-wider block">
                  {lang === 'id' ? 'STATUS INVOICE' : 'INVOICE STATUS'}
                </span>
                <span className="text-lg font-bold text-green-900 uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-green-700 shrink-0" />
                  {lang === 'id' ? 'Lunas / Terbayar' : 'PAID IN FULL'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-green-700/80 uppercase tracking-widest font-bold border border-green-300 bg-green-100/70 px-2 py-0.5 rounded">
                  OFFICIAL
                </span>
              </div>
            </div>
          </div>

          {/* Guest and Reservation details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-100 pb-1.5">
                {lang === 'id' ? 'Informasi Tamu' : 'Guest Details'}
              </h4>
              <div className="space-y-1 text-xs text-stone-700">
                <p>Nama: <span className="font-semibold text-stone-900">{booking.full_name}</span></p>
                <p>Email: <span className="font-semibold text-stone-900">{booking.email}</span></p>
                <p>WhatsApp/HP: <span className="font-semibold text-stone-900">{booking.phone}</span></p>
                {booking.guests && (
                  <p>Jumlah Tamu: <span className="font-semibold text-stone-900">{booking.guests} Orang {booking.extra_beds ? `(+${booking.extra_beds} Kasur Tambahan)` : ''}</span></p>
                )}
                {booking.special_requests && (
                  <p className="text-[11px] italic text-stone-500 mt-1">
                    Catatan: "{booking.special_requests}"
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-100 pb-1.5">
                {lang === 'id' ? 'Detail Reservasi' : 'Reservation Details'}
              </h4>
              <div className="space-y-1 text-xs text-stone-700">
                <p>Check-In: <span className="font-semibold text-emerald-800">🟢 {booking.check_in} (pk {booking.check_in_time || '14:00'} WIB)</span></p>
                <p>Check-Out: <span className="font-semibold text-rose-800">🔴 {booking.check_out} (pk {booking.check_out_time || '12:00'} WIB)</span></p>
                <p>Jumlah Malam: <span className="font-semibold text-stone-900">{nights} malam</span></p>
                <p>Nomor Kamar: <span className="font-bold text-brand-900">{booking.room_number || 'A-1'}</span></p>
                {booking.extra_beds ? (
                  <p className="text-amber-800 font-medium">🛏️ Kasur Tambahan: <span className="font-bold">+{booking.extra_beds} unit</span></p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Itemized Pricing Table */}
          <div className="border border-stone-200 rounded-xl overflow-hidden pt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 font-semibold text-stone-700">
                  <th className="p-3">{lang === 'id' ? 'Deskripsi Layanan' : 'Description'}</th>
                  <th className="p-3 text-center">{lang === 'id' ? 'Durasi' : 'Nights'}</th>
                  <th className="p-3 text-right">{lang === 'id' ? 'Harga Satuan' : 'Unit Price'}</th>
                  <th className="p-3 text-right">{lang === 'id' ? 'Total' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                <tr>
                  <td className="p-3 font-semibold text-stone-900">
                    Sewa Kamar: {booking.room_name || 'Kamar Zegan Homestay'} ({booking.check_in} s/d {booking.check_out})
                  </td>
                  <td className="p-3 text-center font-medium">{nights} Malam</td>
                  <td className="p-3 text-right font-mono">
                    Rp{Math.round(((booking.total_price - (booking.extra_bed_price || 0)) / nights) || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold text-stone-950">
                    Rp{(booking.total_price - (booking.extra_bed_price || 0)).toLocaleString('id-ID')}
                  </td>
                </tr>
                {Boolean(booking.extra_beds && booking.extra_beds > 0) && (
                  <tr className="bg-amber-50/40">
                    <td className="p-3 font-medium text-amber-900">
                      🛏️ Kasur Tambahan (Extra Bed x{booking.extra_beds})
                    </td>
                    <td className="p-3 text-center font-medium">{nights} Malam</td>
                    <td className="p-3 text-right font-mono text-amber-900">
                      Rp{(50000 * (booking.extra_beds || 1)).toLocaleString('id-ID')} / mlm
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-amber-950">
                      Rp{(booking.extra_bed_price || (50000 * (booking.extra_beds || 1) * nights)).toLocaleString('id-ID')}
                    </td>
                  </tr>
                )}
                {/* Tax / Service included */}
                <tr className="bg-stone-50/50">
                  <td className="p-3 text-stone-500 italic" colSpan={3}>
                    *Tax & Service Charge (Included)
                  </td>
                  <td className="p-3 text-right font-mono text-stone-500">Rp0</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-stone-200 font-bold bg-brand-50/30 text-stone-900">
                  <td className="p-3 text-sm" colSpan={3}>
                    Grand Total ({lang === 'id' ? 'TERBAYAR LUNAS' : 'PAID IN FULL'})
                  </td>
                  <td className="p-3 text-right text-sm text-brand-900 font-mono">
                    Rp{booking.total_price?.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer of the Invoice with QR code and signature */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-4 border-t border-dashed border-stone-200">
            {/* Signature */}
            <div className="text-center sm:text-left space-y-4">
              <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                {lang === 'id' ? 'Petugas Konfirmasi' : 'Authorized Signatory'}
              </p>
              <div className="font-serif italic text-lg text-brand-850 h-8 flex items-end justify-center sm:justify-start">
                <span className="relative inline-block border-b border-brand-300 pb-1">
                  Zegan Homestay Admin
                  {/* Mock signature stamp */}
                  <span className="absolute -right-6 -top-5 text-[8px] border border-green-500 text-green-500 rotate-12 px-1 rounded select-none opacity-80 uppercase font-sans font-bold">
                    VERIFIED
                  </span>
                </span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center shrink-0">
              <div className="border border-stone-200 p-2 rounded-xl bg-white shadow-xs">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${booking.booking_code}`}
                  alt="QR Code Booking"
                  className="w-24 h-24"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[9px] font-mono text-stone-400 mt-1.5 uppercase tracking-widest font-semibold">
                SCAN TO CONFIRM
              </span>
            </div>
          </div>

          {/* Thank you note */}
          <div className="text-center text-[10px] text-stone-400 font-sans border-t border-stone-100 pt-4">
            Maturnuwun • Thank you for choosing Zegan Homestay & Cafe as your travel companion in Yogyakarta.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
