import { create } from 'zustand';
import { supabase, isMockMode } from '../supabaseClient';
import { useAuth } from './useAuth';

const mapSupabaseNotification = (n) => ({
  id: n.id,
  userId: n.user_id,
  propertyId: n.property_id,
  title: n.title,
  message: n.message,
  read: n.is_read,
  createdAt: n.created_at
});

export const useNotifications = create((set, get) => {
  const getStorageKey = (profileId) => {
    return profileId ? `rentease_notifications_${profileId}` : 'rentease_notifications_anon';
  };

  return {
    notifications: {}, // Keyed by profile storage key

    loadNotifications: async (profileId) => {
      const key = getStorageKey(profileId);
      if (isMockMode || !profileId) {
        let list = [];
        try {
          const stored = localStorage.getItem(key);
          list = stored ? JSON.parse(stored) : [];
        } catch (e) {
          console.error('Failed to load notifications from localStorage:', e);
        }
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: list
          }
        }));
        return;
      }

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', profileId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        const list = (data || []).map(mapSupabaseNotification);
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: list
          }
        }));
      } catch (e) {
        console.error('Failed to load notifications from Supabase:', e);
      }
    },

    addNotification: async (profileId, notification) => {
      const key = getStorageKey(profileId);
      if (isMockMode || !profileId) {
        const currentList = get().notifications[key] || [];
        const newList = [notification, ...currentList];
        try {
          localStorage.setItem(key, JSON.stringify(newList));
        } catch (e) {
          console.error('Failed to save notification to localStorage:', e);
        }
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: newList
          }
        }));
        return;
      }

      try {
        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: profileId,
            property_id: notification.propertyId,
            title: notification.title,
            message: notification.message,
            is_read: notification.read || false
          });
        if (error) throw error;
        await get().loadNotifications(profileId);
      } catch (e) {
        console.error('Failed to save notification to Supabase:', e);
      }
    },

    markAsRead: async (id, profileId) => {
      const key = getStorageKey(profileId);
      if (isMockMode || !profileId) {
        const currentList = get().notifications[key] || [];
        const newList = currentList.map(n => n.id === id ? { ...n, read: true } : n);
        try {
          localStorage.setItem(key, JSON.stringify(newList));
        } catch (e) {
          console.error('Failed to save notifications to localStorage:', e);
        }
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: newList
          }
        }));
        return;
      }

      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
        if (error) throw error;
        await get().loadNotifications(profileId);
      } catch (e) {
        console.error('Failed to mark notification as read in Supabase:', e);
      }
    },

    markAllAsRead: async (profileId) => {
      const key = getStorageKey(profileId);
      if (isMockMode || !profileId) {
        const currentList = get().notifications[key] || [];
        const newList = currentList.map(n => ({ ...n, read: true }));
        try {
          localStorage.setItem(key, JSON.stringify(newList));
        } catch (e) {
          console.error('Failed to save notifications to localStorage:', e);
        }
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: newList
          }
        }));
        return;
      }

      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', profileId)
          .eq('is_read', false);
        if (error) throw error;
        await get().loadNotifications(profileId);
      } catch (e) {
        console.error('Failed to mark all notifications as read in Supabase:', e);
      }
    },

    removeNotification: async (id, profileId) => {
      const key = getStorageKey(profileId);
      if (isMockMode || !profileId) {
        const currentList = get().notifications[key] || [];
        const newList = currentList.filter(n => n.id !== id);
        try {
          localStorage.setItem(key, JSON.stringify(newList));
        } catch (e) {
          console.error('Failed to save notifications to localStorage:', e);
        }
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: newList
          }
        }));
        return;
      }

      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id);
        if (error) throw error;
        await get().loadNotifications(profileId);
      } catch (e) {
        console.error('Failed to delete notification in Supabase:', e);
      }
    },

    clearAllNotifications: async (profileId) => {
      const key = getStorageKey(profileId);
      if (isMockMode || !profileId) {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error('Failed to clear notifications in localStorage:', e);
        }
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: []
          }
        }));
        return;
      }

      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', profileId);
        if (error) throw error;
        await get().loadNotifications(profileId);
      } catch (e) {
        console.error('Failed to clear notifications in Supabase:', e);
      }
    },

    // Check availability of wishlisted properties and trigger notification if status transitions from leased to available
    checkFavoritesAvailability: async (profileId, favoriteIds) => {
      if (!favoriteIds || favoriteIds.length === 0) return;

      try {
        // Fetch properties status from Supabase
        const { data, error } = await supabase
          .from('properties')
          .select('id, title, availability, availability_status')
          .in('id', favoriteIds)
          .eq('status', 'PUBLISHED');

        if (error) throw error;
        if (!data || data.length === 0) return;

        const availKey = profileId ? `rentease_fav_avail_${profileId}` : 'rentease_fav_avail_anon';
        const storedMap = localStorage.getItem(availKey);
        const prevAvailability = storedMap ? JSON.parse(storedMap) : null;
        
        const currentAvailability = {};
        const newNotifs = [];

        data.forEach(prop => {
          // Check both legacy jsonb availability and new availability_status column
          const isAvailable = prop.availability_status === 'Available' || (prop.availability?.is_available !== false);
          currentAvailability[prop.id] = isAvailable;

          if (prevAvailability !== null) {
            const wasAvailable = prevAvailability[prop.id];
            // Alert if it transitioned from unavailable (false) to available (true)
            if (wasAvailable === false && isAvailable === true) {
              newNotifs.push({
                id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                propertyId: prop.id,
                title: 'Property Available!',
                message: `"${prop.title}" is now available for lease!`,
                read: false,
                createdAt: new Date().toISOString()
              });
            }
          }
        });

        // Save new availability map
        localStorage.setItem(availKey, JSON.stringify(currentAvailability));

        // If new notifications are triggered, save and update Zustand store
        if (newNotifs.length > 0) {
          const notifKey = getStorageKey(profileId);
          if (isMockMode || !profileId) {
            const currentNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
            const updatedNotifs = [...newNotifs, ...currentNotifs];
            localStorage.setItem(notifKey, JSON.stringify(updatedNotifs));
            set((state) => ({
              notifications: {
                ...state.notifications,
                [notifKey]: updatedNotifs
              }
            }));
          } else {
            // Save to Supabase
            for (const n of newNotifs) {
              await supabase.from('notifications').insert({
                user_id: profileId,
                property_id: n.propertyId,
                title: n.title,
                message: n.message,
                is_read: false
              });
            }
            await get().loadNotifications(profileId);
          }
        }
      } catch (err) {
        console.error('Error running checkFavoritesAvailability:', err.message);
      }
    },

    // Immediate local notification dispatcher when status is cancelled in the same browser session
    triggerAvailabilityNotification: (propertyId, propertyTitle) => {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('rentease_favorites_')) {
            const favorites = JSON.parse(localStorage.getItem(key) || '[]');
            if (favorites.includes(propertyId)) {
              // Extract profile ID or anon
              const userSuffix = key.replace('rentease_favorites_', '');
              const notifKey = `rentease_notifications_${userSuffix}`;
              const currentNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
              
              // Skip if unread availability notification for the same property already exists
              if (currentNotifs.some(n => n.propertyId === propertyId && !n.read && n.title === 'Property Available!')) {
                continue;
              }

              const newNotif = {
                id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                propertyId,
                title: 'Property Available!',
                message: `"${propertyTitle}" is now available for lease!`,
                read: false,
                createdAt: new Date().toISOString()
              };
              
              localStorage.setItem(notifKey, JSON.stringify([newNotif, ...currentNotifs]));
              
              // Update status local availability map so it remains in sync
              const availKey = `rentease_fav_avail_${userSuffix}`;
              const storedMap = JSON.parse(localStorage.getItem(availKey) || '{}');
              storedMap[propertyId] = true;
              localStorage.setItem(availKey, JSON.stringify(storedMap));
            }
          }
        }
        // Force reload active user's notifications state
        const activeProfile = useAuth.getState().profile;
        get().loadNotifications(activeProfile?.id);
      } catch (e) {
        console.error('Error running triggerAvailabilityNotification:', e);
      }
    },

    triggerNotificationWorkflow: async (property) => {
      try {
        const propertyId = property.id;
        const propertyTitle = property.title;
        const monthlyRent = property.monthly_rent;
        const location = property.description ? property.description.substring(0, 80) + '...' : 'Bangalore';
        
        // 1. Fetch all users who have saved/liked this property
        let userIds = [];
        if (isMockMode) {
          // Scan localStorage for favorites
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('rentease_favorites_')) {
              const favorites = JSON.parse(localStorage.getItem(key) || '[]');
              if (favorites.includes(propertyId)) {
                const userId = key.replace('rentease_favorites_', '');
                if (userId !== 'anon') {
                  userIds.push(userId);
                }
              }
            }
          }
        } else {
          // Query the favorites table
          const { data: favs, error: favsErr } = await supabase
            .from('favorites')
            .select('user_id')
            .eq('property_id', propertyId);
          
          if (favsErr) throw favsErr;
          userIds = (favs || []).map(f => f.user_id);
        }

        if (userIds.length === 0) {
          console.log('No users to notify for property availability transition.');
          return;
        }

        // 2. Fetch profile details of these users to send emails
        let profilesToNotify = [];
        if (isMockMode) {
          const profiles = JSON.parse(localStorage.getItem('rentease_profiles') || '[]');
          profilesToNotify = profiles.filter(p => userIds.includes(p.id));
        } else {
          const { data: profs, error: profsErr } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);
          
          if (profsErr) throw profsErr;
          profilesToNotify = profs || [];
        }

        // 3. Prevent duplicate notifications for the same availability event
        const title = 'Property Available Again';
        const message = `The property "${propertyTitle}" that you saved is now available for rent.`;

        for (const userProfile of profilesToNotify) {
          const userId = userProfile.id;
          let hasDuplicate = false;

          if (isMockMode) {
            const notifKey = `rentease_notifications_${userId}`;
            const currentNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
            // Check if there's already an unread notification with the same title for the same property
            hasDuplicate = currentNotifs.some(n => n.propertyId === propertyId && n.title === title && !n.read);
          } else {
            const { data: existing, error: existErr } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', userId)
              .eq('property_id', propertyId)
              .eq('title', title)
              .eq('is_read', false);
            
            if (!existErr && existing && existing.length > 0) {
              hasDuplicate = true;
            }
          }

          if (hasDuplicate) {
            console.log(`Skipping notification for user ${userId} to prevent duplicates.`);
            continue;
          }

          // Create In-App Notification
          if (isMockMode) {
            const notifKey = `rentease_notifications_${userId}`;
            const currentNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
            const newNotif = {
              id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
              propertyId,
              title,
              message,
              read: false,
              createdAt: new Date().toISOString()
            };
            localStorage.setItem(notifKey, JSON.stringify([newNotif, ...currentNotifs]));
          } else {
            const { error: insErr } = await supabase
              .from('notifications')
              .insert({
                user_id: userId,
                property_id: propertyId,
                title,
                message,
                is_read: false
              });
            if (insErr) console.error('Failed to insert Supabase notification:', insErr);
          }

          // Trigger email service API call
          try {
            const propertyUrl = `${window.location.origin}/properties/${propertyId}`;
            await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: userProfile.email,
                userName: userProfile.full_name || 'User',
                propertyName: propertyTitle,
                location,
                rent: `₹${Number(monthlyRent).toLocaleString()}`,
                propertyUrl
              })
            });
          } catch (emailErr) {
            console.error('Error calling send-email API:', emailErr);
          }
        }

        // Force reload notifications for the active logged-in user in case they are one of the recipients
        const activeProfile = useAuth.getState().profile;
        if (activeProfile) {
          get().loadNotifications(activeProfile.id);
        }
      } catch (err) {
        console.error('Error running triggerNotificationWorkflow:', err);
      }
    }
  };
});
