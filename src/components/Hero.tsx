import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Users, ArrowRight, Compass } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data';
import heroImage from '../assets/images/zegan_exterior_1782631309135.jpg';

interface HeroProps {
  lang: Language;
  onQuickSearch: (checkIn: string, checkOut: string, guests: number) => void;
}

export default function Hero({ lang, onQuickSearch }: HeroProps) {
  const t = TRANSLATIONS[lang];
  
  // Set default search dates (tomorrow & 1 day after = 1 day stay)
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextDay = new Date(tomorrow);
  nextDay.setDate(nextDay.getDate() + 1);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(formatDate(tomorrow));
  const [checkOut, setCheckOut] = useState(formatDate(nextDay));
  const [guests, setGuests] = useState(2);

  const handleCheckInChange = (newDate: string) => {
    setCheckIn(newDate);
    const inDate = new Date(newDate);
    const outDate = new Date(checkOut);
    if (isNaN(outDate.getTime()) || outDate <= inDate) {
      const next = new Date(newDate);
      next.setDate(next.getDate() + 1);
      setCheckOut(formatDate(next));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickSearch(checkIn, checkOut, guests);
  };

  return (
    <section
      id="home"
      className="relative h-screen flex items-center justify-center bg-cover bg-center overflow-hidden"
      style={{
        backgroundImage: `url(${heroImage})`,
      }}
    >
      {/* Background Dimming & Texture */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-stone-50" />
      
      {/* Subtle traditional batik or pattern look can be added if desired, but we keep it super polished */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
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
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-left">
            <div>
              <label className="block text-xs font-bold text-brand-950/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                {t.checkIn}
              </label>
              <input
                id="hero-check-in"
                type="date"
                min={formatDate(today)}
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
                onChange={(e) => setCheckOut(e.target.value)}
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
                onChange={(e) => setGuests(Number(e.target.value))}
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
