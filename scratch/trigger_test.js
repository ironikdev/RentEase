import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock browser globals for Zustand & Supabase client to load without crashing in Node
global.window = {
  location: { origin: 'http://localhost:5173' }
};
global.localStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = String(value);
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
  get length() {
    return Object.keys(this.store).length;
  },
  key(index) {
    return Object.keys(this.store)[index] || null;
  }
};

// Seed profiles and favorites in the mocked localStorage
const mockTenantId = 'mock-tenant-id-test';
const propertyId = 'prop-1';

// Add profile
global.localStorage.setItem('rentease_profiles', JSON.stringify([
  {
    id: mockTenantId,
    email: 'studydevonly@gmail.com',
    full_name: 'Test Tenant User',
    role: 'TENANT'
  }
]));

// Add favorite
global.localStorage.setItem(`rentease_favorites_${mockTenantId}`, JSON.stringify([propertyId]));

// Load stores
import { useNotifications } from '../src/store/useNotifications.js';

async function runTest() {
  console.log('Testing notification workflow...');
  
  const property = {
    id: propertyId,
    title: 'Cozy Modern Studio in Indiranagar',
    monthly_rent: 18000.00,
    description: 'A beautiful furnished studio apartment in Indiranagar.'
  };

  // Trigger the workflow
  console.log('Invoking triggerNotificationWorkflow for property:', property.title);
  
  // Call the store action
  await useNotifications.getState().triggerNotificationWorkflow(property);
  
  console.log('\nResulting notifications in localStorage for tenant:');
  const tenantNotifs = global.localStorage.getItem(`rentease_notifications_${mockTenantId}`);
  console.log(tenantNotifs ? JSON.parse(tenantNotifs) : 'No notifications created!');
}

runTest().catch(console.error);
