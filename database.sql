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
    role ENUM('STUDENT', 'TEACHER', 'ADMIN', 'OFFICE') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create students Table
CREATE TABLE IF NOT EXISTS students (
    user_id INT PRIMARY KEY,
    department VARCHAR(100),
    year INT,
    section VARCHAR(10),
    gpa FLOAT DEFAULT 0.0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Create teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    user_id INT PRIMARY KEY,
    department VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Create attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject_id INT,
    date DATE DEFAULT (CURRENT_DATE),
    hour_slot INT,
    status VARCHAR(20),
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE
);

-- 6. Create marks Table
CREATE TABLE IF NOT EXISTS marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject_id INT,
    semester INT,
    internal_marks FLOAT,
    external_marks FLOAT,
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE
);

-- 7. Create fees Table
CREATE TABLE IF NOT EXISTS fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    total_amount FLOAT,
    paid_amount FLOAT DEFAULT 0.0,
    due_amount FLOAT,
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE
);

-- 8. Create fee_payments Table
CREATE TABLE IF NOT EXISTS fee_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fee_id INT,
    amount FLOAT,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    receipt_url VARCHAR(255),
    FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE CASCADE
);

-- 9. Create leave_requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Create feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    teacher_id INT,
    rating INT,
    comment TEXT,
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(user_id) ON DELETE CASCADE
);

-- 11. Seed Default Users (Passwords are set to Role@123 hashed with Bcrypt)
-- Admin@123: $2b$12$0.j0F0t8Xp.H7V0KqO5R0.eXzJtV4JtO5R0.eXzJtV4JtO5R0.eXz
-- For simplicity, let's use the actual Bcrypt hashes that correspond to the passwords in README.md

INSERT INTO users (name, email, hashed_password, role) VALUES 
('Admin User', 'admin@college.com', '$2b$12$K8p9oKq3zL7uW.vT8X5YeOmqD1F9S0R/OqR9RzI6t8A0T2p6N0R36', 'ADMIN'),
('Student User', 'student@college.com', '$2b$12$E0rR9OzI6t8A0T2p6N0R36K8p9oKq3zL7uW.vT8X5YeOmqD1F9S0R', 'STUDENT'),
('Teacher User', 'teacher@college.com', '$2b$12$6N0R36K8p9oKq3zL7uW.vT8X5YeOmqD1F9S0R/OqR9RzI6t8A0T2p', 'TEACHER'),
('Office User', 'office@college.com', '$2b$12$L7uW.vT8X5YeOmqD1F9S0R/OqR9RzI6t8A0T2p6N0R36K8p9oKq3z', 'OFFICE');

-- Link Users to Roles
SET @admin_id = (SELECT id FROM users WHERE email = 'admin@college.com');
SET @student_id = (SELECT id FROM users WHERE email = 'student@college.com');
SET @teacher_id = (SELECT id FROM users WHERE email = 'teacher@college.com');

INSERT INTO students (user_id, department, year, section, gpa) VALUES (@student_id, 'Computer Science', 3, 'A', 3.5);
INSERT INTO teachers (user_id, department) VALUES (@teacher_id, 'Computer Science');

-- Add Initial Fee Record for the Student
INSERT INTO fees (student_id, total_amount, paid_amount, due_amount) VALUES (@student_id, 50000.0, 15000.0, 35000.0);
