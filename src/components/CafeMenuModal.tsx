import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Coffee, Sparkles, Flame, Check, Minus, Plus, 
  ShoppingBag, Send, CheckCircle2, User, MapPin, CreditCard, ClipboardList
} from 'lucide-react';
import { CafeItem, Language, ServiceSignal } from '../types';
import { CAFE_ITEMS, TRANSLATIONS } from '../data';
import { getQrisSettings, logActivity, getDynamicQrisImageUrl } from '../services/adminService';

interface CafeMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export default function CafeMenuModal({ isOpen, onClose, lang }: CafeMenuModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<Record<string, number>>({});
  
  // Checkout fields
  const [guestName, setGuestName] = useState('');
  const [deliveryType, setDeliveryType] = useState<'room' | 'cafe'>('room');
  const [roomNumber, setRoomNumber] = useState('1');
  const [tableNumber, setTableNumber] = useState('Meja 1');
  const [specialNotes, setSpecialNotes] = useState('');
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [bookingCode, setBookingCode] = useState('');
  const [availableBookings, setAvailableBookings] = useState<any[]>([]);
  const [selectedBookingCode, setSelectedBookingCode] = useState<string>('');
  
  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSignal, setSubmittedSignal] = useState<ServiceSignal | null>(null);
  const [liveSignalStatus, setLiveSignalStatus] = useState<'pending' | 'preparing' | 'delivered' | 'completed'>('pending');

  // Load active booking session from customer portal
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('zegan_active_customer_booking');
        if (saved) {
          const booking = JSON.parse(saved);
          if (booking && booking.room_number) {
            setRoomNumber(booking.room_number);
            setGuestName(booking.full_name);
            setBookingCode(booking.booking_code || '');
            setHasActiveBooking(true);
            setDeliveryType('room');
            return;
          }
        }
        
        // Load bookings list to match reservation details
        const rawBookings = localStorage.getItem('zegan_bookings');
        if (rawBookings) {
          const parsed = JSON.parse(rawBookings) as any[];
          const activeList = parsed.filter(b => b.status === 'Checked In' || b.status === 'Confirmed' || b.status === 'Aktif' || b.status === 'Ongoing');
          setAvailableBookings(activeList);
          
          if (activeList.length > 0) {
            const first = activeList[0];
            setRoomNumber(first.room_number);
            setGuestName(first.full_name);
            setBookingCode(first.booking_code || '');
            setDeliveryType('room');
            setSelectedBookingCode(first.booking_code || '');
            setHasActiveBooking(false); // They can still pick, but we populate it automatically
          } else {
            setRoomNumber('1');
            setGuestName('');
            setBookingCode('');
            setHasActiveBooking(false);
          }
        } else {
          setRoomNumber('1');
          setGuestName('');
          setBookingCode('');
          setHasActiveBooking(false);
        }
      } catch (err) {
        console.error('Error loading active customer booking:', err);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!submittedSignal) return;

    const checkStatus = () => {
      try {
        const raw = localStorage.getItem('zegan_service_signals') || '[]';
        const existing: ServiceSignal[] = JSON.parse(raw);
        const current = existing.find(s => s.id === submittedSignal.id);
        if (current) {
          setLiveSignalStatus(current.status);
        } else {
          // If not in active queue, it was either archived or completed
          setLiveSignalStatus('completed');
        }
      } catch (err) {
        console.error('Error checking signal status:', err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [submittedSignal]);

  const t = TRANSLATIONS[lang];
  const qris = getQrisSettings();

  // Translations for internal helper elements
  const localTexts = {
    id: {
      cartTitle: 'Keranjang Belanja',
      emptyCart: 'Keranjang Anda kosong. Pilih menu lezat di samping untuk memulai!',
      ordererInfo: 'Informasi Penerima / Pemesan',
      fullName: 'Nama Lengkap Anda',
      fullNamePlaceholder: 'Misal: Budi Santoso',
      location: 'Lokasi Pengantaran / Makan',
      roomGuest: 'Tamu Kamar (Antar ke Kamar)',
      cafeGuest: 'Dine-In (Makan di Area Cafe)',
      roomNumberLabel: 'Nomor Kamar',
      tableNumberLabel: 'Pilih Meja / Lokasi Cafe',
      specialNotesLabel: 'Catatan Khusus (Pedas, tanpa es, dll)',
      notesPlaceholder: 'Misal: Kopi es agak manis, minta sendok ekstra...',
      sendOrder: 'Kirim Sinyal Pesanan Cafe',
      sending: 'Mengirim Sinyal...',
      orderSuccess: 'Sinyal Pesanan Terkirim!',
      orderSuccessDesc: 'Sinyal pesanan Anda telah masuk langsung ke papan monitor staff Zegan. Pesanan sedang diproses di dapur sekarang!',
      paymentNotice: 'Selesaikan pembayaran di kasir atau scan QRIS Zegan di bawah:',
      paymentDesc: 'Harap tunjukkan bukti transfer ke staff/kasir setelah menyelesaikan pesanan.',
      totalPrice: 'Total Pembayaran',
      items: 'item',
      addToCart: 'Tambah',
      checkoutBtn: 'Lanjut ke Pemesanan',
      clearCart: 'Kosongkan',
      backToMenu: 'Kembali Lihat Menu',
      subtotal: 'Subtotal',
      close: 'Tutup'
    },
    en: {
      cartTitle: 'Shopping Cart',
      emptyCart: 'Your cart is empty. Choose delicious menu items to start!',
      ordererInfo: 'Customer & Delivery Info',
      fullName: 'Your Full Name',
      fullNamePlaceholder: 'e.g., John Doe',
      location: 'Delivery / Dine-in Location',
      roomGuest: 'Room Guest (Room Delivery)',
      cafeGuest: 'Dine-In (Eat at Cafe Area)',
      roomNumberLabel: 'Room Number',
      tableNumberLabel: 'Select Table / Cafe Area',
      specialNotesLabel: 'Special Instructions (Spicy, no ice, etc.)',
      notesPlaceholder: 'e.g., Less sugar for ice coffee, extra spoon...',
      sendOrder: 'Send Cafe Order Signal',
      sending: 'Sending Signal...',
      orderSuccess: 'Order Signal Sent!',
      orderSuccessDesc: 'Your order signal has been dispatched to Zegan\'s staff dashboard. Our kitchen team is preparing it right now!',
      paymentNotice: 'Pay at the counter or scan Zegan\'s QRIS below:',
      paymentDesc: 'Please show your payment confirmation to our staff or cashier upon delivery.',
      totalPrice: 'Total Payment',
      items: 'items',
      addToCart: 'Add',
      checkoutBtn: 'Proceed to Checkout',
      clearCart: 'Clear',
      backToMenu: 'Back to Menu List',
      subtotal: 'Subtotal',
      close: 'Close'
    }
  }[lang];

  const categories = [
    { id: 'all', name: t.all },
    { id: 'coffee', name: t.coffee },
    { id: 'herbal', name: t.herbal },
    { id: 'food', name: t.food },
    { id: 'snack', name: t.snack },
  ];

  const filteredItems = activeCategory === 'all' 
    ? CAFE_ITEMS 
    : CAFE_ITEMS.filter(item => item.category === activeCategory);

  // Cart logic
  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      const next = current + delta;
      const updated = { ...prev };
      if (next <= 0) {
        delete updated[itemId];
      } else {
        updated[itemId] = next;
      }
      return updated;
    });
  };

  const getCartTotalItems = (): number => {
    let total = 0;
    for (const id in cart) {
      if (Object.prototype.hasOwnProperty.call(cart, id)) {
        total += cart[id] || 0;
      }
    }
    return total;
  };

  const getCartTotalPrice = (): number => {
    let total = 0;
    for (const id in cart) {
      if (Object.prototype.hasOwnProperty.call(cart, id)) {
        const item = CAFE_ITEMS.find(i => i.id === id);
        if (item) {
          total += item.price * (cart[id] || 0);
        }
      }
    }
    return total;
  };

  const handleClearCart = () => {
    setCart({});
  };

  // Submit order signal to localstorage queue
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (getCartTotalItems() === 0) return;
    if (!guestName.trim()) {
      alert(lang === 'id' ? 'Silakan isi Nama Lengkap Anda.' : 'Please enter your full name.');
      return;
    }

    setIsSubmitting(true);

    // Build details string
    const orderItemsList = Object.entries(cart).map(([itemId, qty]) => {
      const item = CAFE_ITEMS.find(i => i.id === itemId);
      return item ? `${qty}x ${item.name}` : '';
    }).filter(Boolean);

    let detailsStr = orderItemsList.join(', ');
    if (specialNotes.trim()) {
      detailsStr += ` (Catatan: ${specialNotes.trim()})`;
    }

    const locName = deliveryType === 'room' ? `Kamar ${roomNumber}` : tableNumber;

    const newSignal: ServiceSignal = {
      id: `customer-sig-${Date.now()}`,
      booking_code: bookingCode || '', // Set booking code if active session exists
      room_number: deliveryType === 'room' ? roomNumber : tableNumber,
      guest_name: guestName.trim(),
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

      // Log in Activity Logs for transparency
      logActivity(
        'Customer',
        'Customer',
        `Pesanan Zegan Cafe dari ${guestName.trim()} (${locName}): ${detailsStr} - Total Rp${getCartTotalPrice().toLocaleString('id-ID')}`
      );

      // Trigger standard storage event manually for same-window updates if needed
      window.dispatchEvent(new Event('storage'));

      setSubmittedSignal(newSignal);
    } catch (err) {
      console.error('Failed to submit cafe order signal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetModal = () => {
    setSubmittedSignal(null);
    setGuestName('');
    setSpecialNotes('');
    setCart({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="cafe-menu-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          {/* Overlay click */}
          <div className="absolute inset-0" onClick={handleResetModal} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl bg-brand-50 rounded-2xl shadow-2xl overflow-hidden z-10 my-4 sm:my-8 border border-brand-200 flex flex-col max-h-[92vh]"
          >
            {/* Header banner */}
            <div className="relative bg-brand-800 text-white p-5 sm:p-6 shrink-0">
              <button 
                id="close-cafe-menu"
                onClick={handleResetModal} 
                className="absolute top-5 right-5 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all cursor-pointer z-20"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-1">
                <Coffee className="w-6 h-6 text-brand-300 animate-pulse shrink-0" />
                <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-brand-200">Zegan Traditional Cafe & Eatery</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-50">{t.cafeMenuTitle}</h3>
              <p className="text-brand-100/80 text-xs sm:text-sm mt-0.5 font-light leading-snug">{t.cafeMenuSubtitle}</p>
            </div>

            {/* Main Interactive Grid Split */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-brand-50/40 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Section: Menu List (7 Cols) */}
              <div className={`space-y-4 ${submittedSignal ? 'lg:col-span-12' : 'lg:col-span-7'}`}>
                
                {/* Check if already submitted successfully */}
                {submittedSignal ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl border border-brand-200 p-6 sm:p-8 text-center space-y-6 max-w-2xl mx-auto"
                  >
                    <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-xs">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xl sm:text-2xl font-serif font-bold text-brand-950">
                        {localTexts.orderSuccess}
                      </h4>
                      <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-light">
                        {localTexts.orderSuccessDesc}
                      </p>
                    </div>

                    {/* Receipt Details Card */}
                    <div className="bg-brand-50/50 p-5 rounded-2xl border border-brand-150 text-left space-y-3.5 text-xs">
                      <div className="flex justify-between items-center border-b border-brand-200/50 pb-2">
                        <span className="font-bold text-brand-900 uppercase tracking-wider text-[10px]">Detail Pesanan</span>
                        <span className="font-mono text-stone-500 font-medium">{submittedSignal.room_number}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-stone-500 font-light">Pemesan / Atas Nama:</p>
                        <p className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-brand-700" /> {submittedSignal.guest_name}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-stone-500 font-light">Menu yang Dipesan:</p>
                        <p className="font-semibold text-brand-950 leading-relaxed bg-white p-2.5 rounded-lg border border-brand-200/60 font-mono text-[11px]">
                          {submittedSignal.details}
                        </p>
                      </div>

                      <div className="flex justify-between items-center bg-amber-50 border border-amber-200/50 p-2 rounded-lg text-xs">
                        <span className="font-bold text-stone-800">Status Pesanan:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold ${
                          liveSignalStatus === 'pending' ? 'bg-amber-100 text-amber-850' :
                          liveSignalStatus === 'preparing' ? 'bg-blue-100 text-blue-850' :
                          liveSignalStatus === 'delivered' ? 'bg-emerald-100 text-emerald-850' :
                          'bg-stone-100 text-stone-800'
                        }`}>
                          {liveSignalStatus === 'pending' ? '🔴 Belum Diproses' :
                           liveSignalStatus === 'preparing' ? '⚡ Sedang Disiapkan' :
                           liveSignalStatus === 'delivered' ? '🛵 Sedang Diantar' :
                           '✅ Selesai'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-brand-200/50">
                        <span className="font-bold text-stone-800">{localTexts.totalPrice}</span>
                        <span className="text-base font-extrabold text-brand-900 font-mono">
                          Rp{getCartTotalPrice().toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* QRIS section */}
                    <div className="border-t border-stone-100 pt-6 space-y-4">
                      <div className="text-center space-y-1">
                        <h5 className="font-bold text-xs text-stone-800 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                          <CreditCard className="w-4 h-4 text-brand-700" />
                          {localTexts.paymentNotice}
                        </h5>
                        <p className="text-[10px] text-stone-500 font-light">
                          {lang === 'id' 
                            ? 'Silakan scan QRIS di bawah. Nominal pesanan Anda akan terisi otomatis.' 
                            : 'Please scan the QRIS below. Your order total will be pre-filled automatically.'}
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border max-w-[200px] mx-auto shadow-2xs flex flex-col items-center">
                        <span className="text-[8px] bg-amber-50 text-amber-800 border border-amber-200/50 px-1.5 py-0.5 rounded font-black tracking-wide uppercase mb-2">
                          ⚡ NOMINAL TERKUNCI
                        </span>
                        <img 
                          src={getDynamicQrisImageUrl(getCartTotalPrice())} 
                          alt="Zegan Cafe QRIS" 
                          className="w-full h-auto object-contain bg-stone-50"
                        />
                        <p className="text-[10px] font-extrabold text-brand-900 font-mono mt-2 text-center uppercase tracking-wide">
                          {qris.accountName}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetModal}
                      className="px-6 py-2.5 bg-brand-750 hover:bg-brand-850 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                    >
                      {localTexts.close}
                    </button>
                  </motion.div>
                ) : (
                  <>
                    {/* Category tabs */}
                    <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-xl border border-brand-150">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id)}
                          className={`flex-1 min-w-[70px] px-3 py-2 rounded-lg text-[10px] sm:text-xs font-bold tracking-wide text-center transition-all cursor-pointer uppercase ${
                            activeCategory === cat.id
                              ? 'bg-brand-800 text-brand-100 shadow-xs'
                              : 'text-stone-600 hover:bg-brand-50'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>

                    {/* Menu grid */}
                    <div className="grid sm:grid-cols-2 gap-4 max-h-[52vh] overflow-y-auto pr-1">
                      {filteredItems.map((item) => {
                        const currentQty = cart[item.id] || 0;

                        return (
                          <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={item.id}
                            className="flex gap-3 p-3 bg-white rounded-xl border border-brand-150 hover:border-brand-300 transition-all relative overflow-hidden group shadow-2xs"
                          >
                            {item.isBestSeller && (
                              <span className="absolute top-0 left-0 bg-brand-700 text-brand-100 text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-br-lg flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5 text-brand-300 fill-brand-300" />
                                {t.bestSeller}
                              </span>
                            )}

                            <img 
                              referrerPolicy="no-referrer"
                              src={item.image} 
                              alt={item.name} 
                              className="w-18 h-18 sm:w-22 sm:h-22 object-cover rounded-lg shrink-0 bg-stone-50 border border-brand-100/50"
                            />

                            <div className="flex flex-col justify-between flex-1 min-w-0">
                              <div>
                                <div className="flex justify-between items-start gap-1.5">
                                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm leading-tight truncate">{item.name}</h4>
                                  <span className="text-[10px] sm:text-xs font-bold text-brand-800 font-mono whitespace-nowrap bg-brand-50 px-1.5 py-0.5 rounded border border-brand-150">
                                    Rp{item.price.toLocaleString('id-ID')}
                                  </span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-stone-500 mt-1 line-clamp-2 font-light leading-snug">
                                  {item.description[lang]}
                                </p>
                              </div>

                              <div className="flex items-center justify-between gap-2 mt-2">
                                <div className="flex items-center gap-1 text-[9px] text-brand-600 font-bold uppercase tracking-wider">
                                  <Check className="w-3 h-3 text-brand-500 shrink-0" />
                                  <span>Zegan Cafe</span>
                                </div>

                                {/* Add to Cart Buttons */}
                                {currentQty > 0 ? (
                                  <div className="flex items-center bg-brand-50 border border-brand-200 rounded-lg p-0.5 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQty(item.id, -1)}
                                      className="p-1 rounded-md bg-white hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="font-mono font-bold text-xs w-4 text-center">{currentQty}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQty(item.id, 1)}
                                      className="p-1 rounded-md bg-white hover:bg-brand-100 text-brand-800 transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(item.id, 1)}
                                    className="px-2.5 py-1 bg-brand-700 hover:bg-brand-850 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shadow-3xs"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>{localTexts.addToCart}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Right Section: Shopping Cart & Checkout Info (5 Cols) */}
              {!submittedSignal && (
                <div className="lg:col-span-5 bg-white rounded-2xl border border-brand-200 p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-2xs">
                  
                  {/* Cart list wrapper */}
                  <div className="space-y-4 flex-1">
                    <div className="flex justify-between items-center border-b border-stone-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-brand-700" />
                        <h4 className="font-bold text-stone-900 text-sm">{localTexts.cartTitle}</h4>
                      </div>
                      
                      {getCartTotalItems() > 0 && (
                        <button
                          type="button"
                          onClick={handleClearCart}
                          className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider cursor-pointer transition-colors"
                        >
                          {localTexts.clearCart}
                        </button>
                      )}
                    </div>

                    {getCartTotalItems() === 0 ? (
                      <div className="py-12 text-center space-y-2 max-w-xs mx-auto">
                        <p className="text-2xl text-stone-300">🛒</p>
                        <p className="text-stone-500 text-xs leading-normal font-light">
                          {localTexts.emptyCart}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[22vh] overflow-y-auto pr-1">
                        {Object.entries(cart).map(([itemId, qty]) => {
                          const item = CAFE_ITEMS.find(i => i.id === itemId);
                          if (!item) return null;
                          const quantity = qty as number;

                          return (
                            <div key={itemId} className="flex justify-between items-center text-xs p-2 rounded-lg bg-stone-50 border border-stone-100">
                              <div className="min-w-0 pr-2">
                                <p className="font-bold text-stone-900 truncate leading-tight">{item.name}</p>
                                <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                                  {quantity} x Rp{item.price.toLocaleString('id-ID')}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-mono font-bold text-stone-900 text-xs pr-1">
                                  Rp{(item.price * quantity).toLocaleString('id-ID')}
                                </span>
                                <div className="flex items-center bg-white border rounded p-0.5 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(itemId, -1)}
                                    className="p-0.5 rounded hover:bg-stone-100 text-stone-600 cursor-pointer"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(itemId, 1)}
                                    className="p-0.5 rounded hover:bg-brand-100 text-brand-800 cursor-pointer"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Checkout Form (only shown if cart is not empty) */}
                  {getCartTotalItems() > 0 && (
                    <form onSubmit={handleSubmitOrder} className="border-t border-stone-150 pt-4 space-y-3">
                      <span className="text-[10px] text-brand-800 font-extrabold block uppercase tracking-widest flex items-center gap-1">
                        <ClipboardList className="w-3.5 h-3.5" /> {localTexts.ordererInfo}
                      </span>

                      {/* Name and Delivery selection */}
                      {hasActiveBooking ? (
                        <div className="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-xl space-y-1.5 shadow-3xs">
                          <span className="text-[9px] text-emerald-800 font-black uppercase tracking-widest block">
                            🔒 {lang === 'id' ? 'DIANTAR KE KAMAR REgistrasi' : 'DELIVERED TO YOUR REGISTERED ROOM'}
                          </span>
                          <p className="text-xs font-bold text-stone-900 leading-snug">
                            {lang === 'id' ? 'Kamar' : 'Room'} {roomNumber} &bull; {guestName}
                          </p>
                          <p className="text-[10px] text-emerald-700 leading-relaxed">
                            {lang === 'id' 
                              ? 'Pesanan otomatis terhubung dengan reservasi aktif Anda. Pembayaran dapat dilakukan secara offline saat check-out.' 
                              : 'Order is linked to your active reservation. Payment can be settled offline upon check-out.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                          {availableBookings.length > 0 ? (
                            <div className="space-y-1">
                              <label className="block text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
                                {lang === 'id' ? 'Pilih Kamar / Pemesanan Anda' : 'Choose Your Room / Booking'} <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={selectedBookingCode}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSelectedBookingCode(val);
                                  const found = availableBookings.find(b => b.booking_code === val);
                                  if (found) {
                                    setRoomNumber(found.room_number);
                                    setGuestName(found.full_name);
                                    setBookingCode(found.booking_code || '');
                                  }
                                }}
                                className="w-full px-3 py-2.5 bg-white border border-brand-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-brand-700"
                              >
                                {availableBookings.map(b => (
                                  <option key={b.booking_code} value={b.booking_code}>
                                    Kamar {b.room_number} - {b.full_name} ({b.booking_code})
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="block text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
                                  {localTexts.fullName} <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={guestName}
                                  onChange={(e) => setGuestName(e.target.value)}
                                  placeholder={localTexts.fullNamePlaceholder}
                                  className="w-full px-3 py-2 bg-white border border-brand-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-brand-700 focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
                                  {localTexts.roomNumberLabel} <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={roomNumber}
                                  onChange={(e) => setRoomNumber(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-brand-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-brand-700"
                                >
                                  {['1', '2', '3', '4', '5', '6', '7', '8', '101', '102', '103', '104', '105', '106', '201', '202', '203', '204'].map(rm => (
                                    <option key={rm} value={rm}>{lang === 'id' ? 'Kamar' : 'Room'} {rm}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Special instructions */}
                      <div className="space-y-1">
                        <label className="block text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
                          {localTexts.specialNotesLabel}
                        </label>
                        <input
                          type="text"
                          value={specialNotes}
                          onChange={(e) => setSpecialNotes(e.target.value)}
                          placeholder={localTexts.notesPlaceholder}
                          className="w-full px-3 py-2 bg-stone-50 border border-brand-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-brand-700 focus:outline-none"
                        />
                      </div>

                      {/* Total details and Submit */}
                      <div className="bg-brand-50 p-3.5 rounded-xl border border-brand-150 space-y-2 pt-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-stone-600">{localTexts.subtotal} ({getCartTotalItems()} {localTexts.items}):</span>
                          <span className="font-mono font-bold text-stone-900">Rp{getCartTotalPrice().toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-extrabold text-brand-950 border-t border-brand-200/50 pt-2">
                          <span>{localTexts.totalPrice}:</span>
                          <span className="font-mono text-base text-brand-900">Rp{getCartTotalPrice().toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-amber-700 hover:bg-amber-800 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-amber-950/20 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? localTexts.sending : localTexts.sendOrder}</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

            </div>

            {/* Footer Notice */}
            <div className="bg-brand-100 text-stone-600 p-4 text-center text-xs border-t border-brand-200/80 flex justify-center items-center gap-2 shrink-0">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span className="font-light">{lang === 'id' ? 'Zegan Cafe buka setiap hari jam 07:00 - 22:00' : 'Zegan Cafe open daily from 07:00 AM - 10:00 PM'}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
