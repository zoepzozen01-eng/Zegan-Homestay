import { supabase, supabaseDebugInfo } from './supabase';

export interface PhysicalRoom {
  number: string;
  type: 'utama' | 'pratama' | 'madya' | 'family' | 'ekonomi' | 'rumah';
  id: string;
  name: string;
}

export const PHYSICAL_ROOMS: PhysicalRoom[] = [
  { number: '1', type: 'utama', id: '6382483d-4498-4485-b9f5-da418b7c24f5', name: 'Standard Room Utama (No. 1)' },
  { number: '2', type: 'utama', id: '7793c710-ba72-4866-b59c-20aee507a5c9', name: 'Standard Room Utama (No. 2)' },
  { number: '3', type: 'pratama', id: 'cda230a5-0c0c-46f5-bd3a-40ed15ec4862', name: 'Standard Room Pratama (No. 3)' },
  { number: '4', type: 'madya', id: '3dc9da2d-38e4-45e2-bc3d-e68881d50daa', name: 'Standard Room Madya (No. 4)' },
  { number: '5', type: 'pratama', id: '06daf026-6833-4bb0-b9fc-608a02f90784', name: 'Standard Room Pratama (No. 5)' },
  { number: '6', type: 'family', id: 'bc8edfa0-b150-42aa-8874-a7c466fe3602', name: 'Family Room (No. 6)' },
  { number: '7', type: 'ekonomi', id: 'd2471912-9486-483b-b01c-64cb5e6dc148', name: 'Economy Room (No. 7)' },
  { number: '8', type: 'ekonomi', id: '951a1d18-1908-4b67-9fd0-f2895f1d4928', name: 'Economy Room (No. 8)' },
  { number: 'Rumah-1', type: 'rumah', id: 'd3296e6b-a5c5-4db5-ac9a-81664eb41d36', name: 'Sewa 1 Rumah Penuh (Rumah-1)' }
];

export function normalizeRoomCategory(roomNameOrId: string): 'utama' | 'pratama' | 'madya' | 'family' | 'ekonomi' | 'rumah' | '' {
  const norm = String(roomNameOrId || '').toLowerCase().trim();
  
  if (norm.includes('utama') || norm === 'standard-room-utama' || norm === 'b3daf9eb-8af2-40ff-86a8-e3e94e8149e5') {
    return 'utama';
  }
  if (norm.includes('madya') || norm === 'standard-room-madya' || norm === '2332632b-0ec0-4906-a6e1-68a518605c09') {
    return 'madya';
  }
  if (norm.includes('pratama') || norm === 'standard-room' || norm === 'standard-room-pratama' || norm === '573c09f7-546f-452e-9fda-4ebf2d6ab77b') {
    return 'pratama';
  }
  if (norm.includes('family') || norm === '63a30aee-0c4b-49ce-8c5e-7ff4c9077481') {
    return 'family';
  }
  if (norm.includes('ekonomi') || norm.includes('economy') || norm.includes('economis') || norm === 'ekonomi' || norm === '90ced547-d6b1-4089-9617-8972d45a5ad3') {
    return 'ekonomi';
  }
  if (norm.includes('rumah') || norm === 'e8f31a0b-052a-4b29-8a93-06e8013fa623') {
    return 'rumah';
  }
  if (norm.includes('standard')) {
    return 'pratama';
  }
  return '';
}

export interface RoomAvailabilityResult {
  isAvailable: boolean;
  availableCount: number;
  totalCount: number;
  category: string;
  availableRooms: PhysicalRoom[];
  blockedRooms: PhysicalRoom[];
  reason?: string;
}

/**
 * Checks availability for a room category during a specific date range [checkIn, checkOut)
 */
