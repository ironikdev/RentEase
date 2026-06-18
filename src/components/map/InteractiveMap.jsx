import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Custom price icon generator (Rupees formatting)
const createPriceIcon = (price, isActive) => {
  const priceStr = price >= 100000 
    ? `₹${(price / 100000).toFixed(1)}L` 
    : price >= 1000 
      ? `₹${(price / 1000).toFixed(0)}k` 
      : `₹${price}`;
  return L.divIcon({
    className: 'custom-price-marker',
    html: `
      <div class="transition-all duration-300 transform ${isActive ? 'scale-110 bg-brand-green text-brand-dark font-bold border-2 border-white ring-2 ring-brand-green-deep shadow-2xl' : 'bg-brand-section text-brand-green border border-brand-border font-semibold hover:bg-brand-green hover:text-brand-dark'} px-2 py-0.5 rounded-lg text-xs text-center whitespace-nowrap shadow-md cursor-pointer">
        ${priceStr}
      </div>
    `,
    iconSize: [60, 22],
    iconAnchor: [30, 11]
  });
};

// Component to dynamically adjust map view based on visible properties
const FitBounds = ({ properties }) => {
  const map = useMap();

  useEffect(() => {
    if (!properties || properties.length === 0) return;
    
    const bounds = L.latLngBounds(properties.map(p => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [properties, map]);

  return null;
};

// Component to handle map interactions like dragging and zoom changes
const MapEvents = ({ onBoundsChange }) => {
  useMapEvents({
    dragend: (e) => {
      const map = e.target;
      const bounds = map.getBounds();
      if (onBoundsChange) {
        onBoundsChange({
          northEast: bounds.getNorthEast(),
          southWest: bounds.getSouthWest()
        });
      }
    },
    zoomend: (e) => {
      const map = e.target;
      const bounds = map.getBounds();
      if (onBoundsChange) {
        onBoundsChange({
          northEast: bounds.getNorthEast(),
          southWest: bounds.getSouthWest()
        });
      }
    }
  });

  return null;
};

const createClickPinIcon = () => {
  return L.divIcon({
    className: 'custom-click-pin',
    html: `
      <div class="relative flex items-center justify-center">
        <span class="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-brand-green opacity-50"></span>
        <div class="w-3.5 h-3.5 bg-brand-green border-2 border-white rounded-full shadow-lg"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Component to listen to map clicks and register coordinates selection
const MapClickSelector = ({ onMapClick, selectedLatLng }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    }
  });

  return selectedLatLng ? (
    <Marker 
      position={[selectedLatLng.lat, selectedLatLng.lng]} 
      icon={createClickPinIcon()}
    />
  ) : null;
};

export const InteractiveMap = ({ properties = [], activePropId, onMarkerHover, onBoundsChange, onMapClick, selectedLatLng }) => {
  // Default position centers over Bangalore, India
  const defaultCenter = [12.9716, 77.5946];
  const defaultZoom = 12;

  return (
    <div className="w-full h-full relative" id="property-map">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full min-h-[400px] rounded-xl"
        scrollWheelZoom={true}
      >
        {/* Light-themed tile layer provider (CartoDB Positron matches the light/white aesthetics perfectly) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {properties.map(prop => (
          <Marker
            key={prop.id}
            position={[prop.latitude, prop.longitude]}
            icon={createPriceIcon(prop.monthly_rent, prop.id === activePropId)}
            eventHandlers={{
              mouseover: () => onMarkerHover && onMarkerHover(prop.id),
              mouseout: () => onMarkerHover && onMarkerHover(null)
            }}
          >
            <Popup>
              <div className="p-1 space-y-1.5 font-sans">
                <img
                  src={prop.image_urls?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=150'}
                  alt={prop.title}
                  className="w-full h-20 object-cover rounded-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=150';
                  }}
                />
                <h4 className="font-semibold text-xs text-brand-text line-clamp-1 mt-1">{prop.title}</h4>
                <p className="text-brand-green text-xs font-bold">₹{Number(prop.monthly_rent).toLocaleString()}/month</p>
                <div className="text-[10px] text-brand-secondary">
                  {prop.bedrooms} Bed | {prop.bathrooms} Bath | {prop.area_sqft} sqft
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <FitBounds properties={properties} />
        <MapEvents onBoundsChange={onBoundsChange} />
        <MapClickSelector onMapClick={onMapClick} selectedLatLng={selectedLatLng} />
      </MapContainer>
    </div>
  );
};
