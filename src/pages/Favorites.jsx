import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../store/useAuth';
import { useFavorites } from '../store/useFavorites';
import { PropertyCard } from '../components/properties/PropertyCard';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { Heart, Home, ArrowLeft } from 'lucide-react';

export default function Favorites() {
  const { profile } = useAuth();
  const { favoriteIds } = useFavorites();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePropId, setActivePropId] = useState(null);

  const storageKey = profile ? `rentease_favorites_${profile.id}` : 'rentease_favorites_anon';
  const currentFavoriteIds = favoriteIds[storageKey] || [];

  useEffect(() => {
    async function loadFavoritedProperties() {
      if (currentFavoriteIds.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .in('id', currentFavoriteIds)
          .eq('status', 'PUBLISHED');

        if (error) throw error;
        
        // Order the results to match the order they were favorited
        const orderedData = data ? [...data].sort((a, b) => {
          return currentFavoriteIds.indexOf(a.id) - currentFavoriteIds.indexOf(b.id);
        }) : [];

        setProperties(orderedData);
      } catch (err) {
        console.error('Error fetching favorited properties:', err.message);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    }
    loadFavoritedProperties();
  }, [JSON.stringify(currentFavoriteIds)]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-130px)] w-full overflow-hidden bg-brand-bg font-sans">
      {/* LEFT: Favorites list */}
      <div className="w-full lg:w-[55%] flex flex-col h-full border-r border-brand-border overflow-y-auto p-4 sm:p-6 space-y-6">
        
        {/* Header Block */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-brand-secondary hover:text-brand-green p-1 rounded-lg hover:bg-brand-surface transition-all">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
              My Favorites
            </h1>
          </div>
          <p className="text-brand-secondary text-sm">
            You have saved <span className="font-bold text-brand-green">{properties.length}</span> properties.
          </p>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex-1">
            <SkeletonLoader type="card" count={2} />
          </div>
        ) : properties.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-brand-section rounded-xl border border-brand-border/40 text-center space-y-4">
            <div className="p-4 bg-brand-error/10 text-brand-error rounded-full animate-pulseSlow">
              <Heart size={36} fill="currentColor" />
            </div>
            <div className="space-y-1">
              <h3 className="text-brand-text font-bold text-lg">Your favorites list is empty</h3>
              <p className="text-brand-secondary text-sm max-w-sm">
                Like properties while exploring to save them here for quick access later.
              </p>
            </div>
            <Link
              to="/"
              className="bg-brand-green hover:bg-brand-green-deep text-brand-dark hover:text-white font-bold text-xs py-3 px-6 rounded-lg shadow uppercase tracking-wider transition-colors"
            >
              Explore Properties
            </Link>
          </div>
        ) : (
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.map(prop => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  active={prop.id === activePropId}
                  onHover={setActivePropId}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Map of favorited properties */}
      <div className="hidden lg:block lg:w-[45%] h-full relative z-0">
        {properties.length > 0 ? (
          <InteractiveMap
            properties={properties}
            activePropId={activePropId}
            onMarkerHover={setActivePropId}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-surface/30">
            <div className="text-center p-6 space-y-2 text-brand-secondary">
              <Home size={40} className="mx-auto opacity-40 text-brand-green" />
              <p className="text-xs">No active map locations to display</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
