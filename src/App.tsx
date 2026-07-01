import { useState, useEffect } from 'react';
import { Room, Language } from './types';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Facilities from './components/Facilities';
import CafeMenuModal from './components/CafeMenuModal';
import Rooms from './components/Rooms';
import RoomDetailModal from './components/RoomDetailModal';
import BookingLookupModal from './components/BookingLookupModal';
import Gallery from './components/Gallery';
import BookingForm from './components/BookingForm';
import Reviews from './components/Reviews';
import About from './components/About';
import Footer from './components/Footer';
import CustomerPortal from './components/CustomerPortal';
import AdminPortal from './components/AdminPortal';
import StaffLogin from './components/StaffLogin';
import ServiceSignals from './components/ServiceSignals';

export default function App() {
  const [lang, setLang] = useState<Language>('id');
  const [view, setView] = useState<'home' | 'customer-portal'>('home');
  const [isCafeMenuOpen, setIsCafeMenuOpen] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  // Prefill States for Booking Form
  const [prefilledRoomId, setPrefilledRoomId] = useState('deluxe');
  const [prefilledCheckIn, setPrefilledCheckIn] = useState('');
  const [prefilledCheckOut, setPrefilledCheckOut] = useState('');
  const [prefilledGuests, setPrefilledGuests] = useState(2);
  const [formScrollTrigger, setFormScrollTrigger] = useState(0);

  // Path-based routing state
  const [path, setPath] = useState(() => window.location.pathname);
  
  // Session authentication state (persisted in localStorage)
  const [staffUser, setStaffUser] = useState<{ name: string; username: string; role: 'Owner' | 'Receptionist' | 'Admin' } | null>(() => {
    try {
      const saved = localStorage.getItem('zegan_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync Supabase Auth session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { supabase } = await import('./lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const staff = {
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Staff',
          username: user.email || '',
          role: user.user_metadata?.role || 'Receptionist'
        };
        setStaffUser(staff);
        localStorage.setItem('zegan_admin_session', JSON.stringify(staff));
      }
    };
    checkSession().catch(console.error);
  }, []);

  // Keep path state in sync with browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Safe router navigation helper
  const navigateTo = (newPath: string) => {
    window.history.pushState(null, '', newPath);
    setPath(newPath);
  };

  // Redirect to login if accessing protected routes without session, and handle /admin redirect to /dashboard
  useEffect(() => {
    const protectedPaths = ['/dashboard', '/admin', '/reports', '/settings', '/calendar'];
    if (protectedPaths.includes(path)) {
      if (!staffUser) {
        navigateTo('/staff-login');
      } else if (path === '/admin') {
        navigateTo('/dashboard');
      }
    }
  }, [path, staffUser]);

  // Trigger scroll to booking form
  const scrollToBooking = () => {
    setView('home');
    setTimeout(() => {
      const section = document.getElementById('booking');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  // From quick search hero widget
  const handleQuickSearch = (checkIn: string, checkOut: string, guests: number) => {
    setPrefilledCheckIn(checkIn);
    setPrefilledCheckOut(checkOut);
    setPrefilledGuests(guests);
    setFormScrollTrigger(prev => prev + 1);
    scrollToBooking();
  };

  // From room showcase "Book Now" buttons
  const handleBookRoom = (roomId: string) => {
    setPrefilledRoomId(roomId);
    setFormScrollTrigger(prev => prev + 1);
    scrollToBooking();
  };

  // Determine if we are on a protected staff path
  const isProtectedPath = ['/dashboard', '/admin', '/reports', '/settings', '/calendar'].includes(path);

  if (path === '/service-signals' || path === '/sinyal') {
    return (
      <ServiceSignals
        lang={lang}
        onGoHome={() => navigateTo('/')}
      />
    );
  }

  if (path === '/staff-login') {
    return (
      <StaffLogin
        lang={lang}
        onLoginSuccess={(user) => {
          setStaffUser(user);
          localStorage.setItem('zegan_admin_session', JSON.stringify(user));
          navigateTo('/dashboard');
        }}
        onGoHome={() => navigateTo('/')}
      />
    );
  }

  if (isProtectedPath) {
    if (!staffUser) {
      return (
        <div className="min-h-screen bg-stone-900 flex items-center justify-center text-stone-400 font-mono text-xs">
          Redirecting to login...
        </div>
      );
    }

    // Role authorization check (Owner and Receptionist only)
    const isAuthorized = staffUser.role === 'Owner' || staffUser.role === 'Receptionist';
    if (!isAuthorized) {
      return (
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-400 p-6 text-center">
          <div className="w-16 h-16 bg-red-950/50 text-red-400 rounded-2xl flex items-center justify-center mb-6 border border-red-900/50 shadow-lg">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-wide mb-2">
            403 - Akses Ditolak
          </h1>
          <p className="text-xs text-stone-400 max-w-md leading-relaxed font-light mb-8">
            Maaf, Anda tidak memiliki hak akses untuk membuka halaman Dashboard. Halaman ini hanya dapat diakses oleh Owner atau Receptionist.
          </p>
          <button
            onClick={async () => {
              const { signOutStaff } = await import('./services/authService');
              await signOutStaff();
              setStaffUser(null);
              localStorage.removeItem('zegan_admin_session');
              navigateTo('/staff-login');
            }}
            className="bg-brand-700 hover:bg-brand-600 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest cursor-pointer transition-all border border-brand-600/30"
          >
            Kembali & Ganti Akun
          </button>
        </div>
      );
    }

    // Determine default tab based on URL path
    let initialTab: 'dashboard' | 'bookings' | 'calendar' | 'reports' | 'settings' = 'dashboard';
    if (path === '/calendar') initialTab = 'calendar';
    if (path === '/reports') initialTab = 'reports';
    if (path === '/settings') initialTab = 'settings';

    return (
      <AdminPortal
        lang={lang}
        staffUser={staffUser}
        initialTab={initialTab}
        onLogout={async () => {
          const { signOutStaff } = await import('./services/authService');
          await signOutStaff();
          setStaffUser(null);
          localStorage.removeItem('zegan_admin_session');
          navigateTo('/staff-login');
        }}
        onTabChange={(tab) => {
          // Sync URL with the active tab inside admin panel
          if (tab === 'dashboard') navigateTo('/dashboard');
          else if (tab === 'calendar') navigateTo('/calendar');
          else if (tab === 'reports') navigateTo('/reports');
          else if (tab === 'settings') navigateTo('/settings');
          else navigateTo('/dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-brand-50 font-sans antialiased text-brand-950">
      
      {/* 1. Header / Navbar */}
      <Navbar 
        lang={lang} 
        setLang={setLang} 
        onBookClick={scrollToBooking} 
        onLookupClick={() => setView('customer-portal')}
        view={view}
        setView={(newView) => setView(newView as any)}
      />

      {/* Main View Switcher Render */}
      {view === 'home' ? (
        <>
          {/* 2. Hero Section */}
          <Hero 
            lang={lang} 
            onQuickSearch={handleQuickSearch} 
          />

          {/* 3. Facilities Section */}
          <Facilities 
            lang={lang} 
            onOpenMenu={() => setIsCafeMenuOpen(true)} 
          />

          {/* 4. Rooms Showcase */}
          <Rooms 
            lang={lang} 
            onSelectRoom={(room) => setSelectedRoom(room)} 
            onBookRoom={handleBookRoom} 
          />

          {/* 5. Visual Gallery */}
          <Gallery 
            lang={lang} 
          />

          {/* 6. Active Booking Form with interactive sub-calculations */}
          <BookingForm 
            lang={lang}
            prefilledRoomId={prefilledRoomId}
            prefilledCheckIn={prefilledCheckIn}
            prefilledCheckOut={prefilledCheckOut}
            prefilledGuests={prefilledGuests}
            formScrollTrigger={formScrollTrigger}
            onGoToCustomerPortal={() => setView('customer-portal')}
          />

          {/* 7. Javanese Story & Map Info */}
          <About 
            lang={lang} 
          />

          {/* 8. Client Testimonials & Review Submission */}
          <Reviews 
            lang={lang} 
          />
        </>
      ) : (
        <div className="pt-24 sm:pt-28 min-h-[80vh]">
          <CustomerPortal lang={lang} />
        </div>
      )}

      {/* 9. Footer */}
      <Footer 
        lang={lang} 
      />

      {/* 10. Modals / Overlays */}
      <CafeMenuModal 
        isOpen={isCafeMenuOpen} 
        onClose={() => setIsCafeMenuOpen(false)} 
        lang={lang} 
      />

      <RoomDetailModal 
        room={selectedRoom} 
        isOpen={selectedRoom !== null} 
        onClose={() => setSelectedRoom(null)} 
        lang={lang} 
        onBookNow={handleBookRoom}
      />

      <BookingLookupModal 
        isOpen={isLookupOpen} 
        onClose={() => setIsLookupOpen(false)} 
        lang={lang} 
      />

    </div>
  );
}
