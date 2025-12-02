-- Create student_skills table for tracking affective and psychomotor skills
CREATE TABLE IF NOT EXISTS public.student_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    skill_category TEXT NOT NULL CHECK (skill_category IN ('Affective', 'Psychomotor')),
    skill_name TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    assessed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, session_id, term_id, skill_name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_student_skills_student ON public.student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_session_term ON public.student_skills(session_id, term_id);

-- Enable RLS
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff and parents can view student skills"
    ON public.student_skills
    FOR SELECT
    USING (true);

CREATE POLICY "Teachers and admins can manage student skills"
    ON public.student_skills
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('Admin', 'Teacher')
            AND is_active = true
        )
    );

-- Insert default skills for the system
INSERT INTO public.student_skills (student_id, session_id, term_id, class_id, skill_category, skill_name, rating)
SELECT 
    s.id as student_id,
    se.session_id,
    se.term_id,
    se.class_id,
    skill.category,
    skill.name,
    NULL as rating
FROM public.students s
CROSS JOIN public.student_enrollments se ON s.id = se.student_id AND se.is_active = true
CROSS JOIN (
    VALUES 
        ('Affective', 'Punctuality'),
        ('Affective', 'Politeness'),
        ('Affective', 'Neatness'),
        ('Affective', 'Honesty'),
        ('Affective', 'Relationship with Others'),
        ('Psychomotor', 'Handwriting'),
        ('Psychomotor', 'Sports'),
        ('Psychomotor', 'Drawing'),
        ('Psychomotor', 'Verbal Fluency'),
        ('Psychomotor', 'Games')
) AS skill(category, name)
ON CONFLICT (student_id, session_id, term_id, skill_name) DO NOTHING;

COMMENT ON TABLE public.student_skills IS 'Stores student skills assessments (Affective and Psychomotor) with 1-5 rating scale';
