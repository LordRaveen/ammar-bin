-- =====================================================
-- Migration 026: Add First-Class Support for Principal Role
-- =====================================================

-- 1. Update central is_admin() function to include 'principal'
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'principal')
    AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Update central is_accountant() function to include 'principal'
CREATE OR REPLACE FUNCTION is_accountant()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'principal', 'accountant')
    AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Announcements
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'principal'::text])
  ));

-- 4. Attendance
DROP POLICY IF EXISTS "Teachers and admins can manage attendance" ON attendance;
CREATE POLICY "Teachers and admins can manage attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'principal'::text, 'teacher'::text])
  ));

DROP POLICY IF EXISTS "Staff can view attendance" ON attendance;
CREATE POLICY "Staff can view attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'principal'::text, 'teacher'::text, 'cashier'::text, 'accountant'::text])
  ));

-- 5. Discounts
DROP POLICY IF EXISTS "Admins can manage discounts" ON discounts;
CREATE POLICY "Admins can manage discounts"
  ON discounts FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'principal'::text])
  ));

DROP POLICY IF EXISTS "Staff can view discounts" ON discounts;
CREATE POLICY "Staff can view discounts"
  ON discounts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'principal'::text, 'accountant'::text, 'teacher'::text])
  ));

-- 6. School Events
DROP POLICY IF EXISTS "Admins can manage events" ON school_events;
CREATE POLICY "Admins can manage events"
  ON school_events FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'principal'::text])
  ));

DROP POLICY IF EXISTS "Admin events are viewable by admin" ON school_events;
CREATE POLICY "Admin events are viewable by admin"
  ON school_events FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'principal'::text])
  ));

DROP POLICY IF EXISTS "Staff events are viewable by staff and admin" ON school_events;
CREATE POLICY "Staff events are viewable by staff and admin"
  ON school_events FOR SELECT
  TO authenticated
  USING ((visibility = ANY (ARRAY['public'::text, 'staff'::text])) AND (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'principal'::text, 'teacher'::text, 'accountant'::text])
  )));

-- 7. Event targets
DROP POLICY IF EXISTS "Admins can manage targets" ON event_classes;
CREATE POLICY "Admins can manage targets"
  ON event_classes FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'principal'::text])
  ));

DROP POLICY IF EXISTS "Admins can manage student targets" ON event_students;
CREATE POLICY "Admins can manage student targets"
  ON event_students FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'principal'::text])
  ));

-- 8. Expenses & Categories
DROP POLICY IF EXISTS "Admins can manage expense categories" ON expense_categories;
CREATE POLICY "Admins can manage expense categories"
  ON expense_categories FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'principal'::text])
  ));

DROP POLICY IF EXISTS "Admins and accountants can view expenses" ON expenses;
CREATE POLICY "Admins and accountants can view expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'principal'::text, 'accountant'::text])
  ));

DROP POLICY IF EXISTS "Admins and accountants can manage expenses" ON expenses;
CREATE POLICY "Admins and accountants can manage expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'principal'::text, 'accountant'::text])
  ));

-- 9. Fee Templates & Logs
DROP POLICY IF EXISTS "Admins can manage fee templates" ON fee_templates;
CREATE POLICY "Admins can manage fee templates"
  ON fee_templates FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'principal'::text])
  ));

DROP POLICY IF EXISTS "Admins can manage fee template items" ON fee_template_items;
CREATE POLICY "Admins can manage fee template items"
  ON fee_template_items FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'principal'::text])
  ));

DROP POLICY IF EXISTS "Admins can view fee generation logs" ON fee_generation_logs;
CREATE POLICY "Admins can view fee generation logs"
  ON fee_generation_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'principal'::text])
  ));

DROP POLICY IF EXISTS "Admins can create fee generation logs" ON fee_generation_logs;
CREATE POLICY "Admins can create fee generation logs"
  ON fee_generation_logs FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'principal'::text])
  ));

-- 10. Payment Reversals
DROP POLICY IF EXISTS "Admins can manage payment reversals" ON payment_reversals;
CREATE POLICY "Admins can manage payment reversals"
  ON payment_reversals FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'principal'::text])
  ));

DROP POLICY IF EXISTS "Staff can view payment reversals" ON payment_reversals;
CREATE POLICY "Staff can view payment reversals"
  ON payment_reversals FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'principal'::text, 'accountant'::text])
  ));

-- 11. Petty Cash
DROP POLICY IF EXISTS "Admins and accountants can view petty cash" ON petty_cash_transactions;
CREATE POLICY "Admins and accountants can view petty cash"
  ON petty_cash_transactions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'principal'::text, 'accountant'::text])
  ));

DROP POLICY IF EXISTS "Admins and accountants can manage petty cash" ON petty_cash_transactions;
CREATE POLICY "Admins and accountants can manage petty cash"
  ON petty_cash_transactions FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'principal'::text, 'accountant'::text])
  ));

-- 12. Result Publication History & Workflows
DROP POLICY IF EXISTS "Staff can view result history" ON result_publication_history;
CREATE POLICY "Staff can view result history"
  ON result_publication_history FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'principal'::text, 'teacher'::text])
  ));

DROP POLICY IF EXISTS "Teachers and admins can manage result workflows" ON result_publication_workflow;
CREATE POLICY "Teachers and admins can manage result workflows"
  ON result_publication_workflow FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'principal'::text, 'teacher'::text])
  ));

-- 13. Assignments & Submissions
DROP POLICY IF EXISTS "Admins can manage all assignments" ON assignments;
CREATE POLICY "Admins can manage all assignments"
  ON assignments FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'principal'::text])
    AND ur.is_active = true
  ));

DROP POLICY IF EXISTS "Admins can manage all submissions" ON assignment_submissions;
CREATE POLICY "Admins can manage all submissions"
  ON assignment_submissions FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'principal'::text])
    AND ur.is_active = true
  ));

-- 14. Timetable
DROP POLICY IF EXISTS "Teachers and admins can manage timetables" ON timetable;
CREATE POLICY "Teachers and admins can manage timetables"
  ON timetable FOR ALL
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM teachers WHERE teachers.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'principal'::text]) AND ur.is_active = true))
  );
