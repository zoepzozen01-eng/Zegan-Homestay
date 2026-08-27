import { motion } from 'motion/react';
import { MapPin, Phone, Clock, Compass, ShieldAlert, Heart, Navigation } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data';
import officialLogoImg from '../assets/images/zegan_official_logo_1787811644426.jpg';

interface AboutProps {
  lang: Language;
}

export default function About({ lang }: AboutProps) {
  const t = TRANSLATIONS[lang];

  const handleOpenMap = () => {
    // Open Google Maps directions for Zegan Homestay Kulon Progo Yogyakarta
    window.open('https://maps.google.com/?q=Zegan+Homestay+Kulon+Progo+Yogyakarta', '_blank');
  };

  return (
    <section id="about" className="py-24 bg-brand-50 relative overflow-hidden">
      {/* Decorative details */}
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-brand-100 rounded-full filter blur-3xl opacity-20 -mr-36" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Traditional Story (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-700 border border-brand-200/80 px-4 py-1.5 rounded-full bg-brand-100 inline-block">
                HERITAGE &amp; ARCHITECTURE
              </span>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-lg border border-amber-300 p-0.5 bg-amber-50 shrink-0">
                <img
                  src={officialLogoImg}
                  alt="Zegan Homestay & Cafe Emblem"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div>
                <h2 className="text-2xl sm:text-4xl font-serif font-normal text-brand-950 leading-tight">
                  {t.aboutTitle}
                </h2>
                <span className="text-xs font-serif italic text-amber-800 font-medium block mt-1">
                  Zegan Homestay &amp; Cafe • Sentolo, Kulon Progo
                </span>
              </div>
            </div>

            <div className="w-12 h-[2px] bg-brand-300 mt-2 mb-4" />

            <p className="text-stone-600 text-sm sm:text-base leading-relaxed font-light">
              {t.aboutParagraph1}
            </p>

            <p className="text-stone-600 text-sm sm:text-base leading-relaxed font-light">
              {t.aboutParagraph2}
            </p>

            {/* Icons row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="p-4 bg-brand-100/50 rounded-xl border border-brand-200/60 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-brand-950 block">{t.address}</span>
                  <span className="text-[10px] sm:text-xs text-stone-600 block mt-1 leading-relaxed">{t.fullAddress}</span>
                </div>
              </div>

              <div className="p-4 bg-brand-100/50 rounded-xl border border-brand-200/60 flex items-start gap-3">
                <Clock className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-brand-950 block">{t.workingHours}</span>
                  <span className="text-[10px] sm:text-xs text-stone-600 block mt-1 leading-relaxed">{t.workingHoursVal}</span>
                </div>
              </div>

              <div className="p-4 bg-brand-100/50 rounded-xl border border-brand-200/60 flex items-start gap-3">
                <Phone className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-brand-950 block">{t.contactAdmin}</span>
                  <span className="text-[10px] sm:text-xs text-stone-600 block mt-1 leading-relaxed">{t.contactAdminVal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Stylized interactive Map Card (5 Cols) */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-brand-100/40 rounded-2xl p-6 border border-brand-200 relative overflow-hidden group"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-1.5">
                  <Compass className="w-5 h-5 text-brand-600 animate-spin-slow" />
                  <span className="text-xs font-semibold text-brand-950 uppercase tracking-widest font-serif">Zegan Map Location</span>
                </div>
                <span className="text-[9px] bg-brand-700 text-white font-bold px-2 py-0.5 rounded-full uppercase">Sentolo</span>
              </div>

              {/* Simulated Map Canvas */}
              <div className="relative h-64 rounded-xl bg-brand-100 border border-brand-200/80 overflow-hidden flex flex-col justify-between p-4">
                {/* Simulated Road Lines & Sawah Shapes */}
                <div className="absolute inset-0 opacity-25">
                  {/* Road 1 */}
                  <div className="absolute left-1/4 top-0 bottom-0 w-4 bg-brand-200/60 rotate-12" />
                  {/* Road 2 */}
                  <div className="absolute left-0 right-0 top-1/2 h-4 bg-brand-200/60 -rotate-6" />
                  {/* River curve */}
                  <div className="absolute right-0 top-10 bottom-0 w-12 bg-brand-300/40 rounded-l-full blur-xs opacity-60" />
                  {/* Green fields blocks */}
                  <div className="absolute left-6 top-8 w-16 h-16 bg-brand-600/10 border border-brand-600/20 rounded-sm" />
                  <div className="absolute left-1/3 top-1/4 w-20 h-16 bg-brand-600/10 border border-brand-600/20 rounded-sm" />
                  <div className="absolute left-8 bottom-6 w-24 h-16 bg-brand-600/10 border border-brand-600/20 rounded-sm" />
                </div>

                {/* Simulated Pins */}
                <div className="relative z-10 flex flex-col justify-between h-full">
                  
                  {/* Nearby landmarks */}
                  <div className="flex justify-between text-[10px] text-brand-950/70 font-semibold uppercase">
                    <span className="bg-brand-50/90 px-1.5 py-0.5 rounded-md border border-brand-200">Menoreh Hills</span>
                    <span className="bg-brand-50/90 px-1.5 py-0.5 rounded-md border border-brand-200">Progo River</span>
                  </div>

                  {/* Core Pin */}
                  <div className="flex flex-col items-center justify-center translate-x-4 -translate-y-2">
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                      className="relative flex flex-col items-center cursor-pointer"
                      onClick={handleOpenMap}
                    >
                      <MapPin className="w-10 h-10 text-brand-700 fill-white filter drop-shadow-md" />
                      <div className="absolute top-2 w-2.5 h-2.5 bg-brand-700 rounded-full" />
                      <span className="mt-1.5 bg-brand-800 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-sm border border-brand-700 block whitespace-nowrap">
                        Zegan Homestay 🏡
                      </span>
                    </motion.div>
                  </div>

                  {/* Sawah / Paddy fields notice */}
                  <div className="text-center">
                    <span className="bg-brand-100 text-brand-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-brand-200/60">
                      🌾 Beautiful Rice Fields Surroundings
                    </span>
                  </div>
                </div>
              </div>

              {/* Action guidance */}
              <div className="mt-4 text-center">
                <p className="text-[11px] text-stone-500 leading-relaxed mb-4 font-light">
                  {lang === 'id' 
                    ? 'Akses jalan aspal mulus, dapat dijangkau mobil besar, hanya 35 menit dari Bandara YIA.' 
                    : 'Smooth asphalt road access, reachable by large cars, just 35 minutes from YIA Airport.'}
                </p>
                
                <button
                  id="open-google-maps-btn"
                  onClick={handleOpenMap}
                  className="w-full bg-brand-700 hover:bg-brand-850 text-white font-bold py-3 px-4 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-sm group-hover:scale-[1.01] cursor-pointer"
                >
                  <Navigation className="w-4 h-4 fill-current text-brand-300" />
                  <span>{lang === 'id' ? 'Petunjuk Arah Google Maps' : 'Google Maps Directions'}</span>
                </button>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
