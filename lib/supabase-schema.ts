// This file defines the Supabase database schema for reference

/*
Table: users
- id: uuid (primary key)
- username: text (unique)
- password: text (in a real app, this would be hashed)
- role: text (admin, head_department)
- department_id: text (foreign key to departments)
- created_at: timestamp

Table: departments
- id: text (primary key)
- name: text
- created_at: timestamp

Table: divisions
- id: text (primary key)
- department_id: text (foreign key to departments)
- name: text
- created_at: timestamp

Table: entries
- id: uuid (primary key)
- title: text
- pic: text
- description: text
- start_date: timestamp
- end_date: timestamp
- hmif_priority: text
- department_priority: text
- visibility: text (Public, Private)
- department_id: text (foreign key to departments)
- division_id: text (foreign key to divisions)
- created_at: timestamp
- created_by: uuid (foreign key to users)

Table: projects
- id: uuid (primary key)
- entry_id: uuid (foreign key to entries)
- title: text
- pic: text
- description: text
- start_date: timestamp
- deadline: timestamp
- hmif_priority: text
- department_priority: text
- department_id: text (foreign key to departments)
- division_id: text (foreign key to divisions)
- status: text (ongoing, on_hold, canceled, completed)
- on_hold_reason: text
- created_at: timestamp
- created_by: uuid (foreign key to users)
*/

// SQL to create tables:

/*
-- Create departments table
CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create divisions table
CREATE TABLE divisions (
  id TEXT PRIMARY KEY,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'head_department')),
  department_id TEXT REFERENCES departments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create entries table
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  pic TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  hmif_priority TEXT NOT NULL,
  department_priority TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('Public', 'Private')),
  department_id TEXT REFERENCES departments(id),
  division_id TEXT REFERENCES divisions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pic TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  hmif_priority TEXT NOT NULL,
  department_priority TEXT NOT NULL,
  department_id TEXT REFERENCES departments(id),
  division_id TEXT REFERENCES divisions(id),
  status TEXT NOT NULL CHECK (status IN ('ongoing', 'on_hold', 'canceled', 'completed')),
  on_hold_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Insert initial departments
INSERT INTO departments (id, name) VALUES
('kabinet', 'Kabinet'),
('kesekjenan', 'Kesekjenan'),
('ekonomi_kreatif', 'Ekonomi Kreatif'),
('media_komunikasi', 'Media dan Komunikasi'),
('sdm', 'Sumber Daya Manusia'),
('kesejahteraan_mahasiswa', 'Kesejahteraan Mahasiswa'),
('riset_teknologi', 'Riset dan Teknologi');

-- Insert divisions for each department
INSERT INTO divisions (id, department_id, name) VALUES
('sekretaris', 'kesekjenan', 'Sekretaris'),
('bendahara', 'kesekjenan', 'Bendahara'),
('kewirausahaan', 'ekonomi_kreatif', 'Kewirausahaan'),
('sponsorship', 'ekonomi_kreatif', 'Sponsorship'),
('hubungan_eksternal', 'media_komunikasi', 'Hubungan Eksternal'),
('media_publikasi', 'media_komunikasi', 'Media dan Publikasi'),
('manajemen_sdm', 'sdm', 'Managemen Sumber Daya Manusia'),
('pengembangan_sdm', 'sdm', 'Pengembangan Sumber Daya Manusia'),
('minat_bakat', 'kesejahteraan_mahasiswa', 'Minat dan Bakat'),
('rumah_tangga', 'kesejahteraan_mahasiswa', 'Rumah Tangga Himpunan'),
('akademik', 'riset_teknologi', 'Akademik'),
('pengembangan_teknologi', 'riset_teknologi', 'Pengembangan Teknologi');

-- Insert initial admin user
INSERT INTO users (username, password, role) VALUES
('admin', 'admin123', 'admin');
*/
