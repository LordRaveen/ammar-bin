-- Fix RLS policies for user_roles and guardians tables
-- This script properly enables RLS and uses correct policy syntax

-- First, ensure RLS is enabled on both tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage guardians" ON guardians;

-- USER_ROLES POLICIES
-- Policy 1: Users can view their own role
CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
USING (is_admin());

-- Policy 3: Admins can insert roles
CREATE POLICY "Admins can insert roles"
ON user_roles FOR INSERT
WITH CHECK (is_admin());

-- Policy 4: Admins can update roles
CREATE POLICY "Admins can update roles"
ON user_roles FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- Policy 5: Admins can delete roles
CREATE POLICY "Admins can delete roles"
ON user_roles FOR DELETE
USING (is_admin());

-- GUARDIANS POLICIES
-- Policy 1: Admins can view guardians
CREATE POLICY "Admins can view guardians"
ON guardians FOR SELECT
USING (is_admin());

-- Policy 2: Admins can insert guardians
CREATE POLICY "Admins can insert guardians"
ON guardians FOR INSERT
WITH CHECK (is_admin());

-- Policy 3: Admins can update guardians
CREATE POLICY "Admins can update guardians"
ON guardians FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- Policy 4: Admins can delete guardians
CREATE POLICY "Admins can delete guardians"
ON guardians FOR DELETE
USING (is_admin());

-- Policy 5: Parents can view their own guardian record
CREATE POLICY "Parents can view own record"
ON guardians FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'parent'
    AND user_roles.user_id IN (
      SELECT user_id FROM guardians WHERE id = guardians.id
    )
  )
);

-- Verify RLS is enabled
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_roles') THEN
    RAISE EXCEPTION 'RLS is not enabled on user_roles table';
  END IF;
  
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'guardians') THEN
    RAISE EXCEPTION 'RLS is not enabled on guardians table';
  END IF;
  
  RAISE NOTICE 'RLS successfully enabled on user_roles and guardians tables';
END $$;
