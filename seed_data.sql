-- RentEase Database Seeding Script
-- Copy and run this script in your Supabase SQL Editor (https://database.new or Project -> SQL Editor)

-- 1. Confirm all users' emails so you can log in immediately with any registered email
UPDATE auth.users
SET email_confirmed_at = NOW(),
    last_sign_in_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. Ensure profile exists in profiles table and role is set to LANDLORD
INSERT INTO public.profiles (id, email, full_name, role, phone, avatar_url, is_verified, is_active)
VALUES (
  'd319e90d-141e-42d0-846e-bf5fcbea68e5',
  'owner@rentease.com',
  'Sarah Jenkins',
  'LANDLORD',
  '+91 98765 43210',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  true,
  true
)
ON CONFLICT (id) DO UPDATE
SET role = 'LANDLORD', 
    is_verified = true,
    is_active = true;

-- 3. Clear existing properties listed by this landlord to prevent duplicates
DELETE FROM public.properties WHERE landlord_id = 'd319e90d-141e-42d0-846e-bf5fcbea68e5';

-- 4. Seed the 4 Bengalure properties
INSERT INTO public.properties (
  landlord_id, title, type, description, area_sqft, bedrooms, bathrooms,
  monthly_rent, security_deposit, latitude, longitude, status, availability_status, amenities, image_urls
) VALUES
(
  'd319e90d-141e-42d0-846e-bf5fcbea68e5',
  'Cozy Modern Studio in Indiranagar',
  'STUDIO',
  'A beautiful, fully furnished studio apartment located in the heart of Indiranagar, Bangalore. Features a modern kitchen, large windows with garden views, and energy-efficient appliances. Near Metro station and local markets.',
  550,
  1,
  1,
  18000.00,
  50000.00,
  12.9716,
  77.5946,
  'PUBLISHED',
  'Available',
  ARRAY['WiFi', 'AC', 'Parking', 'Gym', 'Pet-friendly'],
  ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600']
),
(
  'd319e90d-141e-42d0-846e-bf5fcbea68e5',
  'Luxury Lakeside Villa in Ulsoor',
  'VILLA',
  'Stunning 4-bedroom villa with private access to Ulsoor Lake, Bangalore. Includes private landscaping, massive open-concept kitchen, home theater, heated pool, and high-end security. Fully air-conditioned.',
  3200,
  4,
  3,
  95000.00,
  300000.00,
  12.9850,
  77.6050,
  'PUBLISHED',
  'Available',
  ARRAY['WiFi', 'AC', 'Parking', 'Pool', 'Gym', 'Pet-friendly'],
  ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600']
),
(
  'd319e90d-141e-42d0-846e-bf5fcbea68e5',
  'Urban Chic Penthouse in Koramangala',
  'APARTMENT',
  'Breathtaking penthouse offering views over Bangalore skyline. Located in Koramangala 4th block. Features floor-to-ceiling windows, modern concrete floors, a private rooftop deck, concierge service, and a resident lounge.',
  1200,
  2,
  2,
  42000.00,
  120000.00,
  12.9300,
  77.6100,
  'PUBLISHED',
  'Available',
  ARRAY['WiFi', 'AC', 'Parking', 'Gym'],
  ARRAY['https://images.unsplash.com/photo-1502672071375-74387ec444a8?w=600', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600']
),
(
  'd319e90d-141e-42d0-846e-bf5fcbea68e5',
  'Quaint Family House in Malleshwaram',
  'HOUSE',
  'Lovely heritage house in quiet, friendly Malleshwaram, Bangalore. Comes with a spacious green backyard, garden gazebo, large detached garage, and a traditional portico. Ideal for families looking for peace.',
  1800,
  3,
  2,
  28000.00,
  80000.00,
  12.9900,
  77.5500,
  'PUBLISHED',
  'Available',
  ARRAY['WiFi', 'Parking', 'Pet-friendly'],
  ARRAY['https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600']
);
