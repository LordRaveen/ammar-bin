-- ============================================
-- SEED DATA FOR ISLAMIC SCHOOL MANAGEMENT SYSTEM
-- ============================================

-- School Settings (Single Row)
INSERT INTO school_settings (
  school_name,
  school_name_arabic,
  address,
  phone_primary,
  phone_secondary,
  email,
  student_id_prefix,
  staff_id_prefix,
  number_of_terms
) VALUES (
  'Ammar Bin Yasir Institute',
  'معهد عمار بن ياسر',
  'No 1, Gwamna Awan Road, Off Muhammad Isah Road, Off Gwamna Road, Kaduna',
  '08066041349',
  '07031158701',
  'info@ammarschool.edu.ng',
  'ISM',
  'STAFF',
  3
) ON CONFLICT DO NOTHING;

-- Sections
INSERT INTO sections (id, name, description) VALUES
  (uuid_generate_v4(), 'Tahfeez', 'Qur''an Memorization Section'),
  (uuid_generate_v4(), 'Islamiyya', 'Islamic Studies Section')
ON CONFLICT (name) DO NOTHING;

-- Get section IDs for use in classes
DO $$
DECLARE
  tahfeez_id UUID;
  islamiyya_id UUID;
BEGIN
  SELECT id INTO tahfeez_id FROM sections WHERE name = 'Tahfeez';
  SELECT id INTO islamiyya_id FROM sections WHERE name = 'Islamiyya';

  -- Classes for Tahfeez Section
  INSERT INTO classes (section_id, name, capacity) VALUES
    (tahfeez_id, 'Raudah 1', 25),
    (tahfeez_id, 'Raudah 2', 25),
    (tahfeez_id, 'Raudah 3', 25),
    (tahfeez_id, 'Class 1', 30),
    (tahfeez_id, 'Class 2', 30),
    (tahfeez_id, 'Halqa 1', 20)
  ON CONFLICT (section_id, name) DO NOTHING;

  -- Classes for Islamiyya Section
  INSERT INTO classes (section_id, name, capacity) VALUES
    (islamiyya_id, 'Raudah 1', 25),
    (islamiyya_id, 'Raudah 2', 25),
    (islamiyya_id, 'Raudah 3', 25),
    (islamiyya_id, 'Class 1', 30),
    (islamiyya_id, 'Class 2', 30),
    (islamiyya_id, 'Ummahat Asas 1A', 20),
    (islamiyya_id, 'Ummahat Asas 1B', 20)
  ON CONFLICT (section_id, name) DO NOTHING;
END $$;

-- Subjects for Islamiyya Raudah Classes
INSERT INTO subjects (name, code, description) VALUES
  ('Qur''an', 'QUR', 'Qur''anic Studies'),
  ('Azkar', 'AZK', 'Daily Supplications and Remembrance'),
  ('Fiqhul Amaly', 'FQA', 'Practical Islamic Jurisprudence'),
  ('Huruf', 'HRF', 'Arabic Letters and Writing'),
  ('Arabiyya', 'ARB', 'Arabic Language')
ON CONFLICT (code) DO NOTHING;

-- Link subjects to Raudah classes (for all Raudah classes in both sections)
DO $$
DECLARE
  class_rec RECORD;
  subject_rec RECORD;
