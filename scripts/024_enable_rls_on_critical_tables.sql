-- Enable RLS on critical tables that have policies but RLS not enabled
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Verify RLS is now enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'students', 'student_scores', 'student_results', 'grading_schemes',
  'student_guardians', 'assessments', 'assignments', 'class_subjects',
  'classes', 'subjects'
)
ORDER BY tablename;
