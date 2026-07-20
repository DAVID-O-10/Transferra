-- ============================================
-- Transferra Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Transfers Table
-- ============================================
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Transfer code (unique, human-readable)
  code TEXT UNIQUE NOT NULL,
  
  -- Sender info
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  
  -- File info (R2 storage)
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  r2_key TEXT NOT NULL,  -- R2 object key
  
  -- Sender settings
  expires_at TIMESTAMPTZ NOT NULL,
  max_downloads INTEGER DEFAULT NULL,  -- NULL = unlimited
  password_hash TEXT DEFAULT NULL,      -- NULL = no password
  
  -- Recipient settings
  retention_hours INTEGER DEFAULT 24,  -- Hours to keep after claimed
  
  -- Claim/status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'downloaded', 'expired', 'deleted')),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT,
  claimed_at TIMESTAMPTZ,
  
  -- Download tracking
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_transfers_code ON transfers(code);
CREATE INDEX idx_transfers_sender_id ON transfers(sender_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_expires_at ON transfers(expires_at);
CREATE INDEX idx_transfers_created_at ON transfers(created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Sender can view their own transfers
CREATE POLICY "Sender can view own transfers"
  ON transfers FOR SELECT
  USING (auth.uid() = sender_id);

-- Sender can create transfers
CREATE POLICY "Sender can create transfers"
  ON transfers FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Sender can update their own transfers (cancel, etc.)
CREATE POLICY "Sender can update own transfers"
  ON transfers FOR UPDATE
  USING (auth.uid() = sender_id);

-- Sender can delete their own transfers
CREATE POLICY "Sender can delete own transfers"
  ON transfers FOR DELETE
  USING (auth.uid() = sender_id);

-- Anyone with the code can view a pending transfer (for claiming)
CREATE POLICY "Anyone can view pending transfers by code"
  ON transfers FOR SELECT
  USING (status = 'pending');

-- Recipient can update transfer when claiming (set recipient info)
CREATE POLICY "Recipient can claim pending transfer"
  ON transfers FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (status = 'claimed');

-- ============================================
-- Function to auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transfers_updated_at
  BEFORE UPDATE ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function to auto-expire transfers
-- ============================================
CREATE OR REPLACE FUNCTION expire_old_transfers()
RETURNS void AS $$
BEGIN
  UPDATE transfers
  SET status = 'expired', updated_at = NOW()
  WHERE status IN ('pending', 'claimed')
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Storage Buckets (run separately if needed)
-- ============================================
-- Note: Create these via Supabase Dashboard > Storage
-- Bucket name: transferra-files
-- Public: false (private bucket)
