import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  VolumeX, 
  Maximize2,
  Tv, 
  DoorOpen,
  LogOut,
  Bell,
  Clock,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  Play,
  HelpCircle
} from 'lucide-react';
import { ServiceSignal, Booking, Language } from '../types';
import officialLogoImg from '../assets/images/zegan_official_logo_1787811644426.jpg';

interface StaffPortalProps {
  lang?: Language;
  onGoHome?: () => void;
}

export default function StaffPortal({ onGoHome }: StaffPortalProps) {
  const [signals, setSignals] = useState<ServiceSignal[]>([]);
  const [todayBookings, setTodayBookings] = useState<{ checkIns: Booking[]; checkOuts: Booking[]; staying: Booking[] }>({
    checkIns: [],
    checkOuts: [],
    staying: []
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [recentAlert, setRecentAlert] = useState<{
    type: 'checkin' | 'order' | 'booking';
    title: string;
    description: string;
    room: string;
    time: string;
  } | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Store known IDs to detect newly arrived check-ins, bookings, or signals
  const knownSignalIdsRef = useRef<Set<string>>(new Set());
  const knownCheckInCodesRef = useRef<Set<string>>(new Set());
  const knownAllBookingCodesRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Digital clock update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Context reference
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // 1. Audio Chime for CHECK-IN (Hotel Reception Fanfare)
  const playCheckInSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [
        { freq: 523.25, time: 0, duration: 0.35 },    // C5
        { freq: 659.25, time: 0.18, duration: 0.35 }, // E5
        { freq: 783.99, time: 0.36, duration: 0.4 },  // G5
        { freq: 1046.50, time: 0.54, duration: 0.8 }  // C6 (High ring)
      ];

      notes.forEach(({ freq, time, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
        
        gain.gain.setValueAtTime(0.01, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + duration);

        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + duration);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  // 2. Audio Chime for ROOM SERVICE / FOOD ORDER (Cafe Bell Ding-Dong)
  const playOrderSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [
        { freq: 880, time: 0, duration: 0.45 },     // A5
        { freq: 1318.51, time: 0.2, duration: 0.7 } // E6
      ];

      notes.forEach(({ freq, time, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
        
        gain.gain.setValueAtTime(0.01, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.45, ctx.currentTime + time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + duration);

        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + duration);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  // 3. Audio Chime for NEW BOOKING (Pemesanan Baru)
  const playNewBookingSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [
        { freq: 659.25, time: 0, duration: 0.3 },    // E5
        { freq: 880, time: 0.15, duration: 0.3 },    // A5
        { freq: 1174.66, time: 0.3, duration: 0.6 }  // D6
      ];

      notes.forEach(({ freq, time, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
        
        gain.gain.setValueAtTime(0.01, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + duration);

        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + duration);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  // Voice Speech Announcement
  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // cancel previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  // Trigger alert with sound + voice + visual banner
  const triggerAlert = (type: 'checkin' | 'order' | 'booking', title: string, description: string, room: string) => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setRecentAlert({ type, title, description, room, time: timeStr });

    if (type === 'checkin') {
      playCheckInSound();
      setTimeout(() => {
        speakText(`Perhatian. Ada kedatangan tamu kamar ${room}. ${title}`);
      }, 700);
    } else if (type === 'order') {
      playOrderSound();
      setTimeout(() => {
        speakText(`Pesanan baru dari kamar ${room}. ${title}`);
      }, 600);
    } else if (type === 'booking') {
      playNewBookingSound();
      setTimeout(() => {
        speakText(`Ada pemesanan kamar baru masuk. Kamar ${room}.`);
      }, 600);
    }

    // Auto clear alert banner after 12 seconds
    setTimeout(() => {
      setRecentAlert(prev => prev && prev.title === title ? null : prev);
    }, 12000);
  };

  // User interaction to unlock audio
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    setAudioUnlocked(true);
    playCheckInSound();
  };

  // Load and compare data
  const loadData = () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Process Signals (Room Orders / Services)
      const localSignalsRaw = localStorage.getItem('zegan_service_signals');
      let currentSignals: ServiceSignal[] = localSignalsRaw ? JSON.parse(localSignalsRaw) : [];
      currentSignals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const activeSignals = currentSignals.filter(s => s.status !== 'completed');

      if (!isFirstLoadRef.current) {
        // Find new signals that were not in known set
        const newSignals = activeSignals.filter(s => !knownSignalIdsRef.current.has(s.id));
        if (newSignals.length > 0) {
          const newest = newSignals[0];
          const typeName = newest.type === 'food' ? 'Pesanan Cafe / Makanan' : 'Bantuan Layanan Kamar';
          triggerAlert('order', `${typeName}: ${newest.details}`, newest.details, newest.room_number);
        }
      }

      // Update known signal IDs
      knownSignalIdsRef.current = new Set(activeSignals.map(s => s.id));
      setSignals(activeSignals);

      // 2. Process Bookings & Check-Ins
      const localBookingsRaw = localStorage.getItem('zegan_bookings');
      if (localBookingsRaw) {
        const allBookings: Booking[] = JSON.parse(localBookingsRaw);

        const checkIns = allBookings.filter(b => b.check_in === todayStr && b.status !== 'Cancelled');
        const checkOuts = allBookings.filter(b => b.check_out === todayStr && b.status !== 'Cancelled');
        const staying = allBookings.filter(b => b.check_in < todayStr && b.check_out > todayStr && b.status !== 'Cancelled');

        if (!isFirstLoadRef.current) {
          // Check for NEW Check-In for Today
          const newTodayCheckIns = checkIns.filter(b => !knownCheckInCodesRef.current.has(b.booking_code));
          if (newTodayCheckIns.length > 0) {
            const newestCheckIn = newTodayCheckIns[0];
            triggerAlert(
              'checkin', 
              `Tamu ${newestCheckIn.full_name} (${newestCheckIn.guests || 2} Orang)`, 
              `Kamar ${newestCheckIn.room_name} - Segera Siapkan Kamar`, 
              newestCheckIn.room_number || 'A-1'
            );
          } else {
            // Check for ANY new booking in general
            const newGeneralBookings = allBookings.filter(b => !knownAllBookingCodesRef.current.has(b.booking_code) && b.status !== 'Cancelled');
            if (newGeneralBookings.length > 0) {
              const newestBooking = newGeneralBookings[0];
              triggerAlert(
                'booking',
                `Pemesanan Baru: ${newestBooking.full_name}`,
                `Check-in tgl ${newestBooking.check_in} s/d ${newestBooking.check_out}`,
                newestBooking.room_number || 'A-1'
              );
            }
          }
        }

        // Update known booking codes
        knownCheckInCodesRef.current = new Set(checkIns.map(b => b.booking_code));
        knownAllBookingCodesRef.current = new Set(allBookings.map(b => b.booking_code));

        setTodayBookings({ checkIns, checkOuts, staying });
      }

      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
      }

    } catch (err) {
      console.error('Error loading staff display data:', err);
    }
  };

  useEffect(() => {
    loadData();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'zegan_service_signals' || e.key === 'zegan_bookings') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Auto-refresh continuously every 2 seconds
    const interval = setInterval(loadData, 2000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [soundEnabled, voiceEnabled]);

  // Fullscreen toggle for TV display
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.warn(e));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div 
      onClick={() => {
        if (!audioUnlocked) unlockAudio();
      }}
      className="min-h-screen lg:h-screen lg:max-h-screen bg-stone-950 text-stone-100 font-sans flex flex-col justify-between selection:bg-amber-500 selection:text-stone-950 lg:overflow-hidden relative"
    >
      
      {/* TOP NOTIFICATION POPUP BANNER (WHEN CHECKIN / ORDER OCCURS) */}
      <AnimatePresence>
        {recentAlert && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.95 }}
            className="fixed top-3 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 max-w-2xl w-full"
          >
            <div className={`p-4 sm:p-5 rounded-2xl shadow-2xl border-3 flex items-center justify-between gap-4 backdrop-blur-md ${
              recentAlert.type === 'checkin'
                ? 'bg-emerald-950/95 border-emerald-400 text-white shadow-emerald-950/80 ring-4 ring-emerald-500/30'
                : recentAlert.type === 'order'
                ? 'bg-amber-950/95 border-amber-400 text-white shadow-amber-950/80 ring-4 ring-amber-500/30'
                : 'bg-blue-950/95 border-blue-400 text-white shadow-blue-950/80 ring-4 ring-blue-500/30'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-serif font-black text-2xl shrink-0 shadow-lg ${
                  recentAlert.type === 'checkin' ? 'bg-emerald-400 text-stone-950' : recentAlert.type === 'order' ? 'bg-amber-400 text-stone-950' : 'bg-blue-400 text-stone-950'
                }`}>
                  {recentAlert.room}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-white/20 tracking-wider">
                      {recentAlert.type === 'checkin' ? '🛎️ TAMU CHECK-IN BARU' : recentAlert.type === 'order' ? '🍔 PESANAN KAMAR BARU' : '📅 PEMESANAN BARU'}
                    </span>
                    <span className="text-xs text-stone-300 font-mono">{recentAlert.time} WIB</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black mt-0.5 leading-tight text-white">
                    {recentAlert.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-200 line-clamp-1 opacity-90">
                    {recentAlert.description}
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRecentAlert(null);
                }}
                className="p-2 text-stone-300 hover:text-white rounded-lg bg-black/30 hover:bg-black/50 text-xs font-bold cursor-pointer shrink-0"
              >
                Tutup ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP COMPACT HEADER */}
      <header className="bg-stone-900/95 border-b border-stone-800 px-4 sm:px-6 py-2.5 flex flex-wrap justify-between items-center shrink-0 z-20 gap-3">
        
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg border border-amber-400/40 p-0.5 bg-stone-950 shrink-0">
            <img
              src={officialLogoImg}
              alt="Zegan Homestay & Cafe"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-serif font-bold text-white tracking-wide">
                Layar Informasi Karyawan
              </h1>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-amber-400 font-medium">
              Zegan Homestay &amp; Cafe • Suara Bel &amp; Notifikasi Otomatis Aktif
            </p>
          </div>
        </div>

        {/* Center: Live Audio Test Shortcuts */}
        <div className="flex items-center gap-2 bg-stone-950/80 px-3 py-1.5 rounded-xl border border-stone-800 text-xs">
          <span className="text-stone-400 text-[11px] font-semibold hidden sm:inline">Uji Suara:</span>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playCheckInSound();
              speakText("Tes bel check-in berhasil.");
            }}
            className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
            title="Tes Suara Check-In"
          >
            <span>🛎️ Bel Check-In</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playOrderSound();
              speakText("Tes bel pesanan kamar berhasil.");
            }}
            className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700/60 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
            title="Tes Suara Pesanan"
          >
            <span>🍔 Bel Pesanan</span>
          </button>
        </div>

        {/* Right: Big Clock & Sound Toggle & Fullscreen */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-end bg-stone-950/90 px-3 py-1 rounded-xl border border-stone-800">
            <span className="text-lg sm:text-xl font-mono font-black text-amber-400 tracking-wider">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
            </span>
            <span className="text-[10px] text-stone-400">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) {
                playCheckInSound();
              }
            }}
            className={`p-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              soundEnabled 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md' 
                : 'bg-stone-800 border-stone-700 text-stone-500'
            }`}
            title="Nyalakan / Matikan Suara"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-300 transition-colors cursor-pointer"
            title="Layar Penuh TV"
          >
            <Maximize2 className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN UNIFIED DASHBOARD */}
      <main className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-3 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:overflow-hidden">
        
        {/* ========================================================= */}
        {/* KOLOM 1 (45% Lebar TV): KEDATANGAN TAMU HARI INI (CHECK-IN) */}
        {/* ========================================================= */}
        <section className="lg:col-span-5 bg-stone-900/70 rounded-2xl p-3.5 sm:p-4 border-2 border-emerald-500/40 flex flex-col justify-between shadow-xl overflow-hidden">
          
          {/* Header */}
          <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-stone-800 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold border border-emerald-500/30">
                🚪
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-serif font-black text-white tracking-wide flex items-center gap-2">
                  <span>KEDATANGAN TAMU (CHECK-IN)</span>
                  <span className="bg-emerald-500 text-stone-950 font-mono text-[11px] font-bold px-2 py-0.2 rounded-full">
                    {todayBookings.checkIns.length}
                  </span>
                </h2>
              </div>
            </div>
            <span className="text-[11px] text-emerald-400 font-extrabold uppercase bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
              🔊 Bunyi Saat Tiba
            </span>
          </div>

          {/* List Content */}
          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 max-h-[450px] lg:max-h-none">
            {todayBookings.checkIns.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-stone-500 bg-stone-950/40 rounded-xl border border-stone-800/80">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mb-2" />
                <p className="text-sm font-bold text-stone-300">Belum Ada Check-In Baru Hari Ini</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Layar akan otomatis berbunyi bel saat ada pesanan atau check-in baru.</p>
              </div>
            ) : (
              todayBookings.checkIns.map((b, idx) => (
                <div 
                  key={idx}
                  className="bg-stone-950 p-3.5 rounded-xl border-2 border-emerald-500/60 shadow-md flex items-center justify-between gap-3 hover:border-emerald-400 transition-colors"
                >
                  {/* Big Room Box */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-emerald-500 text-stone-950 font-serif font-black text-xl sm:text-2xl flex flex-col items-center justify-center shadow-lg shrink-0 leading-tight">
                    <span className="text-[9px] uppercase tracking-tighter opacity-80 -mb-1">KAMAR</span>
                    {b.room_number || 'A-1'}
                  </div>

                  {/* Guest Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-emerald-400 block truncate">
                      {b.room_name}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-amber-400 leading-tight truncate">
                      👤 {b.full_name}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-stone-300 mt-0.5">
                      <span className="font-semibold">👥 {b.guests || 2} Orang</span>
                      <span>•</span>
                      <span>Menginap s/d <strong className="text-white">{b.check_out}</strong></span>
                    </div>
                    {b.special_requests && (
                      <p className="text-[10px] text-stone-400 italic truncate mt-0.5">
                        Catatan: "{b.special_requests}"
                      </p>
                    )}
                  </div>

                  {/* Status Action Label */}
                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-600 rounded-lg text-[10px] sm:text-xs font-black block">
                      SIAPKAN
                    </span>
                    <span className="text-[9px] text-stone-500 block mt-1 font-mono">
                      Masuk 14:00
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 text-[10px] text-stone-500 border-t border-stone-800/80 shrink-0 flex justify-between">
            <span>Standar Check-In: Mulai 14.00 WIB</span>
            <span className="text-emerald-400">Audio Notifikasi Otomatis</span>
          </div>

        </section>

        {/* ========================================================= */}
        {/* KOLOM 2 (35% Lebar TV): PERMINTAAN & PESANAN DARI KAMAR */}
        {/* ========================================================= */}
        <section className="lg:col-span-4 bg-stone-900/70 rounded-2xl p-3.5 sm:p-4 border-2 border-amber-500/50 flex flex-col justify-between shadow-xl overflow-hidden">
          
          {/* Header */}
          <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-stone-800 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-bold border border-amber-500/30">
                🛎️
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-serif font-black text-white tracking-wide flex items-center gap-2">
                  <span>PESANAN & PANGGILAN</span>
                  <span className="bg-amber-500 text-stone-950 font-mono text-[11px] font-bold px-2 py-0.2 rounded-full">
                    {signals.length}
                  </span>
                </h2>
              </div>
            </div>
            <span className="text-[11px] text-amber-400 font-extrabold uppercase bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800">
              🔊 Bunyi Bel
            </span>
          </div>

          {/* List Content */}
          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 max-h-[450px] lg:max-h-none">
            {signals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-stone-500 bg-stone-950/40 rounded-xl border border-stone-800/80">
                <CheckCircle2 className="w-10 h-10 text-amber-500/40 mb-2" />
                <p className="text-sm font-bold text-stone-300">Tidak Ada Pesanan Kamar</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Layar akan berbunyi lonceng otomatis saat tamu memesan makanan Cafe / minta bantuan.</p>
              </div>
            ) : (
              signals.map((sig) => {
                const isFood = sig.type === 'food';
                return (
                  <div
                    key={sig.id}
                    className="bg-stone-950 p-3.5 rounded-xl border-2 border-amber-500 shadow-md flex flex-col justify-between gap-2 relative overflow-hidden"
                  >
                    {/* Top Row */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-11 h-11 rounded-lg bg-amber-500 text-stone-950 font-serif font-black text-xl flex items-center justify-center shrink-0">
                          {sig.room_number}
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block">
                            KAMAR NO. {sig.room_number}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {sig.guest_name}
                          </h4>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono font-bold text-stone-400 block">
                          {new Date(sig.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase mt-0.5 ${
                          isFood ? 'bg-amber-950 text-amber-300' : 'bg-blue-950 text-blue-300'
                        }`}>
                          {isFood ? '🍔 Makanan' : '💬 Layanan'}
                        </span>
                      </div>
                    </div>

                    {/* Order Details in Big Bold Text */}
                    <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
                      <p className="text-xs sm:text-sm font-bold text-stone-100 leading-snug whitespace-pre-line">
                        {sig.details}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 text-[10px] text-stone-500 border-t border-stone-800/80 shrink-0 flex justify-between">
            <span>Audio Bel Lonceng: Aktif</span>
            <span className="text-amber-400">Sinkron Otomatis</span>
          </div>

        </section>

        {/* ========================================================= */}
        {/* KOLOM 3 (20% Lebar TV): TAMU PULANG (CHECK-OUT) */}
        {/* ========================================================= */}
        <section className="lg:col-span-3 bg-stone-900/70 rounded-2xl p-3.5 sm:p-4 border border-stone-800 flex flex-col justify-between shadow-xl overflow-hidden">
          
          {/* Header */}
          <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-stone-800 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-sm font-bold border border-rose-500/30">
                🧹
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-serif font-black text-white tracking-wide flex items-center gap-2">
                  <span>CHECK-OUT HARI INI</span>
                  <span className="bg-rose-500 text-stone-950 font-mono text-[11px] font-bold px-2 py-0.2 rounded-full">
                    {todayBookings.checkOuts.length}
                  </span>
                </h2>
              </div>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 space-y-2 overflow-y-auto pr-1 max-h-[450px] lg:max-h-none">
            {todayBookings.checkOuts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-stone-500 bg-stone-950/40 rounded-xl border border-stone-800/80">
                <p className="text-xs font-semibold text-stone-400">Tidak Ada Tamu Pulang Hari Ini</p>
              </div>
            ) : (
              todayBookings.checkOuts.map((b, idx) => (
                <div 
                  key={idx}
                  className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 font-bold text-sm flex items-center justify-center shrink-0">
                      {b.room_number || 'A-1'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {b.full_name}
                      </h4>
                      <span className="text-[10px] text-stone-400 block truncate">
                        {b.room_name}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-md text-[9px] font-black shrink-0 text-center">
                    BERSIHKAN<br/>SETELAH 12.00
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 text-[10px] text-stone-500 border-t border-stone-800/80 shrink-0 text-center">
            Maksimal Check-Out: 12.00 WIB
          </div>

        </section>

      </main>

      {/* 3. COMPACT BOTTOM FOOTER */}
      <footer className="bg-stone-900/90 border-t border-stone-800 px-4 py-2 text-xs text-stone-400 flex flex-col sm:flex-row justify-between items-center gap-1 shrink-0">
        <p className="flex items-center gap-2 text-[11px]">
          <Tv className="w-3.5 h-3.5 text-amber-400" />
          <span>Layar Karyawan Mode Monitor TV: Otomatis berbunyi saat ada Check-In, Pemesanan Kamar, dan Pesanan Cafe.</span>
        </p>
        <span className="text-[10px] text-amber-400 font-mono">
          Zegan Homestay TV Alert System
        </span>
      </footer>

    </div>
  );
}
