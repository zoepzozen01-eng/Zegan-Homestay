import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, Clock, XCircle, AlertTriangle, Check, Coffee, MessageSquare, 
  Plus, Trash2, Volume2, VolumeX, RefreshCw, User, Lock, ChefHat, Truck, Sparkles, Bell, Home, CreditCard
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logActivity } from '../services/adminService';
import { ServiceSignal } from '../types';

interface ServiceSignalsProps {
  lang: 'id' | 'en';
  onGoHome: () => void;
}

export default function ServiceSignals({ lang, onGoHome }: ServiceSignalsProps) {
  // Active view tab: 'signals' or 'rooms'
  const [activeTab, setActiveTab] = useState<'signals' | 'rooms'>('signals');

  // Service Signals queue
  const [signals, setSignals] = useState<ServiceSignal[]>([]);
  const [loadingSignals, setLoadingSignals] = useState(true);

  // Rooms list state
  const [dbRooms, setDbRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Manual Signal Dialog State
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualRoom, setManualRoom] = useState('101');
  const [manualGuest, setManualGuest] = useState('');
  const [manualType, setManualType] = useState<'food' | 'message'>('food');
  const [manualDetails, setManualDetails] = useState('');

  // Auto-refresh interval ref
  useEffect(() => {
    // Load data initially
    loadRoomsAndSignals();

    // Setup periodic polling every 5 seconds for real-time vibe
    const interval = setInterval(() => {
      loadRoomsAndSignals(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Load signals and rooms from local backup and Supabase
  const loadRoomsAndSignals = async (silent = false) => {
    if (!silent) {
      setLoadingSignals(true);
      setLoadingRooms(true);
    }
    try {
      // 1. Fetch Rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('id, room_number, status, room_types(name)')
        .order('room_number', { ascending: true });

      let mappedRooms = [];
      if (!roomsError && roomsData && roomsData.length > 0) {
        mappedRooms = roomsData.map((r: any) => ({
          id: r.id,
          number: r.room_number,
          type: r.room_types?.name || 'Kamar Zegan',
          status: r.status || 'Available'
        }));
      } else {
        // Fallback to offline rooms if db fails
        mappedRooms = [
          { id: '1', number: '101', type: 'Kamar Ekonomi', status: 'Available' },
          { id: '2', number: '102', type: 'Standard Room Pratama', status: 'Available' },
          { id: '3', number: '103', type: 'Standard Room Pratama', status: 'Available' },
          { id: '4', number: '104', type: 'Standard Room Madya', status: 'Available' },
          { id: '5', number: '105', type: 'Standard Room Madya', status: 'Available' },
          { id: '6', number: '106', type: 'Standard Room Utama', status: 'Available' },
          { id: '7', number: '107', type: 'Standard Room Utama', status: 'Available' },
          { id: '8', number: '108', type: 'Family Room', status: 'Available' },
          { id: '9', number: 'Rumah-1', type: 'Rumah Tradisional', status: 'Available' },
        ];
      }

      // Ensure rooms 1 to 8 are present in the list for express ordering
      const r1to8 = ['1', '2', '3', '4', '5', '6', '7', '8'].map(num => ({
        id: `rm-custom-${num}`,
        number: num,
        type: 'Kamar Mandiri',
        status: 'Available' as const
      }));

      mappedRooms = [
        ...r1to8,
        ...mappedRooms.filter((rm: any) => !['1', '2', '3', '4', '5', '6', '7', '8'].includes(rm.number))
      ];

      // Sort rooms nicely
      mappedRooms.sort((a: any, b: any) => {
        if (a.number.includes('Rumah') && !b.number.includes('Rumah')) return 1;
        if (!a.number.includes('Rumah') && b.number.includes('Rumah')) return -1;
        return a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' });
      });
      setDbRooms(mappedRooms);
      setLoadingRooms(false);

      // 2. Fetch Service Signals from localStorage
      const localSignalsRaw = localStorage.getItem('zegan_service_signals');
      let currentSignals: ServiceSignal[] = [];
      if (localSignalsRaw) {
        currentSignals = JSON.parse(localSignalsRaw);
      } else {
        // Seed default signals if empty
        currentSignals = [
          {
            id: 'sig-1',
            booking_code: 'ZGN9981',
            room_number: '102',
            guest_name: 'Pak Rahmad',
            type: 'food',
            details: '2x Wedang Uwuh (Gula Batu), 1x Mendoan Hangat',
            status: 'pending',
            created_at: new Date(Date.now() - 15 * 60000).toISOString()
          },
          {
            id: 'sig-2',
            booking_code: 'ZGN7251',
            room_number: '105',
            guest_name: 'Mbak Dita',
            type: 'message',
            details: 'Minta tambahan 1 selimut tebal dan 1 handuk mandi bersih',
            status: 'preparing',
            created_at: new Date(Date.now() - 8 * 60000).toISOString()
          }
        ];
        localStorage.setItem('zegan_service_signals', JSON.stringify(currentSignals));
      }

      // Check if there are NEW pending signals to trigger sound
      const hasNewPending = currentSignals.some(s => s.status === 'pending' && !signals.find(prev => prev.id === s.id));
      if (hasNewPending && soundEnabled && !loadingSignals && silent) {
        playAlertSound();
      }

      setSignals(currentSignals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setLoadingSignals(false);
    } catch (err) {
      console.error('Error loading service dashboard:', err);
    }
  };

  // Play gentle alert audio signal
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  };

  // Quick change room status with big touch target buttons
  const handleRoomStatusUpdate = async (roomId: string, roomNumber: string, newStatus: 'Available' | 'Occupied' | 'Dirty') => {
    try {
      // Clean occupied_until if making available/clean
      let occupiedUntilVal = null;
      if (newStatus === 'Occupied') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().substring(0, 10);
        occupiedUntilVal = `${tomorrowStr} 12:00:00`;
      }

      // Translate Dirty state to Occupied with special indicator or customize
      // To match DB constraints, rooms table has 'Available' and 'Occupied'.
      // We will map 'Dirty' as 'Available' with a special local flag or simply write to DB if supported.
      // Let's write 'Occupied' for Terisi, and 'Available' for Kosong. 
      // We can also store cleaning states in a local state backup to display 'Butuh Pembersihan'!
      const statusValueForDb = newStatus === 'Occupied' ? 'Occupied' : 'Available';

      // Update in Supabase
      const { error } = await supabase
        .from('rooms')
        .update({ 
          status: statusValueForDb,
          occupied_until: occupiedUntilVal
        })
        .eq('room_number', roomNumber);

      if (error) throw error;

      // Log activity
      logActivity(
        'Staff Sinyal',
        'Receptionist',
        `Papan Sinyal: Kamar ${roomNumber} diubah statusnya menjadi ${newStatus === 'Available' ? 'Kosong' : newStatus === 'Dirty' ? 'Butuh Pembersihan' : 'Terisi'}`
      );

      // Save custom housekeeping states locally to persistent localStorage
      const customStates = JSON.parse(localStorage.getItem('zegan_room_cleaning_states') || '{}');
      customStates[roomNumber] = newStatus;
      localStorage.setItem('zegan_room_cleaning_states', JSON.stringify(customStates));

      // Refresh data
      loadRoomsAndSignals(true);
    } catch (err) {
      console.error('Error updating room status:', err);
      // Fallback update locally anyway
      const customStates = JSON.parse(localStorage.getItem('zegan_room_cleaning_states') || '{}');
      customStates[roomNumber] = newStatus;
      localStorage.setItem('zegan_room_cleaning_states', JSON.stringify(customStates));
      loadRoomsAndSignals(true);
    }
  };

  // Cycle states: Pending -> Preparing -> Delivered -> Completed (and archived)
  const handleSignalStatusUpdate = (signalId: string, nextStatus: 'pending' | 'preparing' | 'delivered' | 'completed') => {
    try {
      const localSignalsRaw = localStorage.getItem('zegan_service_signals');
      if (localSignalsRaw) {
        let currentSignals: ServiceSignal[] = JSON.parse(localSignalsRaw);
        
        if (nextStatus === 'completed') {
          // Remove or archive
          const completedSignal = currentSignals.find(s => s.id === signalId);
          currentSignals = currentSignals.filter(s => s.id !== signalId);
          
          if (completedSignal) {
            logActivity(
              'Staff Sinyal',
              'Receptionist',
              `Sinyal Layanan Kamar ${completedSignal.room_number} (${completedSignal.type === 'food' ? 'Pesanan Makanan' : 'Pesan Layanan'}) selesai dilayani.`
            );
          }
        } else {
          currentSignals = currentSignals.map(s => {
            if (s.id === signalId) {
              return { ...s, status: nextStatus };
            }
            return s;
          });
        }

        localStorage.setItem('zegan_service_signals', JSON.stringify(currentSignals));
        setSignals(currentSignals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send "Food is ready / Sudah Dibuat" notification to guest
  const handleSendFoodReadyNotification = (signal: ServiceSignal) => {
    try {
      const rawNotifs = localStorage.getItem('zegan_food_notifications') || '[]';
      const notifs = JSON.parse(rawNotifs);
      
      const exists = notifs.some((n: any) => n.signal_id === signal.id);
      if (!exists) {
        const newNotif = {
          id: `notif-${Date.now()}`,
          signal_id: signal.id,
          booking_code: signal.booking_code,
          room_number: signal.room_number,
          guest_name: signal.guest_name,
          details: signal.details,
          message: lang === 'id' 
            ? `Pesanan makanan Anda (${signal.details}) telah selesai dibuat dan siap disajikan/diantar!` 
            : `Your food order (${signal.details}) has been prepared and is ready for serving/delivery!`,
          created_at: new Date().toISOString(),
          read: false
        };
        notifs.push(newNotif);
        localStorage.setItem('zegan_food_notifications', JSON.stringify(notifs));
        
        // Log in Activity Logs for staff transparency
        logActivity(
          'Staff Sinyal',
          'Chef/Kitchen',
          `Mengirim notifikasi ke ${signal.guest_name} (${signal.room_number}): Pesanan ${signal.details} Selesai Dibuat.`
        );

        // Auto-progress status to preparing if currently pending
        if (signal.status === 'pending') {
          handleSignalStatusUpdate(signal.id, 'preparing');
        } else {
          // Force a list reload / state update
          const localSignalsRaw = localStorage.getItem('zegan_service_signals');
          if (localSignalsRaw) {
            const parsed: ServiceSignal[] = JSON.parse(localSignalsRaw);
            setSignals(parsed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
          }
        }

        // Trigger storage event manually so other tabs/components listen
        window.dispatchEvent(new Event('storage'));
        
        alert(lang === 'id' 
          ? 'Notifikasi "Makanan Sudah Dibuat" berhasil dikirim ke tamu!' 
          : 'Notification "Food is Prepared" successfully dispatched to guest!');
      } else {
        alert(lang === 'id' 
          ? 'Notifikasi untuk pesanan ini sudah pernah dikirim sebelumnya.' 
          : 'Notification for this order has already been sent.');
      }
    } catch (err) {
      console.error('Failed to dispatch food notification:', err);
    }
  };

  // Confirm offline payment for cafe food signals
  const handleConfirmOfflinePayment = (signalId: string) => {
    try {
      const localSignalsRaw = localStorage.getItem('zegan_service_signals');
      if (localSignalsRaw) {
        let currentSignals: ServiceSignal[] = JSON.parse(localSignalsRaw);
        currentSignals = currentSignals.map(s => {
          if (s.id === signalId) {
            return { ...s, is_paid: true } as any;
          }
          return s;
        });
        localStorage.setItem('zegan_service_signals', JSON.stringify(currentSignals));
        setSignals(currentSignals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        
        // Log activity
        const target = currentSignals.find(s => s.id === signalId);
        if (target) {
          logActivity(
            'Staff Sinyal',
            'Receptionist',
            `Konfirmasi Pembayaran Offline untuk pesanan Kamar ${target.room_number} (${target.details}) Berhasil.`
          );
        }
        
        // Trigger storage event manually so other tabs/components listen
        window.dispatchEvent(new Event('storage'));
        
        alert(lang === 'id' 
          ? 'Pembayaran offline untuk pesanan ini berhasil dikonfirmasi!' 
          : 'Offline payment for this order successfully confirmed!');
      }
    } catch (err) {
      console.error('Failed to confirm offline payment:', err);
    }
  };

  // Submit manual signal created by staff/waiter
  const handleCreateManualSignal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDetails.trim()) return;

    const newSignal: ServiceSignal = {
      id: `manual-sig-${Date.now()}`,
      booking_code: `OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`,
      room_number: manualRoom,
      guest_name: manualGuest.trim() || 'Tamu Kamar',
      type: manualType,
      details: manualDetails.trim(),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      const localSignalsRaw = localStorage.getItem('zegan_service_signals') || '[]';
      const currentSignals: ServiceSignal[] = JSON.parse(localSignalsRaw);
      currentSignals.push(newSignal);
      localStorage.setItem('zegan_service_signals', JSON.stringify(currentSignals));
      
      setSignals(currentSignals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setIsManualOpen(false);
      setManualDetails('');
      setManualGuest('');

      // Play sound
      if (soundEnabled) {
        playAlertSound();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Retrieve housekeeping state
  const getHousekeepingState = (roomNumber: string, defaultDbStatus: string) => {
    const customStates = JSON.parse(localStorage.getItem('zegan_room_cleaning_states') || '{}');
    if (customStates[roomNumber]) {
      return customStates[roomNumber];
    }
    return defaultDbStatus === 'Occupied' ? 'Occupied' : 'Available';
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans selection:bg-brand-700 selection:text-white pt-20">
      
      {/* MAIN ACTIVE STAFF SIGNAL DASHBOARD */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-950 p-5 rounded-3xl border border-stone-800/80">
          <div>
            <span className="text-[10px] text-amber-500 font-extrabold tracking-widest uppercase block flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" /> MONITOR LAYANAN INSTAN STAFF
            </span>
            <h1 className="text-xl font-serif font-bold text-white tracking-tight mt-0.5">
              Papan Sinyal Zegan Homestay
            </h1>
          </div>

          {/* Quick Utility Tools for Staff */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                soundEnabled 
                  ? 'bg-amber-950/40 border-amber-800/40 text-amber-400' 
                  : 'bg-stone-900 border-stone-800 text-stone-500'
              }`}
              title="Toggle Notifikasi Suara"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
              <span>{soundEnabled ? 'Suara: AKTIF' : 'Suara: MATI'}</span>
            </button>

            <button
              onClick={() => loadRoomsAndSignals()}
              className="p-2.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Segarkan</span>
            </button>

            <button
              onClick={() => setIsManualOpen(true)}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold shadow-sm shadow-emerald-950"
            >
              <Plus className="w-4 h-4" />
              <span>Sinyal Manual</span>
            </button>

            <button
              onClick={onGoHome}
              className="p-2.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-400 hover:text-stone-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <Home className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          </div>
          </div>

          {/* Tab Selection */}
          <div className="flex gap-2 bg-stone-950 p-1.5 rounded-2xl border border-stone-850">
            <button
              onClick={() => setActiveTab('signals')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'signals'
                  ? 'bg-brand-700 text-white shadow-sm shadow-black/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Sinyal Layanan & Makanan ({signals.filter(s => s.status !== 'completed').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'rooms'
                  ? 'bg-brand-700 text-white shadow-sm shadow-black/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Status Penuh Kamar ({dbRooms.length})</span>
            </button>
          </div>

          {/* 3. SUB VIEW 1: SIGNALS QUEUE (PESANAN MAKANAN DAN PESAN TAMU) */}
          {activeTab === 'signals' && (
            <div className="space-y-4">
              
              {loadingSignals ? (
                <div className="text-center py-20 text-stone-500 font-mono text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-brand-600" />
                  Memuat antrean sinyal layanan...
                </div>
              ) : signals.length === 0 ? (
                <div className="text-center py-16 bg-stone-950 rounded-3xl border border-dashed border-stone-800 p-8 space-y-4 max-w-xl mx-auto">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                  <h3 className="text-lg font-serif font-bold text-white">Semua Sinyal Selesai Dilayani!</h3>
                  <p className="text-xs text-stone-400 font-light leading-relaxed">
                    Tidak ada pesanan makanan atau pesan layanan aktif dari tamu saat ini. Staff bisa beristirahat sejenak dengan tenang.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {signals.map((sig) => {
                    const isFood = sig.type === 'food';
                    const isPending = sig.status === 'pending';
                    const isPreparing = sig.status === 'preparing';
                    const isDelivered = sig.status === 'delivered';

                    return (
                      <motion.div
                        layout
                        key={sig.id}
                        className={`bg-stone-950 border rounded-3xl p-5 sm:p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                          isPending ? 'border-amber-500/40 shadow-lg shadow-amber-950/20' :
                          isPreparing ? 'border-blue-500/40 shadow-lg shadow-blue-950/10' :
                          'border-stone-800'
                        }`}
                      >
                        {/* Corner Glow effect for Pending */}
                        {isPending && (
                          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-xl pointer-events-none" />
                        )}

                        {/* Top Metadata Row */}
                        <div className="flex justify-between items-start gap-3 pb-4 border-b border-stone-900">
                          <div className="flex items-center gap-3">
                            <span className="w-12 h-12 bg-brand-800/30 text-white font-serif font-black text-lg rounded-2xl flex items-center justify-center border border-brand-800/20">
                              {sig.room_number}
                            </span>
                            <div>
                              <span className="text-[10px] text-stone-500 uppercase tracking-widest block font-bold">
                                Kode Booking: {sig.booking_code}
                              </span>
                              <span className="text-sm font-semibold text-white block mt-0.5">
                                👤 {sig.guest_name}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            {/* Timestamp */}
                            <span className="text-[10px] text-stone-500 font-mono block">
                              {new Date(sig.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            
                            {/* Custom Label badge */}
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider mt-1.5 ${
                              isFood ? 'bg-amber-950 text-amber-400 border border-amber-900/30' : 'bg-blue-950 text-blue-400 border border-blue-900/30'
                            }`}>
                              {isFood ? '🍔 Pesanan Cafe' : '💬 Pesan Kamar'}
                            </span>
                          </div>
                        </div>

                        {/* Middle Details - Big text for easier reading on a tablet/mobile */}
                        <div className="py-4 my-1 space-y-3">
                          <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-medium bg-stone-900/50 p-3.5 rounded-2xl border border-stone-850">
                            {sig.details}
                          </p>

                          {isFood && (
                            <div className="space-y-2.5">
                              {/* 💳 Offline Payment Confirmation Section */}
                              <div className="flex items-center justify-between bg-stone-900/40 p-3 rounded-xl border border-stone-850/60 text-xs">
                                <span className="text-stone-400 font-bold">Pembayaran Cafe:</span>
                                {(sig as any).is_paid ? (
                                  <span className="text-emerald-400 font-extrabold flex items-center gap-1 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-900/30">
                                    <Check className="w-3.5 h-3.5" /> LUNAS OFFLINE
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-amber-500 font-extrabold bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-900/20 text-[10px]">BELUM BAYAR</span>
                                    <button
                                      onClick={() => handleConfirmOfflinePayment(sig.id)}
                                      className="bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-black px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                                    >
                                      <CreditCard className="w-3.5 h-3.5 text-stone-950" />
                                      <span>Konfirmasi Offline</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => handleSendFoodReadyNotification(sig)}
                                className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-950/20 cursor-pointer"
                              >
                                <Bell className="w-4 h-4" />
                                <span>Kirim Notif "Sudah Dibuat"</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions Row - Giant buttons for "gaptek" staff */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-stone-900/50">
                          <div className="flex justify-between items-center text-xs pb-1">
                            <span className="text-stone-500">Status Sinyal:</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold ${
                              isPending ? 'bg-amber-100 text-amber-850' :
                              isPreparing ? 'bg-blue-100 text-blue-850' :
                              isDelivered ? 'bg-emerald-100 text-emerald-850' :
                              'bg-stone-800 text-stone-400'
                            }`}>
                              {isPending ? '🔴 BELUM DIPROSES' : isPreparing ? '⚡ SEDANG DISIAPKAN' : isDelivered ? '🛵 TELAH DIANTAR' : '✅ SELESAI'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {/* Action 1: Siapkan / Prepare */}
                            <button
                              onClick={() => handleSignalStatusUpdate(sig.id, 'preparing')}
                              disabled={!isPending}
                              className={`py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                                isPending 
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm' 
                                  : 'bg-stone-900 text-stone-600 disabled:opacity-40'
                              }`}
                            >
                              <ChefHat className="w-4 h-4" />
                              <span>Siapkan</span>
                            </button>

                            {/* Action 2: Antar / Deliver / Diantar */}
                            <button
                              onClick={() => handleSignalStatusUpdate(sig.id, 'delivered')}
                              disabled={isDelivered}
                              className={`py-3 rounded-xl font-bold uppercase text-[9px] tracking-tight cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                                !isDelivered 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                                  : 'bg-stone-900 text-stone-600 disabled:opacity-40'
                              }`}
                            >
                              <Truck className="w-4 h-4" />
                              <span>Telah Diantar</span>
                            </button>

                            {/* Action 3: Selesai / Complete */}
                            <button
                              onClick={() => handleSignalStatusUpdate(sig.id, 'completed')}
                              className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest cursor-pointer transition-all flex flex-col items-center justify-center gap-1 shadow-sm"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Selesai</span>
                            </button>
                          </div>
                        </div>

                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. SUB VIEW 2: ROOM STATUS GRID (TAMPILAN STATUS PENUH KAMAR) */}
          {activeTab === 'rooms' && (
            <div className="space-y-4">
              {loadingRooms ? (
                <div className="text-center py-20 text-stone-500 font-mono text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-brand-600" />
                  Memuat data status kamar...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {dbRooms.map((room) => {
                    const cleaningStatus = getHousekeepingState(room.number, room.status);
                    
                    return (
                      <div 
                        key={room.id}
                        className="bg-stone-950 border border-stone-850 rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-md overflow-hidden relative"
                      >
                        {/* Color accent bars based on status */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                          cleaningStatus === 'Available' ? 'bg-emerald-500' :
                          cleaningStatus === 'Dirty' ? 'bg-amber-500' :
                          'bg-rose-500'
                        }`} />

                        {/* Top Info */}
                        <div className="flex justify-between items-start pt-2">
                          <div>
                            <span className="text-[10px] text-stone-500 uppercase tracking-widest font-extrabold block">
                              {room.type}
                            </span>
                            <span className="text-2xl font-serif font-black text-white mt-1 block">
                              No. Kamar {room.number}
                            </span>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1 ${
                            cleaningStatus === 'Available' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30' :
                            cleaningStatus === 'Dirty' ? 'bg-amber-950 text-amber-400 border border-amber-900/30' :
                            'bg-rose-950 text-rose-400 border border-rose-900/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              cleaningStatus === 'Available' ? 'bg-emerald-400' :
                              cleaningStatus === 'Dirty' ? 'bg-amber-400' :
                              'bg-rose-400'
                            }`} />
                            {cleaningStatus === 'Available' ? 'Ready / Bersih' :
                             cleaningStatus === 'Dirty' ? 'Dirty / Kotor' :
                             'Stay / Terisi'}
                          </span>
                        </div>

                        {/* Housekeeping Action Buttons - Giant, tactile, easy for anyone to tap */}
                        <div className="space-y-1.5 pt-2 border-t border-stone-900/50">
                          <span className="block text-[10px] text-stone-500 uppercase tracking-widest font-bold mb-1">
                            Setel Status Kamar:
                          </span>
                          
                          <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                            {/* Available (Ready & Clean) */}
                            <button
                              onClick={() => handleRoomStatusUpdate(room.id, room.number, 'Available')}
                              className={`py-2 px-1 rounded-lg transition-all cursor-pointer border text-[10px] uppercase font-bold text-center ${
                                cleaningStatus === 'Available'
                                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                                  : 'bg-stone-900 hover:bg-stone-850 border-stone-800 text-stone-400'
                              }`}
                            >
                              🟢 Ready
                            </button>

                            {/* Dirty (Needs Housekeeping) */}
                            <button
                              onClick={() => handleRoomStatusUpdate(room.id, room.number, 'Dirty')}
                              className={`py-2 px-1 rounded-lg transition-all cursor-pointer border text-[10px] uppercase font-bold text-center ${
                                cleaningStatus === 'Dirty'
                                  ? 'bg-amber-600 border-amber-500 text-white shadow-xs'
                                  : 'bg-stone-900 hover:bg-stone-850 border-stone-800 text-stone-400'
                              }`}
                            >
                              🟡 Kotor
                            </button>

                            {/* Occupied */}
                            <button
                              onClick={() => handleRoomStatusUpdate(room.id, room.number, 'Occupied')}
                              className={`py-2 px-1 rounded-lg transition-all cursor-pointer border text-[10px] uppercase font-bold text-center ${
                                cleaningStatus === 'Occupied'
                                  ? 'bg-rose-600 border-rose-500 text-white shadow-xs'
                                  : 'bg-stone-900 hover:bg-stone-850 border-stone-800 text-stone-400'
                              }`}
                            >
                              🔴 Terisi
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* manual signal model overlay */}
          <AnimatePresence>
            {isManualOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-md bg-stone-950 border border-stone-850 rounded-3xl overflow-hidden p-6 text-stone-200"
                >
                  <div className="flex justify-between items-center pb-4 border-b border-stone-900">
                    <h3 className="text-base font-serif font-bold text-white flex items-center gap-1.5">
                      <Plus className="w-5 h-5 text-emerald-500" /> Tambah Sinyal Manual
                    </h3>
                    <button
                      onClick={() => setIsManualOpen(false)}
                      className="text-stone-400 hover:text-white transition-colors cursor-pointer text-xs"
                    >
                      Tutup
                    </button>
                  </div>

                  <form onSubmit={handleCreateManualSignal} className="space-y-4 pt-4 text-xs font-semibold">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-stone-500 uppercase tracking-wider">Nomor Kamar</label>
                        <select
                          value={manualRoom}
                          onChange={(e) => setManualRoom(e.target.value)}
                          className="w-full p-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 focus:ring-1 focus:ring-brand-700"
                        >
                          {dbRooms.map(r => (
                            <option key={r.id} value={r.number}>Kamar {r.number}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-stone-500 uppercase tracking-wider">Tipe Sinyal</label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setManualType('food')}
                            className={`flex-1 py-2 rounded-lg font-bold border transition-all cursor-pointer ${
                              manualType === 'food' 
                                ? 'bg-amber-950/40 border-amber-800 text-amber-400' 
                                : 'bg-stone-900 border-stone-850 text-stone-500'
                            }`}
                          >
                            🍔 Makanan
                          </button>
                          <button
                            type="button"
                            onClick={() => setManualType('message')}
                            className={`flex-1 py-2 rounded-lg font-bold border transition-all cursor-pointer ${
                              manualType === 'message' 
                                ? 'bg-blue-950/40 border-blue-800 text-blue-400' 
                                : 'bg-stone-900 border-stone-850 text-stone-500'
                            }`}
                          >
                            💬 Pesan
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-stone-500 uppercase tracking-wider">Nama Tamu (Opsional)</label>
                      <input
                        type="text"
                        value={manualGuest}
                        onChange={(e) => setManualGuest(e.target.value)}
                        placeholder="Misal: Pak Rahmad"
                        className="w-full p-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 focus:ring-1 focus:ring-brand-700 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-stone-500 uppercase tracking-wider">Detail Permintaan / Pesanan</label>
                      <textarea
                        value={manualDetails}
                        onChange={(e) => setManualDetails(e.target.value)}
                        placeholder="Misal: 2 Nasi Goreng, 1 Teh Manis Hangat..."
                        rows={3}
                        className="w-full p-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 focus:ring-1 focus:ring-brand-700 font-medium"
                        required
                      />
                    </div>

                    <div className="flex gap-2.5 pt-3">
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        Kirim Sinyal
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsManualOpen(false)}
                        className="px-5 py-3 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

      </div>

    </div>
  );
}
