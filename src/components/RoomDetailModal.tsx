import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Wifi, Wind, Tv, Coffee, Maximize, Users, Bed, 
  Star, ShieldCheck, Heart, Eye, Sparkles, CheckCircle2 
} from 'lucide-react';
import { Room, Language } from '../types';
import { TRANSLATIONS } from '../data';

interface RoomDetailModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onBookNow: (roomId: string) => void;
}

export default function RoomDetailModal({ room, isOpen, onClose, lang, onBookNow }: RoomDetailModalProps) {
  if (!room) return null;
  const t = TRANSLATIONS[lang];

  // Helper to map amenity strings to Lucide Icons
  const getAmenityDetails = (amenity: string) => {
    switch (amenity) {
      case 'wifi':
        return { label: lang === 'id' ? 'Free WiFi' : 'Free WiFi', icon: Wifi };
      case 'ac':
        return { label: lang === 'id' ? 'AC Pendingin' : 'Air Conditioning', icon: Wind };
      case 'tv':
        return { label: lang === 'id' ? 'Smart TV' : 'Smart TV', icon: Tv };
      case 'shower':
        return { label: lang === 'id' ? 'Shower Air Hangat' : 'Hot Shower', icon: CheckCircle2 };
      case 'coffee-maker':
        return { label: lang === 'id' ? 'Pembuat Kopi & Teh' : 'Coffee/Tea Maker', icon: Coffee };
      case 'fridge':
        return { label: lang === 'id' ? 'Kulkas Mini' : 'Mini Fridge', icon: Sparkles };
      case 'garden-view':
        return { label: lang === 'id' ? 'Pemandangan Taman' : 'Garden View', icon: Eye };
      case 'pool-view':
        return { label: lang === 'id' ? 'Pemandangan Kolam' : 'Pool View', icon: Eye };
      case 'bathtub':
        return { label: lang === 'id' ? 'Bathub Outdoor' : 'Outdoor Bathtub', icon: Sparkles };
      case 'private-patio':
        return { label: lang === 'id' ? 'Teras Pribadi' : 'Private Patio', icon: HomeIcon };
      case 'premium-linens':
        return { label: lang === 'id' ? 'Sprei Katun Premium' : 'Premium Linens', icon: Heart };
      default:
        return { label: amenity, icon: CheckCircle2 };
    }
  };

  function HomeIcon(props: any) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div id={`room-detail-modal-${room.id}`} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          {/* Overlay click */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-3xl bg-brand-50 rounded-xl shadow-2xl overflow-hidden z-10 my-8 border border-brand-200"
          >
            {/* Close button */}
            <button
              id={`close-room-detail-${room.id}`}
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all shadow-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Room Banner Image */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden">
              <img
                src={room.image}
                alt={room.name}
                className="w-full h-full object-cover animate-image-fade"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-brand-700 text-brand-100 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Javanese Heritage
                  </span>
                  <div className="flex items-center gap-1 text-brand-300 bg-black/30 px-2 py-0.5 rounded-full text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {room.rating.toFixed(1)}
                  </div>
                </div>
                <h3 className="text-3xl sm:text-4xl font-serif font-normal text-white leading-tight">
                  {room.name}
                </h3>
              </div>
            </div>

            {/* Content info */}
            <div className="p-6 sm:p-8 bg-brand-50">
              {/* Quick specs */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-brand-100/30 rounded-lg border border-brand-200 shadow-sm mb-6 text-center">
                <div className="flex flex-col items-center justify-center">
                  <Maximize className="w-5 h-5 text-brand-600 mb-1" />
                  <span className="text-[10px] text-brand-950/60 uppercase tracking-widest font-semibold">Size</span>
                  <span className="text-xs sm:text-sm font-bold text-brand-950">{room.size}</span>
                </div>
                <div className="flex flex-col items-center justify-center border-x border-brand-200">
                  <Users className="w-5 h-5 text-brand-600 mb-1" />
                  <span className="text-[10px] text-brand-950/60 uppercase tracking-widest font-semibold">Guests</span>
                  <span className="text-xs sm:text-sm font-bold text-brand-950">Max {room.capacity} {lang === 'id' ? 'Orang' : 'Guests'}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <Bed className="w-5 h-5 text-brand-600 mb-1" />
                  <span className="text-[10px] text-brand-950/60 uppercase tracking-widest font-semibold">Bedding</span>
                  <span className="text-xs sm:text-sm font-bold text-brand-950 truncate max-w-full px-1">{room.bedType[lang]}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h4 className="font-serif font-normal text-lg text-brand-950 mb-2">
                  {lang === 'id' ? 'Deskripsi Kamar' : 'Room Description'}
                </h4>
                <p className="text-sm text-stone-600 leading-relaxed font-light">
                  {room.description[lang]}
                </p>
              </div>

              {/* Amenities */}
              <div className="mb-8">
                <h4 className="font-serif font-normal text-lg text-brand-950 mb-3">
                  {lang === 'id' ? 'Fasilitas & Layanan Kamar' : 'Room Amenities & Features'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {room.amenities.map((amenity) => {
                    const detail = getAmenityDetails(amenity);
                    const IconComponent = detail.icon;
                    return (
                      <div
                        key={amenity}
                        className="flex items-center gap-2.5 p-2.5 bg-brand-100/40 rounded-lg border border-brand-200 text-stone-700 text-xs hover:border-brand-350 transition-colors"
                      >
                        <div className="p-1.5 bg-brand-100 rounded-lg text-brand-700">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-brand-950">{detail.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action pricing */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-brand-200">
                <div className="text-center sm:text-left">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <div>
                      <span className="text-[10px] text-brand-950/60 block uppercase tracking-widest font-semibold">
                        Weekday
                      </span>
                      <span className="text-xl sm:text-2xl font-serif font-bold text-brand-700">
                        Rp{room.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="border-l border-brand-300 pl-3">
                      <span className="text-[10px] text-brand-950/60 block uppercase tracking-widest font-semibold">
                        Weekend / Holiday
                      </span>
                      <span className="text-xl sm:text-2xl font-serif font-bold text-brand-850">
                        Rp{(room.weekendPrice || room.weekend_price || room.price).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  {room.roomNumbers && (
                    <p className="text-xs text-stone-500 mt-1 font-medium">
                      No. Kamar: <span className="text-brand-900 font-bold">{room.roomNumbers}</span>
                    </p>
                  )}
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    id={`modal-book-button-${room.id}`}
                    onClick={() => {
                      onBookNow(room.id);
                      onClose();
                    }}
                    className="flex-1 sm:flex-initial bg-brand-700 hover:bg-brand-850 text-white font-bold px-8 py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-brand-300" />
                    <span>{t.bookNow}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
