import { create } from 'zustand';
import { supabase } from '../supabaseClient';

export const useAuth = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  // Calculate profile completeness percent
  getProfileCompleteness: () => {
    const { profile } = get();
    if (!profile) return 0;
    
    let fields = ['full_name', 'email', 'phone', 'avatar_url'];
    if (profile.role === 'LANDLORD') {
      fields.push('is_verified'); // Needs document verification
    }
    
    let filled = fields.filter(f => {
      const val = profile[f];
      return val !== null && val !== undefined && val !== '' && val !== false;
    });

    return Math.round((filled.length / fields.length) * 100);
  },

  signUp: async (email, password, fullName, role, phone = '') => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            phone,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`
          }
        }
      });

      if (error) throw error;
      
      // If we are in real Supabase mode, the trigger handles inserting the profile.
      // But we can query the profile to ensure it is synchronized.
      let profile = null;
      if (data.user) {
        // Query the profile
        const { data: prof, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (!profError) {
          profile = prof;
        } else {
          // Fallback if trigger hasn't finished immediately
          profile = {
            id: data.user.id,
            email,
            full_name: fullName,
            role,
            phone,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`,
            is_verified: false,
            is_active: true
          };
        }
      }

      set({ user: data.user, profile, loading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const DEV_VERBOSE = import.meta.env.DEV;
      if (DEV_VERBOSE) {
        const masked = password ? '*'.repeat(Math.min(3, password.length)) : '';
        console.debug('[useAuth] signIn attempt', { email: email?.toLowerCase(), password: masked });
      }
      const lowerEmail = email.toLowerCase();
      if (password === 'password' && ['admin@rentease.com', 'landlord@rentease.com', 'tenant@rentease.com'].includes(lowerEmail)) {
        let profileData = null;
        let mockId = '';
        let fullName = '';
        let role = '';

        if (lowerEmail === 'admin@rentease.com') {
          mockId = 'mock-admin-id';
          fullName = 'Super Admin';
          role = 'ADMIN';
          profileData = {
            id: mockId,
            email: lowerEmail,
            full_name: fullName,
            role: role,
            phone: '+1 (555) 999-0000',
            avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            is_verified: true,
            is_active: true
          };
        } else if (lowerEmail === 'landlord@rentease.com') {
          mockId = 'mock-landlord-id';
          fullName = 'Sarah Jenkins';
          role = 'LANDLORD';
          profileData = {
            id: mockId,
            email: lowerEmail,
            full_name: fullName,
            role: role,
            phone: '+1 (555) 234-5678',
            avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            is_verified: true,
            is_active: true
          };
        } else {
          mockId = 'mock-tenant-id';
          fullName = 'Alex Rivera';
          role = 'TENANT';
          profileData = {
            id: mockId,
            email: lowerEmail,
            full_name: fullName,
            role: role,
            phone: '+1 (555) 876-5432',
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            is_verified: false,
            is_active: true
          };
        }

        const session = {
          user: {
            id: mockId,
            email: lowerEmail,
            user_metadata: {
              full_name: fullName,
              role: role,
              avatar_url: profileData.avatar_url,
              phone: profileData.phone
            }
          },
          access_token: 'mock-jwt-token'
        };

        localStorage.setItem('rentease_current_user', JSON.stringify(session));

        try {
          const profiles = JSON.parse(localStorage.getItem('rentease_profiles') || '[]');
          if (!profiles.some(p => p.email.toLowerCase() === lowerEmail)) {
            profiles.push(profileData);
            localStorage.setItem('rentease_profiles', JSON.stringify(profiles));
          }
        } catch (e) {
          console.error(e);
        }

        set({ user: session.user, profile: profileData, loading: false });
        return { success: true };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (DEV_VERBOSE) console.debug('[useAuth] supabase.auth.signInWithPassword result', { data, error });

      if (error) throw error;

      // Fetch user profile; if missing, attempt to create a fallback profile
      let profile = null;
      try {
        const { data: profData, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profError || !profData) {
          // Build fallback from auth metadata
          const fallback = {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || '',
            role: data.user.user_metadata?.role || 'TENANT',
            phone: data.user.user_metadata?.phone || '',
            avatar_url: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.user.email)}`,
            is_verified: false,
            is_active: true
          };

          // Try to insert fallback profile (idempotent if it already exists)
          const { data: insertData, error: insertError } = await supabase
            .from('profiles')
            .insert(fallback)
            .select('*');

          if (insertError) {
            // If insert fails because profile already exists concurrently, attempt to read again
            const { data: retryData /*, error: retryErr */ } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();
            profile = retryData || fallback;
          } else {
            // Insert returned data may be array or object depending on client
            profile = Array.isArray(insertData) ? insertData[0] : insertData;
          }
        } else {
          profile = profData;
        }
      } catch (errProfile) {
        // As a last resort, construct an in-memory fallback profile so UI can proceed
        profile = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || 'Guest User',
          role: data.user.user_metadata?.role || 'TENANT',
          phone: data.user.user_metadata?.phone || '',
          avatar_url: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.user.email)}`,
          is_verified: false,
          is_active: true
        };
      }

      set({ user: data.user, profile, loading: false });
      return { success: true };
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useAuth] signIn error', err);
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, profile: null, loading: false });
  },

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return { success: false, error: 'No active session' };

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

      if (error) throw error;

      const updatedProfile = { ...profile, ...updates };
      set({ profile: updatedProfile, loading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  initSession: async () => {
    set({ loading: true });
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (import.meta.env.DEV) console.debug('[useAuth] onAuthStateChange', { event, session });
      if (session?.user) {
        try {
          // Try to load profile from DB
          const { data: profileData, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          let profile = null;
          if (profError || !profileData) {
            // Attempt to create fallback profile row
            const fallback = {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || 'Guest User',
              role: session.user.user_metadata?.role || 'TENANT',
              phone: session.user.user_metadata?.phone || '',
              avatar_url: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(session.user.email)}`,
              is_verified: false,
              is_active: true
            };

            const { data: insertData, error: insertError } = await supabase
              .from('profiles')
              .insert(fallback)
              .select('*');

            profile = insertError ? (Array.isArray(insertData) ? insertData[0] : insertData) : (Array.isArray(insertData) ? insertData[0] : insertData) || fallback;
          } else {
            profile = profileData;
          }

          set({ user: session.user, profile, loading: false });
        } catch (err) {
          // Fail-safe default profile to keep UI usable
          set({
            user: session.user,
            profile: {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || 'Guest User',
              role: session.user.user_metadata?.role || 'TENANT',
              phone: session.user.user_metadata?.phone || '',
              avatar_url: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              is_verified: false,
              is_active: true
            },
            loading: false
          });
        }
      } else {
        set({ user: null, profile: null, loading: false });
      }
    });
  }
}));
