-- MediVault Supabase Schema Migration
-- Run this entire script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
  avatar_url TEXT,
  phone VARCHAR(20),
  date_of_birth DATE,
  blood_group VARCHAR(10),
  refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'Other' CHECK (category IN ('Prescription', 'Report', 'Scan', 'Vaccination', 'Lab', 'Other')),
  description TEXT,
  record_date DATE,
  tags TEXT[] DEFAULT '{}',
  file_url TEXT,
  file_path TEXT,
  file_type VARCHAR(100),
  file_name VARCHAR(255),
  file_size BIGINT,
  version INTEGER DEFAULT 1,
  is_archived BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RECORD VERSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS record_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID REFERENCES records(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  file_url TEXT,
  file_path TEXT,
  file_name VARCHAR(255),
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHARE LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID REFERENCES records(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  otp VARCHAR(10),
  otp_expires_at TIMESTAMPTZ,
  doctor_email VARCHAR(255),
  expires_at TIMESTAMPTZ,
  max_access_count INTEGER DEFAULT 10,
  access_count INTEGER DEFAULT 0,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHARE ACCESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS share_accesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_link_id UUID REFERENCES share_links(id) ON DELETE CASCADE,
  doctor_email VARCHAR(255),
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_id UUID,
  resource_type VARCHAR(50),
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  doctor_name VARCHAR(255),
  specialty VARCHAR(255),
  appointment_date DATE,
  appointment_time TIME,
  location TEXT,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEDICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  start_date DATE,
  end_date DATE,
  instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  prescription_record_id UUID REFERENCES records(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI SUMMARIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID REFERENCES records(id) ON DELETE CASCADE UNIQUE,
  summary TEXT,
  key_findings TEXT[] DEFAULT '{}',
  abnormal_values TEXT[] DEFAULT '{}',
  disclaimer TEXT DEFAULT 'This summary is AI-generated and is not a substitute for professional medical advice. Always consult a qualified healthcare provider.',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_records_owner_id ON records(owner_id);
CREATE INDEX IF NOT EXISTS idx_records_category ON records(category);
CREATE INDEX IF NOT EXISTS idx_records_date ON records(record_date);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_owner ON share_links(owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id);

-- ============================================
-- ROW LEVEL SECURITY (Optional - since we use service role)
-- ============================================
-- Uncomment below if you want RLS enabled (service role bypasses RLS anyway)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

SELECT 'MediVault schema created successfully! 🏥' as status;
