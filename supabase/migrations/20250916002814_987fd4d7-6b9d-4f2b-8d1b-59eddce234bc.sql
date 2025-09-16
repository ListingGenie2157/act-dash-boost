-- Create RPC function for admin check
CREATE OR REPLACE FUNCTION public.is_admin(user_email text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_emails text[] := ARRAY['admin@actboost.com', 'support@actboost.com'];
  check_email text;
BEGIN
  -- If no email provided, use current user's email
  IF user_email IS NULL THEN
    SELECT email INTO check_email 
    FROM auth.users 
    WHERE id = auth.uid();
  ELSE
    check_email := user_email;
  END IF;
  
  -- Return true if email is in admin list
  RETURN check_email = ANY(admin_emails);
END;
$$;