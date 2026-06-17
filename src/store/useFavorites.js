import { create } from 'zustand';
import { supabase, isMockMode } from '../supabaseClient';

export const useFavorites = create((set, get) => {
  const getStorageKey = (profileId) => {
    return profileId ? `rentease_favorites_${profileId}` : 'rentease_favorites_anon';
  };

  return {
    favoriteIds: {}, // Keyed by profile storage key

    loadFavorites: async (profileId) => {
      const key = getStorageKey(profileId);
      if (isMockMode || !profileId) {
        let ids = [];
        try {
          const stored = localStorage.getItem(key);
          ids = stored ? JSON.parse(stored) : [];
        } catch (e) {
          console.error('Failed to load favorites from localStorage:', e);
        }
        set((state) => ({
          favoriteIds: {
            ...state.favoriteIds,
            [key]: ids
          }
        }));
        return;
      }

      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('property_id')
          .eq('user_id', profileId);

        if (error) throw error;
        const ids = (data || []).map(f => f.property_id);
        set((state) => ({
          favoriteIds: {
            ...state.favoriteIds,
            [key]: ids
          }
        }));
      } catch (e) {
        console.error('Failed to load favorites from Supabase:', e);
      }
    },

    isFavorite: (id, profileId) => {
      const key = getStorageKey(profileId);
      const ids = get().favoriteIds[key] || [];
      return ids.includes(id);
    },

    toggleFavorite: async (id, profileId) => {
      const key = getStorageKey(profileId);
      const currentIds = get().favoriteIds[key] || [];
      const favorited = currentIds.includes(id);

      let newIds;
      if (favorited) {
        newIds = currentIds.filter(favId => favId !== id);
      } else {
        newIds = [...currentIds, id];
      }

      // Optimistic local state update
      set((state) => ({
        favoriteIds: {
          ...state.favoriteIds,
          [key]: newIds
        }
      }));

      if (isMockMode || !profileId) {
        try {
          localStorage.setItem(key, JSON.stringify(newIds));
        } catch (e) {
          console.error('Failed to save favorites to localStorage:', e);
        }
        return;
      }

      try {
        if (favorited) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', profileId)
            .eq('property_id', id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('favorites')
            .insert({
              user_id: profileId,
              property_id: id
            });
          if (error) throw error;
        }
      } catch (e) {
        console.error('Failed to sync toggle favorite with Supabase:', e);
        // Rollback local state on error
        set((state) => ({
          favoriteIds: {
            ...state.favoriteIds,
            [key]: currentIds
          }
        }));
      }
    }
  };
});
