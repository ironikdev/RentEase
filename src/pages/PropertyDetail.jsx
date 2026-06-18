import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../store/useAuth';
import { useFavorites } from '../store/useFavorites';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { MapPin, BedDouble, Bath, Maximize, Calendar, Heart, ShieldCheck, Mail, ArrowLeft, ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [property, setProperty] = useState(null);
  const [landlord, setLandlord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = property ? isFavorite(property.id, profile?.id) : false;

  // Booking Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadPropertyDetails() {
      setLoading(true);
      try {
        // Fetch property
        const { data: prop, error: propErr } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();

        if (propErr) throw propErr;
        setProperty(prop);

        // Fetch landlord profile
        if (prop?.landlord_id) {
          const { data: landlordProf, error: landErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', prop.landlord_id)
            .single();
          if (!landErr) setLandlord(landlordProf);
        }
      } catch (err) {
        console.error('Error fetching property details:', err.message);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    }
    loadPropertyDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 bg-brand-bg font-sans">
        <SkeletonLoader type="detail" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center bg-brand-bg font-sans space-y-4">
        <h2 className="text-2xl font-bold text-brand-text">Property Not Found</h2>
        <p className="text-brand-secondary">The listing you are trying to view does not exist or has been removed.</p>
        <Link to="/" className="inline-block bg-brand-green text-brand-dark hover:bg-brand-green-deep font-semibold py-2.5 px-6 rounded-lg">
          Back to Search
        </Link>
      </div>
    );
  }

  // Calculate rental cost details
  const calcTotalCost = () => {
    if (!startDate || !endDate) return { total: 0, months: 0 };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Monthly calculation
    const months = Math.max(1, Math.round((diffDays / 30.4) * 10) / 10);
    const rentTotal = months * property.monthly_rent;
    const deposit = Number(property.security_deposit);
    const commissionPercent = Number(localStorage.getItem('platform_commission_rate') || 3);
    const platformFee = rentTotal * (commissionPercent / 100);
    const total = rentTotal + deposit + platformFee;

    return {
      rentTotal: Math.round(rentTotal),
      deposit,
      platformFee: Math.round(platformFee),
      total: Math.round(total),
      months
    };
  };

  const cost = calcTotalCost();

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!profile) {
      navigate('/login');
      return;
    }
    if (profile.role !== 'TENANT') {
      setBookingError('Only users registered as Tenants can request bookings.');
      return;
    }
    if (!startDate || !endDate) {
      setBookingError('Please select both start and end lease dates.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      setBookingError('Lease end date must be after the start date.');
      return;
    }

    setIsSubmitting(true);
    setBookingError('');

    try {
      // Create new booking intent
      const { data, error } = await supabase.from('bookings').insert({
        property_id: property.id,
        tenant_id: profile.id,
        start_date: startDate,
        end_date: endDate,
        total_amount: cost.total,
        platform_fee: cost.platformFee,
        status: 'PENDING_PAYMENT'
      }).select();

      if (error) throw error;

      // Mock payment intent transition
      const newBooking = Array.isArray(data) ? data[0] : data;
      
      // Redirect to booking workflow
      navigate(`/booking-checkout/${newBooking.id}`);
    } catch (err) {
      setBookingError(err.message || 'Failed to initialize booking.');
      setIsSubmitting(false);
    }
  };

  const handleInquiry = () => {
    if (!profile) {
      navigate('/login');
      return;
    }
    navigate(`/chat?propId=${property.id}&landlordId=${property.landlord_id}`);
  };

  const images = property.image_urls?.length > 0 ? property.image_urls : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 bg-brand-bg text-brand-text font-sans space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 text-brand-secondary hover:text-brand-green text-sm font-semibold transition-colors">
          <ArrowLeft size={16} /> Back to discover
        </Link>
        <button
          onClick={() => toggleFavorite(property.id, profile?.id)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ${favorited ? 'bg-brand-error/10 border-brand-error text-brand-error hover:bg-brand-error/20' : 'bg-brand-section border-brand-border hover:border-brand-green/40'}`}
        >
          <Heart size={14} fill={favorited ? 'currentColor' : 'none'} /> {favorited ? 'Favorited' : 'Save Property'}
        </button>
      </div>

      {/* Image Gallery */}
      <div className="relative rounded-xl overflow-hidden bg-brand-section border border-brand-border group h-72 sm:h-96 md:h-[480px]">
        <img
          src={images[activeImageIdx]}
          alt={property.title}
          className="w-full h-full object-cover transition-all duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';
          }}
        />

        {/* Carousel controls */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActiveImageIdx(prev => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-brand-bg/80 hover:bg-brand-green hover:text-brand-dark rounded-full border border-brand-border text-brand-text transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setActiveImageIdx(prev => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-brand-bg/80 hover:bg-brand-green hover:text-brand-dark rounded-full border border-brand-border text-brand-text transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Index counter */}
        <div className="absolute bottom-4 right-4 bg-brand-bg/85 border border-brand-border px-3 py-1 rounded-md text-xs font-semibold">
          {activeImageIdx + 1} / {images.length}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="inline-block bg-brand-green/10 text-brand-green text-xs font-bold px-2.5 py-1 rounded border border-brand-green/20 uppercase tracking-wider">
              {property.type}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-brand-text">
              {property.title}
            </h1>
            
            <div className="flex items-center text-brand-secondary text-sm gap-2">
              <MapPin size={16} className="text-brand-green" />
              <span>Bangalore, Karnataka (Lat: {property.latitude.toFixed(4)}, Lng: {property.longitude.toFixed(4)})</span>
            </div>
          </div>

          {/* Specs Row */}
          <div className="grid grid-cols-3 gap-4 bg-brand-section border border-brand-border/60 rounded-xl p-4 text-center">
            <div className="space-y-1">
              <span className="block text-brand-secondary text-xs font-medium">Bedrooms</span>
              <div className="flex items-center justify-center gap-1.5 text-brand-text font-bold text-lg">
                <BedDouble size={18} className="text-brand-green" /> {property.bedrooms}
              </div>
            </div>
            <div className="space-y-1 border-x border-brand-border/40">
              <span className="block text-brand-secondary text-xs font-medium">Bathrooms</span>
              <div className="flex items-center justify-center gap-1.5 text-brand-text font-bold text-lg">
                <Bath size={18} className="text-brand-green" /> {property.bathrooms}
              </div>
            </div>
            <div className="space-y-1">
              <span className="block text-brand-secondary text-xs font-medium">Total Area</span>
              <div className="flex items-center justify-center gap-1.5 text-brand-text font-bold text-lg">
                <Maximize size={18} className="text-brand-green" /> {property.area_sqft} sqft
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-sans text-brand-text">About this Space</h2>
            <p className="text-brand-secondary text-sm leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-sans text-brand-text">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {property.amenities?.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2 bg-brand-section/40 border border-brand-border/40 p-2.5 rounded-lg text-xs text-brand-secondary">
                  <ShieldCheck size={14} className="text-brand-green" />
                  <span className="font-semibold text-brand-text">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Neighbor Map */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold font-sans text-brand-text">Location Map</h2>
            <div className="h-64 sm:h-80 w-full rounded-xl overflow-hidden relative">
              <InteractiveMap properties={[property]} />
            </div>
          </div>

          {/* Landlord Profile */}
          {landlord && (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-brand-section border border-brand-border rounded-xl p-4">
              <img
                src={landlord.avatar_url}
                alt={landlord.full_name}
                className="w-16 h-16 rounded-full object-cover border border-brand-border"
              />
              <div className="flex-1 text-center sm:text-left space-y-1">
                <h4 className="font-bold text-brand-text">{landlord.full_name}</h4>
                <p className="text-brand-green text-xs font-semibold uppercase tracking-wider">Property Owner</p>
                <p className="text-brand-secondary text-xs">Response rate: 100% within 1 hour</p>
              </div>
              <button
                onClick={handleInquiry}
                className="bg-brand-bg text-brand-green hover:bg-brand-green hover:text-brand-dark border border-brand-green/60 text-xs font-semibold py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors self-center"
              >
                <Mail size={14} /> Send Message
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Booking Card */}
        <div className="lg:sticky lg:top-8 space-y-4">
          <div className="bg-brand-section border border-brand-border rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-baseline justify-between border-b border-brand-border/60 pb-3">
              <div>
                <span className="text-2xl font-bold text-brand-text">₹{Number(property.monthly_rent).toLocaleString()}</span>
                <span className="text-brand-secondary text-xs"> / month</span>
              </div>
              <div className="text-xs text-brand-secondary">
                Sec. Deposit: <span className="font-semibold text-brand-text">₹{Number(property.security_deposit).toLocaleString()}</span>
              </div>
            </div>

            {/* Calendar & Dates Input */}
            <form onSubmit={handleBooking} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-brand-secondary text-xs font-medium">Select Move-in Date</label>
                <div className="relative">
                  <input
                    type="date"
                    min={getLocalDateString()}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    onClick={(e) => {
                      try { e.target.showPicker(); } catch (err) {}
                    }}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 pl-9 text-xs focus:outline-none focus:border-brand-green cursor-pointer"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary pointer-events-none" size={14} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-brand-secondary text-xs font-medium">Select Move-out Date</label>
                <div className="relative">
                  <input
                    type="date"
                    min={startDate || getLocalDateString()}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    onClick={(e) => {
                      try { e.target.showPicker(); } catch (err) {}
                    }}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 pl-9 text-xs focus:outline-none focus:border-brand-green cursor-pointer"
                  />
                  <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary pointer-events-none" size={14} />
                </div>
              </div>

              {/* Price Breakdown display */}
              {startDate && endDate && cost.months > 0 && (
                <div className="space-y-2 text-xs border-t border-brand-border/60 pt-3 text-brand-secondary">
                  <div className="flex justify-between">
                    <span>Rent ({cost.months} months)</span>
                    <span className="text-brand-text">₹{cost.rentTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security Deposit (Refundable)</span>
                    <span className="text-brand-text">₹{cost.deposit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee (3%)</span>
                    <span className="text-brand-text">₹{cost.platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-border/40 pt-2 text-sm font-bold text-brand-text">
                    <span>Estimated Total</span>
                    <span className="text-brand-green">₹{cost.total.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {bookingError && (
                <div className="bg-brand-error/10 border border-brand-error text-brand-error text-xs p-2.5 rounded-lg font-medium">
                  {bookingError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-green hover:bg-brand-green-deep text-brand-dark disabled:bg-brand-border disabled:text-brand-secondary font-semibold text-xs py-3 px-4 rounded-lg shadow uppercase tracking-wider transition-colors duration-200"
              >
                {isSubmitting ? 'Processing Booking...' : 'Book Now'}
              </button>
            </form>

            <button
              onClick={handleInquiry}
              className="w-full bg-brand-bg border border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-dark font-semibold text-xs py-3 px-4 rounded-lg uppercase tracking-wider transition-colors duration-200"
            >
              Ask Landlord a Question
            </button>
          </div>

          <div className="bg-brand-section/40 border border-brand-border/40 rounded-xl p-4 text-center">
            <p className="text-[10px] text-brand-secondary leading-normal">
              All bookings are protected under RentEase's escrow policies. Deposits are held in security escrow and released 24h after Move-In confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
