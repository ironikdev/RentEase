import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Maximize, Heart } from 'lucide-react';
import { useAuth } from '../../store/useAuth';
import { useFavorites } from '../../store/useFavorites';

const getBengaluruArea = (lat, lng, title) => {
  const t = title ? title.toLowerCase() : '';
  if (t.includes('indiranagar')) return 'Indiranagar, Bengaluru';
  if (t.includes('ulsoor')) return 'Ulsoor, Bengaluru';
  if (t.includes('koramangala')) return 'Koramangala, Bengaluru';
  if (t.includes('malleshwaram')) return 'Malleshwaram, Bengaluru';
  
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  if (Math.abs(latitude - 12.9716) < 0.02 && Math.abs(longitude - 77.5946) < 0.02) return 'Indiranagar, Bengaluru';
  if (Math.abs(latitude - 12.9850) < 0.02 && Math.abs(longitude - 77.6050) < 0.02) return 'Ulsoor, Bengaluru';
  if (Math.abs(latitude - 12.9300) < 0.02 && Math.abs(longitude - 77.6100) < 0.02) return 'Koramangala, Bengaluru';
  if (Math.abs(latitude - 12.9900) < 0.02 && Math.abs(longitude - 77.5500) < 0.02) return 'Malleshwaram, Bengaluru';
  
  return 'Bengaluru, Karnataka';
};

export const PropertyCard = ({ property, onHover }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const { profile } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const favorited = isFavorite(property.id, profile?.id);
  const isAvailable = property.availability?.is_available !== false;
  const primaryImage = property.image_urls?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600';

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(property.id, profile?.id);
  };

  return (
    <Link
      to={`/properties/${property.id}`}
      className="block group bg-brand-section border border-brand-border hover:border-brand-green/60 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
      onMouseEnter={() => onHover && onHover(property.id)}
      onMouseLeave={() => onHover && onHover(null)}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-brand-bg">
        {!imgLoaded && (
          <div className="absolute inset-0 shimmer-bg" />
        )}
        <img
          src={primaryImage}
          alt={property.title}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          loading="lazy"
        />

        {/* Like/Heart Button Overlay */}
        <button
          onClick={handleLike}
          className={`absolute top-3 left-3 p-1.5 rounded-full border shadow-md backdrop-blur-sm transition-all duration-300 z-10 ${
            favorited 
              ? 'bg-brand-error/15 border-brand-error text-brand-error hover:bg-brand-error/25 hover:scale-110' 
              : 'bg-brand-section/80 border-brand-border text-brand-secondary hover:text-brand-error hover:border-brand-error hover:bg-brand-section hover:scale-110'
          }`}
          title={favorited ? 'Remove from Favorites' : 'Add to Favorites'}
        >
          <Heart size={14} fill={favorited ? 'currentColor' : 'none'} className="transition-transform duration-300" />
        </button>

        {/* Price Badge Overlay */}
        <div className="absolute bottom-3 left-3 bg-brand-bg/85 px-3 py-1 rounded-md border border-brand-border">
          <span className="text-brand-green font-semibold font-sans">
            ₹{Number(property.monthly_rent).toLocaleString()}/mo
          </span>
        </div>

        {/* Availability Badge Overlay */}
        <div className={`absolute bottom-3 right-3 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-md z-10 ${
          isAvailable 
            ? 'bg-emerald-500/80 border-emerald-400 text-white' 
            : 'bg-amber-500/85 border-amber-400 text-white'
        }`}>
          {isAvailable ? 'Available' : 'Leased'}
        </div>

        {/* Type Badge */}
        <div className="absolute top-3 right-3 bg-brand-green/90 text-brand-dark px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">
          {property.type}
        </div>
      </div>

      {/* Details Container */}
      <div className="p-4 space-y-3">
        <h3 className="text-brand-text font-semibold text-lg line-clamp-1 group-hover:text-brand-green transition-colors duration-200">
          {property.title}
        </h3>

        {/* Mapped location (mock coordinates/text since coordinates are stored) */}
        <div className="flex items-center text-brand-secondary text-sm gap-1.5">
          <MapPin size={15} className="text-brand-green" />
          <span className="truncate">{getBengaluruArea(property.latitude, property.longitude, property.title)} ({property.latitude.toFixed(2)}, {property.longitude.toFixed(2)})</span>
        </div>

        {/* Specs row */}
        <div className="flex items-center justify-between text-brand-secondary text-xs border-t border-brand-border/60 pt-3 mt-1">
          <div className="flex items-center gap-1.5">
            <BedDouble size={14} className="text-brand-green-deep" />
            <span>{property.bedrooms} Beds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath size={14} className="text-brand-green-deep" />
            <span>{property.bathrooms} Baths</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize size={14} className="text-brand-green-deep" />
            <span>{property.area_sqft} sqft</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
