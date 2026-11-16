import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default marker icons in bundlers like Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to ensure Leaflet recalculates dimensions when container mounts
const MapResizer = () => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  return null;
};

// Custom price icon generator (Rupees formatting)
const createPriceIcon = (price, isActive) => {
  const numPrice = Number(price) || 0;
  const priceStr = numPrice >= 100000 
    ? `₹${(numPrice / 100000).toFixed(1)}L` 
    : numPrice >= 1000 
      ? `₹${(numPrice / 1000).toFixed(0)}k` 
      : `₹${numPrice}`;
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

// Component to dynamically adjust map view ONCE on load or filter reset.
// CRITICAL: Must NEVER re-fit bounds while the user is manually zooming or panning!
const FitBounds = ({ properties, isUserInteractingRef, resetBounds }) => {
  const map = useMap();
  const hasFittedRef = useRef(false);

  // If resetBounds is triggered (e.g. user clears map view filter), allow re-fitting once
  useEffect(() => {
    if (resetBounds) {
      hasFittedRef.current = false;
      if (isUserInteractingRef) {
        isUserInteractingRef.current = false;
      }
    }
  }, [resetBounds, isUserInteractingRef]);

  useEffect(() => {
    // If user has zoomed or dragged, do NOT override their manual view!
    if (isUserInteractingRef?.current) return;
    if (hasFittedRef.current) return;
    if (!properties || properties.length === 0) return;
    
    const validProps = properties.filter(
      p => p && p.latitude != null && p.longitude != null && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))
    );

    if (validProps.length === 0) return;

    if (validProps.length === 1) {
      map.setView([Number(validProps[0].latitude), Number(validProps[0].longitude)], 14);
      hasFittedRef.current = true;
      return;
    }

    try {
      const bounds = L.latLngBounds(validProps.map(p => [Number(p.latitude), Number(p.longitude)]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        hasFittedRef.current = true;
      }
    } catch (e) {
      console.warn('[InteractiveMap] Error fitting bounds:', e);
    }
  }, [properties, map, isUserInteractingRef]);

  return null;
};

// Component to handle map interactions like dragging and zooming with debouncing
const MapEvents = ({ onBoundsChange, isUserInteractingRef }) => {
  const timeoutRef = useRef(null);

  useMapEvents({
    movestart: () => {
      if (isUserInteractingRef) isUserInteractingRef.current = true;
    },
    zoomstart: () => {
      if (isUserInteractingRef) isUserInteractingRef.current = true;
    },
    dragstart: () => {
      if (isUserInteractingRef) isUserInteractingRef.current = true;
    },
    moveend: (e) => {
      if (!onBoundsChange) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const map = e.target;
        const bounds = map.getBounds();
        onBoundsChange({
          northEast: bounds.getNorthEast(),
          southWest: bounds.getSouthWest()
        });
      }, 350);
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

  return selectedLatLng && selectedLatLng.lat != null && selectedLatLng.lng != null ? (
    <Marker 
      position={[Number(selectedLatLng.lat), Number(selectedLatLng.lng)]} 
      icon={createClickPinIcon()}
    />
  ) : null;
};

export const InteractiveMap = ({
  properties = [],
  activePropId,
  onMarkerHover,
  onBoundsChange,
  onMapClick,
  selectedLatLng,
  resetBounds = false
}) => {
  // Default position centers over Bangalore, India
  const defaultCenter = [12.9716, 77.5946];
  const defaultZoom = 12;

  // Track whether movement is user-initiated (zoom/pan) to avoid auto-fit loops
  const isUserInteractingRef = useRef(false);

  // Filter properties with valid lat/long before creating markers
  const validProperties = properties.filter(
    prop => prop && prop.latitude != null && prop.longitude != null && !isNaN(Number(prop.latitude)) && !isNaN(Number(prop.longitude))
  );

  return (
    <div className="w-full h-full min-h-[350px] relative" id="property-map" style={{ width: '100%', height: '100%', minHeight: '350px' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full min-h-[350px] rounded-xl"
        style={{ width: '100%', height: '100%', minHeight: '350px' }}
        scrollWheelZoom={true}
      >
        <MapResizer />

        {/* 100% Free OpenStreetMap tile provider - No API key required, no 403 Forbidden errors */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        {validProperties.map(prop => (
          <Marker
            key={prop.id}
            position={[Number(prop.latitude), Number(prop.longitude)]}
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

        <FitBounds
          properties={validProperties}
          isUserInteractingRef={isUserInteractingRef}
          resetBounds={resetBounds}
        />
        <MapEvents
          onBoundsChange={onBoundsChange}
          isUserInteractingRef={isUserInteractingRef}
        />
        <MapClickSelector onMapClick={onMapClick} selectedLatLng={selectedLatLng} />
      </MapContainer>
    </div>
  );
};
