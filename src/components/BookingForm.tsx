import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Users, Coffee, Bike, Car, Sparkles, CheckCircle2, 
  HelpCircle, Receipt, Percent, Tag, MessageSquare, Compass, Info,
  Upload, Camera, Loader2
} from 'lucide-react';
import { Language, Room, AddOn } from '../types';
import { ROOMS, ADD_ONS, TRANSLATIONS } from '../data';
import { supabase } from '../lib/supabase';
import { logActivity, getQrisSettings, getDynamicQrisImageUrl } from '../services/adminService';
import { sendAdminNotification } from '../services/fonnte';

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
  onGoToCustomerPortal?: () => void;
}

export default function BookingForm({ 
  lang, 
  prefilledRoomId, 
  prefilledCheckIn, 
  prefilledCheckOut, 
  prefilledGuests,
  formScrollTrigger,
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

  const getDayAfterTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
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
  const [selectedRoomId, setSelectedRoomId] = useState(prefilledRoomId || 'ekonomi');
  const [checkIn, setCheckIn] = useState(prefilledCheckIn || getTomorrowDate());
  const [checkOut, setCheckOut] = useState(prefilledCheckOut || getDayAfterTomorrowDate());
  const [guests, setGuests] = useState(prefilledGuests || 2);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const selectedAddOns: string[] = [];
  
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
        const { data, error } = await supabase
          .from('room_types')
          .select('id, name, description, weekday_price, weekend_price, max_guest');

        if (error) {
          throw error;
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
        console.error('Error loading room types from Supabase:', err);
        setRoomsError(err?.message || String(err));
        // Fallback initialized in useState already
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

  const selectedRoom = rooms.find(r => String(r.id) === String(selectedRoomId)) || rooms[0] || ROOMS[0];

  // Date math
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
  const nightsCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  // Pricing math
  const roomCost = calculateRoomCost(selectedRoom, checkIn, checkOut);
  const averagePrice = nightsCount > 0 ? Math.round(roomCost / nightsCount) : (selectedRoom ? selectedRoom.price : 0);

  const subtotal = roomCost;

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

    // 0. Check bookings conflict (offline localStorage & online Supabase sync)
    try {
      // Fetch local storage bookings
      const existingRaw = localStorage.getItem('zegan_bookings');
      let mergedBookings = existingRaw ? JSON.parse(existingRaw) : [];

      // Try to fetch latest bookings from Supabase to prevent double booking
      try {
        const { data: dbBookings, error: dbBookingsErr } = await supabase
          .from('bookings')
          .select('booking_code, room_id, check_in, check_out, booking_status');

        if (!dbBookingsErr && dbBookings) {
          const formattedDbBookings = dbBookings.map((b: any) => ({
            booking_code: b.booking_code,
            room_id: b.room_id,
            check_in: b.check_in,
            check_out: b.check_out,
            status: b.booking_status
          }));
          
          // Merge unique bookings by booking_code
          const localCodes = new Set(mergedBookings.map((b: any) => b.booking_code));
          formattedDbBookings.forEach((dbB: any) => {
            if (!localCodes.has(dbB.booking_code)) {
              mergedBookings.push(dbB);
            }
          });
        }
      } catch (e) {
        console.warn('[BookingForm] Failed to fetch remote bookings for conflict check, relying on local storage.', e);
      }

      // 1. Map physical rooms
      const pRooms = [
        { number: '1', type: 'utama', id: '6382483d-4498-4485-b9f5-da418b7c24f5' },
        { number: '2', type: 'utama', id: '7793c710-ba72-4866-b59c-20aee507a5c9' },
        { number: '3', type: 'pratama', id: 'cda230a5-0c0c-46f5-bd3a-40ed15ec4862' },
        { number: '4', type: 'madya', id: '3dc9da2d-38e4-45e2-bc3d-e68881d50daa' },
        { number: '5', type: 'pratama', id: '06daf026-6833-4bb0-b9fc-608a02f90784' },
        { number: '6', type: 'family', id: 'bc8edfa0-b150-42aa-8874-a7c466fe3602' },
        { number: '7', type: 'ekonomi', id: 'd2471912-9486-483b-b01c-64cb5e6dc148' },
        { number: '8', type: 'ekonomi', id: '951a1d18-1908-4b67-9fd0-f2895f1d4928' },
        { number: 'Rumah-1', type: 'rumah', id: 'd3296e6b-a5c5-4db5-ac9a-81664eb41d36' }
      ];

      // Identify selected room type category
      const normId = String(selectedRoomId).toLowerCase();
      let selectedCategory = '';
      if (normId === 'standard-room-utama' || normId === 'b3daf9eb-8af2-40ff-86a8-e3e94e8149e5') selectedCategory = 'utama';
      else if (normId === 'standard-room' || normId === '573c09f7-546f-452e-9fda-4ebf2d6ab77b') selectedCategory = 'pratama';
      else if (normId === 'standard-room-madya' || normId === '2332632b-0ec0-4906-a6e1-68a518605c09') selectedCategory = 'madya';
      else if (normId === 'family' || normId === '63a30aee-0c4b-49ce-8c5e-7ff4c9077481') selectedCategory = 'family';
      else if (normId === 'ekonomi' || normId === '90ced547-d6b1-4089-9617-8972d45a5ad3') selectedCategory = 'ekonomi';
      else if (normId === 'rumah' || normId === 'e8f31a0b-052a-4b29-8a93-06e8013fa623') selectedCategory = 'rumah';

      if (selectedCategory) {
        // Filter active bookings
        const activeBookings = mergedBookings.filter((b: any) => b.status !== 'Cancelled' && b.status !== 'Expired' && b.booking_status !== 'Cancelled' && b.booking_status !== 'Expired');

        // Check availability day-by-day
        const dates: string[] = [];
        let current = new Date(checkIn);
        const end = new Date(checkOut);
        while (current < end) {
          dates.push(current.toISOString().substring(0, 10));
          current.setDate(current.getDate() + 1);
        }

        let isAvailable = true;
        for (const dStr of dates) {
          const blockedNumbers = new Set<string>();

          activeBookings.forEach((b: any) => {
            const isOverlapping = dStr >= b.check_in && dStr < b.check_out;
            if (!isOverlapping) return;

            const bRoomNum = String(b.room_number || '');
            const bRoomId = String(b.room_id || '');
            const bRoomName = String(b.room_name || '').toLowerCase();

            let bookedNum = '';
            if (bRoomNum) {
              bookedNum = bRoomNum;
            } else {
              const matchedPhys = pRooms.find(pr => pr.id === bRoomId || pr.number === bRoomId);
              if (matchedPhys) {
                bookedNum = matchedPhys.number;
              } else if (bRoomName.includes('rumah')) {
                bookedNum = 'Rumah-1';
              } else if (bRoomName.includes('utama')) {
                blockedNumbers.add('1');
                blockedNumbers.add('2');
              } else if (bRoomName.includes('pratama') || bRoomName.includes('standard room') && !bRoomName.includes('madya') && !bRoomName.includes('utama')) {
                blockedNumbers.add('3');
                blockedNumbers.add('5');
              } else if (bRoomName.includes('madya')) {
                blockedNumbers.add('4');
              } else if (bRoomName.includes('family')) {
                blockedNumbers.add('6');
              } else if (bRoomName.includes('ekonomi') || bRoomName.includes('economy')) {
                blockedNumbers.add('7');
                blockedNumbers.add('8');
              }
            }

            if (bookedNum) {
              blockedNumbers.add(bookedNum);
              // linkages
              if (bookedNum === 'Rumah-1') {
                blockedNumbers.add('3');
                blockedNumbers.add('4');
                blockedNumbers.add('5');
                blockedNumbers.add('6');
              }
              if (['3', '4', '5', '6'].includes(bookedNum)) {
                blockedNumbers.add('Rumah-1');
              }
            }
          });

          const categoryRooms = pRooms.filter(pr => pr.type === selectedCategory);
          const availableInCat = categoryRooms.filter(pr => !blockedNumbers.has(pr.number));

          if (availableInCat.length === 0) {
            isAvailable = false;
            break;
          }
        }

        if (!isAvailable) {
          throw new Error(lang === 'id'
            ? `Maaf, kamar "${selectedRoom.name}" sudah terisi penuh pada tanggal ${checkIn} s/d ${checkOut} karena keterbatasan ketersediaan rumah / kamar terkait.`
            : `Sorry, "${selectedRoom.name}" is fully booked from ${checkIn} to ${checkOut} due to limited availability of the house / related rooms.`
          );
        }
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error checking room availability');
      setIsSubmitting(false);
      return;
    }

    // 1. Find an available physical room first to fail fast
    let roomsData: any[] | null = null;
    let isSupabaseHealthy = true;
    try {
      const { data, error: roomsQueryError } = await supabase
        .from('rooms')
        .select('id, status, occupied_until')
        .eq('room_type_id', selectedRoomId);

      if (roomsQueryError) {
        throw roomsQueryError;
      }

      const now = new Date();
      const availableRooms = (data || []).filter(r => {
        const isOccupiedUntilActive = r.occupied_until && new Date(r.occupied_until) > now;
        if (isOccupiedUntilActive) return false;
        return String(r.status).toLowerCase() === 'available';
      });

      if (availableRooms.length === 0) {
        throw new Error(lang === 'id' 
          ? `Maaf, tidak ada kamar fisik "${selectedRoom.name}" yang tersedia saat ini (semua terisi/penuh).` 
          : `Sorry, there are no physical rooms available for "${selectedRoom.name}" at the moment.`
        );
      }
      roomsData = [availableRooms[0]];
    } catch (err: any) {
      // Graceful fallback if Supabase is unconfigured or returns API key error (e.g. "No API key found in request")
      const isApiKeyErr = err.message?.includes('No API key') || err.message?.includes('API key') || err.message?.includes('invalid') || err.status === 400 || err.status === 401 || err.status === 403;
      if (isApiKeyErr || err.message?.includes('Failed to fetch') || err.message?.includes('network')) {
        console.warn('[BookingForm] Supabase unconfigured or offline. Falling back to local offline mode.', err);
        isSupabaseHealthy = false;
        roomsData = [{ id: `room-${selectedRoomId}-1` }];
      } else {
        setSubmitError(err.message || 'Error checking room availability');
        setIsSubmitting(false);
        return;
      }
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
              room_id: roomsData[0].id,
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
      guests: guests,
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
      console.error('[BookingForm] Exception sending admin notification:', notifErr);
    }

    const bookingPayload = {
      booking_code: code,
      room_id: selectedRoomId,
      room_name: selectedRoom.name,
      check_in: checkIn,
      check_out: checkOut,
      guests: guests,
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
      ? `\n- Voucher: ${activeDiscount.code} (Diskon ${activeDiscount.percent}%)`
      : '';

    const text = 
`Halo Admin Zegan Homestay! Saya ingin memesan kamar dengan detail berikut:

🏨 *KODE BOOKING: ${generatedCode}*
----------------------------------------
• Kamar: ${selectedRoom.name}
• Check-in: ${checkIn}
• Check-out: ${checkOut}
• Durasi: ${nightsCount} malam
• Tamu: ${guests} orang${voucherLine}
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
                {lang === 'id' ? 'Detail Menginap' : 'Stay Details'}
              </h3>

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
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full px-4 py-3 bg-brand-50 rounded-lg border border-brand-200 text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 font-medium transition-colors"
                  >
                    {roomsLoading ? (
                      <option disabled>{lang === 'id' ? 'Memuat tipe kamar...' : 'Loading room types...'}</option>
                    ) : (
                      rooms.map(r => {
                        const checkInDay = new Date(checkIn).getDay();
                        const isWeekendCheckIn = (checkInDay === 6 || checkInDay === 0);
                        const displayPrice = isWeekendCheckIn && r.weekend_price ? r.weekend_price : r.price;
                        return (
                          <option key={r.id} value={r.id}>
                            {r.name} - Rp{displayPrice.toLocaleString('id-ID')}/{t.perNight}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-950/70 mb-2">{t.guestsCount}</label>
                  <select
                    id="booking-guests-count"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-brand-50 rounded-lg border border-brand-200 text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 font-medium transition-colors"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>
                        {num} {lang === 'id' ? 'Orang' : 'Guests'} (Max {selectedRoom.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-950/70 mb-2">{t.checkIn}</label>
                  <input
                    id="booking-check-in"
                    type="date"
                    min={getTodayDate()}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full px-4 py-3 bg-brand-50 rounded-lg border border-brand-200 text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 font-medium transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-950/70 mb-2">{t.checkOut}</label>
                  <input
                    id="booking-check-out"
                    type="date"
                    min={checkIn}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full px-4 py-3 bg-brand-50 rounded-lg border border-brand-200 text-brand-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-600 focus:border-brand-600 font-medium transition-colors"
                    required
                  />
                </div>
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
                    <Calendar className="w-3.5 h-3.5 text-brand-400" />
                    <span>{nightsCount} {lang === 'id' ? 'Malam' : 'Nights'} ({checkIn} - {checkOut})</span>
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

                {/* Room subtotal */}
                <div className="flex justify-between border-b border-brand-800 pb-3">
                  <span className="text-brand-200/80 font-medium">{t.baseTotal}</span>
                  <span className="font-bold text-white">
                    Rp{roomCost.toLocaleString('id-ID')}
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
