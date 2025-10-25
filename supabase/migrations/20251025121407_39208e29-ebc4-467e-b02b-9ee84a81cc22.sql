-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create has_role helper function BEFORE policies that use it
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- NOW create RLS policies that use has_role
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Update is_admin function to use roles table
CREATE OR REPLACE FUNCTION public.is_admin(user_email TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  check_user_id UUID;
BEGIN
  -- If no email provided, use current user
  IF user_email IS NULL THEN
    check_user_id := auth.uid();
  ELSE
    -- Look up user by email
    SELECT id INTO check_user_id 
    FROM auth.users 
    WHERE email = user_email;
  END IF;
  
  -- Return true if user has admin role
  RETURN public.has_role(check_user_id, 'admin');
END;
$$;

-- Grant admin role to your account
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'listnggenie@gmail.com'
ON CONFLICT DO NOTHING;

-- Ensure skill E1.C exists
INSERT INTO skills (id, name, subject, cluster, order_index)
VALUES ('E1.C', 'Conventions of Standard English: Punctuation', 'English', 'Conventions of Standard English', 1)
ON CONFLICT (id) DO NOTHING;