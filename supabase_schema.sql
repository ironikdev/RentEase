-- RentEase Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database tables, triggers, and Row Level Security (RLS) policies.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (linked to Auth.Users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('TENANT', 'LANDLORD', 'ADMIN')),
  phone text,
  avatar_url text,
  is_verified boolean default false,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone" 
  on public.profiles for select 
  using (true);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Admins can update any profile" 
  on public.profiles for update 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'ADMIN'
    )
  );

-- Trigger to create public profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, avatar_url, is_verified, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'role', 'TENANT'),
    new.raw_user_meta_data->>'avatar_url',
    false,
    true
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. PROPERTIES TABLE
create table public.properties (
  id uuid default gen_random_uuid() primary key,
  landlord_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  type text not null check (type in ('APARTMENT', 'HOUSE', 'STUDIO', 'VILLA', 'OTHER')),
  description text not null,
  area_sqft integer not null,
  bedrooms smallint not null,
  bathrooms smallint not null,
  monthly_rent numeric(10,2) not null,
  security_deposit numeric(10,2) not null,
  latitude double precision not null,
  longitude double precision not null,
  status text not null default 'PUBLISHED' check (status in ('DRAFT', 'PUBLISHED', 'SUSPENDED', 'DELETED')),
  amenities text[] default '{}' not null,
  image_urls text[] default '{}' not null,
  availability jsonb default '{"booked_dates": []}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS on Properties
alter table public.properties enable row level security;

-- Properties Policies
create policy "Anyone can view published properties" 
  on public.properties for select 
  using (status = 'PUBLISHED');

create policy "Landlords can view all their own properties" 
  on public.properties for select 
  using (auth.uid() = landlord_id);

create policy "Landlords can insert their own properties" 
  on public.properties for insert 
  with check (auth.uid() = landlord_id);

create policy "Landlords can update their own properties" 
  on public.properties for update 
  using (auth.uid() = landlord_id);

create policy "Landlords can delete their own properties" 
  on public.properties for delete 
  using (auth.uid() = landlord_id);

create policy "Admins can select all properties" 
  on public.properties for select 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'ADMIN'
    )
  );

create policy "Admins can update all properties" 
  on public.properties for update 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'ADMIN'
    )
  );

create policy "Admins can delete all properties" 
  on public.properties for delete 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'ADMIN'
    )
  );


-- 3. BOOKINGS TABLE
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  tenant_id uuid references public.profiles(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  total_amount numeric(12,2) not null,
  platform_fee numeric(10,2) not null,
  status text not null default 'PENDING_PAYMENT' check (status in ('PENDING_PAYMENT', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'EXPIRED')),
  payment_intent_id text,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz default now() not null
);

-- Enable RLS on Bookings
alter table public.bookings enable row level security;

-- Bookings Policies
create policy "Tenants can view their own bookings" 
  on public.bookings for select 
  using (auth.uid() = tenant_id);

create policy "Landlords can view bookings for their properties" 
  on public.bookings for select 
  using (
    exists (
      select 1 from public.properties 
      where properties.id = bookings.property_id 
      and properties.landlord_id = auth.uid()
    )
  );

create policy "Tenants can create bookings" 
  on public.bookings for insert 
  with check (auth.uid() = tenant_id);

create policy "Users can update their own bookings status" 
  on public.bookings for update 
  using (
    auth.uid() = tenant_id or 
    exists (
      select 1 from public.properties 
      where properties.id = bookings.property_id 
      and properties.landlord_id = auth.uid()
    )
  );

create policy "Admins can select all bookings" 
  on public.bookings for select 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'ADMIN'
    )
  );

create policy "Admins can update all bookings" 
  on public.bookings for update 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'ADMIN'
    )
  );


-- 4. MESSAGES TABLE (Real-time Chat)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  message_text text not null,
  image_url text,
  is_read boolean default false not null,
  created_at timestamptz default now() not null
);

-- Enable RLS on Messages
alter table public.messages enable row level security;

-- Messages Policies
create policy "Users can view messages they sent or received" 
  on public.messages for select 
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages" 
  on public.messages for insert 
  with check (auth.uid() = sender_id);

-- Enable Realtime for Messages channel
alter publication supabase_realtime add table public.messages;

-- =========================================================================
-- DATABASE SEEDING
-- Auto-confirms users and seeds 4 properties under the landlord account
-- =========================================================================

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

-- 4. Seed the 4 Bangalore properties
INSERT INTO public.properties (
  landlord_id, title, type, description, area_sqft, bedrooms, bathrooms,
  monthly_rent, security_deposit, latitude, longitude, status, amenities, image_urls
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
  ARRAY['WiFi', 'Parking', 'Pet-friendly'],
  ARRAY['https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600']
);
