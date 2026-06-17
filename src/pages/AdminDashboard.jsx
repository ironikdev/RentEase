import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../store/useAuth';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../store/useNotifications';
import { 
  Users, 
  Home, 
  Calendar, 
  Percent, 
  Search, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  TrendingUp, 
  Wallet, 
  Loader2, 
  ShieldCheck,
  Lock,
  Unlock,
  Settings
} from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Redirect if not ADMIN
  useEffect(() => {
    if (profile && profile.role !== 'ADMIN') {
      navigate('/');
    }
  }, [profile, navigate]);

  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [commissionRate, setCommissionRate] = useState(3);
  const [loading, setLoading] = useState(true);

  // Search States
  const [userSearch, setUserSearch] = useState('');
  const [propSearch, setPropSearch] = useState('');
  
  // Tab State
  const [activeTab, setActiveTab] = useState('overview');

  // Load all platform data
  const loadPlatformData = async () => {
    setLoading(true);
    try {
      // Load stored commission rate
      const savedRate = localStorage.getItem('platform_commission_rate');
      if (savedRate) {
        setCommissionRate(Number(savedRate));
      }

      // Fetch Profiles
      const { data: usersData, error: usersErr } = await supabase
        .from('profiles')
        .select('*');
      if (usersErr) throw usersErr;
      setUsers(usersData || []);

      // Fetch Properties
      const { data: propsData, error: propsErr } = await supabase
        .from('properties')
        .select('*');
      if (propsErr) throw propsErr;
      setProperties(propsData || []);

      // Fetch Bookings
      const { data: bookingsData, error: bookingsErr } = await supabase
        .from('bookings')
        .select('*');
      if (bookingsErr) throw bookingsErr;
      setBookings(bookingsData || []);
    } catch (err) {
      console.error('Error fetching platform data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'ADMIN') {
      loadPlatformData();
    }
  }, [profile]);

  // Adjust Platform commission rate
  const handleUpdateCommission = (newRate) => {
    const rateVal = Math.min(15, Math.max(1, newRate));
    setCommissionRate(rateVal);
    localStorage.setItem('platform_commission_rate', String(rateVal));
  };

  // User moderation: block/unblock
  const handleToggleUserStatus = async (userId, currentActive) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentActive })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentActive } : u));
    } catch (err) {
      alert('Error updating user status: ' + err.message);
    }
  };

  // Property price modification
  const handleUpdatePropertyPrice = async (propId, newRent) => {
    if (isNaN(newRent) || newRent <= 0) {
      alert('Please enter a valid monthly rent.');
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .update({ monthly_rent: Number(newRent) })
        .eq('id', propId);

      if (error) throw error;

      setProperties(prev => prev.map(p => p.id === propId ? { ...p, monthly_rent: Number(newRent) } : p));
      alert('Property monthly rent updated successfully.');
    } catch (err) {
      alert('Error updating property price: ' + err.message);
    }
  };

  // Property moderation: toggle status (PUBLISHED / SUSPENDED)
  const handleTogglePropertyStatus = async (propId, currentStatus) => {
    const newStatus = currentStatus === 'PUBLISHED' ? 'SUSPENDED' : 'PUBLISHED';
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propId);

      if (error) throw error;

      setProperties(prev => prev.map(p => p.id === propId ? { ...p, status: newStatus } : p));
    } catch (err) {
      alert('Error updating property status: ' + err.message);
    }
  };

  const { triggerNotificationWorkflow } = useNotifications();

  const handleTogglePropertyAvailability = async (propId, currentAvailabilityStatus) => {
    const newAvailabilityStatus = currentAvailabilityStatus === 'Available' ? 'Unavailable' : 'Available';
    try {
      const { error } = await supabase
        .from('properties')
        .update({ availability_status: newAvailabilityStatus })
        .eq('id', propId);

      if (error) throw error;

      setProperties(prev => prev.map(p => p.id === propId ? { ...p, availability_status: newAvailabilityStatus } : p));

      // Trigger notification workflow if transitioning from Unavailable -> Available
      if (currentAvailabilityStatus === 'Unavailable' && newAvailabilityStatus === 'Available') {
        const propToNotify = properties.find(p => p.id === propId);
        if (propToNotify) {
          await triggerNotificationWorkflow(propToNotify);
        }
      }
    } catch (err) {
      alert('Error updating property availability: ' + err.message);
    }
  };

  // Delete property
  const handleDeleteProperty = async (propId) => {
    if (window.confirm('Are you sure you want to delete this property? This will delete the listing from the platform.')) {
      try {
        const { error } = await supabase
          .from('properties')
          .delete()
          .eq('id', propId);

        if (error) throw error;

        setProperties(prev => prev.filter(p => p.id !== propId));
      } catch (err) {
        alert('Error deleting property: ' + err.message);
      }
    }
  };

  if (!profile || profile.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 font-sans text-brand-text">
        <ShieldAlert size={48} className="mx-auto text-brand-error animate-pulse" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-brand-secondary text-sm">You do not have administrative permissions to view this dashboard.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-brand-green hover:bg-brand-green-deep text-brand-dark hover:text-white px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all"
        >
          Return Home
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 font-sans flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-brand-green" size={40} />
        <p className="text-brand-secondary text-sm">Loading admin supervision systems...</p>
      </div>
    );
  }

  // Calculate platform financial stats
  const activeBookings = bookings.filter(b => ['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(b.status));
  const totalFinancialShare = activeBookings.reduce((sum, b) => sum + Number(b.platform_fee), 0);
  const totalVolume = activeBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);

  // Filtered lists
  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredProperties = properties.filter(p => 
    p.title?.toLowerCase().includes(propSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans text-brand-text space-y-8 text-left">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
              Admin Supervision Panel
            </h1>
            <span className="text-[10px] font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 px-2.5 py-0.5 rounded uppercase flex items-center gap-1">
              <ShieldCheck size={10} /> Super System
            </span>
          </div>
          <p className="text-brand-secondary text-sm mt-1">
            Platform monitoring terminal. Oversee listings, configure commissions, review booking flows, and audit user permissions.
          </p>
        </div>

        <button
          onClick={loadPlatformData}
          className="bg-brand-bg hover:bg-brand-surface border border-brand-border text-brand-text px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm self-start md:self-auto"
        >
          Sync Live Data
        </button>
      </div>

      {/* KPI Stats Scorecard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Users */}
        <div className="bg-brand-section border border-brand-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className="p-3 bg-brand-green/10 border border-brand-green/20 rounded-xl text-brand-green">
            <Users size={22} />
          </div>
          <div>
            <span className="block text-[10px] text-brand-secondary uppercase font-semibold tracking-wider">Total Users</span>
            <span className="text-2xl font-extrabold text-brand-dark">{users.length}</span>
          </div>
        </div>

        {/* Card 2: Properties */}
        <div className="bg-brand-section border border-brand-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className="p-3 bg-brand-green/10 border border-brand-green/20 rounded-xl text-brand-green">
            <Home size={22} />
          </div>
          <div>
            <span className="block text-[10px] text-brand-secondary uppercase font-semibold tracking-wider">Properties Listed</span>
            <span className="text-2xl font-extrabold text-brand-dark">{properties.length}</span>
          </div>
        </div>

        {/* Card 3: Leases */}
        <div className="bg-brand-section border border-brand-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className="p-3 bg-brand-green/10 border border-brand-green/20 rounded-xl text-brand-green">
            <Calendar size={22} />
          </div>
          <div>
            <span className="block text-[10px] text-brand-secondary uppercase font-semibold tracking-wider">Total Bookings</span>
            <span className="text-2xl font-extrabold text-brand-dark">{bookings.length}</span>
          </div>
        </div>

        {/* Card 4: Commissions */}
        <div className="bg-brand-section border border-brand-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className="p-3 bg-brand-green/10 border border-brand-green/20 rounded-xl text-brand-green">
            <Wallet size={22} />
          </div>
          <div>
            <span className="block text-[10px] text-brand-secondary uppercase font-semibold tracking-wider">Platform Profit Share</span>
            <span className="text-2xl font-extrabold text-brand-dark">₹{totalFinancialShare.toLocaleString()}</span>
            <span className="block text-[9px] text-brand-green font-medium">From ₹{totalVolume.toLocaleString()} booking flow</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-brand-border pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${activeTab === 'overview' ? 'text-brand-green border-brand-green font-bold' : 'text-brand-secondary border-transparent hover:text-brand-text'}`}
        >
          Overview & Config
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${activeTab === 'users' ? 'text-brand-green border-brand-green font-bold' : 'text-brand-secondary border-transparent hover:text-brand-text'}`}
        >
          User Accounts ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('properties')}
          className={`px-4 py-2 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${activeTab === 'properties' ? 'text-brand-green border-brand-green font-bold' : 'text-brand-secondary border-transparent hover:text-brand-text'}`}
        >
          Property Listings ({properties.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${activeTab === 'bookings' ? 'text-brand-green border-brand-green font-bold' : 'text-brand-secondary border-transparent hover:text-brand-text'}`}
        >
          Transactions Audit ({bookings.length})
        </button>
      </div>

      {/* Tab Contents */}
      
      {/* 1. OVERVIEW & CONFIG TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Profit share setting card */}
          <div className="lg:col-span-1 bg-brand-section border border-brand-border rounded-xl p-5 shadow-sm space-y-6">
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-brand-dark flex items-center gap-1.5">
                <Settings size={18} className="text-brand-green" /> Profit Share Configurator
              </h3>
              <p className="text-brand-secondary text-xs leading-relaxed">
                Adjust platform commission rate. This value controls the fee calculated for new lease requests.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-brand-secondary">Commission Percentage</span>
                <span className="text-brand-green text-sm font-extrabold">{commissionRate}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={commissionRate}
                onChange={(e) => handleUpdateCommission(Number(e.target.value))}
                className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-green"
              />
              <div className="flex justify-between text-[9px] text-brand-secondary font-bold">
                <span>1% (MIN)</span>
                <span>15% (MAX)</span>
              </div>
            </div>

            <div className="bg-brand-surface border border-brand-green/20 rounded-lg p-3 text-[10px] text-brand-secondary leading-relaxed">
              <span className="font-semibold text-brand-dark block mb-0.5">Note:</span>
              Updating this value changes commission on future bookings created by tenants. Existing confirmed leases will retain original parameters.
            </div>
          </div>

          {/* Recent Bookings activity */}
          <div className="lg:col-span-2 bg-brand-section border border-brand-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-dark flex items-center gap-1.5">
              <TrendingUp size={18} className="text-brand-green" /> Recent Booking Leases
            </h3>
            
            {bookings.length === 0 ? (
              <p className="text-brand-secondary text-xs py-8 text-center">No leases initialized on the platform yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border text-brand-secondary font-bold">
                      <th className="py-2.5">Property</th>
                      <th className="py-2.5">Date Created</th>
                      <th className="py-2.5">Total Amount</th>
                      <th className="py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(-5).reverse().map((b) => {
                      const prop = properties.find(p => p.id === b.property_id);
                      return (
                        <tr key={b.id} className="border-b border-brand-border/40 hover:bg-brand-surface/20 transition-all">
                          <td className="py-2.5 font-semibold text-brand-dark max-w-[200px] truncate">{prop?.title || 'Unknown Property'}</td>
                          <td className="py-2.5 text-brand-secondary">{new Date(b.created_at).toLocaleDateString()}</td>
                          <td className="py-2.5 font-bold">₹{Number(b.total_amount).toLocaleString()}</td>
                          <td className="py-2.5 text-right">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${b.status === 'CONFIRMED' || b.status === 'ACTIVE' ? 'bg-brand-surface text-brand-green border-brand-green/25' : b.status === 'PENDING_PAYMENT' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-brand-error border-red-100'}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. USER ACCOUNTS TAB */}
      {activeTab === 'users' && (
        <div className="bg-brand-section border border-brand-border rounded-xl p-5 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-brand-dark">User Administration</h3>
              <p className="text-brand-secondary text-xs mt-0.5">Ban accounts or review account roles and details.</p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary" size={14} />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-4 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-green transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-brand-secondary font-bold">
                  <th className="py-3 px-2">User details</th>
                  <th className="py-3 px-2">Role</th>
                  <th className="py-3 px-2">Phone</th>
                  <th className="py-3 px-2">Access Status</th>
                  <th className="py-3 px-2 text-right">Moderate</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-brand-border/40 hover:bg-brand-surface/20 transition-all">
                    <td className="py-3 px-2 flex items-center gap-3">
                      <img 
                        src={u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                        alt={u.full_name} 
                        className="w-8 h-8 rounded-full border border-brand-border object-cover"
                      />
                      <div>
                        <span className="font-bold text-brand-dark block">{u.full_name}</span>
                        <span className="text-brand-secondary text-[10px] block">{u.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : u.role === 'LANDLORD' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-brand-secondary">{u.phone || '—'}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase ${u.is_active ? 'text-brand-green' : 'text-brand-error'}`}>
                        {u.is_active ? (
                          <>
                            <CheckCircle size={10} /> Active
                          </>
                        ) : (
                          <>
                            <XCircle size={10} /> Suspended
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {u.role !== 'ADMIN' ? (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${u.is_active ? 'bg-red-50 text-brand-error border-red-200 hover:bg-red-100' : 'bg-brand-surface text-brand-green border-brand-green/35 hover:bg-brand-green/20'}`}
                        >
                          {u.is_active ? (
                            <span className="flex items-center justify-end gap-1"><Lock size={12} /> Ban User</span>
                          ) : (
                            <span className="flex items-center justify-end gap-1"><Unlock size={12} /> Reactivate</span>
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] text-brand-secondary italic">System Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PROPERTY LISTINGS TAB */}
      {activeTab === 'properties' && (
        <div className="bg-brand-section border border-brand-border rounded-xl p-5 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-brand-dark">Property Inventory Moderator</h3>
              <p className="text-brand-secondary text-xs mt-0.5">Audit listed properties, adjust prices, or suspend properties.</p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary" size={14} />
              <input
                type="text"
                placeholder="Search listing by title..."
                value={propSearch}
                onChange={(e) => setPropSearch(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-4 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-green transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-brand-secondary font-bold">
                  <th className="py-3 px-2">Property</th>
                  <th className="py-3 px-2">Landlord</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Price Modifier (₹)</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Availability</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((p) => {
                  const landlord = users.find(u => u.id === p.landlord_id);
                  return (
                    <tr key={p.id} className="border-b border-brand-border/40 hover:bg-brand-surface/20 transition-all">
                      <td className="py-3 px-2 flex items-center gap-3">
                        <img 
                          src={p.image_urls?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100'} 
                          alt={p.title} 
                          className="w-10 h-7 rounded border border-brand-border object-cover"
                        />
                        <div className="max-w-[180px] truncate">
                          <span className="font-bold text-brand-dark block truncate">{p.title}</span>
                          <span className="text-brand-secondary text-[10px] block">{p.bedrooms} BHK • {p.area_sqft} sqft</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <span className="font-semibold text-brand-dark block">{landlord?.full_name || 'Sarah Jenkins'}</span>
                          <span className="text-brand-secondary text-[10px] block">{landlord?.email || 'owner@rentease.com'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider">{p.type}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <span className="text-brand-secondary">₹</span>
                          <input
                            type="number"
                            defaultValue={Math.round(p.monthly_rent)}
                            onBlur={(e) => handleUpdatePropertyPrice(p.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdatePropertyPrice(p.id, e.target.value);
                              }
                            }}
                            className="bg-brand-bg border border-brand-border rounded px-1.5 py-1 text-xs text-brand-text font-semibold w-20 focus:outline-none focus:border-brand-green"
                          />
                          <span className="text-[10px] text-brand-secondary font-medium">/mo</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${p.status === 'PUBLISHED' ? 'bg-brand-surface text-brand-green border-brand-green/25' : p.status === 'SUSPENDED' ? 'bg-red-50 text-brand-error border-red-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${(p.availability_status || 'Available') === 'Unavailable' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-brand-green/20 text-brand-green border-brand-green/30'}`}>
                          {p.availability_status || 'Available'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleTogglePropertyAvailability(p.id, p.availability_status || 'Available')}
                            className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase border transition-colors ${
                              (p.availability_status || 'Available') === 'Available'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-brand-surface text-brand-green border-brand-green/25 hover:bg-brand-green/10'
                            }`}
                            title="Toggle Availability Status"
                          >
                            {(p.availability_status || 'Available') === 'Available' ? 'Make Unavailable' : 'Make Available'}
                          </button>
                          <button
                            onClick={() => handleTogglePropertyStatus(p.id, p.status)}
                            className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${p.status === 'PUBLISHED' ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' : 'bg-brand-surface text-brand-green border border-brand-green/30 hover:bg-brand-green/20'}`}
                          >
                            {p.status === 'PUBLISHED' ? 'Suspend' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(p.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-brand-error rounded transition-colors"
                            title="Delete Listing"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TRANSACTIONS AUDIT TAB */}
      {activeTab === 'bookings' && (
        <div className="bg-brand-section border border-brand-border rounded-xl p-5 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-brand-dark">Bookings & Leases Auditor</h3>
            <p className="text-brand-secondary text-xs mt-0.5">Review and trace all lease contracts, platform fee percentages, and system transaction steps.</p>
          </div>

          {bookings.length === 0 ? (
            <p className="text-brand-secondary text-xs py-16 text-center">No leases registered on the RentEase platform database.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-brand-border text-brand-secondary font-bold">
                    <th className="py-3 px-2">ID</th>
                    <th className="py-3 px-2">Property Details</th>
                    <th className="py-3 px-2">Tenant Details</th>
                    <th className="py-3 px-2">Lease Timeline</th>
                    <th className="py-3 px-2">Pricing Structure</th>
                    <th className="py-3 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice().reverse().map((b) => {
                    const prop = properties.find(p => p.id === b.property_id);
                    const tenant = users.find(u => u.id === b.tenant_id);
                    return (
                      <tr key={b.id} className="border-b border-brand-border/40 hover:bg-brand-surface/20 transition-all">
                        <td className="py-3 px-2 font-mono text-[9px] text-brand-secondary truncate max-w-[80px]" title={b.id}>
                          {b.id.substring(0, 8)}...
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-bold text-brand-dark block truncate max-w-[180px]">{prop?.title || 'Unknown Property'}</span>
                          <span className="text-[10px] text-brand-secondary block">₹{Number(prop?.monthly_rent || 0).toLocaleString()}/mo</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-semibold text-brand-dark block">{tenant?.full_name || 'Tenant User'}</span>
                          <span className="text-[10px] text-brand-secondary block">{tenant?.email || 'tenant@rentease.com'}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-brand-text block">{new Date(b.start_date).toLocaleDateString()}</span>
                          <span className="text-[10px] text-brand-secondary block">to {new Date(b.end_date).toLocaleDateString()}</span>
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <span className="font-bold text-brand-dark block">Total: ₹{Number(b.total_amount).toLocaleString()}</span>
                            <span className="text-[9px] text-brand-green font-semibold block">Platform Fee: ₹{Number(b.platform_fee).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${b.status === 'CONFIRMED' || b.status === 'ACTIVE' ? 'bg-brand-surface text-brand-green border-brand-green/25' : b.status === 'PENDING_PAYMENT' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-brand-error border-red-100'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
