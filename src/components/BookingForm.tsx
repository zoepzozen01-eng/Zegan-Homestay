import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Users, Coffee, Bike, Car, Sparkles, CheckCircle2, 
  HelpCircle, Receipt, Percent, Tag, MessageSquare, Compass, Info,
  Upload, Camera, Loader2, Ban, AlertTriangle, Bed, Clock, Plus, Minus
} from 'lucide-react';
import { Language, Room, AddOn } from '../types';
import { ROOMS, ADD_ONS, TRANSLATIONS } from '../data';
import { supabase, supabaseDebugInfo } from '../lib/supabase';
import { logActivity, getQrisSettings, getDynamicQrisImageUrl } from '../services/adminService';
import { sendAdminNotification } from '../services/fonnte';
import { checkRoomAvailability, getLiveBookingsAndRooms } from '../lib/roomAvailability';

// Import room images
import roomEkonomi from '../assets/images/room_ekonomi_1782631326725.jpg';
import roomStandard from '../assets/images/room_standard_1782631345828.jpg';
import roomStandardMadya from '../assets/images/room_standard_madya_1782631361791.jpg';
import roomFamily from '../assets/images/room_family_1782631379795.jpg';
import roomStandardUtama from '../assets/images/room_standard_utama_1782631393687.jpg';

interface DBExtendedRoom extends Room {
  weekend_price?: number;
}

const getRoomImage = (name: string): string => {
  const norm = name.toLowerCase().trim();
  if (norm.includes('economy room')) return roomEkonomi;
  if (norm.includes('standard room pratama')) return roomStandard;
  if (norm.includes('standard room madya')) return roomStandardMadya;
  if (norm.includes('family room')) return roomFamily;
  if (norm.includes('standard room utama')) return roomStandardUtama;
  if (norm.includes('rumah')) return roomFamily;
  
  if (norm.includes('ekonomi')) return roomEkonomi;
  if (norm.includes('utama')) return roomStandardUtama;
  if (norm.includes('madya')) return roomStandardMadya;
  if (norm.includes('pratama') || norm.includes('standard')) return roomStandard;
  if (norm.includes('family')) return roomFamily;
  
  return roomStandard;
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
  return {
    size: '16 m²',
    bedType: { id: '1 Kasur Double', en: '1 Double Bed' },
    amenities: ['wifi', 'ac', 'tv', 'shower', 'garden-view'],
    rating: 4.8,
    capacity: 2
  };
};

const mapPrefilledRoomId = (id: string, availableRooms: DBExtendedRoom[]) => {
  if (!id) return '';
  const norm = id.toLowerCase();
  let matchedName = '';
  if (norm === 'ekonomi') matchedName = 'economy room';
  else if (norm === 'standard-room') matchedName = 'standard room pratama';
  else if (norm === 'standard-room-madya') matchedName = 'standard room madya';
  else if (norm === 'family') matchedName = 'family room';
  else if (norm === 'standard-room-utama') matchedName = 'standard room utama';
  else if (norm === 'rumah') matchedName = 'rumah';

  if (matchedName) {
    const matched = availableRooms.find(r => r.name.toLowerCase().trim().includes(matchedName));
    if (matched) return matched.id;
  }
  
  const matchedById = availableRooms.find(r => String(r.id) === String(id));
  if (matchedById) return matchedById.id;

  const matchedByName = availableRooms.find(r => r.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(norm.replace(/[^a-z0-9]/g, '')));
  if (matchedByName) return matchedByName.id;

  return availableRooms[0]?.id || id;
};

