import { Compass, Mail, Phone, MapPin, Heart, Share2 } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data';
import officialLogoImg from '../assets/images/zegan_official_logo_1787811644426.jpg';

interface FooterProps {
  lang: Language;
}

export default function Footer({ lang }: FooterProps) {
  const t = TRANSLATIONS[lang];

  return (
    <footer className="bg-brand-950 text-brand-100 pt-16 pb-8 border-t border-brand-800 relative overflow-hidden">
      {/* Background patterns could go here, but keeping it clean */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-brand-800 pb-12 mb-12">
          
          {/* Logo & Pitch */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-amber-400/30 p-0.5 bg-stone-900 shrink-0">
                <img
                  src={officialLogoImg}
                  alt="Zegan Homestay & Cafe Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div>
                <h3 className="text-lg font-serif font-black text-white leading-tight">
                  ZEGAN <span className="text-amber-300 font-light italic font-serif">HOMESTAY</span>
                </h3>
                <span className="text-[10px] tracking-widest text-brand-300/80 uppercase font-medium block">
                  Homestay &amp; Cafe
                </span>
              </div>
            </div>
            <p className="text-brand-200/80 text-xs sm:text-sm leading-relaxed font-light">
              {t.footerText}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-brand-300 uppercase tracking-widest mb-4 font-serif">Quick Navigation</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a href="#home" className="hover:text-brand-300 text-brand-200/90 transition-colors font-medium">
                  {t.home}
                </a>
              </li>
              <li>
                <a href="#rooms" className="hover:text-brand-300 text-brand-200/90 transition-colors font-medium">
                  {t.rooms}
                </a>
              </li>
              <li>
                <a href="#facilities" className="hover:text-brand-300 text-brand-200/90 transition-colors font-medium">
                  {t.facilities}
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-brand-300 text-brand-200/90 transition-colors font-medium">
                  {t.gallery}
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-brand-300 text-brand-200/90 transition-colors font-medium">
                  {t.about}
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-brand-300 text-brand-200/90 transition-colors font-medium">
                  {t.reviews}
                </a>
              </li>
            </ul>
          </div>

          {/* Location Info */}
          <div>
            <h4 className="text-xs font-semibold text-brand-300 uppercase tracking-widest mb-4 font-serif">Location & Access</h4>
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5 text-brand-200/80">
                <MapPin className="w-4 h-4 text-brand-300 shrink-0 mt-0.5" />
                <span className="font-light leading-relaxed">
                  {t.fullAddress}
                </span>
              </div>

            </div>
          </div>

          {/* Direct WhatsApp Contact Details */}
          <div>
            <h4 className="text-xs font-semibold text-brand-300 uppercase tracking-widest mb-4 font-serif">Contact Admin</h4>
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5 text-brand-200/80">
                <Phone className="w-4 h-4 text-brand-300 shrink-0" />
                <span className="font-light">{t.contactAdminVal}</span>
              </div>
              <div className="flex items-center gap-2.5 text-brand-200/80">
                <Mail className="w-4 h-4 text-brand-300 shrink-0" />
                <span className="font-light">zeganhomestay@gmail.com</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bottom copyright and developer credits */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-brand-200/60 gap-4">
          <div className="flex flex-wrap items-center gap-3 text-center sm:text-left">
            <p>© 2026 Zegan Homestay. All rights reserved.</p>
            <span className="hidden sm:inline">•</span>
            <a 
              href="/karyawan" 
              className="text-amber-400 hover:text-amber-300 font-bold underline underline-offset-2"
              title="Laman Sinyal Karyawan TV & HP"
            >
              📺 Layar Karyawan (Staff)
            </a>
          </div>
          <p className="flex items-center gap-1.5 justify-center">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-brand-300 fill-current" />
            <span>in Kulon Progo, Yogyakarta</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
