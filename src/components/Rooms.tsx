import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Maximize, Users, Star, ArrowRight, Eye, CheckCircle2 } from 'lucide-react';
import { Room, Language } from '../types';
import { ROOMS, TRANSLATIONS } from '../data';
import { supabase, supabaseDebugInfo } from '../lib/supabase';

// Import room images
import roomEkonomi from '../assets/images/room_ekonomi_1782631326725.jpg';
import roomStandard from '../assets/images/room_standard_1782631345828.jpg';
import roomStandardMadya from '../assets/images/room_standard_madya_1782631361791.jpg';
import roomFamily from '../assets/images/room_family_1782631379795.jpg';
import roomStandardUtama from '../assets/images/room_standard_utama_1782631393687.jpg';

interface RoomsProps {
  lang: Language;
  onSelectRoom: (room: Room) => void;
  onBookRoom: (roomId: string) => void;
}

const getRoomImage = (name: string): string => {
  const norm = name.toLowerCase().trim();
  if (norm.includes('economy room')) return roomEkonomi;
  if (norm.includes('standard room pratama')) return roomStandard;
  if (norm.includes('standard room madya')) return roomStandardMadya;
  if (norm.includes('family room')) return roomFamily;
  if (norm.includes('standard room utama')) return roomStandardUtama;
  if (norm.includes('rumah')) return roomFamily;
  
  // Generic fallback if name varies slightly
  if (norm.includes('ekonomi')) return roomEkonomi;
  if (norm.includes('utama')) return roomStandardUtama;
  if (norm.includes('madya')) return roomStandardMadya;
  if (norm.includes('pratama') || norm.includes('standard')) return roomStandard;
  if (norm.includes('family')) return roomFamily;
  
  return roomStandard; // absolute fallback
};

const getRoomMetaByName = (name: string) => {
  const norm = name.toLowerCase().trim();
  if (norm.includes('economy') || norm.includes('ekonomi')) {
    return {
      size: '12 m²',
      bedType: { id: '1 Kasur Single', en: '1 Single Bed' },
      amenities: ['wifi', 'garden-view'],
      rating: 4.6,
      capacity: 1
    };
  }
  if (norm.includes('pratama') || norm.includes('standard room') && !norm.includes('madya') && !norm.includes('utama')) {
    return {
      size: '16 m²',
      bedType: { id: '1 Kasur Double', en: '1 Double Bed' },
      amenities: ['wifi', 'ac', 'tv', 'shower', 'garden-view'],
      rating: 4.7,
      capacity: 2
    };
  }
  if (norm.includes('madya')) {
    return {
      size: '18 m²',
      bedType: { id: '1 Kasur Double', en: '1 Double Bed' },
      amenities: ['wifi', 'ac', 'tv', 'shower', 'garden-view'],
      rating: 4.8,
      capacity: 2
    };
  }
  if (norm.includes('family')) {
    return {
      size: '28 m²',
      bedType: { id: '1 Kasur Double & 1 Kasur Single', en: '1 Double Bed & 1 Single Bed' },
      amenities: ['wifi', 'ac', 'tv', 'shower', 'garden-view', 'fridge'],
      rating: 4.9,
      capacity: 3
    };
  }
  if (norm.includes('utama')) {
    return {
      size: '20 m²',
      bedType: { id: '1 Kasur Double', en: '1 Double Bed' },
      amenities: ['wifi', 'ac', 'tv', 'shower', 'garden-view'],
      rating: 4.9,
      capacity: 2
    };
  }
  if (norm.includes('rumah')) {
    return {
      size: '45 m²',
      bedType: { id: '2 Kasur Double', en: '2 Double Beds' },
      amenities: ['wifi', 'ac', 'tv', 'shower', 'garden-view', 'fridge'],
      rating: 5.0,
      capacity: 6
    };
  }
  // default fallback
  return {
    size: '16 m²',
    bedType: { id: '1 Kasur Double', en: '1 Double Bed' },
    amenities: ['wifi', 'ac', 'tv', 'shower', 'garden-view'],
    rating: 4.8,
    capacity: 2
  };
};