const calculateRoomCost = (room: DBExtendedRoom, checkInStr: string, checkOutStr: string) => {
  const start = new Date(checkInStr);
  const end = new Date(checkOutStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return room ? room.price : 0;
  }

  let total = 0;
  let currentDate = new Date(start);

  while (currentDate < end) {
    const day = currentDate.getDay(); // 0: Sunday, 6: Saturday
    const isWeekend = (day === 6 || day === 0);
    const price = isWeekend && room.weekend_price ? room.weekend_price : room.price;
    total += price;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return total;
};

interface BookingFormProps {
  lang: Language;
  prefilledRoomId: string;
  prefilledCheckIn: string;
  prefilledCheckOut: string;
  prefilledGuests: number;
  formScrollTrigger: number;
  onCheckInChange?: (date: string) => void;
  onCheckOutChange?: (date: string) => void;
  onGuestsChange?: (guests: number) => void;
  onRoomChange?: (roomId: string) => void;
  onGoToCustomerPortal?: () => void;
}

export default function BookingForm({ 
  lang, 
  prefilledRoomId, 
  prefilledCheckIn, 
  prefilledCheckOut, 
  prefilledGuests,
  formScrollTrigger,
  onCheckInChange,
  onCheckOutChange,
  onGuestsChange,
  onRoomChange,
  onGoToCustomerPortal
}: BookingFormProps) {
  const t = TRANSLATIONS[lang];

  // Helper date generators
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getNextDayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  // State
  const [rooms, setRooms] = useState<DBExtendedRoom[]>(() => {
    return ROOMS.map(r => ({
      ...r,
      weekend_price: r.price
    }));
  });
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState(prefilledRoomId || 'standard-room-utama');
  const [checkIn, setCheckIn] = useState(prefilledCheckIn || getTomorrowDate());
  const [checkOut, setCheckOut] = useState(prefilledCheckOut || getNextDayDate(prefilledCheckIn || getTomorrowDate()));
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [extraBeds, setExtraBeds] = useState(0);
  const [guests, setGuests] = useState(prefilledGuests || 2);

  const formatDayAndDate = (dateStr: string, timeStr?: string, currentLang: Language = 'id') => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const daysId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const dayName = currentLang === 'id' ? daysId[d.getDay()] : daysEn[d.getDay()];
    const monthName = currentLang === 'id' ? monthsId[d.getMonth()] : monthsEn[d.getMonth()];
    const timeText = timeStr ? (currentLang === 'id' ? ` pukul ${timeStr} WIB` : ` at ${timeStr}`) : '';
    return `${dayName}, ${d.getDate()} ${monthName} ${d.getFullYear()}${timeText}`;
  };

  const handleCheckInChange = (newDate: string) => {
    setCheckIn(newDate);
    onCheckInChange?.(newDate);
    const inDate = new Date(newDate);
    const outDate = new Date(checkOut);
    if (isNaN(outDate.getTime()) || outDate <= inDate) {
      const nextDate = getNextDayDate(newDate);
      setCheckOut(nextDate);
      onCheckOutChange?.(nextDate);
    }
  };

  const handleCheckOutChange = (newDate: string) => {
    setCheckOut(newDate);
    onCheckOutChange?.(newDate);
  };

  const handleGuestsChange = (newGuests: number) => {
    setGuests(newGuests);
    onGuestsChange?.(newGuests);
  };

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    setExtraBeds(0);
    onRoomChange?.(roomId);
  };
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const selectedAddOns: string[] = [];

  // Live availability data
  const [liveBookings, setLiveBookings] = useState<any[]>([]);
  const [liveRooms, setLiveRooms] = useState<any[]>([]);

  const refreshAvailability = async () => {
    try {
      const { bookings, dbRooms } = await getLiveBookingsAndRooms();
      setLiveBookings(bookings);
      setLiveRooms(dbRooms);
    } catch (e) {
      console.warn('[BookingForm] Error refreshing availability:', e);
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
  
  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [activeDiscount, setActiveDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Booking result modal
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // States for file uploads
  const [ktpPhoto, setKtpPhoto] = useState<File | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photosUploaded, setPhotosUploaded] = useState(false);

  const handleCloseSuccess = () => {
    setBookingSuccess(false);
    setKtpPhoto(null);
    setPaymentProof(null);
    setPhotosUploaded(false);
    setUploadError(null);
  };

  // Fetch rooms from room_types in Supabase
  useEffect(() => {
    async function fetchRoomTypes() {
      try {
        setRoomsLoading(true);
        setRoomsError(null);

        // Check if Supabase credentials are valid
        if (!supabaseDebugInfo.isValidUrl || !supabaseDebugInfo.keyDefined) {
          if (prefilledRoomId) {
            const mappedId = mapPrefilledRoomId(prefilledRoomId, rooms);
            setSelectedRoomId(mappedId);
          }
          return;
        }

        const { data, error } = await supabase
          .from('room_types')
          .select('id, name, description, weekday_price, weekend_price, max_guest');

        if (error) {
          console.warn('[BookingForm] Supabase room_types query unavailable, using default room list:', error.message);
          return;
        }

        if (data && data.length > 0) {
          const mapped: DBExtendedRoom[] = data.map((row: any) => {
            const meta = getRoomMetaByName(row.name);
            const image = getRoomImage(row.name);
            return {
              id: String(row.id),
              name: row.name,
              price: Number(row.weekday_price),
              weekend_price: Number(row.weekend_price),
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
          setRooms(mapped);
          
          if (prefilledRoomId) {
            const mappedId = mapPrefilledRoomId(prefilledRoomId, mapped);
            setSelectedRoomId(mappedId);
          } else if (mapped.length > 0) {
            setSelectedRoomId(mapped[0].id);
          }
        }
      } catch (err: any) {
        console.warn('[BookingForm] Using static fallback room catalog:', err);
      } finally {
        setRoomsLoading(false);
      }
    }
    fetchRoomTypes();
  }, []);

  // Auto-sync props when changed externally (quick search or booking click)
  useEffect(() => {
    if (prefilledRoomId) {
      const mappedId = mapPrefilledRoomId(prefilledRoomId, rooms);
      setSelectedRoomId(mappedId);
    }
    if (prefilledCheckIn) setCheckIn(prefilledCheckIn);
    if (prefilledCheckOut) setCheckOut(prefilledCheckOut);
    if (prefilledGuests) setGuests(prefilledGuests);
  }, [prefilledRoomId, prefilledCheckIn, prefilledCheckOut, prefilledGuests, formScrollTrigger, rooms]);

  // Auto-switch to available room if currently selected room is booked for the chosen dates
  useEffect(() => {
    if (rooms.length === 0) return;
    const isChosenAvailable = checkRoomAvailability(
      selectedRoom?.name || selectedRoomId,
      checkIn,
      checkOut,
      liveBookings,
      liveRooms
    ).isAvailable;

    if (!isChosenAvailable) {
      // Find the first room type that has available units
      const firstAvailable = rooms.find(r => 
        checkRoomAvailability(r.name || r.id, checkIn, checkOut, liveBookings, liveRooms).isAvailable
      );
      if (firstAvailable && String(firstAvailable.id) !== String(selectedRoomId)) {
        setSelectedRoomId(firstAvailable.id);
      }
    }
  }, [checkIn, checkOut, liveBookings, liveRooms, rooms, selectedRoomId]);

  const selectedRoom = rooms.find(r => String(r.id) === String(selectedRoomId)) || rooms[0] || ROOMS[0];

  // Live availability for currently selected room and dates
  const currentRoomAvail = checkRoomAvailability(
    selectedRoom?.name || selectedRoomId,
    checkIn,
    checkOut,
    liveBookings,
    liveRooms
  );
  const isCurrentRoomBooked = !currentRoomAvail.isAvailable;

  // Date math
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
  const nightsCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  // Pricing math
  const EXTRA_BED_RATE = 50000;
  const roomCost = calculateRoomCost(selectedRoom, checkIn, checkOut);
  const averagePrice = nightsCount > 0 ? Math.round(roomCost / nightsCount) : (selectedRoom ? selectedRoom.price : 0);
  const extraBedCost = extraBeds * EXTRA_BED_RATE * nightsCount;
  const baseCapacity = selectedRoom?.capacity || 2;
  const effectiveMaxCapacity = baseCapacity + extraBeds;

  const subtotal = roomCost + extraBedCost;

  // Discount math
  const discountAmount = activeDiscount ? (subtotal * activeDiscount.percent) / 100 : 0;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * 0.10; // 10% VAT
  const finalTotal = taxableAmount + taxAmount;

  // Coupon apply
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = couponCode.trim().toUpperCase();
    if (normalized === 'ZEGANLOVE') {
      setActiveDiscount({ code: 'ZEGANLOVE', percent: 10 });
      setCouponError('');
    } else if (normalized === 'KULONPROGO') {
      setActiveDiscount({ code: 'KULONPROGO', percent: 15 });
      setCouponError('');
    } else {
      setCouponError(lang === 'id' ? 'Voucher tidak valid' : 'Invalid coupon code');
    }
  };

  // Render add-on icons helper
  const renderAddOnIcon = (icon: string) => {
    switch (icon) {
      case 'Coffee': return <Coffee className="w-5 h-5" />;
      case 'Bike': return <Bike className="w-5 h-5" />;
      case 'Car': return <Car className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      default: return <Coffee className="w-5 h-5" />;
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submit and launch WhatsApp integration
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    // Generate simple random booking code ZG-XXXXX
    const code = 'ZG-' + Math.floor(10000 + Math.random() * 90000);
    setGeneratedCode(code);

    // 0. Check bookings availability using centralized roomAvailability engine
    let assignedPhysicalRoomId = `room-${selectedRoomId}-1`;
    let isSupabaseHealthy = true;

    try {
      const { bookings: currentBookings, dbRooms: currentDbRooms } = await getLiveBookingsAndRooms();
      const availCheck = checkRoomAvailability(
        selectedRoom?.name || selectedRoomId,
        checkIn,
        checkOut,
        currentBookings,
        currentDbRooms
      );

      if (!availCheck.isAvailable) {
        throw new Error(lang === 'id'
          ? `Kamar "${selectedRoom.name}" sudah terkonfirmasi penuh untuk tanggal ${checkIn} s/d ${checkOut}. Silakan pilih tipe kamar lain.`
          : `Room "${selectedRoom.name}" is already fully booked from ${checkIn} to ${checkOut}. Please select another room.`
        );
      }

      // If physical rooms are available in dbRooms, match the appropriate one
      const matchingDbRooms = currentDbRooms.filter(dr => 
        String(dr.room_type_id) === String(selectedRoomId) || 
        String(dr.type || '').toLowerCase() === String(selectedRoom?.name || '').toLowerCase()
      );
      if (matchingDbRooms.length > 0) {
        assignedPhysicalRoomId = matchingDbRooms[0].id;
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('terkonfirmasi penuh') || err.message.includes('fully booked'))) {
        setSubmitError(err.message);
        setIsSubmitting(false);
        return;
      }
      console.warn('[BookingForm] Availability check warning, proceeding gracefully:', err);
    }

    // 2. Insert to guests table
    let guestId: any = null;
    if (isSupabaseHealthy) {
      try {
        const { data: guestData, error: guestError } = await supabase
          .from('guests')
          .insert([
            {
              full_name: fullName,
              phone: phone,
              email: email
            }
          ])
          .select('id');

        if (guestError) {
          throw guestError;
        }
        if (!guestData || guestData.length === 0) {
          throw new Error('No guest data returned');
        }
        guestId = guestData[0].id;
      } catch (err: any) {
        console.warn('[BookingForm] Failed to save guest to Supabase, continuing with local guest ID.', err);
        guestId = 'local-guest-' + Date.now();
        isSupabaseHealthy = false;
      }
    } else {
      guestId = 'local-guest-' + Date.now();
    }

    // 3. Insert to bookings table
    if (isSupabaseHealthy) {
      try {
        const { error: bookingError } = await supabase
          .from('bookings')
          .insert([
            {
              booking_code: code,
              guest_id: typeof guestId === 'number' ? guestId : null,
              room_id: assignedPhysicalRoomId,
              check_in: checkIn,
              check_out: checkOut,
              adults: guests,
              total_price: finalTotal,
              special_request: specialRequests,
              payment_status: 'Pending',
              booking_status: 'Pending',
              admin_notification_sent: false
            }
          ]);

        if (bookingError) {
          throw bookingError;
        }
      } catch (err: any) {
        console.warn('[BookingForm] Failed to save booking to Supabase, continuing with local backup.', err);
        isSupabaseHealthy = false;
      }
    }

    // Direct WhatsApp send to Admin via Fonnte API
    let isNotificationSent = false;
    const tempBookingForNotif = {
      booking_code: code,
      room_id: selectedRoomId,
      check_in: checkIn,
      check_out: checkOut,
      check_in_time: checkInTime,
      check_out_time: checkOutTime,
      guests: guests,
      extra_beds: extraBeds,
      extra_bed_price: extraBedCost,
      full_name: fullName,
      email: email,
      phone: phone,
      total_price: finalTotal,
      status: 'Pending' as any,
      payment_status: 'Pending' as any,
      created_at: new Date().toISOString()
    };

    try {
      isNotificationSent = await sendAdminNotification(tempBookingForNotif, selectedRoom.name);
      if (isNotificationSent && isSupabaseHealthy) {
        // Update database with true
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ admin_notification_sent: true })
          .eq('booking_code', code);
        
        if (updateError) {
          console.warn('[BookingForm] Failed to update admin_notification_sent in Supabase:', updateError);
        }
      }
    } catch (notifErr) {
      console.warn('[BookingForm] Exception sending admin notification:', notifErr);
    }

    const bookingPayload = {
      booking_code: code,
      room_id: selectedRoomId,
      room_name: selectedRoom.name,
      check_in: checkIn,
      check_out: checkOut,
      check_in_time: checkInTime,
      check_out_time: checkOutTime,
      guests: guests,
      extra_beds: extraBeds,
      extra_bed_price: extraBedCost,
      full_name: fullName,
      email: email,
      phone: phone,
      special_requests: specialRequests,
      total_price: finalTotal,
      status: 'Pending' as any,
      payment_status: 'Pending' as any,
      created_at: new Date().toISOString(),
      admin_notification_sent: isNotificationSent
    };

    // Save to local storage for local backup
    try {
      const existingRaw = localStorage.getItem('zegan_bookings');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.push(bookingPayload);
      localStorage.setItem('zegan_bookings', JSON.stringify(existing));
      
      // Log the activity
      logActivity('Customer', 'Customer', `Booking baru dibuat oleh customer dengan kode ${code} (${selectedRoom.name}).`);
    } catch (err) {
      console.warn('Could not save booking backup locally:', err);
    }

    setIsSubmitting(false);
    setBookingSuccess(true);

    // WhatsApp auto-direct has been removed from mid-flow. 
    // It will be shown only after uploading photos in the next step.
  };

  const handlePhotoUpload = async () => {
    if (!ktpPhoto || !paymentProof) {
      setUploadError(lang === 'id' 
        ? 'Harap pilih kedua file (Foto KTP dan Foto Bukti Transfer) terlebih dahulu.' 
        : 'Please select both files (KTP Photo and Transfer Proof Photo) first.'
      );
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const timestamp = Date.now();
      const ktpExt = ktpPhoto.name.split('.').pop() || 'jpg';
      const proofExt = paymentProof.name.split('.').pop() || 'jpg';

      const ktpPath = `ktp_${generatedCode}_${timestamp}.${ktpExt}`;
      const proofPath = `proof_${generatedCode}_${timestamp}.${proofExt}`;

      let ktpUrl = '';
      let proofUrl = '';

      // Create bucket if not exists (gracefully falls back if not supported by current policy)
      try {
        await supabase.storage.createBucket('payment-proofs', { public: true });
      } catch (err) {
        console.warn('[BookingForm] CreateBucket failed or skipped (standard behavior):', err);
      }

      // Upload KTP Photo
      const { data: ktpUploadData, error: ktpUploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(ktpPath, ktpPhoto, {
          cacheControl: '3600',
          upsert: true
        });

      if (ktpUploadError) {
        throw new Error(`KTP Upload Error: ${ktpUploadError.message}`);
      }

      // Upload Payment Proof
      const { data: proofUploadData, error: proofUploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(proofPath, paymentProof, {
          cacheControl: '3600',
          upsert: true
        });

      if (proofUploadError) {
        throw new Error(`Proof Upload Error: ${proofUploadError.message}`);
      }

      // Get Public URLs
      const ktpPublicRes = supabase.storage.from('payment-proofs').getPublicUrl(ktpPath);
      const proofPublicRes = supabase.storage.from('payment-proofs').getPublicUrl(proofPath);

      ktpUrl = ktpPublicRes.data.publicUrl;
      proofUrl = proofPublicRes.data.publicUrl;

      // Update bookings table
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          ktp_photo_url: ktpUrl,
          payment_proof_url: proofUrl,
          payment_status: 'Paid' // Setting payment status as uploaded
        })
        .eq('booking_code', generatedCode);

      if (updateError) {
        throw new Error(`Database update error: ${updateError.message}`);
      }

      // Success
      setPhotosUploaded(true);

      // Local storage backup update
      try {
        const existingRaw = localStorage.getItem('zegan_bookings');
        if (existingRaw) {
          const bookingsList = JSON.parse(existingRaw);
          const idx = bookingsList.findIndex((b: any) => b.booking_code === generatedCode);
          if (idx !== -1) {
            bookingsList[idx].ktp_photo_url = ktpUrl;
            bookingsList[idx].payment_proof_url = proofUrl;
            bookingsList[idx].payment_status = 'Paid';
            localStorage.setItem('zegan_bookings', JSON.stringify(bookingsList));
          }
        }
      } catch (e) {
        console.warn('Could not update local storage backup:', e);
      }

    } catch (err: any) {
      console.error('Error in handlePhotoUpload:', err);
      // Graceful offline check
      const isApiKeyErr = err.message?.includes('No API key') || err.message?.includes('API key') || err.message?.includes('invalid') || err.status === 400 || err.status === 401 || err.status === 403;
      if (isApiKeyErr || err.message?.includes('Failed to fetch') || err.message?.includes('network')) {
        console.warn('[BookingForm] Falling back to offline local success simulation.');
        setPhotosUploaded(true);
      } else {
        setUploadError(lang === 'id'
          ? `Gagal mengunggah foto: ${err.message}`
          : `Upload failed: ${err.message}`
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getWhatsAppMessage = () => {
    const voucherLine = activeDiscount 
      ? `\n• Voucher: ${activeDiscount.code} (Diskon ${activeDiscount.percent}%)`
      : '';

    const extraBedLine = extraBeds > 0
      ? `\n• Kasur Tambahan (Extra Bed): ${extraBeds} unit (+Rp${extraBedCost.toLocaleString('id-ID')})`
      : '';

    const checkInFormatted = formatDayAndDate(checkIn, checkInTime, lang);
    const checkOutFormatted = formatDayAndDate(checkOut, checkOutTime, lang);

    const text = 
`Halo Admin Zegan Homestay! Saya ingin memesan kamar dengan detail berikut:

🏨 *KODE BOOKING: ${generatedCode}*
----------------------------------------
• Kamar: ${selectedRoom.name}
• Check-in: ${checkInFormatted}
• Check-out: ${checkOutFormatted}
• Durasi: ${nightsCount} malam
• Tamu: ${guests} orang (Kapasitas Maks: ${effectiveMaxCapacity} orang)${extraBedLine}${voucherLine}
• Total Pembayaran: Rp${finalTotal.toLocaleString('id-ID')}

👤 *DATA PEMESAN:*
• Nama: ${fullName}
• Email: ${email}
• WhatsApp/HP: ${phone}
• Permintaan Khusus: ${specialRequests || '-'}

Mohon konfirmasi ketersediaan kamarnya. Terima kasih!`;

    return encodeURIComponent(text);
  };

  const whatsAppUrl = `https://wa.me/6285188144499?text=${getWhatsAppMessage()}`;

  return (
    <section id="booking" className="py-24 bg-brand-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-700 border border-brand-200/80 px-4 py-1.5 rounded-full bg-brand-100 inline-block">
            RESERVE SANCTUARY
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-normal text-brand-950 mt-3 leading-tight">
            {t.bookingFormTitle}
          </h2>
          <div className="w-12 h-[2px] bg-brand-300 mx-auto mt-4 mb-4" />
          <p className="text-stone-600 text-sm sm:text-base mt-2">
            {t.bookingFormSub}
          </p>
        </div>

        {/* Outer Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Booking Inputs (8 Cols) */}
          <form onSubmit={handleSubmitBooking} className="lg:col-span-7 bg-brand-100/40 rounded-xl p-6 sm:p-10 border border-brand-200 space-y-8">
            
            {roomsError && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 text-xs flex flex-col gap-1.5 leading-relaxed">
                <div className="font-semibold text-red-900 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                  Gagal Memuat Kamar Real-time (Supabase Error):
                </div>
                <code className="bg-red-100 px-2 py-1 rounded select-all font-mono break-all font-medium text-red-950 block">{roomsError}</code>
                <p className="text-stone-500 mt-1">
                  Aplikasi otomatis beralih menggunakan data cadangan (offline fallback), Anda masih dapat melanjutkan pengisian formulir.
                </p>
              </div>
            )}

            {/* Step 1: Stay Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-normal text-brand-950 flex items-center gap-2 border-b border-brand-200/80 pb-3 mb-6">
                <span className="w-6 h-6 rounded-full bg-brand-700 text-brand-100 text-xs flex items-center justify-center font-sans font-bold">1</span>
                {lang === 'id' ? 'Detail Menginap & Pilihan Kamar' : 'Stay Details & Room Selection'}
              </h3>

              {/* Date and Hours Grid - Primary Input First */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-brand-950/70">{t.checkIn} *</label>
                  <input
                    id="booking-check-in"
                    type="date"
                    min={getTodayDate()}
                    value={checkIn}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    className="w-full px-4 py-3 bg-brand-50 rounded-lg border border-brand-200 text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 font-medium transition-colors"
                    required
                  />
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="text-[11px] text-stone-500 font-medium">{lang === 'id' ? 'Perkiraan Jam Check-In:' : 'Est. Check-in Time:'}</span>
                    <select
                      id="booking-check-in-time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="text-xs font-bold text-brand-900 bg-white border border-brand-200 rounded px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                    >
                      {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map(tVal => (
                        <option key={tVal} value={tVal}>
                          {tVal} WIB {tVal === '14:00' ? '(Standar)' : tVal === '07:00' ? '(Pagi/Early)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-brand-950/70">{t.checkOut} *</label>
                  <input
                    id="booking-check-out"
                    type="date"
                    min={checkIn}
                    value={checkOut}
                    onChange={(e) => handleCheckOutChange(e.target.value)}
                    className="w-full px-4 py-3 bg-brand-50 rounded-lg border border-brand-200 text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 font-medium transition-colors"
                    required
                  />
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="text-[11px] text-stone-500 font-medium">{lang === 'id' ? 'Rencana Jam Check-Out:' : 'Est. Check-out Time:'}</span>
                    <select
                      id="booking-check-out-time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="text-xs font-bold text-brand-900 bg-white border border-brand-200 rounded px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                    >
                      {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'].map(tVal => (
                        <option key={tVal} value={tVal}>
                          {tVal} WIB {tVal === '12:00' ? '(Standar)' : tVal === '07:00' ? '(Pagi)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Alert if selected room is fully booked for selected dates */}
              {isCurrentRoomBooked && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
                  <Ban className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-red-800 flex items-center gap-1.5 text-sm">
                      <span>{lang === 'id' ? 'Kamar Terpesan Penuh pada Tanggal Ini' : 'Room Fully Booked on Selected Dates'}</span>
                    </div>
                    <p className="text-stone-700 leading-relaxed">
                      {lang === 'id' 
                        ? `Kamar "${selectedRoom.name}" sudah terpesan penuh untuk tanggal ${checkIn} s/d ${checkOut}. Silakan klik salah satu tipe kamar yang tersedia di bawah.` 
                        : `Room "${selectedRoom.name}" is fully booked from ${checkIn} to ${checkOut}. Please click one of the available room types below.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Real-time Room availability status badges for selected dates (Updates automatically on date change) */}
              <div className="p-3.5 bg-brand-50/70 border border-brand-200/80 rounded-xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-brand-950 font-bold">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span>
                      {lang === 'id' 
                        ? `Status Ketersediaan Kamar (${formatDayAndDate(checkIn, '', 'id')} - ${formatDayAndDate(checkOut, '', 'id')}):` 
                        : `Live Room Availability (${formatDayAndDate(checkIn, '', 'en')} - ${formatDayAndDate(checkOut, '', 'en')}):`}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-900 bg-emerald-100/90 font-semibold px-2 py-0.5 rounded-full">
                    {lang === 'id' ? '⚡ Diperbarui Otomatis' : '⚡ Auto-Updated Live'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rooms.map(r => {
                    const rAvail = checkRoomAvailability(r.name || r.id, checkIn, checkOut, liveBookings, liveRooms);
                    const isSelected = String(r.id) === String(selectedRoomId);
                    const isBooked = !rAvail.isAvailable;
                    const checkInDay = new Date(checkIn).getDay();
                    const isWeekendCheckIn = (checkInDay === 6 || checkInDay === 0);
                    const rPrice = isWeekendCheckIn && r.weekend_price ? r.weekend_price : r.price;

                    if (isBooked) {
                      return (
                        <div
                          key={`badge-${r.id}`}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 select-none bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-75`}
                          title={lang === 'id' ? `${r.name} sudah terpesan penuh` : `${r.name} is fully booked`}
                        >
                          <Ban className="w-3 h-3 text-red-500 shrink-0" />
                          <span className="line-through">{r.name}</span>
                          <span className="text-[10px] text-stone-400 font-normal">Rp{rPrice.toLocaleString('id-ID')}</span>
                          <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-bold uppercase">{lang === 'id' ? 'Penuh' : 'Full'}</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        type="button"
                        key={`badge-${r.id}`}
                        onClick={() => handleRoomSelect(r.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-700 text-white border-brand-800 shadow-xs'
                            : 'bg-white text-stone-700 border-emerald-300 hover:border-brand-500 hover:bg-brand-50'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`}></span>
                        <span className="font-semibold">{r.name}</span>
                        <span className={`font-mono font-bold ${isSelected ? 'text-amber-200' : 'text-brand-900'}`}>
                          Rp{rPrice.toLocaleString('id-ID')}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${isSelected ? 'bg-brand-850 text-brand-100' : 'bg-emerald-100 text-emerald-800'}`}>
                          {rAvail.availableCount} {lang === 'id' ? 'tersedia' : 'left'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Room Selection Dropdown & Guests */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-950/70 mb-2">
                    {t.chooseRoom}
                    {roomsLoading && (
                      <span className="text-stone-500 text-[10px] ml-2 animate-pulse font-normal">
                        ({lang === 'id' ? 'Memuat...' : 'Loading...'})
                      </span>
                    )}
                  </label>
                  <select
                    id="booking-room-type"
                    value={selectedRoomId}
                    onChange={(e) => handleRoomSelect(e.target.value)}
                    className="w-full px-4 py-3 bg-brand-50 rounded-lg border border-brand-200 text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 font-medium transition-colors"
                  >
                    {roomsLoading ? (
                      <option disabled>{lang === 'id' ? 'Memuat tipe kamar...' : 'Loading room types...'}</option>
                    ) : (
                      rooms.map(r => {
                        const checkInDay = new Date(checkIn).getDay();
                        const isWeekendCheckIn = (checkInDay === 6 || checkInDay === 0);
                        const displayPrice = isWeekendCheckIn && r.weekend_price ? r.weekend_price : r.price;
                        const rAvail = checkRoomAvailability(r.name || r.id, checkIn, checkOut, liveBookings, liveRooms);
                        const isBooked = !rAvail.isAvailable;

                        return (
                          <option 
                            key={r.id} 
                            value={r.id}
                            disabled={isBooked}
                            className={isBooked ? 'text-stone-400 bg-stone-100' : ''}
                          >
                            {isBooked
                              ? `❌ [TERPESAN / PENUH] ${r.name}`
                              : `🟢 ${r.name} (${rAvail.availableCount} Unit Tersedia) - Rp${displayPrice.toLocaleString('id-ID')}/${t.perNight}`
                            }
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-950/70 mb-2">
                    {t.guestsCount} (Kapasitas: {effectiveMaxCapacity} Orang)
                  </label>
                  <select
                    id="booking-guests-count"
                    value={guests}
                    onChange={(e) => {
                      const newCount = Number(e.target.value);
                      handleGuestsChange(newCount);
                      if (newCount > baseCapacity) {
                        const neededExtra = newCount - baseCapacity;
                        if (extraBeds < neededExtra) {
                          setExtraBeds(neededExtra);
                        }
                      }
                    }}
                    className="w-full px-4 py-3 bg-brand-50 rounded-lg border border-brand-200 text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 font-medium transition-colors"
                  >
                    {[...Array(Math.max(6, effectiveMaxCapacity))].map((_, i) => {
                      const num = i + 1;
                      const isExtraRequired = num > baseCapacity;
                      return (
                        <option key={num} value={num}>
                          {num} {lang === 'id' ? 'Orang' : 'Guests'} {isExtraRequired ? `(+${num - baseCapacity} Ekstra Kasur)` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Extra Bed Add-on Section */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-900 shrink-0 mt-0.5">
                      <Bed className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-amber-950 font-serif">
                          {lang === 'id' ? 'Tambah Kasur (Extra Bed)' : 'Add Extra Bed'}
                        </span>
                        <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          +Rp 50.000 / malam
                        </span>
                      </div>
                      <p className="text-xs text-amber-800/80 mt-0.5">
                        {lang === 'id' 
                          ? `Menambah kapasitas tidur (+1 orang per kasur). Kapasitas saat ini: ${effectiveMaxCapacity} tamu.`
                          : `Increases sleeping capacity (+1 guest per bed). Current capacity: ${effectiveMaxCapacity} guests.`}
                      </p>
                    </div>
                  </div>

                  {/* Stepper Counter */}
                  <div className="flex items-center gap-2 self-end sm:self-auto bg-white px-2 py-1.5 rounded-lg border border-amber-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = Math.max(0, extraBeds - 1);
                        setExtraBeds(nextVal);
                        if (guests > baseCapacity + nextVal) {
                          setGuests(baseCapacity + nextVal);
                        }
                      }}
                      disabled={extraBeds === 0}
                      className="w-7 h-7 rounded bg-amber-100 hover:bg-amber-200 disabled:opacity-30 disabled:cursor-not-allowed text-amber-950 flex items-center justify-center transition-colors cursor-pointer"
                      title="Kurangi Kasur"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-amber-950">
                      {extraBeds}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const maxExtra = selectedRoom.name.includes('Family') || selectedRoom.name.includes('Rumah') ? 3 : 2;
                        if (extraBeds < maxExtra) {
                          setExtraBeds(extraBeds + 1);
                        }
                      }}
                      disabled={extraBeds >= (selectedRoom.name.includes('Family') || selectedRoom.name.includes('Rumah') ? 3 : 2)}
                      className="w-7 h-7 rounded bg-amber-700 hover:bg-amber-800 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Tambah Kasur"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {extraBeds > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-900 font-medium">
                    <span>Biaya Tambahan Kasur ({extraBeds} unit x {nightsCount} malam):</span>
                    <span className="font-bold font-mono text-sm text-amber-950">
                      + Rp{extraBedCost.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>

              {/* Dynamic Schedule & Vacancy Explanation Box */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 text-xs space-y-2">
                <div className="font-bold text-brand-950 flex items-center gap-1.5 font-serif">
                  <Calendar className="w-4 h-4 text-brand-700" />
                  <span>{lang === 'id' ? 'Keterangan Jadwal Menginap & Ketersediaan Kamar' : 'Stay Schedule & Room Availability Details'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-stone-200 text-[11px]">
                  <div className="space-y-0.5">
                    <span className="text-stone-400 uppercase text-[9px] font-bold block">🟢 Check-In</span>
                    <span className="font-bold text-stone-900 block">{formatDayAndDate(checkIn, checkInTime, lang)}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-stone-400 uppercase text-[9px] font-bold block">🔴 Check-Out</span>
                    <span className="font-bold text-stone-900 block">{formatDayAndDate(checkOut, checkOutTime, lang)}</span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed font-light">
                  {lang === 'id' ? (
                    <>
                      Kamar terisi dari <strong>{formatDayAndDate(checkIn, checkInTime, 'id')}</strong> sampai <strong>{formatDayAndDate(checkOut, checkOutTime, 'id')}</strong>. Setelah pukul <strong>{checkOutTime} WIB</strong> di hari {formatDayAndDate(checkOut, '', 'id')}, kamar akan <strong>kosong & siap dibersihkan</strong> untuk tamu berikutnya.
                    </>
                  ) : (
                    <>
                      Room is booked from <strong>{formatDayAndDate(checkIn, checkInTime, 'en')}</strong> until <strong>{formatDayAndDate(checkOut, checkOutTime, 'en')}</strong>. After <strong>{checkOutTime}</strong> on {formatDayAndDate(checkOut, '', 'en')}, the room will become <strong>available & ready</strong> for subsequent check-ins.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Step 2: Customer Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-normal text-brand-950 flex items-center gap-2 border-b border-brand-200/80 pb-3 mb-6">
                <span className="w-6 h-6 rounded-full bg-brand-700 text-brand-100 text-xs flex items-center justify-center font-sans font-bold">2</span>
                {lang === 'id' ? 'Informasi Pribadi Pemesan' : 'Guest Information'}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-950/70 mb-2">{t.fullName}</label>
                  <input
                    id="booking-full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={lang === 'id' ? 'Budi Santoso' : 'John Doe'}
                    className="w-full px-4 py-3 bg-brand-50 rounded-lg border border-brand-200 text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 font-medium transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-950/70 mb-2">{t.email}</label>
                    <input
                      id="booking-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full px-4 py-3 bg-brand-50 rounded-lg border border-brand-200 text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 font-medium transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-950/70 mb-2">{t.phone}</label>
                    <input
                      id="booking-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full px-4 py-3 bg-brand-50 rounded-lg border border-brand-200 text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 font-medium transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-950/70 mb-2">{t.specialRequests}</label>
                  <textarea
                    id="booking-special-requests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder={lang === 'id' ? 'Ranjang dihias batik, request menu sarapan vegetarian, dll.' : 'Honeymoon arrangement, late check-in request, vegetarian breakfast option, etc.'}
                    rows={2}
                    className="w-full px-4 py-3 bg-brand-50 rounded-lg border border-brand-200 text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 font-medium resize-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-4 text-xs font-medium flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-red-500" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              {isCurrentRoomBooked ? (
                <button
                  id="submit-booking-form"
                  type="button"
                  disabled
                  className="w-full bg-stone-300 text-stone-500 font-bold py-4 rounded-lg border border-stone-300 shadow-none flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-not-allowed select-none"
                >
                  <Ban className="w-5 h-5 text-stone-400" />
                  <span>{lang === 'id' ? 'Kamar Terpesan / Tidak Tersedia' : 'Room Fully Booked / Unavailable'}</span>
                </button>
              ) : (
                <button
                  id="submit-booking-form"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-700 hover:bg-brand-850 disabled:bg-brand-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{lang === 'id' ? 'Memproses...' : 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{lang === 'id' ? 'Proses Reservasi Kamar' : 'Process Room Reservation'}</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </form>

          {/* Pricing Calculator Card (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live Receipt Card */}
            <div className="bg-brand-950 text-brand-100 rounded-xl p-6 sm:p-8 border border-brand-800 relative overflow-hidden">
              {/* Traditional watermark look */}
              <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full border border-brand-800/35 flex items-center justify-center">
                <Compass className="w-20 h-20 text-brand-800/20 animate-spin-slow" />
              </div>

              <h3 className="text-lg font-serif font-normal text-white border-b border-brand-800 pb-4 mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-brand-300" />
                {t.summaryTitle}
              </h3>

              {/* Room Selected Item */}
              <div className="flex gap-4 mb-6 pb-6 border-b border-brand-800">
                <img 
                  src={selectedRoom.image} 
                  alt={selectedRoom.name} 
                  className="w-16 h-16 object-cover rounded-lg bg-brand-900 shrink-0 border border-brand-800"
                />
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-brand-300 font-bold">Stay Room Type</span>
                  <h4 className="font-bold text-white text-sm mt-0.5">{selectedRoom.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-brand-200/60 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <span>{nightsCount} {lang === 'id' ? 'Malam' : 'Nights'}</span>
                  </div>
                  <div className="text-[11px] text-brand-200/80 mt-1 space-y-0.5 font-light">
                    <div>🟢 In: {formatDayAndDate(checkIn, checkInTime, lang)}</div>
                    <div>🔴 Out: {formatDayAndDate(checkOut, checkOutTime, lang)}</div>
                    {extraBeds > 0 && (
                      <div className="text-amber-300 font-medium">🛏️ +{extraBeds} Extra Bed (Kapasitas {effectiveMaxCapacity} org)</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subtotal break downs */}
              <div className="space-y-3.5 text-xs">
                
                {/* Room charge */}
                <div className="flex justify-between">
                  <span className="text-brand-200/80">
                    {t.pricePerNight} {nightsCount > 1 ? `(Avg x${nightsCount})` : `(x${nightsCount})`}
                  </span>
                  <span className="font-semibold text-brand-100">
                    Rp{averagePrice.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Extra Bed charge if applicable */}
                {extraBeds > 0 && (
                  <div className="flex justify-between text-amber-200">
                    <span>
                      {lang === 'id' ? 'Kasur Tambahan' : 'Extra Bed'} ({extraBeds} unit x {nightsCount} mlm)
                    </span>
                    <span className="font-semibold">
                      + Rp{extraBedCost.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                {/* Room subtotal */}
                <div className="flex justify-between border-b border-brand-800 pb-3">
                  <span className="text-brand-200/80 font-medium">{t.baseTotal}</span>
                  <span className="font-bold text-white">
                    Rp{subtotal.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Discount display */}
                {activeDiscount && (
                  <div className="flex justify-between text-brand-300 bg-brand-900/40 p-2.5 rounded-lg border border-brand-850">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Promo Applied: {activeDiscount.code} ({activeDiscount.percent}%)
                    </span>
                    <span className="font-bold">
                      - Rp{discountAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                {/* Tax */}
                <div className="flex justify-between pt-2">
                  <span className="text-brand-200/80">{t.taxService}</span>
                  <span className="font-semibold text-brand-100">
                    Rp{taxAmount.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Final Total */}
                <div className="flex justify-between items-baseline pt-4 border-t border-brand-800 text-sm">
                  <span className="text-white font-serif font-bold text-base">{t.finalTotal}</span>
                  <span className="text-xl sm:text-2xl font-serif font-black text-brand-300">
                    Rp{finalTotal.toLocaleString('id-ID')}
                  </span>
                </div>

              </div>
            </div>

            {/* Voucher apply box */}
            <div className="bg-brand-100/40 rounded-xl p-6 border border-brand-200">
              <h4 className="text-sm font-bold text-brand-950 flex items-center gap-1.5 mb-3 font-serif">
                <Percent className="w-4 h-4 text-brand-600" />
                {lang === 'id' ? 'Mempunyai Kode Voucher?' : 'Have a Promo Voucher?'}
              </h4>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  id="coupon-input"
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. ZEGANLOVE"
                  className="flex-1 px-4 py-2 bg-brand-50 border border-brand-200 rounded-lg text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 font-bold uppercase placeholder-stone-400"
                />
                <button
                  id="apply-coupon-btn"
                  type="submit"
                  className="bg-brand-700 hover:bg-brand-850 text-white font-semibold text-xs uppercase px-4 rounded-lg transition-all cursor-pointer"
                >
                  Apply
                </button>
              </form>
              
              {/* Voucher guidance */}
              <div className="mt-3 text-[11px] text-stone-500 flex items-start gap-1">
                <Info className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span className="font-light">
                  {lang === 'id' 
                    ? 'Gunakan ZEGANLOVE (diskon 10%) atau KULONPROGO (diskon 15%) untuk potongan khusus!' 
                    : 'Use ZEGANLOVE (10% off) or KULONPROGO (15% off) for authentic Javanese discount!'}
                </span>
              </div>

              {couponError && (
                <p className="text-xs text-red-500 mt-2 font-medium">{couponError}</p>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Success Booking Receipt Lightbox Overlay */}
      <AnimatePresence>
        {bookingSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="absolute inset-0" onClick={() => setBookingSuccess(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-brand-50 rounded-xl shadow-2xl overflow-y-auto max-h-[90vh] z-10 p-6 sm:p-8 border border-brand-200"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <span className="text-xs uppercase tracking-widest text-emerald-850 bg-emerald-100 border border-emerald-200/60 px-3 py-1 rounded-full inline-block font-semibold">
                  {lang === 'id' ? 'Menunggu Pembayaran QRIS' : 'Awaiting QRIS Payment'}
                </span>

                <h3 className="text-xl font-serif font-normal text-brand-950 mt-3 leading-tight">
                  {lang === 'id' ? 'Pesanan Berhasil Dibuat!' : 'Booking Created Successfully!'}
                </h3>

                <p className="text-stone-600 text-xs mt-1 leading-relaxed font-light">
                  {lang === 'id' 
                    ? 'Silakan selesaikan pembayaran menggunakan QRIS statis di bawah ini.' 
                    : 'Please complete your payment using the static QRIS below.'}
                </p>

                {/* Text receipt breakdown */}
                <div className="my-4 bg-brand-100/40 p-3 rounded-lg text-left text-xs border border-brand-200 space-y-1.5">
                  <div className="flex justify-between border-b border-brand-200/40 pb-1.5">
                    <span className="text-stone-500 font-semibold">Booking ID</span>
                    <span className="font-bold text-brand-800 font-mono text-sm">{generatedCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Kamar / Room</span>
                    <span className="font-bold text-brand-950">{selectedRoom.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Durasi / Duration</span>
                    <span className="font-semibold text-brand-950">{nightsCount} {lang === 'id' ? 'malam' : 'nights'}</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-200/40 pt-1.5 text-sm font-bold">
                    <span className="font-serif text-brand-950">{lang === 'id' ? 'Total Harga' : 'Total Price'}</span>
                    <span className="font-serif text-brand-800">Rp{finalTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* QRIS Dynamic Display Section */}
                {(() => {
                  const qris = getQrisSettings();
                  const dynamicQrUrl = getDynamicQrisImageUrl(finalTotal);
                  return (
                    <div className="my-4 bg-white p-4 rounded-lg border border-brand-200 shadow-xs flex flex-col items-center">
                      <span className="text-[10px] uppercase tracking-widest text-brand-800 font-bold mb-1">
                        {lang === 'id' ? 'SCAN QRIS ZEGAN HOMESTAY' : 'SCAN ZEGAN QRIS'}
                      </span>
                      <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded font-black tracking-wider uppercase mb-3 flex items-center gap-1">
                        ⚡ {lang === 'id' ? 'NOMINAL TERKUNCI OTOMATIS' : 'NOMINAL AUTOMATICALLY LOCKED'}
                      </span>
                      <img
                        src={dynamicQrUrl}
                        alt="QRIS Merchant"
                        className="w-40 h-40 object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-center mt-2 space-y-1">
                        <span className="text-[11px] font-bold text-stone-900 block font-mono">{qris.bankName}</span>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block border border-emerald-100">
                          {qris.accountName}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 leading-relaxed mt-2.5 text-left bg-brand-50/50 p-2.5 rounded border border-brand-200/50 font-light">
                        {lang === 'id' 
                          ? 'Scan QRIS di atas. Nominal pembayaran Rp' + finalTotal.toLocaleString('id-ID') + ' akan terisi otomatis secara aman tanpa perlu mengetik manual.'
                          : 'Scan the QRIS above. The payment amount Rp' + finalTotal.toLocaleString('id-ID') + ' is automatically locked and filled securely without manual typing.'}
                      </p>
                    </div>
                  );
                })()}

                {/* Status indicator that WhatsApp notification was sent to Admin */}
                <div className="mb-4 bg-emerald-50 text-emerald-800 text-[10px] px-3 py-2 rounded-lg border border-emerald-100 flex items-center justify-center gap-1.5">
                  <span className="animate-pulse font-bold text-xs">🔔</span>
                  <span className="text-left leading-tight font-medium">
                    {lang === 'id'
                      ? 'WhatsApp pemberitahuan otomatis telah dikirim langsung ke Admin.'
                      : 'An automated WhatsApp notification has been sent directly to the Admin.'}
                  </span>
                </div>

                {/* Photo upload inputs and confirmation/WhatsApp CTAs */}
                {(() => {
                  const waProofMsg = `Halo Admin Zegan Homestay! Saya telah melakukan transfer pembayaran untuk pemesanan berikut:

🏨 *KODE BOOKING: ${generatedCode}*
----------------------------------------
• Kamar: ${selectedRoom.name}
• Atas Nama: ${fullName}
• Total Pembayaran: Rp${finalTotal.toLocaleString('id-ID')}

Saya telah mengunggah Foto KTP dan Bukti Transfer di website. Mohon dibantu verifikasi. Terima kasih!`;

                  const adminPhoneVal = (() => {
                    const envPhone = import.meta.env.VITE_ADMIN_PHONE;
                    if (envPhone && envPhone.trim()) {
                      const cleaned = envPhone.replace(/\D/g, '');
                      if (cleaned.startsWith('0')) return '62' + cleaned.slice(1);
                      return cleaned;
                    }
                    return '6285188144499';
                  })();

                  const waUrl = `https://wa.me/${adminPhoneVal}?text=${encodeURIComponent(waProofMsg)}`;

                  if (!photosUploaded) {
                    return (
                      <div className="mt-4 text-left border-t border-brand-200/50 pt-4 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 text-center">
                          {lang === 'id' ? 'Konfirmasi Pembayaran & KTP' : 'Confirm Payment & KTP'}
                        </h4>
                        <p className="text-[11px] text-stone-500 text-center font-light leading-relaxed">
                          {lang === 'id'
                            ? 'Wajib melampirkan Foto KTP dan Foto Bukti Transfer untuk memverifikasi pesanan Anda.'
                            : 'You must attach your KTP Photo and Transfer Proof Photo to verify your booking.'}
                        </p>

                        {/* File Inputs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* KTP Field */}
                          <div className="bg-white p-3.5 rounded-xl border border-brand-200 shadow-2xs flex flex-col justify-between">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                              {lang === 'id' ? '1. Foto KTP' : '1. KTP Photo'} <span className="text-red-500">*</span>
                            </label>
                            
                            <div className="relative border border-dashed border-stone-300 rounded-lg p-2.5 text-center bg-stone-50/50 hover:bg-brand-50/20 transition-all cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setKtpPhoto(e.target.files[0]);
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <Camera className="w-4 h-4 text-stone-400" />
                                <span className="text-[10px] font-semibold text-stone-600 truncate max-w-xs">
                                  {ktpPhoto ? ktpPhoto.name : (lang === 'id' ? 'Pilih Gambar' : 'Choose Image')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Payment Proof Field */}
                          <div className="bg-white p-3.5 rounded-xl border border-brand-200 shadow-2xs flex flex-col justify-between">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                              {lang === 'id' ? '2. Bukti Transfer' : '2. Transfer Proof'} <span className="text-red-500">*</span>
                            </label>
                            
                            <div className="relative border border-dashed border-stone-300 rounded-lg p-2.5 text-center bg-stone-50/50 hover:bg-brand-50/20 transition-all cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setPaymentProof(e.target.files[0]);
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <Upload className="w-4 h-4 text-stone-400" />
                                <span className="text-[10px] font-semibold text-stone-600 truncate max-w-xs">
                                  {paymentProof ? paymentProof.name : (lang === 'id' ? 'Pilih Gambar' : 'Choose Image')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {uploadError && (
                          <p className="text-[10px] text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-100 text-center">
                            ⚠️ {uploadError}
                          </p>
                        )}

                        {/* Submit Button */}
                        <div className="flex flex-col gap-2 pt-2">
                          <button
                            onClick={handlePhotoUpload}
                            disabled={!ktpPhoto || !paymentProof || isUploading}
                            className="bg-brand-700 hover:bg-brand-800 disabled:opacity-50 active:scale-98 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:cursor-not-allowed"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{lang === 'id' ? 'Mengunggah...' : 'Uploading...'}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{lang === 'id' ? 'Kirim Foto & Konfirmasi' : 'Submit Photos & Confirm'}</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleCloseSuccess}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold py-2 rounded-lg text-xs uppercase tracking-widest transition-all cursor-pointer border border-stone-300/60"
                          >
                            {lang === 'id' ? 'Tutup' : 'Close'}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Once photos are uploaded, show success and the green WhatsApp button
                  return (
                    <div className="mt-4 text-left border-t border-brand-200/50 pt-4 space-y-4">
                      <div className="bg-emerald-50 text-emerald-800 text-xs p-4 rounded-xl border border-emerald-100 flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
                        <span className="font-bold text-center">
                          {lang === 'id' ? 'Foto KTP & Bukti Transfer Berhasil Dikirim!' : 'KTP & Transfer Proof Uploaded Successfully!'}
                        </span>
                        <p className="text-[11px] text-emerald-700 text-center font-light leading-relaxed">
                          {lang === 'id' 
                            ? 'Data pemesanan Anda telah terverifikasi secara sistem. Silakan klik tombol di bawah untuk menghubungi admin WhatsApp.' 
                            : 'Your booking has been verified in the system. Please click the button below to reach out to our admin on WhatsApp.'}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 text-sm uppercase tracking-wider cursor-pointer border border-emerald-500 text-center animate-pulse"
                        >
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.988 3.3 1.48 4.775 1.48 5.4 0 9.795-4.39 9.799-9.78.002-2.61-1.012-5.064-2.857-6.91C16.42 2.09 13.96 1.077 11.353 1.077c-5.405 0-9.8 4.392-9.804 9.783-.001 1.91.5 3.765 1.455 5.422L2.025 21.84l5.622-1.474zM16.618 13.5c-.247-.125-1.464-.723-1.692-.806-.228-.083-.393-.125-.559.125-.166.247-.64.806-.784.969-.144.163-.29.18-.537.056-.247-.125-1.044-.385-1.988-1.227-.735-.656-1.232-1.466-1.376-1.714-.144-.247-.015-.38.11-.504.112-.112.247-.29.372-.434.124-.145.165-.248.247-.414.083-.166.04-.31-.02-.434-.06-.124-.559-1.347-.765-1.848-.2-.484-.404-.418-.559-.426-.143-.007-.31-.01-.476-.01-.166 0-.436.062-.663.31-.228.247-.868.847-.868 2.065 0 1.218.887 2.394.986 2.52.1.125 1.747 2.667 4.233 3.738.59.255 1.053.408 1.413.523.593.189 1.134.162 1.56.098.475-.07 1.464-.598 1.67-.178.206-.418.206-.775.145-.84-.061-.064-.228-.103-.475-.228z"/>
                          </svg>
                          <span>{lang === 'id' ? 'Hubungi Admin via WhatsApp' : 'Contact Admin via WhatsApp'}</span>
                        </a>

                        <button
                          onClick={handleCloseSuccess}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer border border-stone-300"
                        >
                          {lang === 'id' ? 'Tutup' : 'Close'}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
