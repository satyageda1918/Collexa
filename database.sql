-- AI-Powered College ERP System Database Schema & Seed Data

-- 1. Setup Database
CREATE DATABASE IF NOT EXISTS college_erp;
USE college_erp;

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'TEACHER', 'ADMIN', 'ADMISSION', 'EXAM', 'ACCOUNT') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create students Table
CREATE TABLE IF NOT EXISTS students (
    user_id INT PRIMARY KEY,
    department VARCHAR(100),
    year INT,
    section VARCHAR(10),
    phone_number VARCHAR(20),
    address TEXT,
    gpa FLOAT DEFAULT 0.0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Create teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    user_id INT PRIMARY KEY,
    department VARCHAR(100),
    phone_number VARCHAR(20),
    address TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Department Staff Tables
CREATE TABLE IF NOT EXISTS admission_staff (
    user_id INT PRIMARY KEY,
    office_room VARCHAR(50),
    phone_ext VARCHAR(10),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_staff (
    user_id INT PRIMARY KEY,
    office_room VARCHAR(50),
    phone_ext VARCHAR(10),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account_staff (
    user_id INT PRIMARY KEY,
    office_room VARCHAR(50),
    phone_ext VARCHAR(10),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject_id INT,
    date DATE DEFAULT (CURRENT_DATE),
    hour_slot INT,
    status VARCHAR(20),
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE
);

-- 7. Marks Table
CREATE TABLE IF NOT EXISTS marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject_id INT,
    semester INT,
    internal_marks FLOAT,
    external_marks FLOAT,
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE
);

-- 8. Fees Table
CREATE TABLE IF NOT EXISTS fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    total_amount FLOAT,
    paid_amount FLOAT DEFAULT 0.0,
    due_amount FLOAT,
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE
);

-- 9. Question Papers Table
CREATE TABLE IF NOT EXISTS question_papers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(20),
    subject_name VARCHAR(255),
    faculty_name VARCHAR(100),
    semester INT,
    exam_type VARCHAR(50),
    questions_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. System Config Table
CREATE TABLE IF NOT EXISTS system_config (
    id INT PRIMARY KEY,
    mark_entry_enabled BOOLEAN DEFAULT FALSE,
    results_published BOOLEAN DEFAULT FALSE
);

-- 11. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    teacher_id INT,
    rating INT,
    comment TEXT,
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(user_id) ON DELETE CASCADE
);

-- 12. Seed Default Data
INSERT INTO users (name, email, hashed_password, role) VALUES 
('Admin User', 'admin@college.com', '$2b$12$K8p9oKq3zL7uW.vT8X5YeOmqD1F9S0R/OqR9RzI6t8A0T2p6N0R36', 'ADMIN'),
('Student User', 'student@college.com', '$2b$12$E0rR9OzI6t8A0T2p6N0R36K8p9oKq3zL7uW.vT8X5YeOmqD1F9S0R', 'STUDENT'),
('Teacher User', 'teacher@college.com', '$2b$12$6N0R36K8p9oKq3zL7uW.vT8X5YeOmqD1F9S0R/OqR9RzI6t8A0T2p', 'TEACHER'),
('Admission Staff', 'admission@college.com', '$2b$12$L7uW.vT8X5YeOmqD1F9S0R/OqR9RzI6t8A0T2p6N0R36K8p9oKq3z', 'ADMISSION'),
('Exam Staff', 'exam@college.com', '$2b$12$L7uW.vT8X5YeOmqD1F9S0R/OqR9RzI6t8A0T2p6N0R36K8p9oKq3z', 'EXAM'),
('Account Staff', 'account@college.com', '$2b$12$L7uW.vT8X5YeOmqD1F9S0R/OqR9RzI6t8A0T2p6N0R36K8p9oKq3z', 'ACCOUNT');

-- Seed System Config
INSERT INTO system_config (id, mark_entry_enabled, results_published) VALUES (1, 0, 0);

-- Link Seeds
INSERT INTO students (user_id, department, year, section, gpa) 
SELECT id, 'Computer Science', 3, 'A', 3.5 FROM users WHERE email = 'student@college.com';

INSERT INTO teachers (user_id, department) 
SELECT id, 'Computer Science' FROM users WHERE email = 'teacher@college.com';
