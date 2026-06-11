import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Detect if we should use mock database or live Supabase
export const isMockMode = !supabaseUrl || 
                          supabaseUrl === 'placeholder' || 
                          !supabaseAnonKey || 
                          supabaseAnonKey === 'placeholder';

// SEED DATA FOR MOCK MODE
const DEFAULT_PROFILES = [
  {
    id: 'mock-landlord-id',
    email: 'landlord@rentease.com',
    full_name: 'Sarah Jenkins',
    role: 'LANDLORD',
    phone: '+1 (555) 234-5678',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    is_verified: true,
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'mock-tenant-id',
    email: 'tenant@rentease.com',
    full_name: 'Alex Rivera',
    role: 'TENANT',
    phone: '+1 (555) 876-5432',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    is_verified: false,
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'mock-admin-id',
    email: 'admin@rentease.com',
    full_name: 'Super Admin',
    role: 'ADMIN',
    phone: '+1 (555) 999-0000',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    is_verified: true,
    is_active: true,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString()
  }
];

const DEFAULT_PROPERTIES = [
  {
    id: 'prop-1',
    landlord_id: 'mock-landlord-id',
    title: 'Cozy Modern Studio in Indiranagar',
    type: 'STUDIO',
    description: 'A beautiful, fully furnished studio apartment located in the heart of Indiranagar, Bangalore. Features a modern kitchen, large windows with garden views, and energy-efficient appliances. Near Metro station and local markets.',
    area_sqft: 550,
    bedrooms: 1,
    bathrooms: 1,
    monthly_rent: 18000.00,
    security_deposit: 50000.00,
    latitude: 12.9716,
    longitude: 77.5946,
    status: 'PUBLISHED',
    amenities: ['WiFi', 'AC', 'Parking', 'Gym', 'Pet-friendly'],
    image_urls: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600'
    ],
    availability: { booked_dates: [] },
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: 'prop-2',
    landlord_id: 'mock-landlord-id',
    title: 'Luxury Lakeside Villa in Ulsoor',
    type: 'VILLA',
    description: 'Stunning 4-bedroom villa with private access to Ulsoor Lake, Bangalore. Includes private landscaping, massive open-concept kitchen, home theater, heated pool, and high-end security. Fully air-conditioned.',
    area_sqft: 3200,
    bedrooms: 4,
    bathrooms: 3,
    monthly_rent: 95000.00,
    security_deposit: 300000.00,
    latitude: 12.9850,
    longitude: 77.6050,
    status: 'PUBLISHED',
    amenities: ['WiFi', 'AC', 'Parking', 'Pool', 'Gym', 'Pet-friendly'],
    image_urls: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600'
    ],
    availability: { booked_dates: [] },
    created_at: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 'prop-3',
    landlord_id: 'mock-landlord-id',
    title: 'Urban Chic Penthouse in Koramangala',
    type: 'APARTMENT',
    description: 'Breathtaking penthouse offering views over Bangalore skyline. Located in Koramangala 4th block. Features floor-to-ceiling windows, modern concrete floors, a private rooftop deck, concierge service, and a resident lounge.',
    area_sqft: 1200,
    bedrooms: 2,
    bathrooms: 2,
    monthly_rent: 42000.00,
    security_deposit: 120000.00,
    latitude: 12.9300,
    longitude: 77.6100,
    status: 'PUBLISHED',
    amenities: ['WiFi', 'AC', 'Parking', 'Gym'],
    image_urls: [
      'https://images.unsplash.com/photo-1502672071375-74387ec444a8?w=600',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'
    ],
    availability: { booked_dates: [] },
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'prop-4',
    landlord_id: 'mock-landlord-id',
    title: 'Quaint Family House in Malleshwaram',
    type: 'HOUSE',
    description: 'Lovely heritage house in quiet, friendly Malleshwaram, Bangalore. Comes with a spacious green backyard, garden gazebo, large detached garage, and a traditional portico. Ideal for families looking for peace.',
    area_sqft: 1800,
    bedrooms: 3,
    bathrooms: 2,
    monthly_rent: 28000.00,
    security_deposit: 80000.00,
    latitude: 12.9900,
    longitude: 77.5500,
    status: 'PUBLISHED',
    amenities: ['WiFi', 'Parking', 'Pet-friendly'],
    image_urls: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600'
    ],
    availability: { booked_dates: [] },
    created_at: new Date(Date.now() - 15 * 86400000).toISOString()
  }
];