BEGIN
  FOR class_rec IN 
    SELECT id FROM classes WHERE name IN ('Raudah 1', 'Raudah 2', 'Raudah 3')
  LOOP
    FOR subject_rec IN 
      SELECT id FROM subjects WHERE code IN ('QUR', 'AZK', 'FQA', 'HRF', 'ARB')
    LOOP
      INSERT INTO class_subjects (class_id, subject_id, max_score, pass_mark)
      VALUES (class_rec.id, subject_rec.id, 100, 40)
      ON CONFLICT (class_id, subject_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Assessment Types (CA1, CA2, Exam)
INSERT INTO assessment_types (name, max_score, description) VALUES
  ('CA1', 10, 'Continuous Assessment 1'),
  ('CA2', 10, 'Continuous Assessment 2'),
  ('Exam', 80, 'End of Term Examination')
ON CONFLICT (name) DO NOTHING;

-- Grading Scheme (Default)
INSERT INTO grading_schemes (name, min_score, max_score, grade, remark, is_passing) VALUES
  ('Primary Grading', 75, 100, 'A', 'Excellent', TRUE),
  ('Primary Grading', 65, 74, 'B', 'Very Good', TRUE),
  ('Primary Grading', 50, 64, 'C', 'Good', TRUE),
  ('Primary Grading', 40, 49, 'D', 'Pass', TRUE),
  ('Primary Grading', 0, 39, 'F', 'Fail', FALSE)
ON CONFLICT DO NOTHING;

-- Fee Categories
INSERT INTO fee_categories (name, description, is_recurring) VALUES
  ('Form Fee', 'Application Form Fee - One-time (First term only)', FALSE),
  ('Registration Fee', 'Student Registration Fee - One-time (First term only)', FALSE),
  ('School Fee', 'Tuition Fee - Recurring per term', TRUE),
  ('Exam Fee', 'Examination Fee - Recurring per term', TRUE),
  ('Books', 'Textbooks and Learning Materials - One-time per year', FALSE),
  ('Uniform Male', 'School Uniform for Male Students (2 sets)', FALSE),
  ('Uniform Female', 'School Uniform for Female Students (2 sets)', FALSE)
ON CONFLICT (name) DO NOTHING;

-- Fee Structures (2025/2026 Session)
-- NOTE: This will be linked to actual session once created by admin
-- For now, we'll create a template session

INSERT INTO sessions (name, start_date, end_date, is_active) VALUES
  ('2025/2026', '2025-09-01', '2026-07-31', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Create terms for 2025/2026 session
-- Qualified session_id columns with table aliases to fix ambiguity error
DO $$
DECLARE
  session_2025_id UUID;
BEGIN
  SELECT s.id INTO session_2025_id FROM sessions s WHERE s.name = '2025/2026';
  
  INSERT INTO terms (session_id, name, term_number, start_date, end_date, is_active) VALUES
    (session_2025_id, 'First Term', 1, '2025-09-01', '2025-12-15', TRUE),
    (session_2025_id, 'Second Term', 2, '2026-01-05', '2026-04-15', FALSE),
    (session_2025_id, 'Third Term', 3, '2026-04-28', '2026-07-31', FALSE)
  ON CONFLICT (session_id, term_number) DO NOTHING;
END $$;

-- Fee Structures based on the PDF provided
-- Islamiyya Section Fees
DO $$
DECLARE
  session_2025_id UUID;
  term1_id UUID;
  islamiyya_id UUID;
  form_fee_id UUID;
  reg_fee_id UUID;
  school_fee_id UUID;
  exam_fee_id UUID;
  books_fee_id UUID;
  uniform_male_id UUID;
  uniform_female_id UUID;
  class_rec RECORD;
BEGIN
  -- Get IDs with explicit aliases
  SELECT s.id INTO session_2025_id FROM sessions s WHERE s.name = '2025/2026';
  SELECT t.id INTO term1_id FROM terms t WHERE t.session_id = session_2025_id AND t.term_number = 1;
  SELECT sec.id INTO islamiyya_id FROM sections sec WHERE sec.name = 'Islamiyya';
  SELECT fc.id INTO form_fee_id FROM fee_categories fc WHERE fc.name = 'Form Fee';
  SELECT fc.id INTO reg_fee_id FROM fee_categories fc WHERE fc.name = 'Registration Fee';
  SELECT fc.id INTO school_fee_id FROM fee_categories fc WHERE fc.name = 'School Fee';
  SELECT fc.id INTO exam_fee_id FROM fee_categories fc WHERE fc.name = 'Exam Fee';
  SELECT fc.id INTO books_fee_id FROM fee_categories fc WHERE fc.name = 'Books';
  SELECT fc.id INTO uniform_male_id FROM fee_categories fc WHERE fc.name = 'Uniform Male';
  SELECT fc.id INTO uniform_female_id FROM fee_categories fc WHERE fc.name = 'Uniform Female';

  -- Islamiyya Raudah 1-2 (Same fees)
  FOR class_rec IN 
    SELECT c.id FROM classes c WHERE c.section_id = islamiyya_id AND c.name IN ('Raudah 1', 'Raudah 2')
  LOOP
    -- One-time fees (First term only)
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific) VALUES
      (session_2025_id, term1_id, class_rec.id, form_fee_id, 2000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, reg_fee_id, 5000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, books_fee_id, 6500, 'Both'),
      (session_2025_id, term1_id, class_rec.id, uniform_male_id, 23000, 'Male'),
      (session_2025_id, term1_id, class_rec.id, uniform_female_id, 27000, 'Female')
    ON CONFLICT DO NOTHING;
    
    -- Recurring fees (All terms) - Insert for each term
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, school_fee_id, 25000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, exam_fee_id, 3000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Islamiyya Raudah 3
  FOR class_rec IN 
    SELECT c.id FROM classes c WHERE c.section_id = islamiyya_id AND c.name = 'Raudah 3'
  LOOP
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific) VALUES
      (session_2025_id, term1_id, class_rec.id, form_fee_id, 2000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, reg_fee_id, 5000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, books_fee_id, 7500, 'Both'),
      (session_2025_id, term1_id, class_rec.id, uniform_male_id, 23000, 'Male'),
      (session_2025_id, term1_id, class_rec.id, uniform_female_id, 27000, 'Female')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, school_fee_id, 25000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, exam_fee_id, 3000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Islamiyya Class 1
  FOR class_rec IN 
    SELECT c.id FROM classes c WHERE c.section_id = islamiyya_id AND c.name = 'Class 1'
  LOOP
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific) VALUES
      (session_2025_id, term1_id, class_rec.id, form_fee_id, 2000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, reg_fee_id, 5000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, books_fee_id, 11000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, uniform_male_id, 28000, 'Male'),
      (session_2025_id, term1_id, class_rec.id, uniform_female_id, 39000, 'Female')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, school_fee_id, 25000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, exam_fee_id, 3000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Islamiyya Class 2
  FOR class_rec IN 
    SELECT c.id FROM classes c WHERE c.section_id = islamiyya_id AND c.name = 'Class 2'
  LOOP
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific) VALUES
      (session_2025_id, term1_id, class_rec.id, form_fee_id, 2000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, reg_fee_id, 5000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, books_fee_id, 11700, 'Both'),
      (session_2025_id, term1_id, class_rec.id, uniform_male_id, 28000, 'Male'),
      (session_2025_id, term1_id, class_rec.id, uniform_female_id, 39000, 'Female')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, school_fee_id, 25000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, exam_fee_id, 3000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Islamiyya Ummahat Asas 1A & 1B (Married Women - Female only)
  FOR class_rec IN 
    SELECT c.id FROM classes c WHERE c.section_id = islamiyya_id AND c.name IN ('Ummahat Asas 1A', 'Ummahat Asas 1B')
  LOOP
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific) VALUES
      (session_2025_id, term1_id, class_rec.id, form_fee_id, 2000, 'Female'),
      (session_2025_id, term1_id, class_rec.id, reg_fee_id, 5000, 'Female'),
      (session_2025_id, term1_id, class_rec.id, books_fee_id, 10000, 'Female'),
      (session_2025_id, term1_id, class_rec.id, uniform_female_id, 15000, 'Female')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, school_fee_id, 25000, 'Female'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, exam_fee_id, 3000, 'Female'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Tahfeez Section Fees
