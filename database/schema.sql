-- Database Schema for BioGrade Application
-- This schema reflects the data structure used in the application.

-- Users Table (Stores both Students and Teachers)
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('TEACHER', 'STUDENT', 'MONITOR')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table (Extension of Users for specific student data)
CREATE TABLE students (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    school_class VARCHAR(10) NOT NULL CHECK (school_class IN ('1A', '1B', '2A', '2B', '3A', '3B')),
    birth_date DATE NOT NULL,
    residence_type VARCHAR(20) NOT NULL CHECK (residence_type IN ('URBAN', 'RURAL')),
    biological_level VARCHAR(50) DEFAULT 'ORGANELLE',
    is_monitor BOOLEAN DEFAULT FALSE
);

-- Monitor Permissions Table
CREATE TABLE monitor_permissions (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    can_edit_grades BOOLEAN DEFAULT FALSE,
    can_manage_content BOOLEAN DEFAULT FALSE,
    can_manage_materials BOOLEAN DEFAULT FALSE,
    can_manage_mural BOOLEAN DEFAULT FALSE,
    can_login BOOLEAN DEFAULT FALSE
);

-- Class Activity Configuration Table (Template for activities)
CREATE TABLE class_activity_configs (
    id SERIAL PRIMARY KEY,
    school_class VARCHAR(10) NOT NULL,
    bimester VARCHAR(50) NOT NULL,
    activity_id INTEGER NOT NULL CHECK (activity_id IN (1, 2, 3)),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    max_score DECIMAL(5, 2) DEFAULT 10.00,
    has_recovery BOOLEAN DEFAULT FALSE,
    UNIQUE(school_class, bimester, activity_id)
);

-- Student Grades Table
CREATE TABLE student_grades (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(255) REFERENCES students(user_id) ON DELETE CASCADE,
    bimester VARCHAR(50) NOT NULL,
    activity_id INTEGER NOT NULL CHECK (activity_id IN (1, 2, 3)),
    score DECIMAL(5, 2),
    recovery_score DECIMAL(5, 2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class Content Table (Planning, etc.)
CREATE TABLE class_content (
    id SERIAL PRIMARY KEY,
    school_class VARCHAR(10) NOT NULL,
    bimester VARCHAR(50) NOT NULL,
    text_content TEXT,
    last_edited_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_class, bimester)
);

-- Files/Materials Table
CREATE TABLE files (
    id VARCHAR(255) PRIMARY KEY,
    class_content_id INTEGER REFERENCES class_content(id) ON DELETE CASCADE,
    student_id VARCHAR(255) REFERENCES students(user_id) ON DELETE CASCADE, -- For personal materials
    name VARCHAR(255) NOT NULL,
    size VARCHAR(50),
    type VARCHAR(50),
    url TEXT NOT NULL, -- Stores Base64 or S3 URL
    created_by VARCHAR(255),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reminders/Mural Table
CREATE TABLE reminders (
    id VARCHAR(255) PRIMARY KEY,
    class_content_id INTEGER REFERENCES class_content(id) ON DELETE CASCADE,
    student_id VARCHAR(255) REFERENCES students(user_id) ON DELETE CASCADE, -- For personal reminders
    text TEXT NOT NULL,
    date DATE,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('GRADE', 'REMINDER', 'MATERIAL', 'CONTENT')),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('CLASS', 'STUDENT')),
    target_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_section VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Read Status Table
CREATE TABLE notification_reads (
    notification_id VARCHAR(255) REFERENCES notifications(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id, user_id)
);

-- Class Settings Table
CREATE TABLE class_settings (
    school_class VARCHAR(10) NOT NULL,
    bimester VARCHAR(50) NOT NULL,
    show_average BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (school_class, bimester)
);

-- Forum Posts Table
CREATE TABLE forum_posts (
    id VARCHAR(255) PRIMARY KEY,
    author_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(50) NOT NULL,
    author_level VARCHAR(50),
    content TEXT NOT NULL,
    bimester VARCHAR(50) NOT NULL,
    school_class VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forum Settings Table
CREATE TABLE forum_settings (
    school_class VARCHAR(10) NOT NULL,
    bimester VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (school_class, bimester)
);
