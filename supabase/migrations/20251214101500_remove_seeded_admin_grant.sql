-- SECURITY: Never grant admin roles to a specific email in migrations.
-- Admin assignment must be an explicit operational step per environment.

DELETE FROM public.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND ur.role = 'admin'::public.app_role
  AND u.email = 'listnggenie@gmail.com';