DO $$
DECLARE
  session_2025_id UUID;
  term1_id UUID;
  tahfeez_id UUID;
  form_fee_id UUID;
  reg_fee_id UUID;
  school_fee_id UUID;
  exam_fee_id UUID;
  books_fee_id UUID;
  uniform_male_id UUID;
  uniform_female_id UUID;
  class_rec RECORD;
BEGIN
  -- Get IDs with explicit aliases
  SELECT s.id INTO session_2025_id FROM sessions s WHERE s.name = '2025/2026';
  SELECT t.id INTO term1_id FROM terms t WHERE t.session_id = session_2025_id AND t.term_number = 1;
  SELECT sec.id INTO tahfeez_id FROM sections sec WHERE sec.name = 'Tahfeez';
  SELECT fc.id INTO form_fee_id FROM fee_categories fc WHERE fc.name = 'Form Fee';
  SELECT fc.id INTO reg_fee_id FROM fee_categories fc WHERE fc.name = 'Registration Fee';
  SELECT fc.id INTO school_fee_id FROM fee_categories fc WHERE fc.name = 'School Fee';
  SELECT fc.id INTO exam_fee_id FROM fee_categories fc WHERE fc.name = 'Exam Fee';
  SELECT fc.id INTO books_fee_id FROM fee_categories fc WHERE fc.name = 'Books';
  SELECT fc.id INTO uniform_male_id FROM fee_categories fc WHERE fc.name = 'Uniform Male';
  SELECT fc.id INTO uniform_female_id FROM fee_categories fc WHERE fc.name = 'Uniform Female';

  -- Tahfeez Raudah 1-2
  FOR class_rec IN 
    SELECT c.id FROM classes c WHERE c.section_id = tahfeez_id AND c.name IN ('Raudah 1', 'Raudah 2')
  LOOP
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific) VALUES
      (session_2025_id, term1_id, class_rec.id, form_fee_id, 2000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, reg_fee_id, 5000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, books_fee_id, 3000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, uniform_male_id, 23000, 'Male'),
      (session_2025_id, term1_id, class_rec.id, uniform_female_id, 27000, 'Female')
    ON CONFLICT DO NOTHING;
    
    -- Recurring fees (All terms) - Insert for each term
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, school_fee_id, 30000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, exam_fee_id, 3000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Tahfeez Raudah 3
  FOR class_rec IN 
    SELECT c.id FROM classes c WHERE c.section_id = tahfeez_id AND c.name = 'Raudah 3'
  LOOP
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific) VALUES
      (session_2025_id, term1_id, class_rec.id, form_fee_id, 2000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, reg_fee_id, 5000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, books_fee_id, 5000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, uniform_male_id, 23000, 'Male'),
      (session_2025_id, term1_id, class_rec.id, uniform_female_id, 27000, 'Female')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, school_fee_id, 30000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, exam_fee_id, 3000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Tahfeez Class 1
  FOR class_rec IN 
    SELECT c.id FROM classes c WHERE c.section_id = tahfeez_id AND c.name = 'Class 1'
  LOOP
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific) VALUES
      (session_2025_id, term1_id, class_rec.id, form_fee_id, 2000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, reg_fee_id, 5000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, books_fee_id, 6000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, uniform_male_id, 28000, 'Male'),
      (session_2025_id, term1_id, class_rec.id, uniform_female_id, 39000, 'Female')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, school_fee_id, 30000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, exam_fee_id, 3000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Tahfeez Class 2
  FOR class_rec IN 
    SELECT c.id FROM classes c WHERE c.section_id = tahfeez_id AND c.name = 'Class 2'
  LOOP
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific) VALUES
      (session_2025_id, term1_id, class_rec.id, form_fee_id, 2000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, reg_fee_id, 5000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, books_fee_id, 7000, 'Both'),
      (session_2025_id, term1_id, class_rec.id, uniform_male_id, 28000, 'Male'),
      (session_2025_id, term1_id, class_rec.id, uniform_female_id, 39000, 'Female')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, school_fee_id, 30000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
    
    INSERT INTO fee_structures (session_id, term_id, class_id, fee_category_id, amount, gender_specific)
    SELECT session_2025_id, t.id, class_rec.id, exam_fee_id, 3000, 'Both'
    FROM terms t WHERE t.session_id = session_2025_id
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
