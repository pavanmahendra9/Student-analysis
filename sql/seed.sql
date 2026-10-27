USE student_performance_db;

INSERT INTO students (roll_no, name, section) VALUES
('S-101', 'Alice Johnson', 'A'),
('S-102', 'Brian Lee', 'A'),
('S-103', 'Chloe Smith', 'B'),
('S-104', 'David Brown', 'B'),
('S-105', 'Emma Davis', 'A');

INSERT INTO subjects (subject_name, max_marks, pass_marks) VALUES
('Mathematics', 100, 40),
('Science', 100, 40),
('English', 100, 40),
('History', 100, 40);

INSERT INTO marks (student_id, subject_id, assessment, marks_obtained) VALUES
(1, 1, 'Unit Test 1', 88),
(1, 2, 'Unit Test 1', 92),
(1, 3, 'Unit Test 1', 76),
(1, 4, 'Unit Test 1', 82),
(2, 1, 'Unit Test 1', 70),
(2, 2, 'Unit Test 1', 55),
(2, 3, 'Unit Test 1', 61),
(2, 4, 'Unit Test 1', 68),
(3, 1, 'Unit Test 1', 60),
(3, 2, 'Unit Test 1', 48),
(3, 3, 'Unit Test 1', 44),
(3, 4, 'Unit Test 1', 51),
(4, 1, 'Unit Test 1', 40),
(4, 2, 'Unit Test 1', 35),
(4, 3, 'Unit Test 1', 52),
(4, 4, 'Unit Test 1', 47),
(5, 1, 'Unit Test 1', 95),
(5, 2, 'Unit Test 1', 90),
(5, 3, 'Unit Test 1', 88),
(5, 4, 'Unit Test 1', 91);
