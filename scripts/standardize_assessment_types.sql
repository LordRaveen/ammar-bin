-- Ensure standard assessment types exist
INSERT INTO assessment_types (name, max_score, description, is_active)
VALUES 
  ('CA Test 1', 20, 'First Continuous Assessment', true),
  ('CA Test 2', 20, 'Second Continuous Assessment', true),
  ('Exam', 60, 'Final Examination', true)
ON CONFLICT (name) DO UPDATE 
SET max_score = EXCLUDED.max_score, is_active = true;

-- Optional: Deactivate other types if you want to enforce only these 3
-- UPDATE assessment_types SET is_active = false WHERE name NOT IN ('CA Test 1', 'CA Test 2', 'Exam');
