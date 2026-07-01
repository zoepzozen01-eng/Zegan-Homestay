import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, Calendar as CalendarIcon, Users, Settings, ShieldCheck, 
  Search, Filter, Check, ArrowRight, ClipboardList, Database, RefreshCw, 
  Download, FileText, CheckCircle2, Clock, XCircle, AlertTriangle, 
  MessageSquare, Mail, Play, Key, UserCheck, ShieldAlert, LogOut, ChevronRight, ChevronLeft, X
} from 'lucide-react';
import { Booking, BookingStatus, PaymentStatus, UserRole, ActivityLog } from '../types';
import { 
  getQrisSettings, saveQrisSettings, 
  getWhatsappSettings, saveWhatsappSettings, 
  logActivity, getActivityLogs, 
  exportToCSV, checkBookingExpirations,
  getSimulatedEmailLogs, logSimulatedEmail, EmailSimLog
} from '../services/adminService';
import { ROOMS } from '../data';
import InvoicePDF from './InvoicePDF';
import { supabase } from '../lib/supabase';

interface AdminPortalProps {
  lang: 'id' | 'en';
  staffUser: { name: string; username: string; role: 'Owner' | 'Receptionist' | 'Admin' } | null;
  initialTab: 'dashboard' | 'bookings' | 'calendar' | 'reports' | 'settings';
  onLogout: () => void;
  onTabChange: (tab: string) => void;
}