const DEFAULT_BOOKINGS = [
  {
    id: 'booking-1',
    property_id: 'prop-1',
    tenant_id: 'mock-tenant-id',
    start_date: '2026-07-01',
    end_date: '2026-07-31',
    total_amount: 18000.00,
    platform_fee: 540.00,
    status: 'CONFIRMED',
    payment_intent_id: 'pi_mock_1234567890',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

const DEFAULT_MESSAGES = [
  {
    id: 'msg-1',
    property_id: 'prop-1',
    sender_id: 'mock-tenant-id',
    receiver_id: 'mock-landlord-id',
    message_text: 'Hi Sarah, I am interested in booking your studio. Is it available for a viewing this Saturday?',
    image_url: null,
    is_read: true,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'msg-2',
    property_id: 'prop-1',
    sender_id: 'mock-landlord-id',
    receiver_id: 'mock-tenant-id',
    message_text: 'Hello Alex! Yes, Saturday at 11 AM works perfectly for me. See you then!',
    image_url: null,
    is_read: true,
    created_at: new Date(Date.now() - 3000000).toISOString()
  }
];

const initLocalStorage = () => {
  if (!localStorage.getItem('rentease_profiles')) {
    localStorage.setItem('rentease_profiles', JSON.stringify(DEFAULT_PROFILES));
  } else {
    try {
      const current = JSON.parse(localStorage.getItem('rentease_profiles') || '[]');
      let updated = [...current];
      let changed = false;
      DEFAULT_PROFILES.forEach(dp => {
        if (!current.some(p => p.email.toLowerCase() === dp.email.toLowerCase())) {
          updated.push(dp);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('rentease_profiles', JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Error merging profiles:', e);
    }
  }
  if (!localStorage.getItem('rentease_properties')) {
    localStorage.setItem('rentease_properties', JSON.stringify(DEFAULT_PROPERTIES));
  }
  if (!localStorage.getItem('rentease_bookings')) {
    localStorage.setItem('rentease_bookings', JSON.stringify(DEFAULT_BOOKINGS));
  }
  if (!localStorage.getItem('rentease_messages')) {
    localStorage.setItem('rentease_messages', JSON.stringify(DEFAULT_MESSAGES));
  }
};

if (isMockMode) {
  initLocalStorage();
}

// SIMULATED MOCK SUPABASE CLIENT
const createMockClient = () => {
  console.warn('RentEase is running in MOCK DATABASE mode. Data will persist in LocalStorage.');

  // Current session mock state
  let currentSession = null;
  const storedUser = localStorage.getItem('rentease_current_user');
  if (storedUser) {
    currentSession = JSON.parse(storedUser);
  }

  const authCallbacks = [];

  const notifyAuthListeners = () => {
    authCallbacks.forEach(cb => cb('SIGNED_IN', currentSession));
  };

  return {
    auth: {
      async signUp({ email, password, options = {} }) {
        initLocalStorage();
        const profiles = JSON.parse(localStorage.getItem('rentease_profiles'));
        
        if (profiles.some(p => p.email.toLowerCase() === email.toLowerCase())) {
          return { data: { user: null }, error: { message: 'User already exists.' } };
        }

        const userId = 'mock-' + Math.random().toString(36).substr(2, 9);
        const newUserProfile = {
          id: userId,
          email: email,
          full_name: options.data?.full_name || 'New User',
          role: options.data?.role || 'TENANT',
          phone: options.data?.phone || '',
          avatar_url: options.data?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          is_verified: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        profiles.push(newUserProfile);
        localStorage.setItem('rentease_profiles', JSON.stringify(profiles));

        const session = {
          user: {
            id: userId,
            email: email,
            user_metadata: options.data || {}
          },
          access_token: 'mock-jwt-token'
        };

        currentSession = session;
        localStorage.setItem('rentease_current_user', JSON.stringify(session));
        notifyAuthListeners();

        return { data: { user: session.user, session }, error: null };
      },

      async signInWithPassword({ email, password }) {
        initLocalStorage();
        const profiles = JSON.parse(localStorage.getItem('rentease_profiles'));
        const userProfile = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());

        if (!userProfile) {
          return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } };
        }

        const session = {
          user: {
            id: userProfile.id,
            email: userProfile.email,
            user_metadata: {
              full_name: userProfile.full_name,
              role: userProfile.role,
              avatar_url: userProfile.avatar_url,
              phone: userProfile.phone
            }
          },
          access_token: 'mock-jwt-token'
        };

        currentSession = session;
        localStorage.setItem('rentease_current_user', JSON.stringify(session));
        notifyAuthListeners();

        return { data: { user: session.user, session }, error: null };
      },

      async signOut() {
        currentSession = null;
        localStorage.removeItem('rentease_current_user');
        authCallbacks.forEach(cb => cb('SIGNED_OUT', null));
        return { error: null };
      },

      async getUser() {
        if (!currentSession) return { data: { user: null }, error: null };
        return { data: { user: currentSession.user }, error: null };
      },

      onAuthStateChange(callback) {
        authCallbacks.push(callback);
        // Fire initially
        callback(currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', currentSession);
        return {
          data: {
            subscription: {
              unsubscribe() {
                const idx = authCallbacks.indexOf(callback);
                if (idx !== -1) authCallbacks.splice(idx, 1);
              }
            }
          }
        };
      }
    },

    from(tableName) {
      initLocalStorage();
      const storageKey = `rentease_${tableName}`;
      
      const getItems = () => JSON.parse(localStorage.getItem(storageKey) || '[]');
      const setItems = (items) => localStorage.setItem(storageKey, JSON.stringify(items));

      let queryData = getItems();

      // Query Builder Mock Implementation
      const builder = {
        select(fields) {
          // Simplification: returns all fields.
          return this;
        },

        eq(column, value) {
          queryData = queryData.filter(item => item[column] === value);
          return this;
        },

        or(filterString) {
          // Basic parser for or logic e.g. "sender_id.eq.abc,receiver_id.eq.abc"
          const conditions = filterString.split(',');
          queryData = queryData.filter(item => {
            return conditions.some(cond => {
              const [col, op, val] = cond.split('.');
              if (op === 'eq') return item[col] === val;
              return false;
            });
          });
          return this;
        },

        order(column, { ascending = true } = {}) {
          queryData.sort((a, b) => {
            if (a[column] < b[column]) return ascending ? -1 : 1;
            if (a[column] > b[column]) return ascending ? 1 : -1;
            return 0;
          });
          return this;
        },

        async insert(payloads) {
          const items = getItems();
          const list = Array.isArray(payloads) ? payloads : [payloads];
          const newItems = list.map(item => ({
            id: item.id || 'id-' + Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString(),
            ...item
          }));

          items.push(...newItems);
          setItems(items);
          return { data: Array.isArray(payloads) ? newItems : newItems[0], error: null };
        },

        async update(payload) {
          const items = getItems();
          // Update matching items in the filtered queryData
          const idsToUpdate = queryData.map(d => d.id);
          const updatedItems = items.map(item => {
            if (idsToUpdate.includes(item.id)) {
              return { ...item, ...payload, updated_at: new Date().toISOString() };
            }
            return item;
          });
          setItems(updatedItems);
          return { data: payload, error: null };
        },

        async delete() {
          const items = getItems();
          const idsToDelete = queryData.map(d => d.id);
          const remainingItems = items.filter(item => !idsToDelete.includes(item.id));
          setItems(remainingItems);
          return { data: null, error: null };
        },

        async single() {
          if (queryData.length === 0) {
            return { data: null, error: { message: 'Row not found' } };
          }
          return { data: queryData[0], error: null };
        },

        // End of builder chains: resolves query
        then(onfulfilled) {
          // Resolve standard promise
          const result = { data: queryData, error: null };
          return Promise.resolve(result).then(onfulfilled);
        }
      };

      return builder;
    },

    storage: {
      from(bucketName) {
        return {
          async upload(filePath, fileObject) {
            // Mock file upload by returning a random unsplash url
            const randomImages = [
              'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=600',
              'https://images.unsplash.com/photo-1560448204-61dc297c0330?w=600',
              'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600',
              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600'
            ];
            const randomUrl = randomImages[Math.floor(Math.random() * randomImages.length)];
            return { data: { path: filePath, publicUrl: randomUrl }, error: null };
          },
          getPublicUrl(filePath) {
            // Always return a placeholder profile/property image
            return { data: { publicUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600' } };
          }
        };
      }
    },

    channel(channelName) {
      return {
        on(event, filter, callback) {
          // Store callbacks globally in window for mock real-time events
          if (!window._mock_rt_listeners) window._mock_rt_listeners = {};
          if (!window._mock_rt_listeners[channelName]) window._mock_rt_listeners[channelName] = [];
          window._mock_rt_listeners[channelName].push(callback);
          return this;
        },
        subscribe() {
          // Return listener handle
          const chName = channelName;
          return {
            unsubscribe() {
              if (window._mock_rt_listeners && window._mock_rt_listeners[chName]) {
                delete window._mock_rt_listeners[chName];
              }
            }
          };
        }
      };
    }
  };
};

// MOCK OR REAL SUPABASE CLIENT EXPORT
export const supabase = isMockMode 
  ? createMockClient() 
  : createClient(supabaseUrl, supabaseAnonKey);

// Real-time helper for mock messages
export const triggerMockRealtimeMessage = (message) => {
  if (isMockMode && window._mock_rt_listeners) {
    // Look for any message listeners
    Object.keys(window._mock_rt_listeners).forEach(channelName => {
      if (channelName.includes('messages') || channelName.includes('realtime')) {
        window._mock_rt_listeners[channelName].forEach(cb => {
          cb({
            eventType: 'INSERT',
            new: message
          });
        });
      }
    });
  }
};
