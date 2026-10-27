DROP DATABASE IF EXISTS student_performance_db;
CREATE DATABASE student_performance_db;
USE student_performance_db;

CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    section VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE subjects (
    subject_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(150) NOT NULL UNIQUE,
    max_marks DECIMAL(10,2) NOT NULL CHECK (max_marks > 0),
    pass_marks DECIMAL(10,2) NOT NULL CHECK (pass_marks >= 0 AND pass_marks <= max_marks),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE marks (
    mark_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    assessment VARCHAR(100) NOT NULL,
    marks_obtained DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mark_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_mark_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE RESTRICT,
    CONSTRAINT uq_mark_student_subject_assessment UNIQUE (student_id, subject_id, assessment),
    CONSTRAINT chk_marks_obtained CHECK (marks_obtained >= 0)
);

CREATE INDEX idx_students_roll_no ON students (roll_no);
CREATE INDEX idx_students_section ON students (section);
CREATE INDEX idx_marks_student ON marks (student_id);
CREATE INDEX idx_marks_subject ON marks (subject_id);
CREATE INDEX idx_marks_assessment ON marks (assessment);
CREATE INDEX idx_subjects_name ON subjects (subject_name);
