import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Calendar, Users, FileText, CheckCircle2, Clock, XCircle, AlertTriangle, ArrowRight, Upload, Check, CreditCard, ExternalLink, Image as ImageIcon, Coffee, Minus, Plus, Send, Sparkles, MessageSquare } from 'lucide-react';
import { Booking, BookingStatus, PaymentStatus, ServiceSignal } from '../types';
import { getQrisSettings, getWhatsappSettings, logActivity, getDynamicQrisImageUrl } from '../services/adminService';
import { CAFE_ITEMS } from '../data';
import InvoicePDF from './InvoicePDF';

interface CustomerPortalProps {
  lang: 'id' | 'en';
}

export default function CustomerPortal({ lang }: CustomerPortalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Booking[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');
  const [uploadingCode, setUploadingCode] = useState<string | null>(null);
  const [uploadedProof, setUploadedProof] = useState<string | null>(null);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);

  // States for live service signals & food orders
  const [activeActionTab, setActiveActionTab] = useState<{[code: string]: 'none' | 'food' | 'service'}>({});
  const [foodQuantities, setFoodQuantities] = useState<{[code_itemId: string]: number}>({});
  const [customRequests, setCustomRequests] = useState<{[code: string]: string}>({});
  const [successNotification, setSuccessNotification] = useState<{[code: string]: string}>({});

  // Live tracking states for signals and notifications
  const [trackedSignals, setTrackedSignals] = useState<ServiceSignal[]>([]);
  const [foodNotifications, setFoodNotifications] = useState<any[]>([]);

  const loadTrackedSignalsAndNotifications = () => {
    try {
      const rawSignals = localStorage.getItem('zegan_service_signals') || '[]';
      const parsedSignals: ServiceSignal[] = JSON.parse(rawSignals);
      setTrackedSignals(parsedSignals);

      const rawNotifs = localStorage.getItem('zegan_food_notifications') || '[]';
      const parsedNotifs = JSON.parse(rawNotifs);
      setFoodNotifications(parsedNotifs);
    } catch (err) {
      console.error('Error loading signals/notifs:', err);
    }
  };

  useEffect(() => {
    loadTrackedSignalsAndNotifications();

    // Listen to storage event (updates from Staff Sinyal tab)
    const handleStorageChange = () => {
      loadTrackedSignalsAndNotifications();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Fallback polling for real-time responsiveness
    const interval = setInterval(loadTrackedSignalsAndNotifications, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleFoodOrderSubmit = (booking: Booking) => {
    const orderItems: string[] = [];
    CAFE_ITEMS.forEach(item => {
      const qty = foodQuantities[`${booking.booking_code}_${item.id}`] || 0;
      if (qty > 0) {
        orderItems.push(`${qty}x ${item.name}`);
      }
    });

    if (orderItems.length === 0) {
      alert(lang === 'id' ? 'Silakan pilih minimal 1 item menu makanan/minuman.' : 'Please select at least 1 food or beverage item.');
      return;
    }

    const detailsStr = orderItems.join(', ');

    const newSignal: ServiceSignal = {
      id: `customer-sig-${Date.now()}`,
      booking_code: booking.booking_code,
      room_number: booking.room_number || '101',
      guest_name: booking.full_name,
      type: 'food',
      details: detailsStr,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      const raw = localStorage.getItem('zegan_service_signals') || '[]';
      const existing: ServiceSignal[] = JSON.parse(raw);
      existing.push(newSignal);
      localStorage.setItem('zegan_service_signals', JSON.stringify(existing));

      logActivity(
        'Customer',
        'Customer',
        `Tamu ${booking.full_name} (Kamar ${booking.room_number || '101'}) memesan makanan: ${detailsStr}`
      );

      const updatedQuantities = { ...foodQuantities };
      CAFE_ITEMS.forEach(item => {
        delete updatedQuantities[`${booking.booking_code}_${item.id}`];
      });
      setFoodQuantities(updatedQuantities);

      setSuccessNotification(prev => ({
        ...prev,
        [booking.booking_code]: lang === 'id' 
          ? 'Sinyal Pesanan Makanan terkirim! Staff kami sedang menyiapkan.' 
          : 'Food order signal sent! Our staff is preparing it now.'
      }));

      setTimeout(() => {
        setSuccessNotification(prev => ({ ...prev, [booking.booking_code]: '' }));
      }, 5000);

      setActiveActionTab(prev => ({ ...prev, [booking.booking_code]: 'none' }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleServiceRequestSubmit = (booking: Booking, customMsg?: string) => {
    const detailsStr = customMsg || customRequests[booking.booking_code] || '';
    if (!detailsStr.trim()) {
      alert(lang === 'id' ? 'Silakan ketik atau pilih permintaan layanan.' : 'Please enter or select a service request.');
      return;
    }

    const newSignal: ServiceSignal = {
      id: `customer-sig-${Date.now()}`,
      booking_code: booking.booking_code,
      room_number: booking.room_number || '101',
      guest_name: booking.full_name,
      type: 'message',
      details: detailsStr.trim(),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      const raw = localStorage.getItem('zegan_service_signals') || '[]';
      const existing: ServiceSignal[] = JSON.parse(raw);
      existing.push(newSignal);
      localStorage.setItem('zegan_service_signals', JSON.stringify(existing));

      logActivity(
        'Customer',
        'Customer',
        `Tamu ${booking.full_name} (Kamar ${booking.room_number || '101'}) mengirim pesan: ${detailsStr}`
      );

      setCustomRequests(prev => ({ ...prev, [booking.booking_code]: '' }));

      setSuccessNotification(prev => ({
        ...prev,
        [booking.booking_code]: lang === 'id' 
          ? 'Sinyal Permintaan Layanan terkirim! Staff kami akan segera mengantarnya.' 
          : 'Service request signal sent! Our staff will deliver it shortly.'
      }));

      setTimeout(() => {
        setSuccessNotification(prev => ({ ...prev, [booking.booking_code]: '' }));
      }, 5000);

      setActiveActionTab(prev => ({ ...prev, [booking.booking_code]: 'none' }));
    } catch (err) {
      console.error(err);
    }
  };

  const qris = getQrisSettings();
  const wa = getWhatsappSettings();

  // Load bookings from local storage or database on mount/search
  const performSearch = () => {
    setError(null);
    setHasSearched(true);
    
    if (!searchQuery.trim()) {
      setError(lang === 'id' ? 'Silakan masukkan nomor HP, email, atau kode booking.' : 'Please enter a phone number, email, or booking code.');
      return;
    }

    const cleanQuery = searchQuery.trim().toLowerCase();

    try {
      const raw = localStorage.getItem('zegan_bookings');
      if (raw) {
        const allBookings: Booking[] = JSON.parse(raw);
        
        // Match by phone, email, or booking code
        const matched = allBookings.filter(b => {
          const matchCode = b.booking_code.toLowerCase().includes(cleanQuery);
          const matchEmail = b.email.toLowerCase().includes(cleanQuery);
          const matchPhone = b.phone.replace(/[^0-9]/g, '').includes(cleanQuery.replace(/[^0-9]/g, ''));
          return matchCode || matchEmail || matchPhone;
        });

        // Sort by created_at desc
        matched.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setSearchResults(matched);

        if (matched.length > 0) {
          const act = matched.find(b => b.status !== 'Completed' && b.status !== 'Cancelled' && b.status !== 'Expired') || matched[0];
          localStorage.setItem('zegan_active_customer_booking', JSON.stringify(act));
        } else {
          localStorage.removeItem('zegan_active_customer_booking');
        }

        if (matched.length === 0) {
          setError(lang === 'id' ? 'Tidak ditemukan riwayat pemesanan untuk data tersebut.' : 'No reservation history found for this query.');
        }
      } else {
        setSearchResults([]);
        setError(lang === 'id' ? 'Belum ada data pemesanan di sistem.' : 'No bookings in the system yet.');
      }
    } catch (err) {
      console.error(err);
      setError(lang === 'id' ? 'Terjadi kesalahan saat memuat data.' : 'An error occurred while loading data.');
    }
  };

  // Helper categorized groups
  const getCategorizedResults = () => {
    const active: Booking[] = [];
    const completed: Booking[] = [];
    const cancelled: Booking[] = [];

    searchResults.forEach(b => {
      const s = b.status;
      if (s === 'Completed') {
        completed.push(b);
      } else if (s === 'Cancelled' || s === 'Expired') {
        cancelled.push(b);
      } else {
        // Pending, Waiting Verification, Paid, Checked In
        active.push(b);
      }
    });

    return { active, completed, cancelled };
  };

  const { active, completed, cancelled } = getCategorizedResults();
  const displayedList = activeTab === 'active' ? active : activeTab === 'completed' ? completed : cancelled;

  // Handle proof simulation upload
  const handleUploadProof = (bookingCode: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUploadedProof(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const submitPaymentProof = (bookingCode: string) => {
    if (!uploadedProof) return;

    try {
      const raw = localStorage.getItem('zegan_bookings');
      if (raw) {
        const bookings: Booking[] = JSON.parse(raw);
        const idx = bookings.findIndex(b => b.booking_code === bookingCode);
        
        if (idx !== -1) {
          bookings[idx] = {
            ...bookings[idx],
            status: 'Waiting Verification',
            payment_status: 'Waiting Verification',
            payment_proof: uploadedProof,
            payment_date: new Date().toISOString()
          };

          localStorage.setItem('zegan_bookings', JSON.stringify(bookings));
          logActivity(
            'Customer',
            'Customer',
            `Bukti pembayaran diunggah untuk booking ${bookingCode}. Status beralih ke Waiting Verification.`
          );

          // Update local search results state
          setSearchResults(prev => prev.map(b => b.booking_code === bookingCode ? bookings[idx] : b));
          setUploadedProof(null);
          setUploadingCode(null);

          // Show success message
          alert(lang === 'id' ? 'Bukti pembayaran berhasil diunggah! Admin akan segera memverifikasi pesanan Anda.' : 'Payment proof successfully uploaded! Our admin will verify your payment shortly.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error saving payment proof');
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
            <Clock className="w-3 h-3 animate-pulse" />
            PENDING
          </span>
        );
      case 'Waiting Verification':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
            <Clock className="w-3 h-3 shrink-0" />
            MENUNGGU VERIFIKASI
          </span>
        );
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            LUNAS
          </span>
        );
      case 'Checked In':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">
            <Check className="w-3 h-3" />
            CHECKED IN
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded border border-stone-200">
            <CheckCircle2 className="w-3 h-3" />
            SELESAI
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200">
            <XCircle className="w-3 h-3" />
            DIBATALKAN
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center gap-1 bg-stone-200 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded border border-stone-300">
            <AlertTriangle className="w-3 h-3" />
            EXPIRED
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Title */}
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-3xl font-serif font-normal text-brand-950 tracking-tight">
          {lang === 'id' ? 'Riwayat Booking & Portal Layanan' : 'Booking History & Portal'}
        </h2>
        <p className="text-sm text-stone-500 max-w-lg mx-auto leading-relaxed">
          {lang === 'id' 
            ? 'Cari riwayat pemesanan, unggah bukti pembayaran transfer QRIS, atau unduh invoice resmi Anda.' 
            : 'Find your reservations, upload payment proofs, or download your official invoice instantly.'}
        </p>
      </div>

      {/* Search Input Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-brand-200 shadow-md max-w-2xl mx-auto mb-12">
        <div className="space-y-4">
          <label className="block text-xs font-bold text-brand-950 uppercase tracking-widest text-center sm:text-left">
            {lang === 'id' ? 'Masukkan Data Reservasi' : 'Enter Booking Details'}
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                id="portal-search-input"
                type="text"
                placeholder={lang === 'id' ? 'Kode Booking, Email, atau No WhatsApp' : 'Booking Code, Email, or WhatsApp Number'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-brand-200 rounded-xl text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 transition-all font-medium"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-3.5" />
            </div>
            <button
              id="portal-search-button"
              onClick={performSearch}
              className="bg-brand-700 hover:bg-brand-850 text-white font-semibold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <span>{lang === 'id' ? 'Cari Riwayat' : 'Search Records'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <span className="block text-[10px] text-stone-400 italic text-center sm:text-left">
            {lang === 'id' 
              ? '*Format pencarian No HP bebas, misal: "0851..." atau "62851..."' 
              : '*Phone search supports formatting flexibility like "0851..." or "62851..."'}
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs max-w-2xl mx-auto flex items-center gap-2">
          <AlertTriangle className="w-4.5 h-4.5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Workspace */}
      {hasSearched && searchResults.length > 0 && (
        <div className="space-y-8">
          {/* Tab Selection */}
          <div className="flex border-b border-brand-200">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 pb-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 text-center cursor-pointer ${
                activeTab === 'active' 
                  ? 'border-brand-700 text-brand-900' 
                  : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              {lang === 'id' ? `Booking Aktif (${active.length})` : `Active (${active.length})`}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 pb-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 text-center cursor-pointer ${
                activeTab === 'completed' 
                  ? 'border-brand-700 text-brand-900' 
                  : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              {lang === 'id' ? `Booking Selesai (${completed.length})` : `Completed (${completed.length})`}
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`flex-1 pb-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 text-center cursor-pointer ${
                activeTab === 'cancelled' 
                  ? 'border-brand-700 text-brand-900' 
                  : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              {lang === 'id' ? `Batal / Expired (${cancelled.length})` : `Cancelled / Expired (${cancelled.length})`}
            </button>
          </div>

          {/* Cards Grid */}
          <div className="space-y-6">
            {displayedList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-brand-100/60 p-8 space-y-2">
                <div className="text-4xl text-stone-300">📅</div>
                <p className="text-sm font-semibold text-stone-600">
                  {lang === 'id' ? 'Tidak ada data di tab ini.' : 'No items found in this tab.'}
                </p>
                <p className="text-xs text-stone-400">
                  {lang === 'id' ? 'Silakan periksa tab riwayat lainnya.' : 'Check other tabs for older histories.'}
                </p>
              </div>
            ) : (
              displayedList.map((booking) => {
                const isPending = booking.status === 'Pending';
                
                return (
                  <div 
                    key={booking.booking_code}
                    className="bg-white rounded-2xl border border-brand-200 overflow-hidden shadow-xs hover:shadow-md transition-all p-6 sm:p-8 space-y-6"
                  >
                    {/* Top Row: Code and Status */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-stone-100 pb-4">
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">
                          KODE BOOKING
                        </span>
                        <span className="font-mono font-bold text-lg text-brand-950">
                          {booking.booking_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">KAMAR & TAMU</span>
                        <p className="font-semibold text-brand-900 text-sm">{booking.room_name || 'Kamar Zegan'}</p>
                        <p className="text-xs text-stone-600 flex items-center gap-1.5 mt-0.5">
                          <Users className="w-3.5 h-3.5 text-brand-700" />
                          {booking.guests} Tamu / Guests
                        </p>
                        <p className="text-xs text-stone-500 font-semibold mt-1">
                          Nomor Kamar: <span className="bg-brand-100 text-brand-900 px-1.5 py-0.5 rounded font-mono text-xs">{booking.room_number || 'A-1'}</span>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">TANGGAL MENGINAP</span>
                        <div className="flex items-center gap-1 text-xs text-stone-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                          <span>{booking.check_in}</span>
                          <ArrowRight className="w-3 h-3 text-stone-400" />
                          <span>{booking.check_out}</span>
                        </div>
                        <p className="text-[10px] text-stone-500 italic mt-0.5">
                          Check-in jam 14:00, Check-out jam 12:00
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">BIAYA & TRANSAKSI</span>
                        <p className="font-serif font-bold text-lg text-brand-850">
                          Rp{booking.total_price?.toLocaleString('id-ID')}
                        </p>
                        <span className="text-[10px] text-stone-500 block">
                          Status Bayar: <span className="font-bold underline uppercase">{booking.payment_status || 'Pending'}</span>
                        </span>
                      </div>
                    </div>

                    {/* QRIS / Proof Upload workflow for PENDING bookings */}
                    {isPending && (
                      <div className="bg-brand-50/50 rounded-xl p-4 sm:p-6 border border-brand-100 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                          {/* QRIS image view */}
                          <div className="bg-white p-3 rounded-xl border border-brand-200 shadow-xs shrink-0 mx-auto sm:mx-0 text-center flex flex-col items-center">
                            <span className="text-[8px] bg-amber-50 text-amber-800 border border-amber-200/50 px-1 py-0.5 rounded font-black tracking-wide uppercase mb-1.5 block">
                              ⚡ NOMINAL TERKUNCI
                            </span>
                            <img
                              src={getDynamicQrisImageUrl(booking.total_price)}
                              alt="QRIS Merchant"
                              className="w-32 h-32 object-contain"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[9px] font-bold text-brand-900 font-mono mt-1.5 block">
                              {qris.bankName}
                            </span>
                          </div>

                          {/* Payment Instruction */}
                          <div className="space-y-2 text-xs flex-1">
                            <h4 className="font-bold text-brand-950 flex items-center gap-1.5">
                              <CreditCard className="w-4 h-4 text-brand-700" />
                              Instruksi Pembayaran QRIS:
                            </h4>
                            <p className="text-stone-600 leading-relaxed">
                              {lang === 'id' 
                                ? `Silakan scan QRIS di atas menggunakan aplikasi e-wallet atau m-banking Anda. Nominal pembayaran sebesar Rp${booking.total_price?.toLocaleString('id-ID')} akan terisi secara otomatis tanpa perlu mengetik manual.`
                                : `Please scan the QRIS above using your e-wallet or mobile banking app. The payment amount of Rp${booking.total_price?.toLocaleString('id-ID')} is automatically filled and locked.`}
                            </p>
                            <p className="font-semibold text-brand-900 bg-brand-100/60 p-2 rounded">
                              Nama Rekening: {qris.accountName}
                            </p>
                          </div>
                        </div>

                        {/* Interactive proof submission block */}
                        <div className="pt-4 border-t border-brand-200/50">
                          {uploadingCode === booking.booking_code ? (
                            <div className="bg-white rounded-xl border border-dashed border-stone-300 p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-stone-700">Pilih File Bukti Transfer</span>
                                <button
                                  onClick={() => {
                                    setUploadingCode(null);
                                    setUploadedProof(null);
                                  }}
                                  className="text-stone-400 hover:text-red-500 text-xs font-semibold cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>

                              <div className="flex flex-col items-center justify-center border border-dashed border-stone-200 bg-stone-50 rounded-lg p-6 hover:bg-stone-100/50 transition-all cursor-pointer relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleUploadProof(booking.booking_code, e)}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                {uploadedProof ? (
                                  <div className="flex flex-col items-center gap-2">
                                    <ImageIcon className="w-8 h-8 text-emerald-600 animate-bounce" />
                                    <span className="text-xs font-semibold text-emerald-800">Gambar Terpilih!</span>
                                    <img src={uploadedProof} alt="Proof" className="max-h-24 object-contain rounded mt-1 border" />
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-2 text-center">
                                    <Upload className="w-8 h-8 text-brand-600" />
                                    <span className="text-xs font-semibold text-brand-950">Seret atau Klik untuk Unggah Bukti</span>
                                    <span className="text-[10px] text-stone-400">JPG, PNG up to 2MB</span>
                                  </div>
                                )}
                              </div>

                              {uploadedProof && (
                                <button
                                  id="submit-payment-proof"
                                  onClick={() => submitPaymentProof(booking.booking_code)}
                                  className="w-full bg-brand-700 hover:bg-brand-850 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>Kirim Bukti Pembayaran</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              id="btn-trigger-upload-proof"
                              onClick={() => setUploadingCode(booking.booking_code)}
                              className="w-full bg-brand-700 hover:bg-brand-850 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Unggah Bukti Pembayaran</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Guest Service Signals Section (Only for Paid, Checked In, or Completed bookings) */}
                    {['Paid', 'Checked In', 'CheckedIn', 'Completed'].includes(booking.status) && (
                      <div className="bg-brand-50/70 rounded-2xl p-4 sm:p-5 border border-brand-200/80 space-y-4">
                        <div className="flex justify-between items-center border-b border-brand-200/50 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg">🛎️</span>
                            <div>
                              <h4 className="font-serif font-bold text-brand-950 text-sm sm:text-base">
                                {lang === 'id' ? 'Layanan Mandiri & Pesan Makanan' : 'Self-Service & Cafe Orders'}
                              </h4>
                              <p className="text-[10px] text-stone-500 font-light">
                                {lang === 'id' 
                                  ? 'Kirim sinyal langsung ke staff kami untuk pelayanan super cepat.' 
                                  : 'Send signals directly to our staff for express services.'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-brand-200/60 text-brand-900 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                            {lang === 'id' ? 'Sinyal Aktif' : 'Signal Active'}
                          </span>
                        </div>

                        {/* Success message popup inside card */}
                        {successNotification[booking.booking_code] && (
                          <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-semibold"
                          >
                            <span className="text-base">🔔</span>
                            <span className="leading-tight">{successNotification[booking.booking_code]}</span>
                          </motion.div>
                        )}

                        {/* 🔔 Live Notifications Banner */}
                        {foodNotifications.filter(n => n.booking_code === booking.booking_code).length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                              🔔 {lang === 'id' ? 'NOTIFIKASI DAPUR ZEGAN' : 'ZEGAN KITCHEN NOTIFICATIONS'}
                            </span>
                            <div className="space-y-2">
                              {foodNotifications
                                .filter(n => n.booking_code === booking.booking_code)
                                .map(n => (
                                  <motion.div
                                    key={n.id}
                                    initial={{ scale: 0.98, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-amber-100 text-amber-950 border border-amber-300 p-4 rounded-xl text-xs space-y-1.5 shadow-xs"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-extrabold tracking-wider text-[9px] text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-md uppercase">
                                        {lang === 'id' ? 'Makanan Selesai Dibuat' : 'Food Prepared'}
                                      </span>
                                      <span className="text-[9px] text-amber-850 font-mono">
                                        {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="font-semibold leading-relaxed">
                                      {n.message}
                                    </p>
                                  </motion.div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* 📋 Sinyal / Pesanan Aktif Tracker */}
                        {trackedSignals.filter(s => s.booking_code === booking.booking_code).length > 0 && (
                          <div className="space-y-2 pt-1">
                            <span className="text-[10px] text-brand-800 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                              📋 {lang === 'id' ? 'ANTREAN SINYAL AKTIF ANDA' : 'YOUR ACTIVE SIGNALS QUEUE'}
                            </span>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {trackedSignals
                                .filter(s => s.booking_code === booking.booking_code)
                                .map(s => {
                                  const isFoodSig = s.type === 'food';
                                  return (
                                    <div key={s.id} className="bg-white p-3.5 rounded-xl border border-brand-200/70 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-3xs">
                                      <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                                            isFoodSig ? 'bg-amber-100 text-amber-850 border border-amber-200/40' : 'bg-blue-100 text-blue-850 border border-blue-200/40'
                                          }`}>
                                            {isFoodSig ? (lang === 'id' ? '🍔 Pesanan Cafe' : '🍔 Cafe Order') : (lang === 'id' ? '🛎️ Layanan Kamar' : '🛎️ Room Service')}
                                          </span>
                                          <span className="text-[10px] text-stone-400 font-mono">
                                            {new Date(s.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                        <p className="font-bold text-stone-900 leading-snug break-words">
                                          {s.details}
                                        </p>
                                      </div>

                                      <div className="shrink-0">
                                        <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider font-extrabold ${
                                          s.status === 'pending' ? 'bg-amber-100 text-amber-850' :
                                          s.status === 'preparing' ? 'bg-blue-100 text-blue-850' :
                                          s.status === 'delivered' ? 'bg-emerald-100 text-emerald-850' :
                                          'bg-stone-100 text-stone-800'
                                        }`}>
                                          {s.status === 'pending' ? (lang === 'id' ? '🔴 Belum Diproses' : '🔴 Pending') :
                                           s.status === 'preparing' ? (lang === 'id' ? '⚡ Sedang Disiapkan' : '⚡ Preparing') :
                                           s.status === 'delivered' ? (lang === 'id' ? '🛵 Sedang Diantar' : '🛵 Out for Delivery') :
                                           (lang === 'id' ? '✅ Selesai' : '✅ Completed')}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        {/* Action buttons tabs */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setActiveActionTab(prev => ({
                              ...prev,
                              [booking.booking_code]: prev[booking.booking_code] === 'food' ? 'none' : 'food'
                            }))}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                              activeActionTab[booking.booking_code] === 'food'
                                ? 'bg-amber-700 border-amber-600 text-white shadow-sm'
                                : 'bg-white border-brand-200 text-stone-700 hover:bg-brand-100/50'
                            }`}
                          >
                            <Coffee className="w-4 h-4" />
                            <span>{lang === 'id' ? 'Pesan Makanan' : 'Order Food'}</span>
                          </button>

                          <button
                            onClick={() => setActiveActionTab(prev => ({
                              ...prev,
                              [booking.booking_code]: prev[booking.booking_code] === 'service' ? 'none' : 'service'
                            }))}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                              activeActionTab[booking.booking_code] === 'service'
                                ? 'bg-brand-700 border-brand-600 text-white shadow-sm'
                                : 'bg-white border-brand-200 text-stone-700 hover:bg-brand-100/50'
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{lang === 'id' ? 'Layanan Kamar' : 'Room Service'}</span>
                          </button>
                        </div>

                        {/* Sub Form 1: Food Order Menu Grid */}
                        {activeActionTab[booking.booking_code] === 'food' && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-3.5 rounded-xl border border-brand-200/70 space-y-3"
                          >
                            <span className="text-[10px] text-brand-800 font-bold block uppercase tracking-wider">
                              {lang === 'id' ? 'Menu Zegan Cafe Favorit' : 'Popular Cafe Menu'}
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                              {CAFE_ITEMS.map(item => {
                                const qtyKey = `${booking.booking_code}_${item.id}`;
                                const currentQty = foodQuantities[qtyKey] || 0;

                                return (
                                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-brand-50/50 border border-brand-100 text-xs">
                                    <div className="flex items-center gap-2">
                                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-md bg-stone-100 border" />
                                      <div>
                                        <p className="font-bold text-stone-900">{item.name}</p>
                                        <p className="text-[10px] text-stone-500">Rp{item.price.toLocaleString('id-ID')}</p>
                                      </div>
                                    </div>

                                    {/* Qty Stepper */}
                                    <div className="flex items-center gap-2.5">
                                      <button
                                        type="button"
                                        onClick={() => setFoodQuantities(prev => ({
                                          ...prev,
                                          [qtyKey]: Math.max(0, currentQty - 1)
                                        }))}
                                        className="p-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="font-mono font-bold w-4 text-center text-sm">{currentQty}</span>
                                      <button
                                        type="button"
                                        onClick={() => setFoodQuantities(prev => ({
                                          ...prev,
                                          [qtyKey]: currentQty + 1
                                        }))}
                                        className="p-1 rounded-full bg-brand-100 hover:bg-brand-200 text-brand-900 transition-colors cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <button
                              onClick={() => handleFoodOrderSubmit(booking)}
                              className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{lang === 'id' ? 'Kirim Sinyal Pesanan Cafe' : 'Send Cafe Order Signal'}</span>
                            </button>
                          </motion.div>
                        )}

                        {/* Sub Form 2: Room Service / Assistance Request */}
                        {activeActionTab[booking.booking_code] === 'service' && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-3.5 rounded-xl border border-brand-200/70 space-y-3"
                          >
                            <span className="text-[10px] text-brand-800 font-bold block uppercase tracking-wider">
                              {lang === 'id' ? 'Pilih Permintaan Cepat' : 'Quick Requests'}
                            </span>

                            {/* Quick options buttons */}
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { label: '🧼 Minta Sabun / Sampo', text: 'Minta tambahan sabun mandi & sampo' },
                                { label: '🥤 Tambah Air Minum', text: 'Minta tambahan air minum kemasan' },
                                { label: '🛌 Selimut & Bantal', text: 'Minta tambahan selimut tebal dan bantal bersih' },
                                { label: '🧹 Bersihkan Kamar', text: 'Minta tolong bersihkan & sapu kamar saya' },
                              ].map((opt, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setCustomRequests(prev => ({
                                    ...prev,
                                    [booking.booking_code]: opt.text
                                  }))}
                                  className="text-[10px] bg-brand-50 hover:bg-brand-100 text-brand-950 font-semibold px-2.5 py-1.5 rounded-lg border border-brand-200/60 transition-colors cursor-pointer text-left"
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] text-stone-500 uppercase tracking-wider">
                                {lang === 'id' ? 'Atau Tulis Permintaan Kustom Anda' : 'Or Type Custom Request'}
                              </label>
                              <input
                                type="text"
                                value={customRequests[booking.booking_code] || ''}
                                onChange={(e) => setCustomRequests(prev => ({
                                  ...prev,
                                  [booking.booking_code]: e.target.value
                                }))}
                                placeholder={lang === 'id' ? 'Misal: Minta sendok garpu tambahan...' : 'E.g. Request extra spoons and forks...'}
                                className="w-full px-3 py-2 bg-brand-50 border border-brand-200 rounded-lg text-brand-950 text-xs focus:ring-1 focus:ring-brand-700 font-medium"
                              />
                            </div>

                            <button
                              onClick={() => handleServiceRequestSubmit(booking)}
                              className="w-full bg-brand-700 hover:bg-brand-850 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{lang === 'id' ? 'Kirim Sinyal Permintaan' : 'Send Service Signal'}</span>
                            </button>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* View Invoice and Support Action Buttons */}
                    <div className="pt-4 border-t border-stone-100 flex flex-wrap justify-between items-center gap-3">
                      <div className="text-[11px] text-stone-400">
                        {booking.payment_proof && (
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            Bukti Pembayaran Sudah Diunggah
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* If Paid, Checked In, or Completed, can view Invoice */}
                        {['Paid', 'Checked In', 'Completed'].includes(booking.status) ? (
                          <button
                            id={`btn-view-invoice-${booking.booking_code}`}
                            onClick={() => setSelectedInvoiceBooking(booking)}
                            className="bg-brand-100 hover:bg-brand-200 text-brand-900 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Lihat Invoice PDF</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-stone-400 bg-stone-50 px-2 py-1 rounded border">
                            Invoice Tersedia Setelah Lunas
                          </span>
                        )}

                        <a
                          href={`https://wa.me/${wa.phoneNumber}?text=Halo%20Admin%20Zegan%20Homestay%21%20Saya%20ingin%20bertanya%20mengenai%20booking%20kode%20${booking.booking_code}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Hubungi Admin</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Lookup Success State Intro */}
      {!hasSearched && (
        <div className="text-center py-12 text-stone-400 space-y-3 bg-brand-100/20 rounded-2xl border border-dashed border-brand-200 p-8 max-w-2xl mx-auto">
          <FileText className="w-10 h-10 mx-auto text-brand-700 opacity-60 animate-bounce" />
          <p className="text-sm font-semibold text-brand-950">
            {lang === 'id' ? 'Cari Menggunakan Kontak Anda' : 'Search by Your Contacts'}
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            {lang === 'id' 
              ? 'Masukkan nomor WhatsApp atau email yang Anda gunakan saat mendaftar booking di form depan untuk melacak status pembayaran.' 
              : 'Enter the WhatsApp number or email address used during booking submission to trace live room occupancy updates.'}
          </p>
        </div>
      )}

      {/* Invoice modal overlay */}
      {selectedInvoiceBooking && (
        <InvoicePDF
          booking={selectedInvoiceBooking}
          isOpen={selectedInvoiceBooking !== null}
          onClose={() => setSelectedInvoiceBooking(null)}
          lang={lang}
        />
      )}
    </div>
  );
}
