-- SQL Setup Script for Supabase Inventory System
-- Run this in your Supabase SQL Editor to create the users table and add test users

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert test users
INSERT INTO users (username, password, role) VALUES
  ('admin', '@dmin2026', 'admin'),
  ('user1', 'pass1', 'user'),
  ('viewer1', 'viewpass', 'viewer')
ON CONFLICT (username) DO NOTHING;

-- Create assets table (if not exists)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag TEXT UNIQUE NOT NULL,
  assetName TEXT,
  assetType TEXT,
  serial TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'Available',
  location TEXT,
  station TEXT,
  warranty TEXT,
  vendor TEXT,
  datePurchased TEXT,
  date TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Set up RLS (Row Level Security) - make tables readable to all, but only allow authenticated users to modify
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Allow public to read users (needed for login)
CREATE POLICY "Users are readable by everyone" ON users FOR SELECT USING (true);

-- Allow public to read assets
CREATE POLICY "Assets are readable by everyone" ON assets FOR SELECT USING (true);

-- Allow authenticated users to insert assets
CREATE POLICY "Users can insert assets" ON assets FOR INSERT USING (true);

-- Allow authenticated users to update assets
CREATE POLICY "Users can update assets" ON assets FOR UPDATE USING (true);

-- Allow authenticated users to delete assets
CREATE POLICY "Users can delete assets" ON assets FOR DELETE USING (true);

-- Insert sample assets for testing
INSERT INTO assets (tag, assetName, assetType, serial, status, location, station, warranty, vendor, datePurchased, notes) VALUES
  ('ASSET001', 'Dell Laptop', 'Computer', 'SN123456', 'Available', 'Office A', 'Desk 1', '2 Years', 'Dell', '2023-01-15', 'Good condition'),
  ('ASSET002', 'HP Printer', 'Device', 'SN654321', 'In Use', 'Office B', 'Desk 2', '1 Year', 'HP', '2023-06-20', 'Working fine'),
  ('ASSET003', 'Monitor LG', 'Display', 'SN111222', 'Defective', 'Warehouse', '', '6 Months', 'LG', '2023-09-10', 'Screen flickering')
ON CONFLICT (tag) DO NOTHING;
