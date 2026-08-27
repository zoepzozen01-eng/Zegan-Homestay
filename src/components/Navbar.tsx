import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Languages, PhoneCall, Search } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data';
import officialLogoImg from '../assets/images/zegan_official_logo_1787811644426.jpg';

interface NavbarProps {
  lang: Language;
  setLang: (lang: Language) => void;
  onBookClick: () => void;
  onLookupClick: () => void;
  view: 'home' | 'customer-portal';
  setView: (view: 'home' | 'customer-portal') => void;
}

export default function Navbar({ lang, setLang, onBookClick, onLookupClick, view, setView }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#home', label: t.home, isAnchor: true },
    { href: '#rooms', label: t.rooms, isAnchor: true },
    { href: '#facilities', label: t.facilities, isAnchor: true },
    { href: '#gallery', label: t.gallery, isAnchor: true },
    { href: '#about', label: t.about, isAnchor: true },
    { href: '#reviews', label: t.reviews, isAnchor: true },
  ];

  return (
    <header
      id="main-navbar"
      className={`fixed top-0 w-full z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-brand-50/95 border-b border-brand-200/50 backdrop-blur-md shadow-sm py-3' 
          : 'bg-black/20 backdrop-blur-3xs py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <button 
          onClick={() => {
            setView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} 
          className="flex items-center gap-3 group cursor-pointer bg-transparent border-none text-left"
        >
          <span className="flex items-center gap-2.5 transition-colors">
            <span className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-md transition-all group-hover:scale-105 border flex items-center justify-center p-0.5 ${
              isScrolled 
                ? 'bg-amber-50 border-amber-300 shadow-stone-900/10' 
                : 'bg-black/60 border-white/30 shadow-black/50'
            }`}>
              <img
                src={officialLogoImg}
                alt="Zegan Homestay & Cafe Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-lg"
              />
            </span>
            <span className="flex flex-col">
              <span className={`font-serif text-lg sm:text-xl font-black tracking-wider uppercase leading-none ${
                isScrolled ? 'text-stone-900' : 'text-white'
              }`}>
                ZEGAN <span className={isScrolled ? 'text-amber-800 font-serif font-light italic' : 'text-amber-300 font-serif font-light italic'}>HOMESTAY</span>
              </span>
              <span className={`text-[10px] tracking-widest font-semibold uppercase mt-0.5 ${
                isScrolled ? 'text-stone-600' : 'text-stone-200'
              }`}>
                Homestay &amp; Cafe • Yogyakarta
              </span>
            </span>
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 items-center">
          <button
            onClick={() => {
              setView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`text-xs uppercase tracking-widest font-semibold transition-colors hover:text-brand-300 cursor-pointer ${
              view === 'home' 
                ? (isScrolled ? 'text-brand-800 underline underline-offset-4 font-bold' : 'text-white underline underline-offset-4 font-bold') 
                : (isScrolled ? 'text-brand-950/80' : 'text-stone-200')
            }`}
          >
            {lang === 'id' ? 'Beranda' : 'Home'}
          </button>

          {view === 'home' && navLinks.slice(1, 4).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-xs uppercase tracking-widest font-semibold transition-colors hover:text-brand-300 ${
                isScrolled ? 'text-brand-950/80 hover:text-brand-300' : 'text-stone-200 hover:text-white'
              }`}
            >
              {link.label}
            </a>
          ))}

          {/* Customer History Portal Button */}
          <button
            onClick={() => setView('customer-portal')}
            className={`text-xs uppercase tracking-widest font-semibold transition-colors hover:text-brand-300 cursor-pointer ${
              view === 'customer-portal'
                ? (isScrolled ? 'text-brand-800 underline underline-offset-4 font-bold' : 'text-white underline underline-offset-4 font-bold')
                : (isScrolled ? 'text-brand-950/80' : 'text-stone-200')
            }`}
          >
            {lang === 'id' ? 'Riwayat Booking' : 'Booking History'}
          </button>
        </nav>

        {/* Utility / Languages and Booking */}
        <div className="hidden md:flex items-center gap-4">
          {/* Language Selector Button */}
          <button
            id="lang-toggle-desktop"
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${
              isScrolled
                ? 'border-brand-200 text-brand-950 bg-brand-100 hover:bg-brand-200'
                : 'border-white/20 text-stone-100 bg-white/10 hover:bg-white/20'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'id' ? 'EN' : 'ID'}</span>
          </button>

          <button
            id="navbar-lookup-desktop"
            onClick={() => setView('customer-portal')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${
              isScrolled
                ? 'border-brand-250 text-brand-800 bg-brand-100/40 hover:bg-brand-100'
                : 'border-white/20 text-stone-200 bg-white/5 hover:bg-white/15'
            }`}
          >
            <Search className="w-3.5 h-3.5 animate-pulse" />
            <span>{lang === 'id' ? 'Cek Booking' : 'Find Booking'}</span>
          </button>

          {view === 'home' && (
            <button
              id="navbar-booking-desktop"
              onClick={onBookClick}
              className="bg-brand-700 hover:bg-brand-850 text-white text-xs uppercase tracking-widest font-bold px-6 py-2.5 rounded-full shadow-md shadow-brand-700/10 hover:scale-102 transition-all cursor-pointer"
            >
              {t.bookNow}
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            id="lang-toggle-mobile"
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            className={`p-2 rounded-full transition-all border ${
              isScrolled
                ? 'border-brand-200 text-brand-950 hover:bg-brand-100'
                : 'border-white/20 text-stone-100 hover:bg-white/10'
            }`}
          >
            <Languages className="w-4 h-4" />
          </button>

          <button
            id="mobile-menu-toggle"
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 rounded-lg transition-colors ${
              isScrolled ? 'text-brand-950 hover:bg-brand-100' : 'text-stone-50 hover:bg-white/10'
            }`}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-brand-50 border-b border-brand-200 shadow-xl overflow-hidden"
          >
            <div className="px-4 pt-4 pb-6 space-y-3">
              <button
                onClick={() => {
                  setView('home');
                  setIsOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left block py-2 text-brand-950/80 hover:text-brand-700 font-semibold text-sm border-b border-brand-100"
              >
                {lang === 'id' ? 'Beranda' : 'Home'}
              </button>

              <button
                onClick={() => {
                  setView('customer-portal');
                  setIsOpen(false);
                }}
                className="w-full text-left block py-2 text-brand-950/80 hover:text-brand-700 font-semibold text-sm border-b border-brand-100"
              >
                {lang === 'id' ? 'Riwayat Booking' : 'Booking History'}
              </button>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  id="navbar-lookup-mobile"
                  onClick={() => {
                    setView('customer-portal');
                    setIsOpen(false);
                  }}
                  className="w-full bg-brand-100 hover:bg-brand-200 text-brand-900 border border-brand-200 py-3 rounded-full text-center font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>{lang === 'id' ? 'Riwayat Booking' : 'Booking History'}</span>
                </button>

                {view === 'home' && (
                  <button
                    id="navbar-booking-mobile"
                    onClick={() => {
                      onBookClick();
                      setIsOpen(false);
                    }}
                    className="w-full bg-brand-700 hover:bg-brand-850 text-white py-3 rounded-full text-center font-bold text-xs uppercase tracking-widest shadow-md transition-all cursor-pointer"
                  >
                    {t.bookNow}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
