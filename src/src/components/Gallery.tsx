import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, Compass } from 'lucide-react';
import { GALLERY_IMAGES, TRANSLATIONS } from '../data';
import { Language } from '../types';

interface GalleryProps {
  lang: Language;
}

export default function Gallery({ lang }: GalleryProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<typeof GALLERY_IMAGES[0] | null>(null);
  const t = TRANSLATIONS[lang];

  const categories = [
    { id: 'all', name: t.cat_all },
    { id: 'rooms', name: t.cat_rooms },
    { id: 'cafe', name: t.cat_cafe },
    { id: 'pool', name: t.cat_pool },
    { id: 'grounds', name: t.cat_grounds },
  ];

  const filteredImages = activeCategory === 'all'
    ? GALLERY_IMAGES
    : GALLERY_IMAGES.filter(img => img.category === activeCategory);

  return (
    <section id="gallery" className="py-16 sm:py-20 bg-brand-50/40 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Gallery Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-700 bg-brand-100/70 border border-brand-200/80 px-3.5 py-1 rounded-full inline-block mb-2.5">
            {lang === 'id' ? 'Galeri Foto' : 'Photo Gallery'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-brand-950 font-medium tracking-tight">
            {t.galleryTitle}
          </h2>
          <div className="w-10 h-0.5 bg-brand-300 mx-auto my-3" />
          <p className="text-stone-600 text-sm sm:text-base font-light leading-relaxed">
            {t.gallerySubtitle}
          </p>
        </div>

        {/* Minimalist Categories Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-brand-800 text-brand-50 shadow-xs border border-brand-900'
                  : 'bg-white text-stone-600 hover:bg-brand-100/80 hover:text-brand-900 border border-brand-200/70'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Clean & Natural Images Grid */}
        <motion.div 
          layout 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          {filteredImages.map((img, idx) => (
            <motion.div
              layout
              key={`${img.url}-${idx}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              onClick={() => setSelectedImage(img)}
              className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-brand-200/80 shadow-2xs hover:shadow-md hover:border-brand-300 transition-all flex flex-col"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                <img
                  src={img.url}
                  alt={img.title[lang]}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                />
                
                {/* Subtle zoom icon on hover */}
                <div className="absolute inset-0 bg-stone-900/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-2.5 rounded-full bg-white/90 text-brand-900 shadow-sm transform scale-90 group-hover:scale-100 transition-transform">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Natural clean photo caption */}
              <div className="p-3.5 flex items-center justify-between border-t border-brand-100/60 bg-white">
                <p className="text-xs sm:text-sm font-medium text-stone-800 truncate">
                  {img.title[lang]}
                </p>
                <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-150 uppercase tracking-wider shrink-0 ml-2">
                  {img.category === 'rooms' ? (lang === 'id' ? 'Kamar' : 'Rooms') :
                   img.category === 'cafe' ? 'Cafe' :
                   img.category === 'pool' ? (lang === 'id' ? 'Kolam' : 'Pool') :
                   (lang === 'id' ? 'Sekitar' : 'Grounds')}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs">
              <div className="absolute inset-0" onClick={() => setSelectedImage(null)} />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative max-w-3xl max-h-[85vh] z-10 flex flex-col items-center"
              >
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-11 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <img
                  src={selectedImage.url}
                  alt={selectedImage.title[lang]}
                  className="w-full max-h-[72vh] object-contain rounded-xl shadow-2xl bg-black border border-stone-800"
                />

                <div className="text-center mt-3.5 text-white">
                  <span className="text-[10px] uppercase tracking-widest text-brand-300 font-semibold inline-flex items-center gap-1">
                    <Compass className="w-3 h-3" />
                    {selectedImage.category}
                  </span>
                  <h4 className="text-base font-serif mt-0.5 font-medium">{selectedImage.title[lang]}</h4>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