export function checkRoomAvailability(
  roomNameOrId: string,
  checkIn: string,
  checkOut: string,
  bookingsList: any[] = [],
  dbRoomsList: any[] = []
): RoomAvailabilityResult {
  const category = normalizeRoomCategory(roomNameOrId);
  const categoryRooms = PHYSICAL_ROOMS.filter(r => r.type === category);
  const totalCount = categoryRooms.length;

  if (!category || totalCount === 0) {
    return {
      isAvailable: true,
      availableCount: 1,
      totalCount: 1,
      category: 'unknown',
      availableRooms: [],
      blockedRooms: []
    };
  }

  // Ensure dates are valid
  const todayStr = new Date().toISOString().substring(0, 10);
  const startDate = checkIn || todayStr;
  let endDate = checkOut;
  if (!endDate || endDate <= startDate) {
    const next = new Date(startDate);
    next.setDate(next.getDate() + 1);
    endDate = next.toISOString().substring(0, 10);
  }

  // Generate list of dates to check
  const dates: string[] = [];
  let current = new Date(startDate);
  const end = new Date(endDate);
  while (current < end) {
    dates.push(current.toISOString().substring(0, 10));
    current.setDate(current.getDate() + 1);
  }

  // Filter active blocking bookings:
  // ONLY bookings that are confirmed (Paid, Checked In, Completed, or explicitly Verified) block rooms.
  // Unconfirmed 'Pending' bookings do not lock the room until confirmed by Admin.
  // Cancelled, Expired, and Batal bookings NEVER block rooms.
  const activeBookings = (bookingsList || []).filter((b: any) => {
    const st = String(b.status || b.booking_status || '').toLowerCase().replace(/[\s-_]/g, '');
    const paySt = String(b.payment_status || '').toLowerCase().replace(/[\s-_]/g, '');
    
    // Explicitly cancelled or expired
    if (st === 'cancelled' || st === 'batal' || st === 'expired' || paySt === 'expired' || paySt === 'cancelled') {
      return false;
    }
    
    // Only lock room if paid, confirmed, checked in, or completed
    const isConfirmedOrPaid = 
      st === 'paid' || 
      st === 'checkedin' || 
      st === 'completed' || 
      st === 'confirmed' || 
      st === 'terkonfirmasi' ||
      paySt === 'paid' || 
      paySt === 'lunas' ||
      paySt === 'success';

    return isConfirmedOrPaid;
  });

  // Track blocked physical room numbers across ALL dates in range
  const blockedNumbersSet = new Set<string>();

  for (const dStr of dates) {
    const dateBlocked = new Set<string>();

    // 1. Check real-time dbRooms status if date is today
    if (dStr === todayStr && dbRoomsList && dbRoomsList.length > 0) {
      const now = new Date();
      dbRoomsList.forEach((r: any) => {
        const roomNum = String(r.room_number || r.number || '');
        const rStatus = String(r.status || '').toLowerCase();
        const occupiedUntil = r.occupied_until ? new Date(r.occupied_until) : null;
        const isOccupiedUntilActive = occupiedUntil && occupiedUntil > now;

        if (rStatus === 'booked' || rStatus === 'occupied' || rStatus === 'terisi' || isOccupiedUntilActive) {
          if (roomNum) dateBlocked.add(roomNum);
        }
      });
    }

    // 2. Check overlapping bookings for date dStr
    activeBookings.forEach((b: any) => {
      const bCheckIn = b.check_in ? String(b.check_in).substring(0, 10) : '';
      const bCheckOut = b.check_out ? String(b.check_out).substring(0, 10) : '';
      
      const isOverlapping = dStr >= bCheckIn && dStr < bCheckOut;
      if (!isOverlapping) return;

      const bRoomNum = String(b.room_number || '');
      const bRoomId = String(b.room_id || '');
      const bRoomName = String(b.room_name || '').toLowerCase();

      let assignedNum = '';
      if (bRoomNum) {
        assignedNum = bRoomNum;
      } else if (bRoomId) {
        const matchPhys = PHYSICAL_ROOMS.find(pr => pr.id === bRoomId || pr.number === bRoomId);
        if (matchPhys) assignedNum = matchPhys.number;
      }

      if (assignedNum) {
        dateBlocked.add(assignedNum);
      } else {
        // Map by name/category
        const bCat = normalizeRoomCategory(bRoomName || b.room_id);
        if (bCat === 'rumah') {
          dateBlocked.add('Rumah-1');
        } else if (bCat === 'utama') {
          // If unassigned utama booking, mark room 1 first, if already marked, mark room 2
          if (!dateBlocked.has('1')) dateBlocked.add('1');
          else dateBlocked.add('2');
        } else if (bCat === 'pratama') {
          if (!dateBlocked.has('3')) dateBlocked.add('3');
          else dateBlocked.add('5');
        } else if (bCat === 'madya') {
          dateBlocked.add('4');
        } else if (bCat === 'family') {
          dateBlocked.add('6');
        } else if (bCat === 'ekonomi') {
          if (!dateBlocked.has('7')) dateBlocked.add('7');
          else dateBlocked.add('8');
        }
      }
    });

    // 3. Linkage rules for full house (Rumah-1 <-> 3,4,5,6)
    if (dateBlocked.has('Rumah-1')) {
      dateBlocked.add('3');
      dateBlocked.add('4');
      dateBlocked.add('5');
      dateBlocked.add('6');
    }
    if (dateBlocked.has('3') || dateBlocked.has('4') || dateBlocked.has('5') || dateBlocked.has('6')) {
      dateBlocked.add('Rumah-1');
    }

    // Merge into blocked numbers set for entire stay
    dateBlocked.forEach(num => blockedNumbersSet.add(num));
  }

  const availableRooms = categoryRooms.filter(r => !blockedNumbersSet.has(r.number));
  const blockedRooms = categoryRooms.filter(r => blockedNumbersSet.has(r.number));
  const availableCount = availableRooms.length;
  const isAvailable = availableCount > 0;

  return {
    isAvailable,
    availableCount,
    totalCount,
    category,
    availableRooms,
    blockedRooms,
    reason: !isAvailable ? `Semua ${totalCount} kamar tipe ini sudah terpesan untuk periode ${startDate} - ${endDate}` : undefined
  };
}

