import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Calendar, Users, CheckCircle2, Clock, 
  Phone, Mail, User, Copy, MessageSquare, AlertCircle 
} from 'lucide-react';
import { Language } from '../types';
import { supabase } from '../lib/supabase';
import { ROOMS } from '../data';

interface BookingLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export default function BookingLookupModal({ isOpen, onClose, lang }: BookingLookupModalProps) {
  const [searchCode, setSearchCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryCode = searchCode.trim().toUpperCase();
    if (!queryCode) return;

    setLoading(true);
    setError(null);
    setBooking(null);

    try {
      // 1. First attempt to fetch from Supabase
      const { data, error: sbError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_code', queryCode);

      if (sbError) {
        console.warn('Supabase lookup failed, trying local backup...', sbError);
        // Fallback to local storage if table doesn't exist
        throw new Error(sbError.message);
      }

      if (data && data.length > 0) {
        setBooking({
          ...data[0],
          isLocalBackup: false
        });
        setLoading(false);
        return;
      }

      // If not found in Supabase, try local storage backup
      const localBookingsRaw = localStorage.getItem('zegan_bookings');
      if (localBookingsRaw) {
        const localBookings = JSON.parse(localBookingsRaw);
        const matched = localBookings.find((b: any) => b.bookingCode?.toUpperCase() === queryCode || b.booking_code?.toUpperCase() === queryCode);
        if (matched) {
          setBooking({
            booking_code: matched.bookingCode || matched.booking_code,
            room_name: matched.room_name || matched.roomName || ROOMS.find(r => r.id === matched.roomId)?.name || 'Kamar Zegan',
            check_in: matched.checkIn || matched.check_in,
            check_out: matched.checkOut || matched.check_out,
            guests: matched.guests,
            full_name: matched.name || matched.full_name,
            email: matched.email,
            phone: matched.phone,
            special_requests: matched.specialRequests || matched.special_requests || '-',
            total_price: matched.totalPrice || matched.total_price,
            status: matched.status || 'pending',
            isLocalBackup: true
          });
          setLoading(false);
          return;
        }
      }

      // If absolutely not found
      setError(
        lang === 'id' 
          ? 'Kode booking tidak ditemukan. Silakan periksa kembali kode Anda.' 
          : 'Booking code not found. Please double-check your code.'
      );

    } catch (err: any) {
      console.error('Error querying bookings:', err);
      
      // Fallback directly to local storage backup on error (e.g. table not initialized)
      const localBookingsRaw = localStorage.getItem('zegan_bookings');
      if (localBookingsRaw) {
        try {
          const localBookings = JSON.parse(localBookingsRaw);
          const matched = localBookings.find((b: any) => b.bookingCode?.toUpperCase() === queryCode || b.booking_code?.toUpperCase() === queryCode);
          if (matched) {
            setBooking({
              booking_code: matched.bookingCode || matched.booking_code,
              room_name: matched.room_name || matched.roomName || ROOMS.find(r => r.id === matched.roomId)?.name || 'Kamar Zegan',
              check_in: matched.checkIn || matched.check_in,
              check_out: matched.checkOut || matched.check_out,
              guests: matched.guests,
              full_name: matched.name || matched.full_name,
              email: matched.email,
              phone: matched.phone,
              special_requests: matched.specialRequests || matched.special_requests || '-',
              total_price: matched.totalPrice || matched.total_price,
              status: matched.status || 'pending',
              isLocalBackup: true
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }

      setError(
        lang === 'id'
          ? 'Koneksi database terganggu atau kode salah. Cari di backup lokal gagal.'
          : 'Database connection issue or invalid code.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.booking_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWhatsAppMessage = () => {
    if (!booking) return '';
    const text = 
`Halo Admin Zegan Homestay! Saya ingin menanyakan status pesanan saya:

🏨 *KODE BOOKING: ${booking.booking_code}*
----------------------------------------
• Kamar: ${booking.room_name}
• Check-in: ${booking.check_in}
• Check-out: ${booking.check_out}
• Tamu: ${booking.guests} orang
• Total Pembayaran: Rp${booking.total_price?.toLocaleString('id-ID')}
• Status: ${booking.status?.toUpperCase()}

👤 *DATA PEMESAN:*
• Nama: ${booking.full_name}
• Email: ${booking.email}
• WhatsApp/HP: ${booking.phone}

Mohon bantuannya untuk proses selanjutnya. Terima kasih!`;
    return encodeURIComponent(text);
  };

  const waUrl = `https://wa.me/6285188144499?text=${getWhatsAppMessage()}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-brand-50 w-full max-w-lg rounded-2xl shadow-2xl border border-brand-200 overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-5 border-b border-brand-200/60 bg-brand-100/50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-serif font-normal text-xl text-brand-950">
                  {lang === 'id' ? 'Cari Kode Reservasi' : 'Find Reservation'}
                </h3>
                <p className="text-stone-500 text-[11px] font-sans tracking-wide mt-0.5">
                  {lang === 'id' ? 'Cek status pesanan Anda dari database Supabase' : 'Verify booking status via Supabase real-time database'}
                </p>
              </div>
              <button
                id="close-lookup-modal"
                onClick={onClose}
                className="p-1.5 rounded-lg text-stone-400 hover:text-brand-900 hover:bg-brand-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Search Form */}
              <form onSubmit={handleSearch} className="space-y-3">
                <label className="block text-xs font-semibold text-brand-950/70">
                  {lang === 'id' ? 'Masukkan Kode Booking (contoh: ZG-12345)' : 'Enter Booking Code (e.g. ZG-12345)'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="lookup-code-input"
                      type="text"
                      placeholder="ZG-XXXXX"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-200 rounded-xl text-brand-950 text-sm font-mono tracking-widest focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 font-bold uppercase transition-all"
                      required
                    />
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  </div>
                  <button
                    id="submit-lookup-search"
                    type="submit"
                    disabled={loading}
                    className="bg-brand-700 hover:bg-brand-850 text-white font-semibold text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (lang === 'id' ? 'Mencari...' : 'Searching...') : (lang === 'id' ? 'Cari' : 'Search')}
                  </button>
                </div>
              </form>

              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Booking Result View */}
              {booking && (
                <div className="space-y-4 border border-brand-200 rounded-xl p-4 bg-white shadow-xs">
                  {/* Title Bar & Status Badge */}
                  <div className="flex justify-between items-start border-b border-brand-100 pb-3">
                    <div>
                      <span className="text-[10px] text-stone-500 font-semibold block uppercase tracking-wider">
                        {lang === 'id' ? 'KODE RESERVASI' : 'RESERVATION CODE'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-bold text-base text-brand-950">{booking.booking_code}</span>
                        <button
                          id="copy-booking-code"
                          type="button"
                          onClick={handleCopy}
                          className="p-1 text-stone-400 hover:text-brand-700 hover:bg-brand-100 rounded-md transition-all cursor-pointer"
                          title="Copy Code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {copied && (
                          <span className="text-[9px] bg-brand-700 text-brand-100 px-1.5 py-0.5 rounded-sm font-sans">
                            {lang === 'id' ? 'Disalin' : 'Copied'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-stone-500 font-semibold block uppercase tracking-wider mb-1">
                        {lang === 'id' ? 'STATUS' : 'STATUS'}
                      </span>
                      {booking.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-full border border-green-200 uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          {lang === 'id' ? 'Terkonfirmasi' : 'Confirmed'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          {lang === 'id' ? 'Pending' : 'Pending'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-stone-400 font-medium block mb-0.5">{lang === 'id' ? 'Kamar Pilihan' : 'Selected Room'}</span>
                      <span className="font-bold text-brand-950">{booking.room_name}</span>
                    </div>

                    <div>
                      <span className="text-stone-400 font-medium block mb-0.5">{lang === 'id' ? 'Jumlah Tamu' : 'Guests Count'}</span>
                      <span className="font-bold text-brand-950 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-brand-700" />
                        {booking.guests} {lang === 'id' ? 'Orang' : 'Guests'}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 font-medium block mb-0.5">{lang === 'id' ? 'Tanggal Check-In' : 'Check-In Date'}</span>
                      <span className="font-bold text-brand-950 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-700" />
                        {booking.check_in}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 font-medium block mb-0.5">{lang === 'id' ? 'Tanggal Check-Out' : 'Check-Out Date'}</span>
                      <span className="font-bold text-brand-950 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-700" />
                        {booking.check_out}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info Card */}
                  <div className="bg-brand-100/40 p-3 rounded-lg border border-brand-200/50 space-y-2 text-xs">
                    <span className="text-[10px] font-bold text-brand-900 block uppercase tracking-wider">
                      {lang === 'id' ? 'Data Pemesan' : 'Customer Details'}
                    </span>
                    <div className="flex items-center gap-2 text-stone-700">
                      <User className="w-3.5 h-3.5 text-brand-700" />
                      <span className="font-medium text-brand-950">{booking.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-700">
                      <Mail className="w-3.5 h-3.5 text-brand-700" />
                      <span>{booking.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-700">
                      <Phone className="w-3.5 h-3.5 text-brand-700" />
                      <span>{booking.phone}</span>
                    </div>
                    {booking.special_requests && (
                      <div className="mt-1 pt-1.5 border-t border-brand-200/40 text-[11px] text-stone-600">
                        <span className="font-semibold text-brand-900 block mb-0.5">{lang === 'id' ? 'Catatan Khusus' : 'Special Notes'}</span>
                        <p className="italic font-light">"{booking.special_requests}"</p>
                      </div>
                    )}
                  </div>

                  {/* Price Tag & Action */}
                  <div className="pt-2 border-t border-brand-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div>
                      <span className="text-[10px] text-stone-400 font-medium block uppercase tracking-wider">
                        {lang === 'id' ? 'Total Pembayaran' : 'Total Price'}
                      </span>
                      <span className="text-lg font-serif font-bold text-brand-800">
                        Rp{booking.total_price?.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <a
                      id="lookup-wa-button"
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#25D366] hover:bg-[#20ba56] text-white font-bold px-4 py-2.5 rounded-xl text-center text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <MessageSquare className="w-4 h-4 fill-current" />
                      <span>{lang === 'id' ? 'Hubungi Admin' : 'Contact Support'}</span>
                    </a>
                  </div>

                  {booking.isLocalBackup && (
                    <div className="text-[9px] text-stone-400 italic text-center pt-1 border-t border-dashed border-stone-200">
                      {lang === 'id' 
                        ? '*Menampilkan data cadangan lokal. Silakan hubungi admin untuk konfirmasi akhir.' 
                        : '*Showing local backup data. Please contact admin for final confirmation.'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-brand-200/60 bg-brand-100/20 text-center shrink-0">
              <span className="text-[10px] text-stone-400 font-sans block">
                Zegan Homestay & Cafe • Kulon Progo, Yogyakarta
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
