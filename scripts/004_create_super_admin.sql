-- ============================================
-- CREATE DEFAULT SUPER ADMIN USER
-- ============================================
-- This script creates a default super admin account
-- Email: admin@ammarschool.edu.ng
-- Password: AdminPass123! (MUST BE CHANGED ON FIRST LOGIN)
--
-- NOTE: This user is created in auth.users by the admin manually
-- This script just ensures the user_roles entry exists
-- ============================================

-- Insert super admin role for the default admin user
-- The UUID will be from the auth.users table after manual creation
-- For now, this is a placeholder that will be updated after first login

-- Create a function to setup super admin role after user is created
CREATE OR REPLACE FUNCTION setup_super_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user (super admin)
  -- You can modify this logic based on email or other criteria
  IF NEW.email = 'admin@ammarschool.edu.ng' THEN
    INSERT INTO user_roles (user_id, role, is_active)
    VALUES (NEW.id, 'super_admin', TRUE)
    ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', is_active = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-assign super admin role
DROP TRIGGER IF EXISTS setup_super_admin_trigger ON auth.users;
CREATE TRIGGER setup_super_admin_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION setup_super_admin_role();

-- NOTE: The actual user creation will be done through the signup page
-- or Supabase dashboard. This trigger ensures they get super_admin role
-- if they use the designated admin email.
