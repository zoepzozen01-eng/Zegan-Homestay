import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Users, ArrowRight, Compass, CheckCircle2, Ban, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { ROOMS, TRANSLATIONS } from '../data';
import { checkRoomAvailability, getLiveBookingsAndRooms } from '../lib/roomAvailability';
import heroImage from '../assets/images/zegan_exterior_1782631309135.jpg';

interface HeroProps {
  lang: Language;
  checkIn: string;
  checkOut: string;
  guests: number;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  onGuestsChange: (guests: number) => void;
  onQuickSearch: (checkIn: string, checkOut: string, guests: number, roomId?: string) => void;
}

export default function Hero({
  lang,
  checkIn,
  checkOut,
  guests,
  onCheckInChange,
  onCheckOutChange,
  onGuestsChange,
  onQuickSearch
}: HeroProps) {
  const t = TRANSLATIONS[lang];
  const todayStr = new Date().toISOString().split('T')[0];

  // Live availability data
  const [liveBookings, setLiveBookings] = useState<any[]>([]);
  const [liveRooms, setLiveRooms] = useState<any[]>([]);

  const refreshAvailability = async () => {
    try {
      const { bookings, dbRooms } = await getLiveBookingsAndRooms();
      setLiveBookings(bookings);
      setLiveRooms(dbRooms);
    } catch (e) {
      console.warn('[Hero] Error refreshing availability:', e);
    }
  };

  useEffect(() => {
    refreshAvailability();

    const handleStorage = () => refreshAvailability();
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(refreshAvailability, 10000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const handleCheckInChange = (newDate: string) => {
    onCheckInChange(newDate);
  };

  // Helper to format date with day name in Indonesian/English
  const formatHeroDayDate = (dateStr: string, l: Language = 'id') => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const daysId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthsId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayName = l === 'id' ? daysId[d.getDay()] : daysEn[d.getDay()];
      const monthName = l === 'id' ? monthsId[d.getMonth()] : monthsEn[d.getMonth()];
      return `${dayName}, ${d.getDate()} ${monthName}`;
    } catch {
      return dateStr;
    }
  };

  // Compute availability stats for all rooms on current dates
  const roomAvailabilities = ROOMS.map(room => {
    const avail = checkRoomAvailability(room.name || room.id, checkIn, checkOut, liveBookings, liveRooms);
    const inDay = new Date(checkIn).getDay();
    const isWeekend = inDay === 6 || inDay === 0;
    const price = isWeekend && room.weekendPrice ? room.weekendPrice : room.price;
    return {
      room,
      isAvailable: avail.isAvailable,
      availableCount: avail.availableCount,
      price
    };
  });

  const availableRoomsCount = roomAvailabilities.filter(r => r.isAvailable).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickSearch(checkIn, checkOut, guests);
  };

  const handleQuickRoomClick = (roomId: string) => {
    onQuickSearch(checkIn, checkOut, guests, roomId);
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center py-24 sm:py-28 md:py-32"
      style={{
        backgroundImage: `url(${heroImage})`,
      }}
    >
      {/* Background Dimming & Texture */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-brand-950/80" />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center mb-4"
        >
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-800/90 backdrop-blur-xs text-brand-100 text-xs font-semibold tracking-wider uppercase border border-brand-300/30">
            <Compass className="w-3.5 h-3.5 animate-spin-slow text-brand-300" />
            <span>KULON PROGO • YOGYAKARTA</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-white mb-6 tracking-tight leading-tight max-w-4xl mx-auto"
        >
          {t.heroTitle === 'Zegan : Homestay & Cafe' ? (
            <>
              Zegan : <span className="italic font-light text-brand-200">Homestay & Cafe</span>
            </>
          ) : (
            t.heroTitle
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-stone-100 text-sm sm:text-base md:text-lg mb-10 max-w-2xl mx-auto font-light leading-relaxed tracking-wide"
        >
          {t.heroSubtitle}
        </motion.p>

        {/* Quick Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-full max-w-4xl mx-auto bg-brand-100/95 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl border border-brand-200/80"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-brand-950/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  {t.checkIn}
                </label>
                <input
                  id="hero-check-in"
                  type="date"
                  min={todayStr}
                  value={checkIn}
                  onChange={(e) => handleCheckInChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-brand-200 bg-brand-50 text-brand-950 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-hidden font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-950/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  {t.checkOut}
                </label>
                <input
                  id="hero-check-out"
                  type="date"
                  min={checkIn}
                  value={checkOut}
                  onChange={(e) => onCheckOutChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-brand-200 bg-brand-50 text-brand-950 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-hidden font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-950/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-600" />
                  {t.guestsCount}
                </label>
                <select
                  id="hero-guests-select"
                  value={guests}
                  onChange={(e) => onGuestsChange(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-brand-200 bg-brand-50 text-brand-950 text-sm focus:ring-2 focus:ring-brand-600 focus:outline-hidden font-medium"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} {lang === 'id' ? 'Tamu' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  id="hero-search-submit"
                  type="submit"
                  className="w-full bg-brand-700 hover:bg-brand-850 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer hover:scale-101"
                >
                  <span>{t.checkAvailability}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Real-Time Automatic Room Availability Display (No Click Required) */}
            <div className="pt-2 border-t border-brand-200/70">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs text-brand-950 font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>
                    {lang === 'id'
                      ? `Ketersediaan Kamar Otomatis (${formatHeroDayDate(checkIn, 'id')} - ${formatHeroDayDate(checkOut, 'id')}):`
                      : `Live Availability (${formatHeroDayDate(checkIn, 'en')} - ${formatHeroDayDate(checkOut, 'en')}):`}
                  </span>
                </div>
                <span className="text-[10px] text-brand-800 bg-brand-200/80 px-2 py-0.5 rounded-full font-medium">
                  {lang === 'id' 
                    ? `${availableRoomsCount} dari ${roomAvailabilities.length} tipe kamar siap huni` 
                    : `${availableRoomsCount} of ${roomAvailabilities.length} room types available`}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {roomAvailabilities.map(({ room, isAvailable, availableCount, price }) => {
                  if (!isAvailable) {
                    return (
                      <div
                        key={`hero-room-${room.id}`}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-200/70 text-stone-500 border border-stone-300 text-xs flex items-center gap-1.5 select-none opacity-80 cursor-not-allowed"
                        title={lang === 'id' ? `${room.name} sudah penuh di tanggal ini` : `${room.name} fully booked`}
                      >
                        <Ban className="w-3 h-3 text-red-500 shrink-0" />
                        <span className="line-through font-medium">{room.name}</span>
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded uppercase">
                          {lang === 'id' ? 'Penuh' : 'Full'}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <button
                      type="button"
                      key={`hero-room-${room.id}`}
                      onClick={() => handleQuickRoomClick(room.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-white text-brand-950 border border-emerald-300 hover:border-brand-600 shadow-2xs hover:shadow-xs transition-all text-xs flex items-center gap-1.5 cursor-pointer group"
                      title={lang === 'id' ? `Klik untuk langsung memesan ${room.name}` : `Click to book ${room.name}`}
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-brand-900 group-hover:text-brand-950">{room.name}</span>
                      <span className="text-[11px] font-mono font-bold text-amber-900">
                        Rp{price.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                        {availableCount} {lang === 'id' ? 'unit' : 'left'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Decorative Javanese wood-carving styling overlay at the bottom border */}
      <div className="absolute bottom-0 w-full h-12 bg-brand-50 border-t border-brand-200/50 flex justify-center items-center">
        <div className="w-16 h-1 bg-brand-300 rounded-full mx-1 opacity-65" />
        <div className="w-3 h-3 border-2 border-brand-600 rounded-full rotate-45 mx-1" />
        <div className="w-24 h-1 bg-brand-600 rounded-full mx-1" />
        <div className="w-3 h-3 border-2 border-brand-600 rounded-full rotate-45 mx-1" />
        <div className="w-16 h-1 bg-brand-300 rounded-full mx-1 opacity-65" />
      </div>
    </section>
  );
}
