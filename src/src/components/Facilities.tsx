import { motion } from 'motion/react';
import { Wifi, Car, Coffee, Waves, ArrowRight, Utensils } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data';

interface FacilitiesProps {
  lang: Language;
  onOpenMenu: () => void;
}

export default function Facilities({ lang, onOpenMenu }: FacilitiesProps) {
  const t = TRANSLATIONS[lang];

  const facilityList = [
    {
      icon: Waves,
      title: t.poolTitle,
      description: t.poolDesc,
      tag: lang === 'id' ? 'Air Bersih' : 'Fresh Water',
      bgColor: 'bg-brand-100 text-brand-700 border-brand-200/50',
    },
    {
      icon: Wifi,
      title: t.wifiTitle,
      description: t.wifiDesc,
      tag: '100 Mbps Fiber',
      bgColor: 'bg-brand-100 text-brand-700 border-brand-200/50',
    },
    {
      icon: Car,
      title: t.parkingTitle,
      description: t.parkingDesc,
      tag: lang === 'id' ? 'Aman & Luas' : 'Secure & Free',
      bgColor: 'bg-brand-100 text-brand-700 border-brand-200/50',
    },
    {
      icon: Coffee,
      title: t.cafeTitle,
      description: t.cafeDesc,
      tag: 'Open-air Cafe',
      bgColor: 'bg-brand-600 text-brand-50 border-brand-700/50',
      action: {
        label: t.viewMenu,
        onClick: onOpenMenu,
      }
    }
  ];

  return (
    <section id="facilities" className="py-24 bg-brand-100/30 relative overflow-hidden">
      {/* Decorative corner circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-100 rounded-full filter blur-3xl opacity-40 -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-200/20 rounded-full filter blur-3xl opacity-40 -ml-48 -mb-48" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-700 border border-brand-200/85 px-4 py-1.5 rounded-full bg-brand-100 inline-block">
            MODERN COMFORTS
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-normal text-brand-950 mt-3 leading-tight">
            {t.facilitiesTitle}
          </h2>
          <div className="w-12 h-[2px] bg-brand-300 mx-auto mt-4 mb-4" />
          <p className="text-stone-600 text-sm sm:text-base mt-2">
            {lang === 'id' 
              ? 'Layanan lengkap bernuansa pedesaan untuk pengalaman menginap tanpa kompromi.' 
              : 'Complete country-themed services for an uncompromised vacation experience.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {facilityList.map((fac, idx) => {
            const IconComponent = fac.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-brand-50 rounded-2xl p-6 sm:p-8 border border-brand-200/80 hover:border-brand-300/80 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${fac.bgColor} border mb-6`}>
                    <IconComponent className="w-6 h-6" />
                  </div>

                  <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-950/60 bg-brand-200/50 px-2.5 py-0.5 rounded-md">
                    {fac.tag}
                  </span>

                  <h3 className="text-lg font-semibold text-brand-950 mt-3 mb-2">
                    {fac.title}
                  </h3>

                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                    {fac.description}
                  </p>
                </div>

                {fac.action && (
                  <div className="mt-6 pt-6 border-t border-brand-200/60">
                    <button
                      id="view-cafe-menu-button"
                      onClick={fac.action.onClick}
                      className="w-full py-2.5 px-4 bg-brand-700 hover:bg-brand-850 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Utensils className="w-4 h-4 text-brand-300" />
                      <span>{fac.action.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