/**
 * Fetches all live bookings & dbRooms from Supabase & localStorage
 */
export async function getLiveBookingsAndRooms(): Promise<{ bookings: any[]; dbRooms: any[] }> {
  let bookings: any[] = [];
  let dbRooms: any[] = [];

  // 1. Get from localStorage as immediate local baseline
  try {
    const localBkRaw = localStorage.getItem('zegan_bookings');
    if (localBkRaw) {
      bookings = JSON.parse(localBkRaw);
    }
    const localRoomsRaw = localStorage.getItem('zegan_db_rooms');
    if (localRoomsRaw) {
      dbRooms = JSON.parse(localRoomsRaw);
    }
  } catch (e) {
    console.warn('Failed to parse local storage in roomAvailability:', e);
  }

  // 2. Fetch from Supabase if configured
  if (supabaseDebugInfo.isValidUrl && supabaseDebugInfo.keyDefined) {
    try {
      const [bksRes, rmsRes] = await Promise.allSettled([
        supabase.from('bookings').select('*, guests(*)').order('created_at', { ascending: false }),
        supabase.from('rooms').select('*')
      ]);

      if (bksRes.status === 'fulfilled' && bksRes.value.data) {
        const remoteBookings = bksRes.value.data.map((b: any) => {
          const guestObj = Array.isArray(b.guests) ? b.guests[0] : b.guests;
          return {
            booking_code: b.booking_code,
            room_id: b.room_id,
            room_number: b.room_number,
            room_name: b.room_name,
            full_name: guestObj?.full_name || b.full_name || 'Guest',
            email: guestObj?.email || b.email || '',
            phone: guestObj?.phone || b.phone || '',
            check_in: b.check_in,
            check_out: b.check_out,
            total_price: b.total_price || b.total_amount,
            status: b.booking_status || b.status || 'Pending',
            payment_status: b.payment_status || 'Pending',
            created_at: b.created_at
          };
        });

        // Merge remote with local
        const remoteCodes = new Set(remoteBookings.map((b: any) => b.booking_code));
        bookings = [
          ...remoteBookings,
          ...bookings.filter(b => !remoteCodes.has(b.booking_code))
        ];
        try {
          localStorage.setItem('zegan_bookings', JSON.stringify(bookings));
        } catch {}
      }

      if (rmsRes.status === 'fulfilled' && rmsRes.value.data) {
        dbRooms = rmsRes.value.data;
        try {
          localStorage.setItem('zegan_db_rooms', JSON.stringify(dbRooms));
        } catch {}
      }
    } catch (err) {
      console.warn('Supabase fetch failed in getLiveBookingsAndRooms, using local cache:', err);
    }
  }

  return { bookings, dbRooms };
}
