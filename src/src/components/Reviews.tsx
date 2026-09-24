import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Quote, CheckCircle2, User } from 'lucide-react';
import { Language, Review } from '../types';
import { INITIAL_REVIEWS, TRANSLATIONS, ROOMS } from '../data';
import { supabase } from '../lib/supabase';

interface ReviewsProps {
  lang: Language;
}

export default function Reviews({ lang }: ReviewsProps) {
  const t = TRANSLATIONS[lang];

  // Load reviews from localStorage if they exist, else initial
  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('zegan_reviews');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_REVIEWS;
      }
    }
    return INITIAL_REVIEWS;
  });

  // Review Form States
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [roomType, setRoomType] = useState(ROOMS[0]?.name || 'Standard Room');
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    async function loadSupabaseReviews() {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Supabase reviews table fetch error, falling back to local:', error);
          return;
        }

        if (data && data.length > 0) {
          const dbReviews: Review[] = data.map((item: any) => ({
            id: item.id || `rev-${item.created_at}`,
            author: item.author || 'Tamu Zegan',
            rating: Number(item.rating) || 5,
            comment: item.comment || '',
            date: item.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            roomType: item.room_type || item.roomType || ROOMS[0]?.name || 'Standard Room'
          }));

          // Avoid duplicates with local initial reviews
          setReviews(prev => {
            const merged = [...dbReviews];
            INITIAL_REVIEWS.forEach(initRev => {
              const exists = merged.some(
                r => r.author.toLowerCase() === initRev.author.toLowerCase() && 
                     r.comment.toLowerCase() === initRev.comment.toLowerCase()
              );
              if (!exists) {
                merged.push(initRev);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.error('Failed to load reviews from Supabase:', err);
      }
    }
    loadSupabaseReviews();
  }, []);

  // Sync back to localStorage as secondary backup
  useEffect(() => {
    localStorage.setItem('zegan_reviews', JSON.stringify(reviews));
  }, [reviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) return;

    const newId = 'rev-' + Date.now();
    const newReview: Review = {
      id: newId,
      author: author.trim(),
      rating,
      comment: comment.trim(),
      date: new Date().toISOString().split('T')[0],
      roomType
    };

    // Optimistic UI update
    setReviews([newReview, ...reviews]);
    setAuthor('');
    setRating(5);
    setComment('');
    setRoomType(ROOMS[0]?.name || 'Standard Room');
    
    // Trigger temporary success notification
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
    }, 4000);

    // Save to Supabase
    try {
      const { error: sbError } = await supabase
        .from('reviews')
        .insert([
          {
            id: newId,
            author: newReview.author,
            rating: newReview.rating,
            comment: newReview.comment,
            date: newReview.date,
            room_type: newReview.roomType,
            created_at: new Date().toISOString()
          }
        ]);
      
      if (sbError) {
        console.error('Failed to save review to Supabase table:', sbError);
      } else {
        console.log('Review successfully stored on Supabase!');
      }
    } catch (err) {
      console.error('Network or database issue saving review to Supabase:', err);
    }
  };

  return (
    <section id="reviews" className="py-24 bg-brand-50 relative overflow-hidden">
      {/* Visual accents */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-brand-100 rounded-full filter blur-3xl opacity-40 -ml-40 -mt-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-700 border border-brand-200/80 px-4 py-1.5 rounded-full bg-brand-100 inline-block">
            CLIENT TESTIMONIALS
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-normal text-brand-950 mt-3 leading-tight">
            {t.reviewsTitle}
          </h2>
          <div className="w-12 h-[2px] bg-brand-300 mx-auto mt-4 mb-4" />
          <p className="text-stone-600 text-sm sm:text-base mt-2">
            {t.reviewsSubtitle}
          </p>
        </div>

        {/* Layout: Left list of reviews, Right Submit form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Reviews List (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <AnimatePresence initial={false}>
              {reviews.map((rev) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={rev.id}
                  className="bg-brand-100/30 rounded-xl p-6 sm:p-8 border border-brand-200/80 relative group hover:border-brand-300 transition-colors shadow-sm"
                >
                  <Quote className="absolute top-6 right-6 w-10 h-10 text-brand-200/40 rotate-180 group-hover:scale-110 transition-transform" />

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm shrink-0 uppercase border border-brand-200/60">
                      {rev.author[0] || <User className="w-5 h-5" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                        <h4 className="font-semibold text-brand-950 text-sm sm:text-base">{rev.author}</h4>
                        <span className="text-[10px] text-stone-400 font-semibold">{rev.date}</span>
                      </div>

                      {/* Stars and Room tags */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex text-brand-300">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current text-brand-300' : 'text-brand-200/60'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] bg-brand-100 border border-brand-200/60 text-brand-700 font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          {rev.roomType}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
                        "{rev.comment}"
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Write a Review Form (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="bg-brand-100/40 rounded-xl p-6 sm:p-8 border border-brand-200 shadow-sm">
              <h3 className="text-lg font-serif font-normal text-brand-950 flex items-center gap-2 border-b border-brand-200/80 pb-3 mb-6">
                <MessageSquare className="w-5 h-5 text-brand-600" />
                {t.writeReview}
              </h3>

              <form onSubmit={handleSubmitReview} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-brand-950/70 mb-2">{t.yourName}</label>
                  <input
                    id="review-author"
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder={lang === 'id' ? 'Nama lengkap Anda' : 'Your name'}
                    className="w-full px-4 py-2.5 bg-brand-50 border border-brand-200 rounded-lg text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 transition-colors font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-950/70 mb-2">{lang === 'id' ? 'Kamar Menginap' : 'Stayed Room'}</label>
                    <select
                      id="review-room-type"
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-brand-50 border border-brand-200 rounded-lg text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 transition-colors font-medium"
                    >
                      {ROOMS.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rating Stars Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-950/70 mb-2">{t.yourRating}</label>
                    <div className="flex gap-1.5 py-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const starVal = i + 1;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setRating(starVal)}
                            onMouseEnter={() => setHoverRating(starVal)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-1 cursor-pointer transition-transform hover:scale-115 text-2xl outline-hidden focus:outline-hidden"
                          >
                            <Star 
                              className={`w-6 h-6 transition-colors ${
                                starVal <= (hoverRating ?? rating) 
                                  ? 'text-brand-300 fill-current' 
                                  : 'text-brand-200'
                              }`} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-950/70 mb-2">{lang === 'id' ? 'Ulasan Anda' : 'Your Feedback'}</label>
                  <textarea
                    id="review-comment"
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t.yourComment}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-brand-50 border border-brand-200 rounded-lg text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 transition-colors font-medium resize-none"
                  />
                </div>

                <button
                  id="submit-review-form"
                  type="submit"
                  className="w-full bg-brand-700 hover:bg-brand-850 text-white font-semibold py-3 rounded-lg shadow-sm transition-all text-xs uppercase tracking-widest cursor-pointer"
                >
                  {t.submitReview}
                </button>
              </form>

              {/* Custom success notification box */}
              <AnimatePresence>
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-4 bg-brand-100 text-brand-700 rounded-lg border border-brand-200/50 flex items-start gap-2 text-xs font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span>
                      {lang === 'id' 
                        ? 'Terima kasih banyak! Ulasan Anda berhasil diterbitkan secara langsung di bawah.' 
                        : 'Thank you so much! Your review has been published directly below.'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