export default function Rooms({ lang, onSelectRoom, onBookRoom }: RoomsProps) {
  const t = TRANSLATIONS[lang];
  const [rooms, setRooms] = useState<Room[]>(ROOMS);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRooms() {
      try {
        setLoading(true);
        setDbError(null);

        // Check if Supabase credentials are configured
        if (!supabaseDebugInfo.isValidUrl || !supabaseDebugInfo.keyDefined) {
          setRooms(ROOMS);
          return;
        }

        const { data, error } = await supabase
          .from('room_types')
          .select('id, name, description, weekday_price, weekend_price, max_guest');

        if (error) {
          console.warn('Supabase room_types query unavailable, using static catalog:', error.message);
          setRooms(ROOMS);
          return;
        }

        if (data && data.length > 0) {
          const mappedRooms: Room[] = data.map((row: any) => {
            const meta = getRoomMetaByName(row.name);
            const image = getRoomImage(row.name);
            return {
              id: String(row.id),
              name: row.name,
              price: Number(row.weekday_price),
              description: {
                id: row.description || '',
                en: row.description || ''
              },
              image: image,
              size: meta.size,
              capacity: Number(row.max_guest) || meta.capacity,
              bedType: meta.bedType,
              amenities: meta.amenities,
              rating: meta.rating
            };
          });
          setRooms(mappedRooms);
        } else {
          setRooms(ROOMS);
        }
      } catch (err: any) {
        console.warn('Fallback to local catalog due to Supabase error:', err);
        setRooms(ROOMS);
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
  }, []);

  return (
    <section id="rooms" className="py-24 bg-brand-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-700 border border-brand-200/80 px-4 py-1.5 rounded-full bg-brand-100 inline-block">
            LUXURY LODGINGS
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-normal text-brand-950 mt-3 leading-tight">
            {t.roomsTitle}
          </h2>
          <div className="w-12 h-[2px] bg-brand-300 mx-auto mt-4 mb-4" />
          <p className="text-stone-600 text-sm sm:text-base mt-2">
            {t.roomsSubtitle}
          </p>
        </div>

        {dbError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex flex-col gap-1 max-w-2xl mx-auto">
            <span className="font-semibold">Supabase Query Error:</span>
            <code className="text-xs bg-red-100 px-2 py-1 rounded select-all whitespace-pre-wrap">{dbError}</code>
            <p className="text-xs mt-1 text-red-600">Pastikan skema database Supabase sudah sesuai dan RLS policy untuk SELECT sudah di-allow.</p>
          </div>
        )}

        {/* Rooms Grid / Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-brand-700 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-stone-600 text-sm font-medium animate-pulse">
              {lang === 'id' ? 'Memuat data kamar...' : 'Loading room data...'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {rooms.map((room, idx) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="bg-brand-100/40 rounded-2xl overflow-hidden border border-brand-200/80 hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between h-full group"
              >
                {/* Image & Price Overlay */}
                <div className="relative h-60 overflow-hidden cursor-pointer" onClick={() => onSelectRoom(room)}>
                  <img
                    src={room.image}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Float Badge */}
                  <div className="absolute top-4 left-4 bg-brand-50/90 border border-brand-200/50 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-bold text-brand-950 flex items-center gap-1 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-brand-300 fill-current" />
                    <span>{room.rating.toFixed(1)}</span>
                  </div>

                  {/* Room Number Badge */}
                  {room.roomNumbers && (
                    <div className="absolute top-4 right-4 bg-brand-950/80 text-white backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide">
                      No: {room.roomNumbers}
                    </div>
                  )}

                  {/* Price Display */}
                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-white">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl font-serif font-bold text-white">
                          Rp{room.price.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-stone-100 font-sans">
                          Weekday
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-200 mt-0.5 flex items-center gap-1.5">
                        <span>Weekend: <strong className="font-semibold text-white">Rp{(room.weekendPrice || room.weekend_price || room.price).toLocaleString('id-ID')}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content details */}
                <div className="p-6 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-serif font-normal text-brand-950 mb-2 group-hover:text-brand-300 transition-colors">
                      {room.name}
                    </h3>
                    
                    <p className="text-xs text-stone-600 line-clamp-3 mb-6 min-h-[54px] leading-relaxed">
                      {room.description[lang]}
                    </p>

                    {/* Amenities Row */}
                    <div className="flex items-center gap-4 text-xs text-stone-600 border-t border-brand-200/60 pt-4 mb-6">
                      <div className="flex items-center gap-1">
                        <Maximize className="w-4 h-4 text-brand-600" />
                        <span className="font-semibold">{room.size}</span>
                      </div>
                      <div className="w-1.5 h-1.5 bg-brand-200 rounded-full" />
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-brand-600" />
                        <span className="font-semibold">Max {room.capacity} {lang === 'id' ? 'Tamu' : 'Guests'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      id={`view-detail-btn-${room.id}`}
                      onClick={() => onSelectRoom(room)}
                      className="w-full bg-brand-100 hover:bg-brand-200 text-brand-950 font-semibold py-3 px-4 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all border border-brand-200 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-brand-600" />
                      <span>{t.viewDetail}</span>
                    </button>

                    <button
                      id={`book-room-btn-${room.id}`}
                      onClick={() => onBookRoom(room.id)}
                      className="w-full bg-brand-700 hover:bg-brand-850 text-white font-bold py-3 px-4 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-brand-300" />
                      <span>{t.bookNow}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
