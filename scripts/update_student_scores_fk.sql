-- Drop the existing foreign key constraint
ALTER TABLE student_scores
DROP CONSTRAINT IF EXISTS student_scores_entered_by_fkey;

-- Add a new foreign key constraint referencing auth.users
ALTER TABLE student_scores
ADD CONSTRAINT student_scores_entered_by_fkey
FOREIGN KEY (entered_by)
REFERENCES auth.users(id)
ON DELETE SET NULL;