export default function AdminPortal({ lang, staffUser, initialTab, onLogout, onTabChange }: AdminPortalProps) {
  const currentRole = staffUser?.role || 'Receptionist';
  const adminName = staffUser?.name || 'Staff';

  // State mapping the 10 requested views
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'calendar' | 'offline-booking' | 'confirm-payment' | 'check-in' | 'check-out' | 'reports' | 'settings'>(initialTab as any);

  // Core Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailSimLog[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // QRIS Settings Form state
  const [qrisForm, setQrisForm] = useState(getQrisSettings());

  // WhatsApp Settings Form state
  const [whatsappForm, setWhatsappForm] = useState(getWhatsappSettings());

  // Active viewing state (invoice overlay, detail calendar popups)
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);
  const [selectedCalendarRoom, setSelectedCalendarRoom] = useState<any>(null);

  // Edit booking modal/state inside the room popup
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [editFormName, setEditFormName] = useState('');
  const [editFormPhone, setEditFormPhone] = useState('');
  const [editFormCheckIn, setEditFormCheckIn] = useState('');
  const [editFormCheckOut, setEditFormCheckOut] = useState('');

  // Offline Booking form states
  const [offlineName, setOfflineName] = useState('');
  const [offlineEmail, setOfflineEmail] = useState('');
  const [offlinePhone, setOfflinePhone] = useState('');
  const [offlineRoomNum, setOfflineRoomNum] = useState('1');
  const [offlineCheckIn, setOfflineCheckIn] = useState('');
  const [offlineCheckOut, setOfflineCheckOut] = useState('');
  const [offlineGuests, setOfflineGuests] = useState(2);
  const [offlineNotes, setOfflineNotes] = useState('');
  const [offlinePriceOverride, setOfflinePriceOverride] = useState('');

  // Physical rooms loaded from database
  const [dbRooms, setDbRooms] = useState<any[]>([
    { id: '6382483d-4498-4485-b9f5-da418b7c24f5', number: '1', type: 'Standard Room Utama', status: 'Available', room_type_id: 'b3daf9eb-8af2-40ff-86a8-e3e94e8149e5' },
    { id: '7793c710-ba72-4866-b59c-20aee507a5c9', number: '2', type: 'Standard Room Utama', status: 'Available', room_type_id: 'b3daf9eb-8af2-40ff-86a8-e3e94e8149e5' },
    { id: 'cda230a5-0c0c-46f5-bd3a-40ed15ec4862', number: '3', type: 'Standard Room Pratama', status: 'Available', room_type_id: '573c09f7-546f-452e-9fda-4ebf2d6ab77b' },
    { id: '3dc9da2d-38e4-45e2-bc3d-e68881d50daa', number: '4', type: 'Standard Room Madya', status: 'Available', room_type_id: '2332632b-0ec0-4906-a6e1-68a518605c09' },
    { id: '06daf026-6833-4bb0-b9fc-608a02f90784', number: '5', type: 'Standard Room Pratama', status: 'Available', room_type_id: '573c09f7-546f-452e-9fda-4ebf2d6ab77b' },
    { id: 'bc8edfa0-b150-42aa-8874-a7c466fe3602', number: '6', type: 'Family Room', status: 'Available', room_type_id: '63a30aee-0c4b-49ce-8c5e-7ff4c9077481' },
    { id: 'd2471912-9486-483b-b01c-64cb5e6dc148', number: '7', type: 'Economy Room', status: 'Available', room_type_id: '90ced547-d6b1-4089-9617-8972d45a5ad3' },
    { id: '951a1d18-1908-4b67-9fd0-f2895f1d4928', number: '8', type: 'Economy Room', status: 'Available', room_type_id: '90ced547-d6b1-4089-9617-8972d45a5ad3' },
    { id: 'd3296e6b-a5c5-4db5-ac9a-81664eb41d36', number: 'Rumah-1', type: 'Rumah', status: 'Available', room_type_id: 'e8f31a0b-052a-4b29-8a93-06e8013fa623' }
  ]);

  const [loadingRooms, setLoadingRooms] = useState<Record<string, boolean>>({});

  // Real-time Service Signals & Cafe Food Orders checking states
  const [pendingSignalsCount, setPendingSignalsCount] = useState(0);
  const [newSignalToast, setNewSignalToast] = useState<{ guestName: string; details: string; roomNumber: string } | null>(null);

  useEffect(() => {
    const checkSignals = () => {
      try {
        const raw = localStorage.getItem('zegan_service_signals') || '[]';
        const list: any[] = JSON.parse(raw);
        const pending = list.filter((s: any) => s.status === 'pending');
        setPendingSignalsCount(pending.length);
        
        if (pending.length > 0) {
          const latest = pending[pending.length - 1];
          // Check if we already notified about this specific signal ID
          const lastNotified = localStorage.getItem('zegan_last_notified_signal_id');
          if (latest.id !== lastNotified) {
            localStorage.setItem('zegan_last_notified_signal_id', latest.id);
            setNewSignalToast({
              guestName: latest.guest_name,
              details: latest.details,
              roomNumber: latest.room_number
            });
            
            // Subtle sound chime using Web Audio API
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
              gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.1);
              
              setTimeout(() => {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(1109.73, audioCtx.currentTime); // C#6
                gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
                osc2.start();
                osc2.stop(audioCtx.currentTime + 0.15);
              }, 120);
            } catch (e) {
              // Ignore audio error
            }
          }
        }
      } catch (err) {
        console.warn('Error checking signals in Admin Portal:', err);
      }
    };

    checkSignals();
    const interval = setInterval(checkSignals, 4000);
    return () => clearInterval(interval);
  }, []);

  const calendarRoomsList = dbRooms;

  // Monthly Calendar States
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [selectedCalendarDateStr, setSelectedCalendarDateStr] = useState<string>(new Date().toISOString().substring(0, 10));

  // Keep the edit booking inline form inputs in sync when the selected calendar date or selected room changes
  useEffect(() => {
    if (selectedCalendarRoom && selectedCalendarRoom.room) {
      const roomNum = selectedCalendarRoom.room.number;
      const activeBooking = getRoomActiveBookingOnDate(roomNum, selectedCalendarDateStr);
      if (activeBooking) {
        setEditFormName(activeBooking.full_name || '');
        setEditFormPhone(activeBooking.phone || '');
        setEditFormCheckIn(activeBooking.check_in || '');
        setEditFormCheckOut(activeBooking.check_out || '');
      } else {
        setEditFormName('');
        setEditFormPhone('');
        setEditFormCheckIn('');
        setEditFormCheckOut('');
      }
    }
  }, [selectedCalendarDateStr, selectedCalendarRoom?.room?.number, bookings, dbRooms]);

  // Fetch rooms from Supabase
  const fetchDbRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, room_number, status, room_type_id, occupied_until, room_types(name)')
        .order('room_number', { ascending: true });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          number: r.room_number,
          type: r.room_types?.name || 'Unknown Room',
          status: r.status,
          room_type_id: r.room_type_id,
          occupied_until: r.occupied_until
        }));
        
        // Custom sorting to make sure numeric order works and Rumah-1 is at the end
        mapped.sort((a: any, b: any) => {
          if (a.number.includes('Rumah') && !b.number.includes('Rumah')) return 1;
          if (!a.number.includes('Rumah') && b.number.includes('Rumah')) return -1;
          return a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' });
        });
        setDbRooms(mapped);

        // Fetch bookings after rooms are loaded so we can map room numbers
        await fetchDbBookings(mapped);
      }
    } catch (err) {
      console.error('Error fetching rooms from database:', err);
    }
  };

  // Fetch real-time bookings from Supabase and map/sync
  const fetchDbBookings = async (roomsList = dbRooms) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          booking_code,
          room_id,
          check_in,
          check_out,
          adults,
          total_price,
          special_request,
          payment_status,
          booking_status,
          admin_notification_sent,
          created_at,
          guests (
            id,
            full_name,
            phone,
            email
          )
        `);

      if (error) {
        console.warn('Failed to fetch bookings from database, using local backups.', error);
        return;
      }

      if (data) {
        const mappedBookings: Booking[] = data.map((b: any) => {
          const guestObj = b.guests;
          const guest = Array.isArray(guestObj) ? guestObj[0] : guestObj;
          const roomObj = roomsList.find(r => r.id === b.room_id);
          
          return {
            booking_code: b.booking_code,
            room_id: b.room_id,
            room_name: roomObj ? roomObj.type : 'Kamar Zegan',
            room_number: roomObj ? roomObj.number : '',
            check_in: b.check_in,
            check_out: b.check_out,
            guests: b.adults || 1,
            full_name: guest?.full_name || 'Tamu',
            email: guest?.email || '',
            phone: guest?.phone || '',
            special_requests: b.special_request || '',
            total_price: b.total_price || 0,
            status: b.booking_status || 'Pending',
            payment_status: b.payment_status || 'Pending',
            created_at: b.created_at || new Date().toISOString()
          };
        });

        setBookings(mappedBookings);
        localStorage.setItem('zegan_bookings', JSON.stringify(mappedBookings));
      }
    } catch (err) {
      console.error('Error in fetchDbBookings:', err);
    }
  };

  // Handle Check-in action for a booked (KUNING) room
  const handleCheckInBooking = async (roomObj: any, activeBooking: any) => {
    if (loadingRooms[roomObj.id]) return;

    setLoadingRooms(prev => ({ ...prev, [roomObj.id]: true }));
    try {
      // 1. Update booking_status to 'CheckedIn' in Supabase bookings table
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ booking_status: 'CheckedIn' })
        .eq('booking_code', activeBooking.booking_code);

      if (bookingError) {
        throw bookingError;
      }

      // 2. Update status and occupied_until in Supabase rooms table
      const checkoutTime = activeBooking.check_out ? `${activeBooking.check_out} 12:00:00` : null;
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ 
          status: 'Occupied',
          occupied_until: checkoutTime
        })
        .eq('id', roomObj.id);

      if (roomError) {
        throw roomError;
      }

      // Log activity
      logActivity(
        adminName,
        currentRole,
        `Melakukan CHECK-IN otomatis untuk Kamar No. ${roomObj.number} (Kode Booking: ${activeBooking.booking_code})`
      );

      // 3. Update local states so colors update instantly without reload!
      setBookings(prev => prev.map(b => b.booking_code === activeBooking.booking_code ? { ...b, status: 'CheckedIn' as any } : b));
      setDbRooms(prev => prev.map(r => r.id === roomObj.id ? { ...r, status: 'Occupied', occupied_until: checkoutTime } : r));

      // Also update localStorage backups to keep in sync
      const raw = localStorage.getItem('zegan_bookings');
      if (raw) {
        const localB = JSON.parse(raw);
        const updatedB = localB.map((b: any) => b.booking_code === activeBooking.booking_code ? { ...b, status: 'CheckedIn' } : b);
        localStorage.setItem('zegan_bookings', JSON.stringify(updatedB));
      }

      alert(lang === 'id'
        ? `Berhasil Check-in untuk Kamar No. ${roomObj.number}!`
        : `Successfully checked-in Room No. ${roomObj.number}!`
      );
    } catch (err: any) {
      console.error('Error in handleCheckInBooking:', err);
      alert(lang === 'id'
        ? `Gagal melakukan Check-in: ${err.message || err}`
        : `Failed to Check-in: ${err.message || err}`
      );
    } finally {
      setLoadingRooms(prev => ({ ...prev, [roomObj.id]: false }));
    }
  };

  // Helper to map room type name to base price
  const getRoomBasePrice = (roomType: string) => {
    switch (roomType) {
      case 'Standard Room Utama': return 200000;
      case 'Standard Room Madya': return 175000;
      case 'Standard Room Pratama': return 150000;
      case 'Family Room': return 200000;
      case 'Economy Room': return 125000;
      case 'Rumah': return 700000;
      default: return 150000;
    }
  };

  // Manual status override toggler
  const handleManualStatusToggle = async (roomObj: any) => {
    if (loadingRooms[roomObj.id]) return;

    setLoadingRooms(prev => ({ ...prev, [roomObj.id]: true }));
    try {
      const currentStatusInfo = getRoomColorStatus(roomObj);
      const isCurrentlyAvailable = currentStatusInfo.status === 'Available';
      
      const newStatus = isCurrentlyAvailable ? 'Occupied' : 'Available';
      let occupiedUntilVal = null;
      
      if (isCurrentlyAvailable) {
        // Set occupied_until to tomorrow's checkout time 12:00:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().substring(0, 10);
        occupiedUntilVal = `${tomorrowStr} 12:00:00`;
      }

      // Update in Supabase
      const { error } = await supabase
        .from('rooms')
        .update({ 
          status: newStatus,
          occupied_until: occupiedUntilVal
        })
        .eq('id', roomObj.id);

      if (error) {
        throw error;
      }

      // Log activity
      logActivity(
        adminName,
        currentRole,
        `Mengubah status Kamar No. ${roomObj.number} secara manual menjadi ${newStatus === 'Available' ? 'Kosong (Available)' : 'Terisi (Occupied)'}`
      );

      // Update local dbRooms state immediately
      setDbRooms(prev => prev.map(r => r.id === roomObj.id ? { ...r, status: newStatus, occupied_until: occupiedUntilVal } : r));

      // Update active selected room state so popup drawer updates immediately too
      setSelectedCalendarRoom((prev: any) => {
        if (!prev) return null;
        const updatedRoom = { ...prev.room, status: newStatus, occupied_until: occupiedUntilVal };
        return {
          ...prev,
          room: updatedRoom,
          statusInfo: getRoomColorStatus(updatedRoom)
        };
      });

    } catch (err: any) {
      console.error('Error toggling room status:', err);
      alert(lang === 'id'
        ? `Gagal mengubah status kamar No. ${roomObj.number}: ${err.message || err}`
        : `Failed to change room status for No. ${roomObj.number}: ${err.message || err}`
      );
    } finally {
      setLoadingRooms(prev => ({ ...prev, [roomObj.id]: false }));
    }
  };

  // Auto-calculate offline booking price
  useEffect(() => {
    if (offlineCheckIn && offlineCheckOut) {
      const d1 = new Date(offlineCheckIn);
      const d2 = new Date(offlineCheckOut);
      const diffTime = d2.getTime() - d1.getTime();
      const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const roomObj = calendarRoomsList.find(r => r.number === offlineRoomNum);
      if (roomObj) {
        const pricePerNight = getRoomBasePrice(roomObj.type);
        setOfflinePriceOverride(String(pricePerNight * nights));
      }
    }
  }, [offlineCheckIn, offlineCheckOut, offlineRoomNum, dbRooms]);

  // Sync tab with props
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  const handleTabSelection = (tab: any) => {
    setActiveTab(tab);
    onTabChange(tab);
  };

  // Initialize and load
  const loadData = () => {
    try {
      const raw = localStorage.getItem('zegan_bookings');
      if (raw) {
        setBookings(JSON.parse(raw));
      } else {
        const defaults: Booking[] = [
          {
            booking_code: 'ZG-78241',
            room_id: 'deluxe',
            room_name: 'Joglo Deluxe Room',
            room_number: 'A-2',
            check_in: new Date().toISOString().substring(0, 10),
            check_out: new Date(Date.now() + 86400000).toISOString().substring(0, 10),
            guests: 2,
            full_name: 'Budi Santoso',
            email: 'budi.santoso@gmail.com',
            phone: '628123456789',
            special_requests: 'Butuh extra bantal',
            total_price: 450000,
            status: 'Paid',
            payment_status: 'Paid',
            payment_proof: 'https://placeholder.jpg',
            payment_date: new Date().toISOString(),
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            booking_code: 'ZG-41209',
            room_id: 'ekonomi',
            room_name: 'Lumbung Ekonomi Room',
            room_number: 'B-1',
            check_in: new Date(Date.now() + 172800000).toISOString().substring(0, 10),
            check_out: new Date(Date.now() + 345600000).toISOString().substring(0, 10),
            guests: 1,
            full_name: 'Siti Rahma',
            email: 'siti.rahma@gmail.com',
            phone: '6287711223344',
            total_price: 350000,
            status: 'Waiting Verification',
            payment_status: 'Waiting Verification',
            payment_proof: 'https://placeholder.jpg',
            payment_date: new Date().toISOString(),
            created_at: new Date(Date.now() - 7200000).toISOString()
          }
        ];
        localStorage.setItem('zegan_bookings', JSON.stringify(defaults));
        setBookings(defaults);
      }

      setLogs(getActivityLogs());
      setEmailLogs(getSimulatedEmailLogs());
    } catch (err) {
      console.error('Error loading admin portal data:', err);
    }
  };

  useEffect(() => {
    loadData();
    checkBookingExpirations();
    fetchDbRooms();
  }, []);

  const refreshWorkspace = () => {
    loadData();
    fetchDbRooms();
  };

  // Admin Actions: Konfirmasi Lunas
  const handleConfirmPaid = (bookingCode: string) => {
    try {
      const updated = bookings.map(b => {
        if (b.booking_code === bookingCode) {
          const paidBooking: Booking = {
            ...b,
            status: 'Paid',
            payment_status: 'Paid',
            payment_date: new Date().toISOString()
          };

          // Trigger simulated email automatically
          const subject = `Bukti Reservasi Terkonfirmasi LUNAS - ${bookingCode}`;
          const body = `Halo ${b.full_name},\n\nPembayaran Anda untuk pesanan ${bookingCode} di Zegan Homestay telah berhasil diverifikasi dan terkonfirmasi LUNAS.\n\nDetail Kamar: ${b.room_name || 'Kamar Zegan'}\nCheck-in: ${b.check_in}\nCheck-out: ${b.check_out}\n\nTerlampir adalah Invoice PDF Resmi Anda. Kami menantikan kehadiran Anda!\n\nSalam,\nZegan Homestay & Cafe`;
          logSimulatedEmail(b.email, subject, body, `Invoice-${bookingCode}.pdf`);

          // Log WhatsApp simulation
          logActivity(
            adminName,
            currentRole,
            `Konfirmasi LUNAS untuk booking ${bookingCode}. WhatsApp & Email invoice dikirim secara otomatis.`
          );

          return paidBooking;
        }
        return b;
      });

      localStorage.setItem('zegan_bookings', JSON.stringify(updated));
      refreshWorkspace();
      alert(lang === 'id' ? 'Pembayaran berhasil dikonfirmasi!' : 'Payment successfully confirmed!');
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Actions: Check In
  const handleConfirmCheckIn = (bookingCode: string) => {
    try {
      const updated = bookings.map(b => {
        if (b.booking_code === bookingCode) {
          logActivity(
            adminName,
            currentRole,
            `Proses CHECK-IN berhasil dikonfirmasi untuk tamu ${b.full_name} (${bookingCode}). Kamar diset menjadi OCCUPIED.`
          );
          return {
            ...b,
            status: 'Checked In' as any
          };
        }
        return b;
      });

      localStorage.setItem('zegan_bookings', JSON.stringify(updated));
      refreshWorkspace();
      alert(lang === 'id' ? 'Check-in tamu berhasil dikonfirmasi!' : 'Guest check-in successfully confirmed!');
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Actions: Check Out
  const handleConfirmCheckOut = (bookingCode: string) => {
    try {
      const updated = bookings.map(b => {
        if (b.booking_code === bookingCode) {
          logActivity(
            adminName,
            currentRole,
            `Proses CHECK-OUT berhasil dikonfirmasi untuk tamu ${b.full_name} (${bookingCode}). Kamar dibebaskan (AVAILABLE).`
          );
          return {
            ...b,
            status: 'Completed' as any,
            check_out_date: new Date().toISOString()
          };
        }
        return b;
      });

      localStorage.setItem('zegan_bookings', JSON.stringify(updated));
      refreshWorkspace();
      alert(lang === 'id' ? 'Check-out tamu berhasil diselesaikan!' : 'Guest check-out completed successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Actions: Cancel
  const handleCancelBooking = (bookingCode: string) => {
    if (!window.confirm(lang === 'id' ? 'Yakin ingin membatalkan booking ini?' : 'Are you sure you want to cancel this booking?')) return;
    try {
      const updated = bookings.map(b => {
        if (b.booking_code === bookingCode) {
          logActivity(
            adminName,
            currentRole,
            `Pemesanan dengan kode ${bookingCode} dibatalkan oleh admin.`
          );
          return {
            ...b,
            status: 'Cancelled' as any,
            payment_status: 'Expired' as any
          };
        }
        return b;
      });

      localStorage.setItem('zegan_bookings', JSON.stringify(updated));
      refreshWorkspace();
      alert(lang === 'id' ? 'Booking berhasil dibatalkan.' : 'Booking successfully cancelled.');
    } catch (err) {
      console.error(err);
    }
  };

  // Save QRIS & Fonnte Settings
  const handleSaveQris = (e: React.FormEvent) => {
    e.preventDefault();
    saveQrisSettings(qrisForm);
    logActivity(adminName, currentRole, 'Mengubah Pengaturan Gambar dan Rekening QRIS Utama.');
    alert(lang === 'id' ? 'Pengaturan QRIS berhasil diperbarui!' : 'QRIS Settings successfully saved!');
  };

  const handleSaveWhatsapp = (e: React.FormEvent) => {
    e.preventDefault();
    saveWhatsappSettings(whatsappForm);
    logActivity(adminName, currentRole, 'Mengubah Token Fonnte dan Template Template WhatsApp.');
    alert(lang === 'id' ? 'Pengaturan WhatsApp berhasil diperbarui!' : 'WhatsApp Settings saved successfully!');
  };

  // Submit offline booking
  const handleOfflineBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineName || !offlineCheckIn || !offlineCheckOut) {
      alert(lang === 'id' ? 'Harap lengkapi semua data wajib!' : 'Please fill in all required fields!');
      return;
    }

    const roomObj = calendarRoomsList.find(r => r.number === offlineRoomNum);
    if (!roomObj) return;

    // Date overlapping check
    const overlapping = bookings.filter(b => {
      if (b.status === 'Cancelled' || b.status === 'Expired') return false;
      const isSameRoom = b.room_number === offlineRoomNum || (b.room_id === roomObj.id && !b.room_number);
      if (!isSameRoom) return false;
      return (offlineCheckIn < b.check_out) && (offlineCheckOut > b.check_in);
    });

    if (overlapping.length > 0) {
      alert(lang === 'id' 
        ? `Gagal! Kamar ${offlineRoomNum} sudah terisi/dipesan pada tanggal tersebut.` 
        : `Conflict! Room ${offlineRoomNum} is already booked on those dates.`
      );
      return;
    }

    const code = 'ZG-OFF' + Math.floor(10000 + Math.random() * 90000);
    const newBooking: Booking = {
      booking_code: code,
      room_id: roomObj.id,
      room_name: roomObj.type,
      room_number: roomObj.number,
      check_in: offlineCheckIn,
      check_out: offlineCheckOut,
      guests: offlineGuests,
      full_name: offlineName,
      email: offlineEmail || 'offline-guest@zegan.com',
      phone: offlinePhone || '000000000000',
      special_requests: offlineNotes ? `[Booking Offline] ${offlineNotes}` : '[Booking Offline]',
      total_price: Number(offlinePriceOverride) || 300000,
      status: 'Paid',
      payment_status: 'Paid',
      created_at: new Date().toISOString(),
      payment_date: new Date().toISOString()
    };

    const newBookingsList = [...bookings, newBooking];
    localStorage.setItem('zegan_bookings', JSON.stringify(newBookingsList));
    logActivity(adminName, currentRole, `Membuat BOOKING OFFLINE untuk tamu ${offlineName} (${code}) kamar ${offlineRoomNum}`);
    
    // Clear form
    setOfflineName('');
    setOfflineEmail('');
    setOfflinePhone('');
    setOfflineCheckIn('');
    setOfflineCheckOut('');
    setOfflineNotes('');

    setBookings(newBookingsList);
    alert(lang === 'id' ? `Booking offline ${code} berhasil dibuat!` : `Offline booking ${code} created successfully!`);
    handleTabSelection('calendar');
  };

  // Edit booking submit
  const handleEditBookingSubmit = (e: React.FormEvent, bookingCode: string) => {
    e.preventDefault();
    try {
      const updated = bookings.map(b => {
        if (b.booking_code === bookingCode) {
          logActivity(
            adminName,
            currentRole,
            `Mengubah data pemesanan tamu ${b.full_name} (${bookingCode}) menjadi: ${editFormName}, In: ${editFormCheckIn}, Out: ${editFormCheckOut}`
          );
          return {
            ...b,
            full_name: editFormName,
            phone: editFormPhone,
            check_in: editFormCheckIn,
            check_out: editFormCheckOut
          };
        }
        return b;
      });

      localStorage.setItem('zegan_bookings', JSON.stringify(updated));
      setBookings(updated);
      setIsEditingBooking(false);
      setSelectedCalendarRoom(null);
      alert(lang === 'id' ? 'Detail booking berhasil diperbarui!' : 'Booking details successfully updated!');
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch active booking for calendar
  const getRoomActiveBooking = (roomNumber: string) => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const roomObj = dbRooms.find(r => r.number === roomNumber);
    
    // 1. Direct booking for this specific room
    const directBooking = bookings.find(b => {
      if (b.status === 'Cancelled' || b.status === 'Expired') return false;
      
      const isMyRoom = (roomObj && b.room_id === roomObj.id) || 
                       b.room_number === roomNumber || 
                       (!b.room_number && roomNumber === '1');
                        
      const isDateInRange = todayStr >= b.check_in && todayStr < b.check_out;
      return isMyRoom && isDateInRange;
    });

    if (directBooking) return directBooking;

    // 2. If room is 3, 4, 5, or 6, check if 'Rumah-1' has an active booking on that date
    if (['3', '4', '5', '6'].includes(roomNumber)) {
      const rumahRoom = dbRooms.find(r => r.number === 'Rumah-1' || r.type === 'Rumah');
      const rumahBooking = bookings.find(b => {
        if (b.status === 'Cancelled' || b.status === 'Expired') return false;
        
        const isRumahRoom = (rumahRoom && b.room_id === rumahRoom.id) || 
                             b.room_number === 'Rumah-1' || 
                             (b.room_name && b.room_name.toLowerCase().includes('rumah'));
                             
        const isDateInRange = todayStr >= b.check_in && todayStr < b.check_out;
        return isRumahRoom && isDateInRange;
      });
      if (rumahBooking) {
        return {
          ...rumahBooking,
          room_number: roomNumber,
          full_name: `${rumahBooking.full_name} (${lang === 'id' ? 'Satu Rumah' : 'Whole House'})`
        };
      }
    }

    // 3. If room is 'Rumah-1', check if any of the sub-rooms (3, 4, 5, 6) are booked
    if (roomNumber === 'Rumah-1') {
      for (const num of ['3', '4', '5', '6']) {
        const subRoomObj = dbRooms.find(r => r.number === num);
        const subBooking = bookings.find(b => {
          if (b.status === 'Cancelled' || b.status === 'Expired') return false;
          
          const isSubRoom = (subRoomObj && b.room_id === subRoomObj.id) || 
                             b.room_number === num;
                             
          const isDateInRange = todayStr >= b.check_in && todayStr < b.check_out;
          return isSubRoom && isDateInRange;
        });
        if (subBooking) {
          return {
            ...subBooking,
            room_number: 'Rumah-1',
            full_name: `${subBooking.full_name} (Room ${num})`
          };
        }
      }
    }

    return null;
  };

  // Get color status metadata for a room
  const getRoomColorStatus = (room: any) => {
    const activeBooking = getRoomActiveBooking(room.number);
    const now = new Date();
    
    // 3. MERAH (Occupied) — kolom occupied_until di-set dan belum dilewati (atau booking_status === 'CheckedIn')
    const hasOccupiedUntil = room.occupied_until && new Date(room.occupied_until) > now;
    const hasCheckedInBooking = activeBooking && (
      String(activeBooking.status).toLowerCase().replace(/[\s-_]/g, '') === 'checkedin'
    );
    const isLegacyOccupied = String(room.status).toLowerCase() === 'occupied' && !room.occupied_until;

    if (hasOccupiedUntil || hasCheckedInBooking || isLegacyOccupied) {
      return { 
        status: 'Occupied', 
        color: 'bg-rose-600 text-rose-50 ring-rose-700', 
        label: lang === 'id' ? 'Terisi (Occupied)' : 'Occupied' 
      };
    }

    // 2. KUNING (Booked) — ada booking di tabel bookings untuk kamar ini, dengan booking_status "Pending" atau "Confirmed" (belum "CheckedIn"), dan tanggal hari ini ada di antara check_in dan check_out.
    if (activeBooking) {
      const bStatus = String(activeBooking.status).toLowerCase().replace(/[\s-_]/g, '');
      if (bStatus === 'pending' || bStatus === 'confirmed' || bStatus === 'paid') {
        return { 
          status: 'Booked', 
          color: 'bg-amber-500 text-amber-950 ring-amber-600', 
          label: lang === 'id' ? 'Dipesan (Booked)' : 'Booked' 
        };
      }
    }
    
    // 1. HIJAU (Available) — kolom rooms.occupied_until kosong (NULL), atau waktu sekarang sudah melewati nilai occupied_until.
    return { 
      status: 'Available', 
      color: 'bg-emerald-600 text-emerald-50 ring-emerald-700', 
      label: lang === 'id' ? 'Kosong' : 'Available' 
    };
  };

  // Fetch active booking for calendar on a specific date
  const getRoomActiveBookingOnDate = (roomNumber: string, dateStr: string) => {
    const roomObj = dbRooms.find(r => r.number === roomNumber);
    
    // 1. Direct booking for this specific room
    const directBooking = bookings.find(b => {
      if (b.status === 'Cancelled' || b.status === 'Expired') return false;
      
      const isMyRoom = (roomObj && b.room_id === roomObj.id) || 
                       b.room_number === roomNumber || 
                       (!b.room_number && roomNumber === '1');
                        
      const isDateInRange = dateStr >= b.check_in && dateStr < b.check_out;
      return isMyRoom && isDateInRange;
    });

    if (directBooking) return directBooking;

    // 2. If room is 3, 4, 5, or 6, check if 'Rumah-1' is booked on that date
    if (['3', '4', '5', '6'].includes(roomNumber)) {
      const rumahRoom = dbRooms.find(r => r.number === 'Rumah-1' || r.type === 'Rumah');
      const rumahBooking = bookings.find(b => {
        if (b.status === 'Cancelled' || b.status === 'Expired') return false;
        
        const isRumahRoom = (rumahRoom && b.room_id === rumahRoom.id) || 
                             b.room_number === 'Rumah-1' || 
                             (b.room_name && b.room_name.toLowerCase().includes('rumah'));
                             
        const isDateInRange = dateStr >= b.check_in && dateStr < b.check_out;
        return isRumahRoom && isDateInRange;
      });
      if (rumahBooking) {
        return {
          ...rumahBooking,
          room_number: roomNumber,
          full_name: `${rumahBooking.full_name} (${lang === 'id' ? 'Satu Rumah' : 'Whole House'})`
        };
      }
    }

    // 3. If room is 'Rumah-1', check if any of the sub-rooms (3, 4, 5, 6) is booked
    if (roomNumber === 'Rumah-1') {
      for (const num of ['3', '4', '5', '6']) {
        const subRoomObj = dbRooms.find(r => r.number === num);
        const subBooking = bookings.find(b => {
          if (b.status === 'Cancelled' || b.status === 'Expired') return false;
          
          const isSubRoom = (subRoomObj && b.room_id === subRoomObj.id) || 
                             b.room_number === num;
                             
          const isDateInRange = dateStr >= b.check_in && dateStr < b.check_out;
          return isSubRoom && isDateInRange;
        });
        if (subBooking) {
          return {
            ...subBooking,
            room_number: 'Rumah-1',
            full_name: `${subBooking.full_name} (Room ${num})`
          };
        }
      }
    }

    return null;
  };

  // Get color status metadata for a room on a specific date
  const getRoomColorStatusOnDate = (room: any, dateStr: string) => {
    const activeBooking = getRoomActiveBookingOnDate(room.number, dateStr);
    const todayStr = new Date().toISOString().substring(0, 10);
    
    if (activeBooking) {
      const bStatus = String(activeBooking.status).toLowerCase().replace(/[\s-_]/g, '');
      if (bStatus === 'checkedin' || bStatus === 'occupied') {
        return { 
          status: 'Occupied', 
          color: 'bg-rose-600 text-rose-50 ring-rose-700', 
          label: lang === 'id' ? 'Terisi (Occupied)' : 'Occupied' 
        };
      }
      if (bStatus === 'pending' || bStatus === 'confirmed' || bStatus === 'paid') {
        return { 
          status: 'Booked', 
          color: 'bg-amber-500 text-amber-950 ring-amber-600', 
          label: lang === 'id' ? 'Dipesan (Booked)' : 'Booked' 
        };
      }
    }

    if (dateStr === todayStr) {
      const now = new Date();
      const hasOccupiedUntil = room.occupied_until && new Date(room.occupied_until) > now;
      const isLegacyOccupied = String(room.status).toLowerCase() === 'occupied' && !room.occupied_until;
      if (hasOccupiedUntil || isLegacyOccupied) {
        return { 
          status: 'Occupied', 
          color: 'bg-rose-600 text-rose-50 ring-rose-700', 
          label: lang === 'id' ? 'Terisi (Occupied)' : 'Occupied' 
        };
      }
    }
    
    return { 
      status: 'Available', 
      color: 'bg-emerald-600 text-emerald-50 ring-emerald-700', 
      label: lang === 'id' ? 'Kosong' : 'Available' 
    };
  };

  // Calculate available rooms on a specific date (out of total 9)
  const getAvailableRoomsCountOnDate = (dateStr: string) => {
    return getRoomCountsOnDate(dateStr).vacant;
  };

  // Get detailed room counts (vacant, booked, occupied) on a specific date based on individual room evaluation
  const getRoomCountsOnDate = (dateStr: string) => {
    let vacantCount = 0;
    let occupiedCount = 0;
    let bookedCount = 0;

    dbRooms.forEach(room => {
      const statusInfo = getRoomColorStatusOnDate(room, dateStr);
      if (statusInfo.status === 'Occupied') {
        occupiedCount++;
      } else if (statusInfo.status === 'Booked') {
        bookedCount++;
      } else {
        vacantCount++;
      }
    });

    return {
      vacant: vacantCount,
      occupied: occupiedCount,
      booked: bookedCount
    };
  };

  // Dashboard Stats Calculations
  const getStats = () => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const thisMonthStr = new Date().toISOString().substring(0, 7);

    let total = bookings.length;
    let todayBookings = bookings.filter(b => b.created_at && b.created_at.startsWith(todayStr)).length;
    let pending = bookings.filter(b => b.status === 'Pending').length;
    let waitingVerification = bookings.filter(b => b.status === 'Waiting Verification').length;
    let paid = bookings.filter(b => b.status === 'Paid').length;
    let checkInToday = bookings.filter(b => b.check_in === todayStr).length;
    let checkOutToday = bookings.filter(b => b.check_out === todayStr).length;

    let todayEarnings = bookings
      .filter(b => (b.status === 'Paid' || b.status === 'Checked In' || b.status === 'Completed') && b.payment_date && b.payment_date.startsWith(todayStr))
      .reduce((sum, b) => sum + (b.total_price || 0), 0);

    let monthEarnings = bookings
      .filter(b => (b.status === 'Paid' || b.status === 'Checked In' || b.status === 'Completed') && b.payment_date && b.payment_date.startsWith(thisMonthStr))
      .reduce((sum, b) => sum + (b.total_price || 0), 0);

    return {
      total, todayBookings, pending, waitingVerification, paid, checkInToday, checkOutToday, todayEarnings, monthEarnings
    };
  };

  const stats = getStats();

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone.includes(searchQuery) ||
      b.booking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.room_number && b.room_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportBookings = () => {
    const headers = ['Kode Booking', 'Kamar', 'No Kamar', 'Check-In', 'Check-Out', 'Tamu', 'Nama Pelanggan', 'Email', 'WhatsApp', 'Total Harga', 'Status'];
    const exportData = bookings.map(b => ({
      booking_code: b.booking_code,
      room_name: b.room_name || 'Kamar',
      room_number: b.room_number || 'A-1',
      check_in: b.check_in,
      check_out: b.check_out,
      guests: b.guests,
      full_name: b.full_name,
      email: b.email,
      phone: b.phone,
      total_price: b.total_price,
      status: b.status
    }));
    exportToCSV(exportData, headers, 'zegan-bookings-backup');
    logActivity(adminName, currentRole, 'Mengunduh backup database pemesanan dalam format CSV.');
  };

  const runSchedulerManual = () => {
    const changed = checkBookingExpirations();
    if (changed) {
      alert(lang === 'id' ? 'Scheduler berhasil dijalankan. Pemesanan kedaluwarsa telah diperbarui!' : 'Scheduler executed. Expired bookings updated!');
      refreshWorkspace();
    } else {
      alert(lang === 'id' ? 'Semua status pemesanan masih valid (tidak ada yang kedaluwarsa).' : 'All bookings are valid.');
    }
  };

  // Tab definitions
  const adminTabs = [
    { id: 'dashboard', label: lang === 'id' ? 'Dashboard' : 'Dashboard', icon: BarChart3 },
    { id: 'bookings', label: lang === 'id' ? 'Reservasi' : 'Reservations', icon: ClipboardList },
    { id: 'calendar', label: lang === 'id' ? 'Kalender Kamar' : 'Room Calendar', icon: CalendarIcon },
    { id: 'offline-booking', label: lang === 'id' ? 'Booking Offline' : 'Offline Booking', icon: FileText },
    { id: 'confirm-payment', label: lang === 'id' ? 'Konfirmasi Pembayaran' : 'Confirm Payment', icon: CheckCircle2, badge: stats.waitingVerification + stats.pending },
    { id: 'check-in', label: lang === 'id' ? 'Check In' : 'Check In', icon: Clock, badge: stats.checkInToday },
    { id: 'check-out', label: lang === 'id' ? 'Check Out' : 'Check Out', icon: XCircle, badge: stats.checkOutToday },
    { id: 'reports', label: lang === 'id' ? 'Laporan' : 'Reports', icon: BarChart3, ownerOnly: true },
    { id: 'settings', label: lang === 'id' ? 'Pengaturan' : 'Settings', icon: Settings },
    { id: 'logout', label: lang === 'id' ? 'Logout' : 'Logout', icon: LogOut, isLogout: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* 1. Welcoming staff bar */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border border-stone-850">
        <div>
          <span className="text-[10px] text-brand-400 uppercase tracking-widest font-extrabold block mb-1">
            Sistem Manajemen Internal • Zegan Homestay
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
            Selamat Datang, {adminName}
          </h1>
          <p className="text-xs text-stone-400 mt-1 flex items-center gap-2">
            <span>Peran:</span>
            <span className="bg-stone-800 text-brand-300 font-bold px-2 py-0.5 rounded-md font-mono text-[10px] uppercase border border-stone-700">
              {currentRole}
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-stone-500">Koneksi Supabase Aktif</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/service-signals"
            className="bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 relative"
          >
            <span className="text-sm animate-pulse">🛎️</span>
            <span>Monitor Sinyal</span>
            {pendingSignalsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white font-mono text-[10px] font-extrabold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center border-2 border-stone-900 animate-bounce">
                {pendingSignalsCount}
              </span>
            )}
          </a>

          <button
            onClick={onLogout}
            className="bg-stone-800 hover:bg-red-950/80 hover:text-red-300 border border-stone-700 text-stone-200 text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* 2. Menu list Tab Navigation */}
      <div className="flex overflow-x-auto gap-1 border-b border-brand-200 pb-1 scrollbar-none">
        {adminTabs.map((tab) => {
          if (tab.ownerOnly && currentRole !== 'Owner') return null;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.isLogout) {
                  onLogout();
                } else {
                  handleTabSelection(tab.id);
                }
              }}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                activeTab === tab.id
                  ? 'bg-brand-100 text-brand-900 border-brand-250 font-extrabold shadow-sm'
                  : 'bg-transparent text-stone-500 border-transparent hover:text-brand-900 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-red-600 text-white rounded-full font-bold">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* 3. Render the dynamic sub-view panels */}
      <div className="min-h-[50vh]">
        
        {/* SUBVIEW 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Quick Greeting & Role Badge */}
            <div className="bg-brand-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
              <div className="space-y-2 relative z-10">
                <span className="text-[10px] uppercase tracking-widest bg-white/15 px-3 py-1 rounded-full font-bold">
                  {currentRole === 'Owner' ? '👑 Owner Portal' : '🔑 Receptionist Portal'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                  {lang === 'id' ? `Selamat Datang, ${adminName}!` : `Welcome back, ${adminName}!`}
                </h2>
                <p className="text-xs text-brand-100/80 font-light max-w-xl">
                  {lang === 'id' 
                    ? 'Kelola operasional harian Zegan Homestay secara real-time. Pantau keterisian kamar dan konfirmasi pembayaran tamu.' 
                    : 'Manage Zegan Homestay daily operations in real-time. Monitor room occupancies and confirm payments.'}
                </p>
              </div>
              <button
                onClick={onLogout}
                className="bg-red-700 hover:bg-red-600 text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer border border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span>{lang === 'id' ? 'Keluar (Logout)' : 'Logout'}</span>
              </button>
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { title: 'Total Booking', val: stats.total, sub: 'Seluruh pesanan', color: 'text-brand-900' },
                { title: 'Verifikasi Baru', val: stats.waitingVerification, sub: 'Butuh validasi bayar', color: 'text-amber-600' },
                { title: 'Omzet Hari Ini', val: `Rp${stats.todayEarnings.toLocaleString('id-ID')}`, sub: 'Pembayaran hari ini', color: 'text-emerald-700' },
                { title: 'Omzet Bulan Ini', val: `Rp${stats.monthEarnings.toLocaleString('id-ID')}`, sub: 'Periode berjalan', color: 'text-brand-800' }
              ].map((card, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-brand-200 p-5 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 block">{card.title}</span>
                  <span className={`text-xl sm:text-2xl font-serif font-extrabold ${card.color} block mt-2 tracking-tight`}>{card.val}</span>
                  <span className="text-[10px] text-stone-500 font-light mt-1.5 block">{card.sub}</span>
                </div>
              ))}
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-4">
              <h3 className="font-serif font-bold text-brand-950 text-base">
                {lang === 'id' ? 'Akses Cepat & Navigasi' : 'Quick Actions & Navigation'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                <button 
                  onClick={() => handleTabSelection('offline-booking')}
                  className="p-4 bg-brand-50 hover:bg-brand-100 rounded-xl font-bold text-brand-900 flex flex-col items-center justify-center text-center gap-2 border border-brand-100 transition-all cursor-pointer shadow-3xs"
                >
                  <FileText className="w-5 h-5 text-brand-700" />
                  <span className="font-bold">{lang === 'id' ? 'Booking Offline' : 'Offline Booking'}</span>
                </button>
                <button 
                  onClick={() => handleTabSelection('calendar')}
                  className="p-4 bg-brand-50 hover:bg-brand-100 rounded-xl font-bold text-brand-900 flex flex-col items-center justify-center text-center gap-2 border border-brand-100 transition-all cursor-pointer shadow-3xs"
                >
                  <CalendarIcon className="w-5 h-5 text-brand-700" />
                  <span className="font-bold">{lang === 'id' ? 'Kalender Reservasi' : 'Reservation Calendar'}</span>
                </button>
                <button 
                  onClick={() => handleTabSelection('bookings')}
                  className="p-4 bg-brand-50 hover:bg-brand-100 rounded-xl font-bold text-brand-900 flex flex-col items-center justify-center text-center gap-2 border border-brand-100 transition-all cursor-pointer shadow-3xs"
                >
                  <ClipboardList className="w-5 h-5 text-brand-700" />
                  <span className="font-bold">{lang === 'id' ? 'Semua Reservasi' : 'All Reservations'}</span>
                </button>
                <button 
                  onClick={() => handleTabSelection('reports')}
                  className="p-4 bg-brand-50 hover:bg-brand-100 rounded-xl font-bold text-brand-900 flex flex-col items-center justify-center text-center gap-2 border border-brand-100 transition-all cursor-pointer shadow-3xs disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentRole !== 'Owner'}
                >
                  <BarChart3 className="w-5 h-5 text-brand-700" />
                  <span className="font-bold">{lang === 'id' ? 'Laporan (Owner Only)' : 'Reports (Owner Only)'}</span>
                </button>
              </div>
                        {/* Real-time Room Grid */}
            <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="font-serif font-bold text-brand-950 text-base">
                    {lang === 'id' ? 'Kotak Status Kamar Real-time' : 'Real-time Room Status Grid'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {lang === 'id' ? 'Kondisi dan status keterisian real-time hari ini.' : 'Real-time room occupancy status today.'}
                  </p>
                </div>
                <button 
                  onClick={() => handleTabSelection('calendar')}
                  className="text-brand-700 hover:text-brand-900 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{lang === 'id' ? 'Lihat di Kalender' : 'View in Calendar'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-stone-600">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-600 rounded-sm"></span><span>{lang === 'id' ? 'Kosong (Available)' : 'Available'}</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-500 rounded-sm"></span><span>{lang === 'id' ? 'Dipesan (Booked / Kuning)' : 'Booked'}</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-rose-600 rounded-sm"></span><span>{lang === 'id' ? 'Terisi (Occupied / CheckedIn)' : 'Occupied'}</span></div>
              </div>

              {/* The Room Boxes */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                {calendarRoomsList.map((room) => {
                  const statusInfo = getRoomColorStatus(room);
                  const activeBooking = getRoomActiveBooking(room.number);
                  const isLoading = !!loadingRooms[room.id];

                  return (
                    <motion.button
                      whileHover={isLoading ? {} : { scale: 1.02 }}
                      key={room.number}
                      onClick={() => {
                        if (statusInfo.status === 'Booked' && activeBooking) {
                          handleCheckInBooking(room, activeBooking);
                        } else if (statusInfo.status === 'Available' || (statusInfo.status === 'Occupied' && !activeBooking)) {
                          handleManualStatusToggle(room);
                        }
                      }}
                      disabled={isLoading}
                      className={`h-40 rounded-2xl p-4 text-left border flex flex-col justify-between shadow-xs cursor-pointer transition-all ring-1 ${statusInfo.color} ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-base font-bold tracking-wide font-mono">No. {room.number}</span>
                          <div className="flex items-center gap-1">
                            {/* Manage Button */}
                            <button
                              type="button"
                              className="detail-btn hover:bg-black/20 text-white p-1 rounded-md transition-all cursor-pointer mr-0.5"
                              onClick={(e) => {
                                e.stopPropagation(); // Stop click from toggling status
                                setSelectedCalendarRoom({ room, statusInfo, activeBooking });
                                if (activeBooking) {
                                  setEditFormName(activeBooking.full_name);
                                  setEditFormPhone(activeBooking.phone);
                                  setEditFormCheckIn(activeBooking.check_in);
                                  setEditFormCheckOut(activeBooking.check_out);
                                }
                                setIsEditingBooking(false);
                              }}
                              title={lang === 'id' ? 'Kelola Detail Booking' : 'Manage Booking Details'}
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[9px] font-extrabold uppercase tracking-widest bg-black/10 px-1.5 py-0.5 rounded-md leading-none">
                              {isLoading ? '...' : statusInfo.label}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] block opacity-90 mt-0.5 truncate">{room.type}</span>
                      </div>

                      <div>
                        {activeBooking ? (
                          <div className="space-y-1 border-t border-white/20 pt-1.5 mt-1.5">
                            <div className="flex justify-between items-center gap-1">
                              <span className="text-[10px] font-bold block truncate max-w-[90px]">
                                👤 {activeBooking.full_name}
                              </span>
                              {statusInfo.status === 'Booked' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCheckInBooking(room, activeBooking);
                                  }}
                                  className="bg-white text-amber-950 hover:bg-amber-100 font-extrabold text-[9px] px-1.5 py-0.5 rounded-lg transition-all shadow-xs shrink-0 cursor-pointer uppercase tracking-wider"
                                >
                                  Check-in
                                </button>
                              )}
                            </div>
                            <span className="text-[8.5px] opacity-90 block font-mono font-medium">
                              📅 In: {activeBooking.check_in}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] italic font-light opacity-90">
                            {isLoading ? (lang === 'id' ? 'Menyimpan...' : 'Saving...') : (room.status === 'Available' ? (lang === 'id' ? 'Siap huni / kosong' : 'Ready / Kosong') : (lang === 'id' ? 'Terisi (Occupied)' : 'Occupied'))}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>        </div>

            {/* Split Row for Booking Hari Ini, Menunggu Verifikasi */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Booking Hari Ini */}
              <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-4">
                <h3 className="font-serif font-bold text-brand-950 text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-700" />
                  <span>{lang === 'id' ? 'Booking Hari Ini' : 'Bookings Today'}</span>
                </h3>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {(() => {
                    const todayStr = new Date().toISOString().substring(0, 10);
                    const todayBookings = bookings.filter(b => b.check_in === todayStr || b.check_out === todayStr);
                    
                    if (todayBookings.length === 0) {
                      return (
                        <div className="p-8 text-center text-stone-400 italic text-xs font-semibold">
                          {lang === 'id' ? 'Tidak ada kedatangan atau keberangkatan hari ini.' : 'No arrivals or departures today.'}
                        </div>
                      );
                    }

                    return todayBookings.map((b) => {
                      const isCheckIn = b.check_in === todayStr;
                      return (
                        <div key={b.booking_code} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${isCheckIn ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-800'}`}>
                                {isCheckIn ? 'Check In' : 'Check Out'}
                              </span>
                              <span className="font-mono font-bold text-brand-900">{b.booking_code}</span>
                            </div>
                            <p className="font-bold text-stone-800">{b.full_name}</p>
                            <p className="text-[10px] text-stone-400 font-mono">No. Kamar: {b.room_number || 'A-1'} ({b.room_name})</p>
                          </div>
                          <div className="text-right">
                            <span className="block font-mono font-bold text-stone-800">Rp{(b.total_price || 0).toLocaleString('id-ID')}</span>
                            <span className="text-[10px] font-semibold text-stone-500">{b.guests} {lang === 'id' ? 'Tamu' : 'Guests'}</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Right Column: Menunggu Verifikasi */}
              <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-4">
                <h3 className="font-serif font-bold text-brand-950 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600" />
                  <span>{lang === 'id' ? 'Menunggu Verifikasi Pembayaran' : 'Awaiting Payment Verification'}</span>
                </h3>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {(() => {
                    const waitingList = bookings.filter(b => b.status === 'Waiting Verification' || b.status === 'Pending');
                    
                    if (waitingList.length === 0) {
                      return (
                        <div className="p-8 text-center text-stone-400 italic text-xs font-semibold">
                          {lang === 'id' ? 'Tidak ada pembayaran yang butuh verifikasi.' : 'No payments pending verification.'}
                        </div>
                      );
                    }

                    return waitingList.map((b) => (
                      <div key={b.booking_code} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center text-xs">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-brand-900 block">{b.booking_code}</span>
                          <p className="font-bold text-stone-800">{b.full_name}</p>
                          <p className="text-[10px] text-stone-500">Kamar: {b.room_name}</p>
                        </div>
                        <div className="text-right space-y-1.5">
                          <span className="block font-mono font-bold text-stone-800">Rp{(b.total_price || 0).toLocaleString('id-ID')}</span>
                          <button
                            onClick={() => handleTabSelection('bookings')}
                            className="bg-brand-700 hover:bg-brand-800 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                          >
                            {lang === 'id' ? 'Verifikasi' : 'Verify'}
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

            </div>

            {/* Row for Laporan */}
            <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-5">
              <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
                <h3 className="font-serif font-bold text-brand-950 text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-700" />
                  <span>{lang === 'id' ? 'Laporan & Analisis Keterisian Kamar' : 'Reports & Room Analysis'}</span>
                </h3>
                <button
                  onClick={() => handleTabSelection('reports')}
                  className="text-brand-700 hover:text-brand-900 font-bold text-xs inline-flex items-center gap-1 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                  disabled={currentRole !== 'Owner'}
                >
                  <span>{lang === 'id' ? 'Lihat Laporan Lengkap (Owner)' : 'View Full Reports (Owner)'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-stone-700">
                {/* Visual statistics */}
                <div className="space-y-3">
                  <h4 className="text-stone-500 font-bold uppercase text-[10px] tracking-wider mb-2">Persentase Booking Kamar</h4>
                  {ROOMS.map(r => {
                    const count = bookings.filter(b => b.room_id === r.id).length;
                    const percent = bookings.length > 0 ? Math.round((count / bookings.length) * 100) : 0;
                    
                    return (
                      <div key={r.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-800 font-bold">{r.name}</span>
                          <span className="text-brand-900 font-extrabold">{count} Bookings ({percent}%)</span>
                        </div>
                        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-700" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-brand-50/50 rounded-2xl p-5 border border-brand-100 flex flex-col justify-center space-y-3">
                  <h4 className="font-serif font-bold text-brand-900 text-sm">Zegan Homestay Performance Overview</h4>
                  <p className="text-[11px] text-stone-600 font-normal leading-relaxed">
                    {lang === 'id' 
                      ? 'Laporan ini membantu pengelola memantau jenis kamar yang paling diminati tamu. Pastikan kamar yang terlaris selalu dalam kondisi prima dan bersih sebelum check-in dilakukan.'
                      : 'This report helps staff identify top-selling rooms. Ensure bestselling rooms are clean and in pristine condition before guest arrivals.'}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-center pt-2">
                    <div className="bg-white rounded-xl p-2.5 border">
                      <span className="text-[10px] text-stone-400 block font-bold uppercase">Omzet Hari Ini</span>
                      <span className="text-sm font-bold text-emerald-700 block font-serif mt-1">Rp{stats.todayEarnings.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border">
                      <span className="text-[10px] text-stone-400 block font-bold uppercase">Bulan Ini</span>
                      <span className="text-sm font-bold text-brand-800 block font-serif mt-1">Rp{stats.monthEarnings.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* SUBVIEW 2: RESERVATIONS LIST */}
        {activeTab === 'bookings' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                  <h3 className="font-serif font-bold text-brand-950 text-base">Seluruh Data Reservasi</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Kelola, verifikasi pembayaran, atau ekspor laporan CSV.</p>
                </div>
                <button
                  onClick={handleExportBookings}
                  className="bg-brand-700 hover:bg-brand-850 text-white font-bold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Ekspor CSV</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kode booking, nama tamu, no hp, atau nomor kamar..."
                    className="w-full p-2.5 pl-9 border rounded-xl text-xs focus:ring-1 focus:ring-brand-700 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="p-2.5 px-4 border rounded-xl text-xs font-semibold text-stone-600 bg-white"
                  >
                    <option value="All">Semua Status</option>
                    <option value="Pending">Menunggu Pembayaran</option>
                    <option value="Waiting Verification">Menunggu Verifikasi</option>
                    <option value="Paid">Lunas (Paid)</option>
                    <option value="Checked In">Sudah Check-In</option>
                    <option value="Completed">Selesai (Completed)</option>
                    <option value="Cancelled">Dibatalkan</option>
                  </select>
                </div>
              </div>

              {/* Bookings Table */}
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-stone-50 border-b font-bold text-stone-600 uppercase text-[10px] tracking-wider">
                      <th className="p-3">Kode Booking</th>
                      <th className="p-3">Kamar</th>
                      <th className="p-3">Tamu</th>
                      <th className="p-3">Tanggal Menginap</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-stone-600">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-stone-400 italic">Tidak ada data booking yang cocok.</td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr key={b.booking_code} className="hover:bg-stone-50/40">
                          <td className="p-3 font-mono font-bold text-brand-900">{b.booking_code}</td>
                          <td className="p-3">
                            <span className="block font-bold text-stone-800">{b.room_name}</span>
                            <span className="text-[10px] text-stone-400 font-mono">No. Kamar: {b.room_number || 'A-1'}</span>
                          </td>
                          <td className="p-3">
                            <span className="block font-bold text-stone-800">{b.full_name}</span>
                            <span className="text-[10px] text-stone-400 font-mono">{b.phone}</span>
                          </td>
                          <td className="p-3">
                            <span className="block">{b.check_in} s/d {b.check_out}</span>
                            <span className="text-[10px] text-stone-400 font-light block">Kapasitas: {b.guests} Tamu</span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-stone-850">
                            Rp{(b.total_price || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider font-extrabold ${
                              b.status === 'Paid' ? 'bg-green-100 text-green-800' :
                              b.status === 'Checked In' ? 'bg-blue-100 text-blue-800' :
                              b.status === 'Waiting Verification' ? 'bg-amber-100 text-amber-800' :
                              b.status === 'Completed' ? 'bg-stone-100 text-stone-800' :
                              b.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-stone-100 text-stone-600'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-3 flex justify-center gap-1.5 mt-1">
                            <button
                              onClick={() => setSelectedInvoiceBooking(b)}
                              className="p-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md text-[10px] font-bold cursor-pointer transition-all"
                            >
                              Invoice
                            </button>
                            {b.status === 'Waiting Verification' && (
                              <button
                                onClick={() => handleConfirmPaid(b.booking_code)}
                                className="p-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold cursor-pointer transition-all"
                              >
                                Verifikasi
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (() => {
          const monthNames = lang === 'id'
            ? ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
            : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

          const dayNames = lang === 'id' 
            ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

          const handlePrevMonth = () => {
            if (calendarMonth === 0) {
              setCalendarMonth(11);
              setCalendarYear(prev => prev - 1);
            } else {
              setCalendarMonth(prev => prev - 1);
            }
          };

          const handleNextMonth = () => {
            if (calendarMonth === 11) {
              setCalendarMonth(0);
              setCalendarYear(prev => prev + 1);
            } else {
              setCalendarMonth(prev => prev + 1);
            }
          };

          const formatDateString = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
          };

          const getFormattedHumanDate = (dateStr: string) => {
            try {
              const parts = dateStr.split('-');
              if (parts.length !== 3) return dateStr;
              const y = parts[0];
              const mIdx = parseInt(parts[1], 10) - 1;
              const d = parseInt(parts[2], 10);
              return `${d} ${monthNames[mIdx]} ${y}`;
            } catch (e) {
              return dateStr;
            }
          };

          const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1);
          const startDayOfWeek = firstDayOfMonth.getDay();
          const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

          const daysArray = [];
          for (let i = 0; i < startDayOfWeek; i++) {
            daysArray.push(null);
          }
          for (let d = 1; d <= daysInMonth; d++) {
            daysArray.push(new Date(calendarYear, calendarMonth, d));
          }

          return (
            <div className="space-y-6 animate-fadeIn">
              {/* Visi Utama: Monitor Real-time Hari Ini */}
              <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-4">
                <div className="border-b pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-serif font-bold text-brand-950 text-base">Grid Monitor Kamar Real-time</h3>
                    <p className="text-xs text-stone-500 mt-0.5">Kondisi keterisian seluruh unit kamar hari ini.</p>
                  </div>
                  {/* Legenda warna */}
                  <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-stone-600">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-600 rounded-sm"></span><span>{lang === 'id' ? 'Kosong (Available)' : 'Available'}</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-500 rounded-sm"></span><span>{lang === 'id' ? 'Dipesan (Booked / Kuning)' : 'Booked'}</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-rose-600 rounded-sm"></span><span>{lang === 'id' ? 'Terisi (Occupied / CheckedIn)' : 'Occupied'}</span></div>
                  </div>
                </div>

                {/* 9 BIG BOXES */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pt-2">
                  {calendarRoomsList.map((room) => {
                    const statusInfo = getRoomColorStatus(room);
                    const activeBooking = getRoomActiveBooking(room.number);
                    const isLoading = !!loadingRooms[room.id];

                    return (
                      <motion.button
                        whileHover={isLoading ? {} : { scale: 1.03 }}
                        key={room.number}
                        onClick={() => {
                          if (statusInfo.status === 'Booked' && activeBooking) {
                            handleCheckInBooking(room, activeBooking);
                          } else if (statusInfo.status === 'Available' || (statusInfo.status === 'Occupied' && !activeBooking)) {
                            handleManualStatusToggle(room);
                          }
                        }}
                        disabled={isLoading}
                        className={`h-44 rounded-2xl p-5 text-left border flex flex-col justify-between shadow-sm cursor-pointer transition-all ring-1 ${statusInfo.color} ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-lg font-bold tracking-wide font-mono">No. {room.number}</span>
                            <div className="flex items-center gap-1.5">
                              {/* Manage Button */}
                              <button
                                type="button"
                                className="detail-btn hover:bg-black/20 text-white p-1 rounded-md transition-all cursor-pointer mr-0.5"
                                onClick={(e) => {
                                  e.stopPropagation(); // Stop click from toggling status
                                  setSelectedCalendarRoom({ room, statusInfo, activeBooking });
                                  if (activeBooking) {
                                    setEditFormName(activeBooking.full_name);
                                    setEditFormPhone(activeBooking.phone);
                                    setEditFormCheckIn(activeBooking.check_in);
                                    setEditFormCheckOut(activeBooking.check_out);
                                  }
                                  setIsEditingBooking(false);
                                }}
                                title={lang === 'id' ? 'Kelola Detail Booking' : 'Manage Booking Details'}
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-black/10 px-1.5 py-0.5 rounded-md">
                                {isLoading ? '...' : statusInfo.label}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] block opacity-85 mt-1 font-sans">{room.type}</span>
                        </div>

                        {/* Display guest name if occupied or booked */}
                        <div>
                          {activeBooking ? (
                            <div className="space-y-1 border-t border-white/20 pt-2 mt-2">
                              <span className="text-[10px] uppercase opacity-75 font-semibold block tracking-wider">Tamu Aktif</span>
                              <div className="flex justify-between items-center gap-1">
                                <span className="text-xs font-extrabold block truncate max-w-[100px] leading-tight">
                                  👤 {activeBooking.full_name}
                                </span>
                                {statusInfo.status === 'Booked' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCheckInBooking(room, activeBooking);
                                    }}
                                    className="bg-white text-amber-950 hover:bg-amber-100 font-extrabold text-[10px] px-2 py-0.5 rounded-md transition-all shadow-sm shrink-0 cursor-pointer uppercase tracking-wider"
                                  >
                                    Check-in
                                  </button>
                                )}
                              </div>
                              <span className="text-[9px] opacity-80 block font-mono font-medium">
                                📅 In: {activeBooking.check_in}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] italic font-light opacity-85">
                              {isLoading ? (lang === 'id' ? 'Menyimpan...' : 'Saving...') : (room.status === 'Available' ? (lang === 'id' ? 'Siap huni / kosong' : 'Ready / Kosong') : (lang === 'id' ? 'Terisi (Occupied)' : 'Occupied'))}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* SEKSI KALENDER BULANAN & DETAIL KAMAR BERDASARKAN TANGGAL KLIK */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                
                {/* Kolom Kiri: Kalender Bulanan */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-brand-200 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b gap-3">
                    <div>
                      <h4 className="font-serif font-bold text-brand-950 text-base">
                        {lang === 'id' ? 'Kalender Okupansi Bulanan' : 'Monthly Occupancy Calendar'}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {lang === 'id' ? 'Sisa kamar kosong di setiap tanggal bulan ini.' : 'Available vacant rooms for each day of the month.'}
                      </p>
                    </div>

                    {/* Navigasi Bulan */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={handlePrevMonth}
                        type="button"
                        className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 transition-all cursor-pointer bg-white"
                        title={lang === 'id' ? 'Bulan Sebelumnya' : 'Previous Month'}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold font-serif text-brand-950 min-w-[120px] text-center uppercase tracking-wider">
                        {monthNames[calendarMonth]} {calendarYear}
                      </span>
                      <button
                        onClick={handleNextMonth}
                        type="button"
                        className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 transition-all cursor-pointer bg-white"
                        title={lang === 'id' ? 'Bulan Berikutnya' : 'Next Month'}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Kalender Grid */}
                  <div className="space-y-2">
                    {/* Header Hari */}
                    <div className="grid grid-cols-7 gap-1 text-center font-bold">
                      {dayNames.map((dayName, idx) => (
                        <div
                          key={dayName}
                          className={`text-[10px] uppercase tracking-wider py-1 ${
                            idx === 0 ? 'text-rose-600' : idx === 6 ? 'text-brand-700' : 'text-stone-400'
                          }`}
                        >
                          {dayName}
                        </div>
                      ))}
                    </div>

                    {/* Tanggal Grid */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {daysArray.map((day, idx) => {
                        if (!day) {
                          return <div key={`empty-${idx}`} className="bg-stone-50/20 rounded-xl aspect-square border border-transparent" />;
                        }

                        const dateStr = formatDateString(day);
                        const counts = getRoomCountsOnDate(dateStr);
                        const isSelected = selectedCalendarDateStr === dateStr;
                        const isToday = new Date().toISOString().substring(0, 10) === dateStr;

                        return (
                          <button
                            key={dateStr}
                            onClick={() => setSelectedCalendarDateStr(dateStr)}
                            type="button"
                            className={`aspect-square p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'border-brand-700 bg-brand-50/50 ring-2 ring-brand-700 ring-offset-1'
                                : isToday
                                ? 'border-brand-500 bg-brand-50/20'
                                : 'border-stone-100 bg-stone-50/30 hover:bg-stone-50 hover:border-stone-300'
                            }`}
                          >
                            <span className={`text-xs font-bold font-mono leading-none ${
                              isToday ? 'text-brand-700 font-extrabold underline underline-offset-2' : 'text-stone-700'
                            }`}>
                              {day.getDate()}
                            </span>
                            
                            {/* Detailed dynamic indicators */}
                            <div className="w-full mt-1">
                              {/* Desktop / Tablet: Detailed rows with text label & status counts */}
                              <div className="hidden sm:flex flex-col gap-0.5">
                                {/* Kosong - Hijau */}
                                <div className="flex items-center justify-between text-[8px] px-1 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/40 font-bold leading-none">
                                  <span>{lang === 'id' ? 'Kosong' : 'Vacant'}</span>
                                  <span className="bg-emerald-600 text-white rounded px-1 text-[8px] font-mono leading-none font-extrabold">{counts.vacant}</span>
                                </div>
                                {/* Baru Pesan - Kuning */}
                                <div className="flex items-center justify-between text-[8px] px-1 py-0.5 rounded bg-amber-50/80 text-amber-800 border border-amber-200/40 font-bold leading-none">
                                  <span>{lang === 'id' ? 'Pesan' : 'Booked'}</span>
                                  <span className="bg-amber-500 text-amber-950 rounded px-1 text-[8px] font-mono leading-none font-extrabold">{counts.booked}</span>
                                </div>
                                {/* Terisi - Merah */}
                                <div className="flex items-center justify-between text-[8px] px-1 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200/40 font-bold leading-none">
                                  <span>{lang === 'id' ? 'Terisi' : 'Occupied'}</span>
                                  <span className="bg-rose-600 text-white rounded px-1 text-[8px] font-mono leading-none font-extrabold">{counts.occupied}</span>
                                </div>
                              </div>

                              {/* Mobile: Compact color-coded dots with counts */}
                              <div className="flex sm:hidden justify-center items-center gap-0.5 mt-0.5 flex-wrap">
                                <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-850 font-extrabold text-[8px] w-3.5 h-3.5 rounded-full border border-emerald-300" title="Kosong">
                                  {counts.vacant}
                                </span>
                                <span className="inline-flex items-center justify-center bg-amber-100 text-amber-900 font-extrabold text-[8px] w-3.5 h-3.5 rounded-full border border-amber-300" title="Baru Pesan">
                                  {counts.booked}
                                </span>
                                <span className="inline-flex items-center justify-center bg-rose-100 text-rose-900 font-extrabold text-[8px] w-3.5 h-3.5 rounded-full border border-rose-300" title="Terisi">
                                  {counts.occupied}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Keterangan Warna Kalender */}
                  <div className="flex flex-wrap items-center gap-4 pt-3 text-[10px] font-bold uppercase tracking-wider text-stone-600 justify-center border-t border-dashed border-stone-150 mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-emerald-700"></span>
                      <span>{lang === 'id' ? 'Kosong (Hijau)' : 'Vacant (Green)'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600"></span>
                      <span>{lang === 'id' ? 'Baru Pesan (Kuning)' : 'Booked (Yellow)'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-rose-700"></span>
                      <span>{lang === 'id' ? 'Terisi (Merah)' : 'Occupied (Red)'}</span>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Detail per Kamar untuk Tanggal Terpilih */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-brand-200 p-6 space-y-4">
                  <div className="border-b pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h4 className="font-serif font-bold text-brand-950 text-base">
                        {lang === 'id' ? 'Detail Status Kamar' : 'Room Status Details'}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {lang === 'id' ? 'Keterisian kamar pada tanggal:' : 'Room occupancy on date:'}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 bg-brand-50 text-brand-950 border border-brand-200 rounded-full font-mono shrink-0">
                      📅 {getFormattedHumanDate(selectedCalendarDateStr)}
                    </span>
                  </div>

                  {/* Dynamic counts summary statistics for the selected date */}
                  {(() => {
                    const selCounts = getRoomCountsOnDate(selectedCalendarDateStr);
                    return (
                      <div className="grid grid-cols-3 gap-2 bg-stone-50/70 p-2.5 rounded-xl border border-stone-100">
                        {/* Kosong */}
                        <div className="flex flex-col items-center justify-center bg-emerald-50 text-emerald-950 p-1.5 rounded-lg border border-emerald-200/50 text-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">{lang === 'id' ? 'Kosong' : 'Vacant'}</span>
                          <span className="text-base font-extrabold font-mono mt-0.5 text-emerald-600">{selCounts.vacant}</span>
                        </div>
                        {/* Baru Pesan */}
                        <div className="flex flex-col items-center justify-center bg-amber-50/80 text-amber-950 p-1.5 rounded-lg border border-amber-200/50 text-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700">{lang === 'id' ? 'Pesan' : 'Booked'}</span>
                          <span className="text-base font-extrabold font-mono mt-0.5 text-amber-500">{selCounts.booked}</span>
                        </div>
                        {/* Terisi */}
                        <div className="flex flex-col items-center justify-center bg-rose-50 text-rose-950 p-1.5 rounded-lg border border-rose-200/50 text-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700">{lang === 'id' ? 'Terisi' : 'Occupied'}</span>
                          <span className="text-base font-extrabold font-mono mt-0.5 text-rose-600">{selCounts.occupied}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Room status details grid */}
                  <div className="grid grid-cols-2 gap-4 max-h-[360px] overflow-y-auto pr-1">
                    {calendarRoomsList.map((room) => {
                      const statusInfo = getRoomColorStatusOnDate(room, selectedCalendarDateStr);
                      const activeBooking = getRoomActiveBookingOnDate(room.number, selectedCalendarDateStr);

                      return (
                        <div
                          key={`detail-room-${room.number}`}
                          onClick={() => {
                            setSelectedCalendarRoom({ room, statusInfo, activeBooking });
                            if (activeBooking) {
                              setEditFormName(activeBooking.full_name);
                              setEditFormPhone(activeBooking.phone);
                              setEditFormCheckIn(activeBooking.check_in);
                              setEditFormCheckOut(activeBooking.check_out);
                            }
                            setIsEditingBooking(false);
                          }}
                          className={`rounded-xl p-3.5 text-left border flex flex-col justify-between shadow-2xs transition-all cursor-pointer hover:scale-102 ring-1 ${statusInfo.color}`}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold font-mono">No. {room.number}</span>
                              <span className="text-[8px] font-extrabold uppercase tracking-widest bg-black/10 px-1 py-0.5 rounded-sm">
                                {statusInfo.label}
                              </span>
                            </div>
                            <span className="text-[10px] block opacity-85 mt-0.5 leading-tight">{room.type}</span>
                          </div>

                          <div className="mt-3 pt-2 border-t border-white/20">
                            {activeBooking ? (
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold block truncate leading-none">
                                  👤 {activeBooking.full_name}
                                </span>
                                <span className="text-[8px] opacity-80 block font-mono">
                                  📅 In: {activeBooking.check_in}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[9px] italic font-light opacity-80 block text-center">
                                {lang === 'id' ? 'Kosong (Ready)' : 'Available (Ready)'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* SUBVIEW 4: BOOKING OFFLINE FORM */}
        {activeTab === 'offline-booking' && (
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-brand-200 p-6 sm:p-8 space-y-6 shadow-xs animate-fadeIn">
            <div className="border-b pb-4">
              <h3 className="font-serif font-bold text-brand-950 text-lg">Input Reservasi Resepsionis (Offline)</h3>
              <p className="text-xs text-stone-500 mt-0.5">Daftarkan tamu yang datang langsung dan kunci kamar di tanggal yang sama.</p>
            </div>

            <form onSubmit={handleOfflineBookingSubmit} className="space-y-4 text-xs font-semibold text-stone-700">
              <div className="space-y-1">
                <label className="block text-[11px] text-stone-500 uppercase tracking-wider">Nama Tamu *</label>
                <input
                  type="text"
                  value={offlineName}
                  onChange={(e) => setOfflineName(e.target.value)}
                  placeholder="Nama Lengkap Tamu"
                  className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] text-stone-500 uppercase tracking-wider">Email (Opsional)</label>
                  <input
                    type="email"
                    value={offlineEmail}
                    onChange={(e) => setOfflineEmail(e.target.value)}
                    placeholder="guest@mail.com"
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-stone-500 uppercase tracking-wider">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={offlinePhone}
                    onChange={(e) => setOfflinePhone(e.target.value)}
                    placeholder="62812xxxxxx"
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] text-stone-500 uppercase tracking-wider">Pilih Kamar *</label>
                  <select
                    value={offlineRoomNum}
                    onChange={(e) => setOfflineRoomNum(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950 bg-white"
                  >
                    {calendarRoomsList.map(r => (
                      <option key={r.number} value={r.number}>
                        {r.number} - {r.type} ({r.status === 'Available' ? (lang === 'id' ? 'Kosong' : 'Available') : (lang === 'id' ? 'Terisi' : 'Occupied')})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-stone-500 uppercase tracking-wider">Check-In *</label>
                  <input
                    type="date"
                    value={offlineCheckIn}
                    onChange={(e) => setOfflineCheckIn(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-stone-500 uppercase tracking-wider">Check-Out *</label>
                  <input
                    type="date"
                    value={offlineCheckOut}
                    onChange={(e) => setOfflineCheckOut(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] text-stone-500 uppercase tracking-wider">Jumlah Tamu</label>
                  <input
                    type="number"
                    value={offlineGuests}
                    onChange={(e) => setOfflineGuests(Number(e.target.value))}
                    min={1}
                    max={10}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-stone-500 uppercase tracking-wider">Total Harga Diinput (Rp)</label>
                  <input
                    type="text"
                    value={offlinePriceOverride}
                    onChange={(e) => setOfflinePriceOverride(e.target.value)}
                    placeholder="cth: 450000"
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-stone-500 uppercase tracking-wider">Catatan Tambahan</label>
                <textarea
                  value={offlineNotes}
                  onChange={(e) => setOfflineNotes(e.target.value)}
                  placeholder="Butuh extra bantal, kasur tambahan dll"
                  className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950 h-20"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-700 hover:bg-brand-850 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest cursor-pointer transition-all border border-brand-600/25 mt-2"
              >
                Simpan & Kunci Kamar
              </button>
            </form>
          </div>
        )}

        {/* SUBVIEW 5: PAYMENT VERIFICATION */}
        {activeTab === 'confirm-payment' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-4">
              <h3 className="font-serif font-bold text-brand-950 text-base">Reservasi Menunggu Verifikasi Pembayaran</h3>
              <p className="text-xs text-stone-500 mt-0.5">Tinjau bukti pembayaran transfer/QRIS, lalu setujui untuk menerbitkan invoice.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.filter(b => b.status === 'Waiting Verification' || b.status === 'Pending').length === 0 ? (
                  <div className="p-12 text-center text-stone-400 italic col-span-2">Semua pembayaran aman dan terverifikasi. Tidak ada antrean baru.</div>
                ) : (
                  bookings.filter(b => b.status === 'Waiting Verification' || b.status === 'Pending').map((b) => (
                    <div key={b.booking_code} className="border border-brand-100 rounded-2xl p-5 space-y-4 bg-brand-50/10">
                      <div className="flex justify-between items-start border-b border-stone-100 pb-2.5">
                        <div>
                          <span className="text-xs font-mono font-bold text-brand-900">{b.booking_code}</span>
                          <h4 className="font-bold text-stone-900 text-sm mt-0.5">{b.full_name}</h4>
                        </div>
                        <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                          {b.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-stone-500">
                        <div><span className="block text-[10px] text-stone-400">Unit Kamar:</span><span className="font-bold text-stone-800">{b.room_name} ({b.room_number || 'A-1'})</span></div>
                        <div><span className="block text-[10px] text-stone-400">Total Tagihan:</span><span className="font-bold text-brand-850 font-mono">Rp{(b.total_price || 0).toLocaleString('id-ID')}</span></div>
                        <div className="col-span-2"><span className="block text-[10px] text-stone-400">Masa Tinggal:</span><span className="font-bold text-stone-850">{b.check_in} s/d {b.check_out}</span></div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <button
                          onClick={() => handleConfirmPaid(b.booking_code)}
                          className="flex-1 p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                        >
                          Verifikasi Lunas
                        </button>
                        <button
                          onClick={() => handleCancelBooking(b.booking_code)}
                          className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                        >
                          Tolak / Batalkan
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW 6: CHECK IN QUEUE */}
        {activeTab === 'check-in' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-4">
              <h3 className="font-serif font-bold text-brand-950 text-base">Antrean Check-In Hari Ini</h3>
              <p className="text-xs text-stone-500 mt-0.5">Konfirmasi kedatangan tamu hari ini untuk mengubah status kamar menjadi terisi.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.filter(b => b.status === 'Paid').length === 0 ? (
                  <div className="p-12 text-center text-stone-400 italic col-span-2">Tidak ada kedatangan tamu yang dijadwalkan hari ini.</div>
                ) : (
                  bookings.filter(b => b.status === 'Paid').map((b) => (
                    <div key={b.booking_code} className="border border-brand-100 rounded-2xl p-5 space-y-4 bg-brand-50/10">
                      <div className="flex justify-between items-start border-b border-stone-100 pb-2.5">
                        <div>
                          <span className="text-xs font-mono font-bold text-brand-900">{b.booking_code}</span>
                          <h4 className="font-bold text-stone-900 text-sm mt-0.5">{b.full_name}</h4>
                        </div>
                        <span className="text-[10px] bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                          {b.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-stone-500">
                        <div><span className="block text-[10px] text-stone-400">Nomor Kamar:</span><span className="font-bold text-stone-800">{b.room_number || 'A-1'} ({b.room_name})</span></div>
                        <div><span className="block text-[10px] text-stone-400">Kontak:</span><span className="font-bold text-stone-850 font-mono">{b.phone}</span></div>
                        <div className="col-span-2"><span className="block text-[10px] text-stone-400">Periode:</span><span className="font-bold text-stone-800">{b.check_in} s/d {b.check_out}</span></div>
                      </div>

                      <button
                        onClick={() => handleConfirmCheckIn(b.booking_code)}
                        className="w-full p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all mt-1"
                      >
                        Konfirmasi Masuk (Check-In)
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW 7: CHECK OUT QUEUE */}
        {activeTab === 'check-out' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-4">
              <h3 className="font-serif font-bold text-brand-950 text-base">Antrean Check-Out Aktif</h3>
              <p className="text-xs text-stone-500 mt-0.5">Selesaikan kunjungan tamu dan bebaskan status kamar menjadi kosong kembali.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.filter(b => b.status === 'Checked In').length === 0 ? (
                  <div className="p-12 text-center text-stone-400 italic col-span-2">Tidak ada kamar terisi yang dijadwalkan keluar.</div>
                ) : (
                  bookings.filter(b => b.status === 'Checked In').map((b) => (
                    <div key={b.booking_code} className="border border-brand-100 rounded-2xl p-5 space-y-4 bg-brand-50/10">
                      <div className="flex justify-between items-start border-b border-stone-100 pb-2.5">
                        <div>
                          <span className="text-xs font-mono font-bold text-brand-900">{b.booking_code}</span>
                          <h4 className="font-bold text-stone-900 text-sm mt-0.5">{b.full_name}</h4>
                        </div>
                        <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                          {b.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-stone-500">
                        <div><span className="block text-[10px] text-stone-400">Unit Kamar:</span><span className="font-bold text-stone-800">{b.room_number || 'A-1'} ({b.room_name})</span></div>
                        <div><span className="block text-[10px] text-stone-400">Rencana Keluar:</span><span className="font-bold text-stone-800 font-mono">{b.check_out}</span></div>
                      </div>

                      <button
                        onClick={() => handleConfirmCheckOut(b.booking_code)}
                        className="w-full p-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all mt-1"
                      >
                        Konfirmasi Selesai (Check-Out)
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW 8: REPORTS & ANALYSIS (Owner only) */}
        {activeTab === 'reports' && currentRole === 'Owner' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Analysis Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kamar Terlaris (Bestselling rooms) */}
              <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-4">
                <h3 className="font-serif text-base text-brand-950 font-bold">Analisis Kamar Terlaris</h3>
                <div className="space-y-3.5 text-xs font-semibold text-stone-700">
                  {ROOMS.map(r => {
                    const count = bookings.filter(b => b.room_id === r.id).length;
                    const percent = bookings.length > 0 ? Math.round((count / bookings.length) * 100) : 0;
                    
                    return (
                      <div key={r.id} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-stone-800">{r.name}</span>
                          <span className="text-brand-900 font-bold">{count} Bookings ({percent}%)</span>
                        </div>
                        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-700" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Log Audit */}
              <div className="bg-white rounded-2xl border border-brand-200 p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-base text-brand-950 font-bold mb-3">Catatan Audit Operasional Terbaru</h3>
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1 text-[11px] font-semibold text-stone-600">
                    {logs.slice(0, 8).map((l) => (
                      <div key={l.id} className="p-2.5 bg-stone-50 rounded-lg border">
                        <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                          <span>{l.adminName} ({l.role})</span>
                          <span>{new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-stone-850 leading-relaxed font-medium">{l.activity}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (window.confirm('Hapus seluruh riwayat log audit?')) {
                      localStorage.removeItem('zegan_activity_logs');
                      setLogs([]);
                    }
                  }}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-bold transition-all"
                >
                  Clear Logs
                </button>
              </div>
            </div>

            {/* Backups section */}
            <div className="bg-white rounded-2xl border border-brand-200 p-6 text-center space-y-3 max-w-md mx-auto shadow-xs">
              <Database className="w-10 h-10 text-brand-700 mx-auto" />
              <h4 className="font-serif font-bold text-stone-900 text-sm">Unduh Laporan Operasional Resmi</h4>
              <p className="text-xs text-stone-500">Ekspor seluruh riwayat pesanan ke file format Excel-friendly CSV untuk arsip.</p>
              <div className="flex gap-2.5 justify-center pt-2">
                <button
                  onClick={handleExportBookings}
                  className="p-2.5 px-4 rounded-xl bg-brand-700 hover:bg-brand-850 text-white text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Ekspor Laporan (CSV)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW 9: CONFIGURATION SETTINGS */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            
            {/* QRIS Config */}
            <div className="bg-white rounded-2xl border border-brand-200 p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="border-b pb-4">
                <h3 className="font-serif font-bold text-brand-950 text-lg">Konfigurasi Pembayaran QRIS</h3>
                <p className="text-xs text-stone-500 mt-0.5">Ubah rekening merchant, instruksi bayar, atau URL gambar QRIS.</p>
              </div>

              <form onSubmit={handleSaveQris} className="space-y-4 text-xs font-semibold text-stone-700">
                <div className="space-y-1">
                  <label className="block text-[11px] text-stone-500 uppercase tracking-wider">Nama Bank / QRIS Merchant</label>
                  <input
                    type="text"
                    value={qrisForm.bankName}
                    onChange={(e) => setQrisForm({ ...qrisForm, bankName: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-stone-500 uppercase tracking-wider">Nama Rekening Penerima</label>
                  <input
                    type="text"
                    value={qrisForm.accountName}
                    onChange={(e) => setQrisForm({ ...qrisForm, accountName: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-stone-500 uppercase tracking-wider">Gambar QRIS (URL)</label>
                  <input
                    type="text"
                    value={qrisForm.imageUrl}
                    onChange={(e) => setQrisForm({ ...qrisForm, imageUrl: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-stone-500 uppercase tracking-wider">Instruksi Pembayaran</label>
                  <textarea
                    value={qrisForm.instructions}
                    onChange={(e) => setQrisForm({ ...qrisForm, instructions: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950 h-20"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-700 hover:bg-brand-850 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest cursor-pointer transition-all border border-brand-600/35"
                >
                  Simpan Pengaturan Pembayaran
                </button>
              </form>
            </div>

            {/* Fonnte API Config */}
            <div className="bg-white rounded-2xl border border-brand-200 p-6 sm:p-8 space-y-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="border-b pb-4 mb-4">
                  <h3 className="font-serif font-bold text-brand-950 text-lg">Integrasi WhatsApp (Fonnte API)</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Ubah token gateway Fonnte dan susun template pesan lunas.</p>
                </div>

                <form onSubmit={handleSaveWhatsapp} className="space-y-4 text-xs font-semibold text-stone-700">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-stone-500 uppercase tracking-wider">Fonnte API Token</label>
                    <input
                      type="text"
                      value={whatsappForm.token}
                      onChange={(e) => setWhatsappForm({ ...whatsappForm, token: e.target.value })}
                      className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950 font-mono"
                      placeholder="Fonnte Token"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-stone-500 uppercase tracking-wider">No. WhatsApp Admin (Internasional)</label>
                    <input
                      type="text"
                      value={whatsappForm.phoneNumber}
                      onChange={(e) => setWhatsappForm({ ...whatsappForm, phoneNumber: e.target.value })}
                      className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950 font-mono"
                      placeholder="6285188144499"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-stone-500 uppercase tracking-wider">Template Pesan Otomatis</label>
                    <textarea
                      value={whatsappForm.templateMessage}
                      onChange={(e) => setWhatsappForm({ ...whatsappForm, templateMessage: e.target.value })}
                      className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950 h-24"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-700 hover:bg-brand-850 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest cursor-pointer transition-all border border-brand-600/35"
                  >
                    Simpan Pengaturan WhatsApp
                  </button>
                </form>
              </div>

              {/* Sync tools */}
              <div className="mt-6 pt-6 border-t flex flex-col gap-3">
                <span className="block text-[11px] text-stone-400 uppercase tracking-widest font-extrabold text-center">Scheduler Manual</span>
                <button
                  onClick={runSchedulerManual}
                  className="w-full p-3 bg-stone-850 hover:bg-stone-950 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-stone-800 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  <span>Jalankan Scheduler Expiry</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 4. MODALS AND DETAILS OVERLAYS */}

      {/* 8-Room Box Click Popup Drawer */}
      <AnimatePresence>
        {selectedCalendarRoom && (() => {
          const room = selectedCalendarRoom.room;
          const statusInfo = getRoomColorStatusOnDate(room, selectedCalendarDateStr);
          const activeBooking = getRoomActiveBookingOnDate(room.number, selectedCalendarDateStr);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="w-full max-w-lg bg-white rounded-3xl overflow-hidden border shadow-2xl text-stone-800 animate-fadeIn"
              >
                {/* Popup Header with dynamic colors based on status (Hijau = Available, Kuning = Booked, Merah = Occupied) */}
                <div className={`p-6 flex justify-between items-center transition-colors duration-300 ${
                  statusInfo.status === 'Available' ? 'bg-emerald-600 text-white shadow-md' :
                  statusInfo.status === 'Booked' ? 'bg-amber-500 text-amber-950 shadow-md' :
                  'bg-rose-600 text-white shadow-md'
                }`}>
                  <div>
                    <span className={`text-[10px] uppercase tracking-widest font-extrabold block ${
                      statusInfo.status === 'Booked' ? 'text-amber-900/90' : 'text-white/80'
                    }`}>
                      No. Kamar {room.number} • {statusInfo.label}
                    </span>
                    <h3 className="text-lg font-serif font-bold mt-0.5">{room.type}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedCalendarRoom(null)}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      statusInfo.status === 'Booked' ? 'hover:bg-black/10 text-amber-950/70 hover:text-amber-950' : 'hover:bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Popup Content */}
                <div className="p-6 sm:p-8 space-y-6">
                  
                  {/* Active Booking Detail */}
                  {activeBooking ? (
                    isEditingBooking ? (
                      // Edit Booking Inline Form
                      <form onSubmit={(e) => handleEditBookingSubmit(e, activeBooking.booking_code)} className="space-y-4 text-xs font-semibold">
                        <div className="space-y-1">
                          <label className="block text-[10px] text-stone-400 uppercase tracking-wider">Nama Lengkap Tamu</label>
                          <input
                            type="text"
                            value={editFormName}
                            onChange={(e) => setEditFormName(e.target.value)}
                            className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] text-stone-400 uppercase tracking-wider">Nomor WhatsApp</label>
                          <input
                            type="text"
                            value={editFormPhone}
                            onChange={(e) => setEditFormPhone(e.target.value)}
                            className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950 font-mono"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[10px] text-stone-400 uppercase tracking-wider">Check-In Date</label>
                            <input
                              type="date"
                              value={editFormCheckIn}
                              onChange={(e) => setEditFormCheckIn(e.target.value)}
                              className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950 font-mono"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] text-stone-400 uppercase tracking-wider">Check-Out Date</label>
                            <input
                              type="date"
                              value={editFormCheckOut}
                              onChange={(e) => setEditFormCheckOut(e.target.value)}
                              className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-brand-700 text-xs text-brand-950 font-mono"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex gap-2.5 pt-3">
                          <button
                            type="submit"
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                          >
                            Simpan Perubahan
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingBooking(false)}
                            className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                          >
                            Batal
                          </button>
                        </div>
                      </form>
                    ) : (
                      // Display Detail
                      <div className="space-y-4">
                        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/50 space-y-3 text-xs font-semibold">
                          <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-stone-400">Kode Booking:</span>
                            <span className="font-mono font-bold text-brand-900 text-sm">{activeBooking.booking_code}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-400">Nama Tamu:</span>
                            <span className="text-stone-800 font-bold">👤 {activeBooking.full_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-400">No. WhatsApp:</span>
                            <span className="text-stone-800 font-mono">📞 {activeBooking.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-400">Check-In:</span>
                            <span className="text-stone-800">📅 {activeBooking.check_in}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-400">Check-Out:</span>
                            <span className="text-stone-800">📅 {activeBooking.check_out}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-400">Total Harga:</span>
                            <span className="text-brand-900 font-bold font-mono">Rp{(activeBooking.total_price || 0).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-stone-400">Status Pembayaran:</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold ${
                              activeBooking.status === 'Paid' ? 'bg-green-100 text-green-800' :
                              activeBooking.status === 'Checked In' ? 'bg-blue-100 text-blue-800' :
                              activeBooking.status === 'Waiting Verification' ? 'bg-amber-100 text-amber-800' :
                              'bg-stone-100 text-stone-600'
                            }`}>
                              {activeBooking.status}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Actions for Room Box Popup */}
                        <div className="grid grid-cols-2 gap-3.5 pt-2 text-xs">
                          
                          {/* 1. Konfirmasi Pembayaran */}
                          <button
                            onClick={() => handleConfirmPaid(activeBooking.booking_code)}
                            disabled={activeBooking.status === 'Paid' || activeBooking.status === 'Checked In' || activeBooking.status === 'Completed'}
                            className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 disabled:pointer-events-none text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Bayar Lunas</span>
                          </button>

                          {/* 2. Check In */}
                          <button
                            onClick={() => handleConfirmCheckIn(activeBooking.booking_code)}
                            disabled={activeBooking.status !== 'Paid'}
                            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-45 disabled:pointer-events-none text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            <Clock className="w-4 h-4" />
                            <span>Check In</span>
                          </button>

                          {/* 3. Check Out */}
                          <button
                            onClick={() => handleConfirmCheckOut(activeBooking.booking_code)}
                            disabled={activeBooking.status !== 'Checked In'}
                            className="p-3 bg-stone-800 hover:bg-stone-900 disabled:opacity-45 disabled:pointer-events-none text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Check Out</span>
                          </button>

                          {/* 4. Edit Booking */}
                          <button
                            onClick={() => setIsEditingBooking(true)}
                            className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5 border"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Edit Booking</span>
                          </button>

                          {/* 5. Batalkan Booking */}
                          <button
                            onClick={() => handleCancelBooking(activeBooking.booking_code)}
                            disabled={activeBooking.status === 'Cancelled' || activeBooking.status === 'Completed'}
                            className="p-3 bg-red-50 hover:bg-red-100 disabled:opacity-45 disabled:pointer-events-none text-red-600 border border-red-200 rounded-xl font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5 col-span-2 mt-1"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Batalkan Reservasi</span>
                          </button>

                        </div>
                      </div>
                    )
                  ) : (
                    <div className="py-8 text-center space-y-4">
                      <p className="text-sm font-semibold text-emerald-600">Unit Kamar kosong dan siap dipesan sekarang juga.</p>
                      <button
                        onClick={() => {
                          setOfflineRoomNum(room.number);
                          setSelectedCalendarRoom(null);
                          handleTabSelection('offline-booking');
                        }}
                        className="px-5 py-3 bg-brand-700 hover:bg-brand-850 text-white rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all"
                      >
                        Buat Booking Offline Di Sini
                      </button>
                    </div>
                  )}

                  {/* Manual Room Status Override Section */}
                  <div className="border-t border-stone-200 pt-4 mt-4 space-y-3 bg-stone-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-stone-800">Ubah Status Kamar Manual</h4>
                        <p className="text-[10px] text-stone-500">Gunakan untuk memblokir/membuka kamar di luar sistem booking.</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase ${
                        room.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {room.status === 'Available' ? 'KOSONG / AVAILABLE' : 'TERISI / OCCUPIED'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleManualStatusToggle(room)}
                      className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                        room.status === 'Available' 
                          ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>
                        {room.status === 'Available' ? 'Tandai Sebagai TERISI (Occupied)' : 'Tandai Sebagai KOSONG (Available)'}
                      </span>
                    </button>
                  </div>

                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Invoice Modal Overlay */}
      {selectedInvoiceBooking && (
        <InvoicePDF
          booking={selectedInvoiceBooking}
          isOpen={selectedInvoiceBooking !== null}
          onClose={() => setSelectedInvoiceBooking(null)}
          lang={lang}
        />
      )}

      {/* Floating Toast Notification for Real-Time Service Signals & Cafe Orders */}
      <AnimatePresence>
        {newSignalToast && (
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-stone-950 border border-amber-500/40 text-stone-100 rounded-2xl shadow-2xl p-4 flex gap-3.5 items-start"
          >
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/25 shrink-0">
              <span className="text-xl animate-bounce block">🛎️</span>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex justify-between items-start gap-2">
                <p className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest">
                  {lang === 'id' ? 'PESANAN CAFE / LAYANAN BARU!' : 'NEW CAFE ORDER / REQUEST!'}
                </p>
                <button 
                  onClick={() => setNewSignalToast(null)}
                  className="text-stone-500 hover:text-stone-300 transition-colors p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-bold text-white leading-tight">
                {newSignalToast.guestName} ({newSignalToast.roomNumber})
              </p>
              <p className="text-xs text-stone-300 leading-normal line-clamp-2">
                {newSignalToast.details}
              </p>
              <div className="pt-2.5 flex gap-2">
                <a 
                  href="/service-signals"
                  className="bg-amber-700 hover:bg-amber-800 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors inline-block"
                >
                  {lang === 'id' ? 'Papan Sinyal' : 'Service Board'}
                </a>
                <button
                  onClick={() => setNewSignalToast(null)}
                  className="bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-400 font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors"
                >
                  {lang === 'id' ? 'Tutup' : 'Dismiss'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
