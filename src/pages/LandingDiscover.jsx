import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../store/useAuth';
import { PropertyCard } from '../components/properties/PropertyCard';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { Search, SlidersHorizontal, ArrowUpDown, X, MapPin, Home, Plus, Trash2, ExternalLink, Wallet, TrendingUp, UserCheck, MessageSquare, Calendar } from 'lucide-react';

export default function LandingDiscover() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePropId, setActivePropId] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [priceRange, setPriceRange] = useState(150000);
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy] = useState('newest');

  // Load properties
  useEffect(() => {
    async function loadProperties() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'PUBLISHED');

        if (error) throw error;
        setProperties(data || []);
      } catch (err) {
        console.error('Error fetching properties:', err.message);
      } finally {
        // Minimum 800ms loading state for perceived performance (PRD Section 7.1)
        setTimeout(() => setLoading(false), 800);
      }
    }
    loadProperties();
  }, []);

  // Filter and sort application
  useEffect(() => {
    let result = [...properties];

    // Filter by text search
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        p =>
          p.title.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }

    // Filter by type
    if (selectedType !== 'ALL') {
      result = result.filter(p => p.type === selectedType);
    }

    // Filter by price
    result = result.filter(p => Number(p.monthly_rent) <= priceRange);

    // Filter by bedrooms
    if (minBedrooms > 0) {
      result = result.filter(p => p.bedrooms >= minBedrooms);
    }

    // Filter by amenities
    if (selectedAmenities.length > 0) {
      result = result.filter(p =>
        selectedAmenities.every(amenity => p.amenities?.includes(amenity))
      );
    }

    // Filter by map viewport bounds (if map dragged)
    if (mapBounds) {
      const { northEast, southWest } = mapBounds;
      result = result.filter(
        p =>
          p.latitude >= southWest.lat &&
          p.latitude <= northEast.lat &&
          p.longitude >= southWest.lng &&
          p.longitude <= northEast.lng
      );
    }

    // Apply sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => Number(a.monthly_rent) - Number(b.monthly_rent));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => Number(b.monthly_rent) - Number(a.monthly_rent));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    setFilteredProperties(result);
  }, [properties, searchTerm, selectedType, priceRange, minBedrooms, selectedAmenities, sortBy, mapBounds]);

  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleBoundsChange = (bounds) => {
    setMapBounds(bounds);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('ALL');
    setPriceRange(150000);
    setMinBedrooms(0);
    setSelectedAmenities([]);
    setMapBounds(null);
    setSortBy('newest');
  };

  const { profile } = useAuth();

  const [landlordProperties, setLandlordProperties] = useState([]);
  const [landlordBookings, setLandlordBookings] = useState([]);
  const [landlordLoading, setLandlordLoading] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'LANDLORD') return;
    
    async function loadLandlordDashboard() {
      setLandlordLoading(true);
      try {
        const { data: props, error: propsErr } = await supabase
          .from('properties')
          .select('*')
          .eq('landlord_id', profile.id);
        
        const fetchedProps = props || [];
        if (!propsErr) setLandlordProperties(fetchedProps);

        const { data: books, error: booksErr } = await supabase
          .from('bookings')
          .select('*');
        
        if (!booksErr && books) {
          const propIds = fetchedProps.map(p => p.id);
          const filteredBooks = books.filter(b => propIds.includes(b.property_id));
          setLandlordBookings(filteredBooks);
        }
      } catch (err) {
        console.error('Error loading landlord stats:', err);
      } finally {
        setLandlordLoading(false);
      }
    }
    loadLandlordDashboard();
  }, [profile]);

  const handleDeleteProperty = async (propId) => {
    if (window.confirm('Are you sure you want to delete this property? This will also delete all related bookings.')) {
      const { error } = await supabase.from('properties').delete().eq('id', propId);
      if (error) {
        alert('Error deleting property: ' + error.message);
      } else {
        setLandlordProperties(prev => prev.filter(p => p.id !== propId));
      }
    }
  };

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 font-sans text-brand-text space-y-12">
        {/* Main Hero & Promo Banner Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center pt-2">
          
          {/* Hero & Search Form Area */}
          <div className="lg:col-span-3 space-y-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight leading-tight">
              Start your <span className="text-brand-green font-bold">#PataBadloLifeBadlo</span> Journey
            </h1>

            {/* Tabs Row */}
            <div className="flex items-center gap-6 border-b border-brand-border pb-2 overflow-x-auto">
              <button className="text-brand-green border-b-2 border-brand-green font-bold text-sm pb-1.5 whitespace-nowrap">
                Rent
              </button>
              <button className="text-brand-secondary hover:text-brand-text font-semibold text-sm pb-1.5 whitespace-nowrap cursor-not-allowed" disabled>
                Buy
              </button>
              <button className="text-brand-secondary hover:text-brand-text font-semibold text-sm pb-1.5 whitespace-nowrap cursor-not-allowed" disabled>
                New Projects
              </button>
              <button className="text-brand-secondary hover:text-brand-text font-semibold text-sm pb-1.5 whitespace-nowrap cursor-not-allowed" disabled>
                PG / Co-Living
              </button>
              <button className="text-brand-secondary hover:text-brand-text font-semibold text-sm pb-1.5 whitespace-nowrap cursor-not-allowed" disabled>
                Plot
              </button>
              <Link to="/login" className="text-brand-secondary hover:text-brand-green font-semibold text-sm pb-1.5 whitespace-nowrap">
                Post Free Property Ad
              </Link>
            </div>

            {/* Pill Search Bar Card */}
            <div className="bg-brand-section border border-brand-border rounded-full p-2.5 pl-6 flex flex-col md:flex-row items-center gap-3 shadow-xl">
              {/* Location */}
              <div className="flex items-center gap-2 flex-1 w-full border-b md:border-b-0 md:border-r border-brand-border pb-2 md:pb-0">
                <MapPin size={16} className="text-brand-green" />
                <div className="text-left">
                  <span className="block text-[10px] text-brand-secondary uppercase font-semibold">City</span>
                  <input
                    type="text"
                    readOnly
                    value="Bangalore, Karnataka"
                    className="bg-transparent text-xs font-bold text-brand-text focus:outline-none w-full"
                  />
                </div>
              </div>

              {/* Type */}
              <div className="flex items-center gap-2 flex-1 w-full border-b md:border-b-0 md:border-r border-brand-border pb-2 md:pb-0">
                <Home size={16} className="text-brand-green" />
                <div className="text-left">
                  <span className="block text-[10px] text-brand-secondary uppercase font-semibold">Property Type</span>
                  <span className="block text-xs font-bold text-brand-text">Apartment & House</span>
                </div>
              </div>

              {/* Budget */}
              <div className="flex items-center gap-2 flex-1 w-full pb-2 md:pb-0">
                <span className="text-brand-green font-bold text-sm">₹</span>
                <div className="text-left">
                  <span className="block text-[10px] text-brand-secondary uppercase font-semibold">Budget Limit</span>
                  <span className="block text-xs font-bold text-brand-text">Any Budget</span>
                </div>
              </div>

              {/* Search Button */}
              <Link
                to="/login"
                className="w-full md:w-auto bg-brand-green hover:bg-brand-green-deep text-brand-dark px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-md shrink-0 text-center"
              >
                <Search size={14} /> Search
              </Link>
            </div>
          </div>

          {/* Right Side Promo Card */}
          <div className="bg-gradient-to-br from-brand-surface to-white border border-brand-border rounded-2xl p-5 space-y-4 shadow-lg text-left relative overflow-hidden group">
            {/* Visual design element */}
            <div className="absolute right-2 bottom-2 opacity-15 text-5xl">🎁</div>
            
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-brand-green bg-brand-green/10 px-2 py-0.5 rounded border border-brand-green/20">
                Exclusive Campaign
              </span>
              <h3 className="font-bold text-brand-dark text-base pt-1">
                Share your story & win vouchers worth <span className="text-brand-green font-extrabold">₹5,000</span>
              </h3>
              <p className="text-xs text-brand-secondary leading-relaxed">
                Tell us how RentEase helped change your location and win!
              </p>
            </div>

            <Link
              to="/login"
              className="inline-block bg-brand-green hover:bg-brand-green-deep text-brand-dark text-xs font-bold px-4 py-2 rounded-lg uppercase tracking-wider transition-colors shadow-sm text-center"
            >
              Click Here
            </Link>
          </div>

        </div>

        {/* Bottom Section: "We've got properties for everyone" */}
        <div className="space-y-6 pt-4">
          <div className="text-left space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-dark flex items-center gap-2">
              We've got properties for everyone
            </h2>
            <div className="w-16 h-1 bg-brand-green rounded-full" />
          </div>

          {/* 4 Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <Link
              to="/login"
              className="group relative h-48 rounded-2xl overflow-hidden border border-brand-border shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left flex flex-col justify-end p-4"
            >
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=450"
                alt="Owner Properties"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              
              <div className="relative space-y-1">
                <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest bg-brand-green/10 px-2 py-0.5 rounded border border-brand-green/20">
                  Verified Listings
                </span>
                <h4 className="font-bold text-white text-lg leading-tight">3,777+ Owner Properties</h4>
                <div className="text-xs font-bold text-brand-green group-hover:underline flex items-center gap-1 mt-0.5">
                  Explore →
                </div>
              </div>
            </Link>

            {/* Card 2 */}
            <Link
              to="/login"
              className="group relative h-48 rounded-2xl overflow-hidden border border-brand-border shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left flex flex-col justify-end p-4"
            >
              <img
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=450"
                alt="Luxury Projects"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              
              <div className="relative space-y-1">
                <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest bg-brand-green/10 px-2 py-0.5 rounded border border-brand-green/20">
                  Premium Estates
                </span>
                <h4 className="font-bold text-white text-lg leading-tight">167 Luxury Projects</h4>
                <div className="text-xs font-bold text-brand-green group-hover:underline flex items-center gap-1 mt-0.5">
                  Explore →
                </div>
              </div>
            </Link>

            {/* Card 3 */}
            <Link
              to="/login"
              className="group relative h-48 rounded-2xl overflow-hidden border border-brand-border shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left flex flex-col justify-end p-4"
            >
              <img
                src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=450"
                alt="Direct Deals"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              
              <div className="relative space-y-1">
                <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest bg-brand-green/10 px-2 py-0.5 rounded border border-brand-green/20">
                  0% Brokerage
                </span>
                <h4 className="font-bold text-white text-lg leading-tight">Direct Owner Deals</h4>
                <div className="text-xs font-bold text-brand-green group-hover:underline flex items-center gap-1 mt-0.5">
                  Explore →
                </div>
              </div>
            </Link>

            {/* Card 4 */}
            <Link
              to="/login"
              className="group relative h-48 rounded-2xl overflow-hidden border border-brand-border shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left flex flex-col justify-end p-4"
            >
              <img
                src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=450"
                alt="Budget Homes"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              
              <div className="relative space-y-1">
                <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest bg-brand-green/10 px-2 py-0.5 rounded border border-brand-green/20">
                  Economical Living
                </span>
                <h4 className="font-bold text-white text-lg leading-tight">1,174 Budget Homes</h4>
                <div className="text-xs font-bold text-brand-green group-hover:underline flex items-center gap-1 mt-0.5">
                  Explore →
                </div>
              </div>
            </Link>

          </div>
        </div>
      </div>
    );
  }

  if (profile?.role === 'LANDLORD') {
    const activeBookings = landlordBookings.filter(b => ['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(b.status));
    const totalEarnings = activeBookings.reduce((sum, b) => sum + (Number(b.total_amount) - Number(b.platform_fee)), 0);

    if (landlordLoading) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8 font-sans space-y-6 text-left">
          <div className="h-8 bg-brand-surface rounded w-48 shimmer-bg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-brand-surface rounded-xl shimmer-bg" />
            <div className="h-32 bg-brand-surface rounded-xl shimmer-bg" />
            <div className="h-32 bg-brand-surface rounded-xl shimmer-bg" />
          </div>
          <div className="h-96 bg-brand-surface rounded-xl shimmer-bg" />
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 py-6 font-sans text-brand-text space-y-8 text-left">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                Landlord Console
              </h1>
              <span className="text-[10px] font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 px-2.5 py-0.5 rounded uppercase flex items-center gap-1">
                <UserCheck size={10} /> Verified Owner
              </span>
            </div>
            <p className="text-brand-secondary text-sm mt-1">
              Welcome back, <span className="font-semibold text-brand-text">{profile.full_name}</span>. Oversee your properties, active leases, and revenue.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/create-listing"
              className="bg-brand-green hover:bg-brand-green-deep text-brand-dark hover:text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus size={14} /> Add Property
            </Link>
            <Link
              to="/bookings"
              className="bg-brand-bg hover:bg-brand-surface border border-brand-border text-brand-text px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Calendar size={14} /> View Leases
            </Link>
            <Link
              to="/chat"
              className="bg-brand-bg hover:bg-brand-surface border border-brand-border text-brand-text px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
            >
              <MessageSquare size={14} /> Tenant Chats
            </Link>
          </div>
        </div>

        {/* Stats KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-brand-section border border-brand-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
            <div className="p-3 bg-brand-green/10 border border-brand-green/20 rounded-xl text-brand-green">
              <Home size={22} />
            </div>
            <div>
              <span className="block text-[10px] text-brand-secondary uppercase font-semibold tracking-wider">Properties Listed</span>
              <span className="text-2xl font-extrabold text-brand-dark">{landlordProperties.length}</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-brand-section border border-brand-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
            <div className="p-3 bg-brand-green/10 border border-brand-green/20 rounded-xl text-brand-green">
              <Calendar size={22} />
            </div>
            <div>
              <span className="block text-[10px] text-brand-secondary uppercase font-semibold tracking-wider">Active Leases</span>
              <span className="text-2xl font-extrabold text-brand-dark">{activeBookings.length} / {landlordBookings.length}</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-brand-section border border-brand-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
            <div className="p-3 bg-brand-green/10 border border-brand-green/20 rounded-xl text-brand-green">
              <Wallet size={22} />
            </div>
            <div>
              <span className="block text-[10px] text-brand-secondary uppercase font-semibold tracking-wider">Accumulated Earnings</span>
              <span className="text-2xl font-extrabold text-brand-dark">₹{totalEarnings.toLocaleString()}</span>
              <span className="block text-[9px] text-brand-secondary mt-0.5">Excludes platform fees & commissions</span>
            </div>
          </div>
        </div>

        {/* List of Landlord's Properties */}
        <div className="bg-brand-section border border-brand-border rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-brand-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-brand-dark">Your Property Listings</h2>
              <p className="text-brand-secondary text-xs mt-0.5">Manage and track your rentals posted on RentEase</p>
            </div>
            <span className="text-xs bg-brand-surface text-brand-green border border-brand-green/20 px-2.5 py-0.5 rounded-full font-semibold">
              {landlordProperties.length} properties
            </span>
          </div>

          {landlordProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="p-4 bg-brand-surface rounded-full text-brand-green">
                <Home size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-brand-dark">No properties listed yet</h3>
                <p className="text-brand-secondary text-xs max-w-sm">
                  Start listing your apartments, houses, or villas to find verified tenants and begin earning.
                </p>
              </div>
              <Link
                to="/create-listing"
                className="bg-brand-green hover:bg-brand-green-deep text-brand-dark hover:text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Plus size={14} /> Add Your First Listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {landlordProperties.map((prop) => {
                const propBookings = landlordBookings.filter(b => b.property_id === prop.id);
                const isBooked = propBookings.some(b => ['CONFIRMED', 'ACTIVE'].includes(b.status));
                const image = prop.image_urls?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600';
                
                return (
                  <div key={prop.id} className="bg-brand-bg border border-brand-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group text-left">
                    {/* Thumbnail Image */}
                    <div className="relative h-44 overflow-hidden bg-brand-surface">
                      <img
                        src={image}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 flex gap-1">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded shadow border ${isBooked ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-brand-green/20 text-brand-green border-brand-green/30'}`}>
                          {isBooked ? 'Leased' : 'Available'}
                        </span>
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded shadow border ${prop.status === 'PUBLISHED' ? 'bg-brand-surface text-brand-green border-brand-green/20' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {prop.status}
                        </span>
                      </div>
                    </div>

                    {/* Details Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-brand-green uppercase font-bold tracking-wider">{prop.type}</span>
                        <h4 className="font-bold text-brand-dark text-sm leading-snug line-clamp-1">
                          {prop.title}
                        </h4>
                        <div className="flex justify-between items-center text-xs font-semibold text-brand-text">
                          <span>₹{Number(prop.monthly_rent).toLocaleString()}/mo</span>
                          <span className="text-brand-secondary font-medium">{prop.bedrooms} BHK • {prop.area_sqft} sqft</span>
                        </div>
                      </div>

                      {/* Info and Actions */}
                      <div className="pt-3 border-t border-brand-border flex items-center justify-between gap-2">
                        <span className="text-[10px] text-brand-secondary font-medium">
                          {propBookings.length} total bookings
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/properties/${prop.id}`}
                            className="p-1.5 bg-brand-surface hover:bg-brand-green/20 border border-brand-green/25 text-brand-green rounded transition-colors"
                            title="View Property Detail"
                          >
                            <ExternalLink size={14} />
                          </Link>
                          <button
                            onClick={() => handleDeleteProperty(prop.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-brand-error rounded transition-colors"
                            title="Delete Listing"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-brand-bg font-sans">
      {/* LEFT: Filters & Listing Grid */}
      <div className="w-full lg:w-[55%] flex flex-col h-full border-r border-brand-border overflow-y-auto p-4 sm:p-6 space-y-6">
        
        {/* Banner informing user about mode */}
        <div className="bg-brand-section/80 border border-brand-green/30 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <h4 className="text-brand-green font-semibold text-sm">Welcome to RentEase</h4>
            <p className="text-brand-secondary text-xs mt-0.5">Find high-quality rental properties with real-time mapping.</p>
          </div>
          <div className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-brand-green/10 text-brand-green rounded border border-brand-green/20">
            Phase 1 Active
          </div>
        </div>

        {/* Search & Main Filter Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary" size={18} />
              <input
                type="text"
                placeholder="Search properties, areas, descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-brand-section border border-brand-border rounded-lg pl-10 pr-4 py-2.5 text-brand-text placeholder-brand-secondary/60 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/30 transition-all duration-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-brand-section border border-brand-border text-brand-text rounded-lg px-4 py-2.5 text-sm cursor-pointer focus:outline-none focus:border-brand-green transition-all"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
                <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-brand-secondary" size={14} />
              </div>
            </div>
          </div>

          {/* Expanded Filters Drawer Style */}
          <div className="bg-brand-section rounded-xl p-4 border border-brand-border/60 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border/40 pb-2.5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-brand-green" />
                <span className="font-semibold text-sm text-brand-text">Filter Options</span>
              </div>
              <button
                onClick={clearFilters}
                className="text-brand-secondary hover:text-brand-green text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Type select */}
              <div>
                <label className="block text-brand-secondary text-xs font-medium mb-1.5">Property Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border text-brand-text rounded-lg p-2 text-xs focus:outline-none focus:border-brand-green"
                >
                  <option value="ALL">All Types</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="HOUSE">House</option>
                  <option value="STUDIO">Studio</option>
                  <option value="VILLA">Villa</option>
                </select>
              </div>

              {/* Price slider */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-brand-secondary">Max Monthly Rent</span>
                  <span className="text-brand-green">₹{priceRange.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="150000"
                  step="5000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full h-1 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-green"
                />
              </div>

              {/* Bedrooms slider */}
              <div>
                <label className="block text-brand-secondary text-xs font-medium mb-1.5">Bedrooms Required</label>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => setMinBedrooms(num)}
                      className={`flex-1 py-1 text-xs font-semibold rounded transition-all duration-200 border ${minBedrooms === num ? 'bg-brand-green text-brand-dark border-brand-green' : 'bg-brand-bg text-brand-text border-brand-border hover:border-brand-green/40'}`}
                    >
                      {num === 0 ? 'Any' : `${num}+`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Amenities select */}
            <div>
              <label className="block text-brand-secondary text-xs font-medium mb-2">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {['WiFi', 'AC', 'Parking', 'Pool', 'Gym', 'Pet-friendly'].map(amenity => {
                  const isSelected = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${isSelected ? 'bg-brand-green/20 text-brand-green border-brand-green' : 'bg-brand-bg text-brand-secondary border-brand-border hover:border-brand-green/35'}`}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-brand-secondary text-sm font-medium">
              Showing {filteredProperties.length} of {properties.length} matches
            </span>
            {mapBounds && (
              <span className="text-[10px] bg-brand-green/10 border border-brand-green/25 text-brand-green px-2 py-0.5 rounded flex items-center gap-1">
                Filtered by Map View
                <X size={10} className="cursor-pointer" onClick={() => setMapBounds(null)} />
              </span>
            )}
          </div>

          {loading ? (
            <SkeletonLoader type="card" count={4} />
          ) : filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-brand-section rounded-xl border border-brand-border/40 text-center space-y-3">
              <SlidersHorizontal size={40} className="text-brand-secondary/60" />
              <h3 className="text-brand-text font-semibold text-lg">No properties found</h3>
              <p className="text-brand-secondary text-sm max-w-sm">
                We couldn't find any listings matching your selected search criteria. Try modifying your filter values or zooming out on the map.
              </p>
              <button
                onClick={clearFilters}
                className="bg-brand-green text-brand-dark hover:bg-brand-green-deep font-semibold text-xs py-2 px-4 rounded-lg shadow transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProperties.map(prop => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  active={prop.id === activePropId}
                  onHover={setActivePropId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Full interactive Map */}
      <div className="hidden lg:block lg:w-[45%] h-full relative">
        <InteractiveMap
          properties={filteredProperties}
          activePropId={activePropId}
          onMarkerHover={setActivePropId}
          onBoundsChange={handleBoundsChange}
        />
      </div>
    </div>
  );
}
