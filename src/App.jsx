import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './store/useAuth';
import LandingDiscover from './pages/LandingDiscover';
import PropertyDetail from './pages/PropertyDetail';
import ListingWizard from './pages/ListingWizard';
import BookingDashboard from './pages/BookingDashboard';
import BookingCheckout from './pages/BookingCheckout';
import ChatRoom from './pages/ChatRoom';
import Login from './pages/Login';
import Register from './pages/Register';
import DebugAuth from './pages/DebugAuth';
import AdminDashboard from './pages/AdminDashboard';
import Favorites from './pages/Favorites';
import GlobalChatbot from './components/common/GlobalChatbot';
import NotificationBell from './components/common/NotificationBell';
import { useFavorites } from './store/useFavorites';
import { useNotifications } from './store/useNotifications';
import { Home, Calendar, MessageSquare, PlusCircle, LogOut, KeyRound, Shield, Heart } from 'lucide-react';

function Navigation() {
  const { profile, signOut, getProfileCompleteness } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const completeness = getProfileCompleteness();

  return (
    <nav className="bg-brand-section border-b border-brand-border px-4 py-3 sm:px-6 sticky top-0 z-[1010] shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 text-brand-green hover:text-brand-green-deep transition-all duration-300">
          <div className="bg-brand-green/10 border border-brand-green/30 p-1.5 rounded-lg">
            <Home className="w-5 h-5 text-brand-green" />
          </div>
          <span className="font-bold font-sans text-lg tracking-wider text-brand-text">
            Rent<span className="text-brand-green">Ease</span>
          </span>
        </Link>

        {/* NAVIGATION LINKS */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold uppercase tracking-wider">
          <Link to="/" className="text-brand-secondary hover:text-brand-text px-2.5 py-2 transition-colors">
            Discover
          </Link>
          <Link to="/favorites" className="text-brand-secondary hover:text-brand-text px-2.5 py-2 flex items-center gap-1 transition-colors">
            <Heart size={13} /> Favorites
          </Link>
          
          {profile && (
            <>
              <Link to="/bookings" className="text-brand-secondary hover:text-brand-text px-2.5 py-2 flex items-center gap-1 transition-colors">
                <Calendar size={13} /> Leases
              </Link>
              
              {profile.role === 'LANDLORD' && (
                <Link to="/create-listing" className="text-brand-green hover:text-brand-green-deep px-2.5 py-2 flex items-center gap-1 transition-colors">
                  <PlusCircle size={13} /> List Property
                </Link>
              )}

              {profile.role === 'ADMIN' && (
                <Link to="/admin" className="text-brand-green hover:text-brand-green-deep px-2.5 py-2 flex items-center gap-1 transition-colors">
                  <Shield size={13} /> Admin Panel
                </Link>
              )}
            </>
          )}
        </div>

        {/* PROFILE ACTIONS & SESSION STATUS */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          {profile ? (
            <div className="flex items-center gap-3.5">
              {/* Profile completeness meter */}
              <div className="hidden md:flex flex-col items-end space-y-0.5">
                <span className="text-[10px] text-brand-secondary font-medium">Profile completeness</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1 bg-brand-bg rounded-full overflow-hidden border border-brand-border">
                    <div className="h-full bg-brand-green" style={{ width: `${completeness}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-brand-green">{completeness}%</span>
                </div>
              </div>

              {/* User Identity avatar */}
              <img
                src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                alt={profile.full_name}
                className="w-8 h-8 rounded-full border border-brand-border object-cover"
                title={`${profile.full_name} (${profile.role})`}
              />

              <button
                onClick={handleSignOut}
                className="text-brand-secondary hover:text-brand-error p-1.5 transition-colors"
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                className="bg-brand-bg hover:bg-brand-border text-brand-text px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1 border border-brand-border transition-all"
              >
                <KeyRound size={12} /> Login
              </Link>
              <Link
                to="/register"
                className="bg-brand-green hover:bg-brand-green-deep text-brand-dark px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}

function Logout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    async function performLogout() {
      await signOut();
      localStorage.removeItem('rentease_current_user');
      navigate('/login');
    }
    performLogout();
  }, [signOut, navigate]);
  return <div className="p-8 text-center text-brand-secondary text-xs">Logging out...</div>;
}

function App() {
  const { initSession, profile } = useAuth();
  const { loadFavorites, favoriteIds } = useFavorites();
  const { loadNotifications, checkFavoritesAvailability } = useNotifications();

  useEffect(() => {
    initSession();
  }, [initSession]);

  useEffect(() => {
    loadFavorites(profile?.id);
    loadNotifications(profile?.id);
  }, [profile?.id, loadFavorites, loadNotifications]);

  // Periodically check favorites availability status and trigger alerts if status changes
  useEffect(() => {
    const storageKey = profile ? `rentease_favorites_${profile.id}` : 'rentease_favorites_anon';
    const currentFavIds = favoriteIds[storageKey] || [];
    
    if (currentFavIds.length > 0) {
      checkFavoritesAvailability(profile?.id, currentFavIds);
      
      const interval = setInterval(() => {
        checkFavoritesAvailability(profile?.id, currentFavIds);
      }, 30000); // Poll every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [profile, profile?.id, favoriteIds, checkFavoritesAvailability]);

  return (
    <Router>
      <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col font-sans">
        <Navigation />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<LandingDiscover />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
            <Route path="/create-listing" element={<ListingWizard />} />
            <Route path="/bookings" element={<BookingDashboard />} />
            <Route path="/booking-checkout/:id" element={<BookingCheckout />} />
            <Route path="/chat" element={<ChatRoom />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/logout" element={<Logout />} />
            {import.meta.env.DEV && (
              <>
                <Route path="/debug-auth" element={<DebugAuth />} />
              </>
            )}
          </Routes>
        </main>
        <GlobalChatbot />
      </div>
    </Router>
  );
}

export default App;
