-- Paid-access lockdown (audit H1, H3, H4, M4, L5).
-- Run: see supabase/tests/README.md
BEGIN;
SELECT plan(32);

-- ---------- fixtures (as postgres) ----------
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000f1ee', 'free@test.local'),
  ('00000000-0000-0000-0000-0000000ac71e', 'active@test.local'),
  ('00000000-0000-0000-0000-0000000041a1', 'trial@test.local'),
  ('00000000-0000-0000-0000-00000000ca9c', 'cancel@test.local'),
  ('00000000-0000-0000-0000-00000000e8a1', 'expired@test.local'),
  ('00000000-0000-0000-0000-00000000ad31', 'admin@test.local');

INSERT INTO public.subscriptions (user_id, plan_type, status, current_period_end, cancel_at_period_end) VALUES
  ('00000000-0000-0000-0000-0000000ac71e', 'monthly', 'active',   now() + interval '20 days', false),
  ('00000000-0000-0000-0000-0000000041a1', 'monthly', 'trialing', now() + interval '5 days',  false),
  ('00000000-0000-0000-0000-00000000ca9c', 'monthly', 'active',   now() + interval '3 days',  true),
  ('00000000-0000-0000-0000-00000000e8a1', 'monthly', 'active',   now() - interval '1 day',   false);

INSERT INTO public.user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-00000000ad31', 'admin');

INSERT INTO public.lesson_content (id, skill_code, overview_html, independent_practice_answers)
  VALUES (1, 'S1', '<p>x</p>', 'B');
INSERT INTO public.passages (id, form_id, section, passage_text) VALUES ('P1', 'FA_1', 'RD', 'text');
INSERT INTO public.staging_items (staging_id, form_id, section, ord, skill_code, difficulty, question,
  choice_a, choice_b, choice_c, choice_d, answer) VALUES
  (9001, 'DR_TEST', 'MATH', 1, 'S1', 'easy', 'q', 'a', 'b', 'c', 'd', 'B'),
  (9002, 'D2_TEST', 'MATH', 1, 'S1', 'easy', 'q', 'a', 'b', 'c', 'd', 'C');

-- ---------- has_active_access ----------
SELECT is(public.has_active_access('00000000-0000-0000-0000-00000000f1ee'), false, 'free user: no access');
SELECT is(public.has_active_access('00000000-0000-0000-0000-00000000e8a1'), false, 'active but period ended: no access');
SELECT is(public.has_active_access('00000000-0000-0000-0000-0000000ac71e'), true,  'active, future end: access');
SELECT is(public.has_active_access('00000000-0000-0000-0000-0000000041a1'), true,  'trialing: access');
SELECT is(public.has_active_access('00000000-0000-0000-0000-00000000ca9c'), true,  'cancel at period end, end in future: access');
SELECT is(public.has_active_access('00000000-0000-0000-0000-00000000ad31'), true,  'admin without subscription: access');
SELECT is(public.has_active_access(NULL), false, 'null user: no access');

-- ---------- anon ----------
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SELECT throws_ok('SELECT * FROM public.lesson_content', '42501', NULL, 'anon cannot read lesson_content');
SELECT throws_ok('SELECT * FROM public.passages', '42501', NULL, 'anon cannot read passages');
SELECT throws_ok('SELECT * FROM public.v_staging_items_public', '42501', NULL, 'anon cannot read bank view');
SELECT throws_ok($$SELECT public.increment_error_bank('00000000-0000-0000-0000-0000000ac71e', 'q1')$$, '42501', NULL, 'anon cannot call increment_error_bank');
SELECT throws_ok($$SELECT public.check_rate_limit('k', 5, 60000)$$, '42501', NULL, 'anon cannot call check_rate_limit');
SELECT throws_ok('SELECT public.cleanup_old_webhook_events()', '42501', NULL, 'anon cannot call cleanup_old_webhook_events');
SELECT throws_ok($$SELECT public.has_role('00000000-0000-0000-0000-00000000ad31', 'admin')$$, '42501', NULL, 'anon cannot call has_role');
SELECT throws_ok('SELECT public.is_admin()', '42501', NULL, 'anon cannot call is_admin');
SELECT throws_ok($$SELECT public.has_active_access('00000000-0000-0000-0000-00000000ad31')$$, '42501', NULL, 'anon cannot call has_active_access');
RESET ROLE;

-- ---------- free authenticated user ----------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f1ee","role":"authenticated"}', true);
SELECT is((SELECT count(*) FROM public.lesson_content)::int, 0, 'free user sees no lessons');
SELECT is((SELECT count(*) FROM public.passages)::int, 0, 'free user sees no passages');
SELECT is((SELECT count(*) FROM public.v_staging_items_public WHERE form_id = 'DR_TEST')::int, 0, 'free user sees no drill items');
SELECT is((SELECT count(*) FROM public.v_staging_items_public WHERE form_id = 'D2_TEST')::int, 1, 'free user still sees diagnostic items');
SELECT is((SELECT count(*) FROM public.get_bank_answers(ARRAY[9001::bigint]))::int, 0, 'free user gets no drill answers');
SELECT throws_ok($$SELECT public.check_rate_limit('k', 5, 60000)$$, '42501', NULL, 'authenticated cannot call check_rate_limit');
SELECT throws_ok('SELECT public.cleanup_old_webhook_events()', '42501', NULL, 'authenticated cannot call cleanup_old_webhook_events');
SELECT throws_ok($$SELECT public.increment_error_bank('00000000-0000-0000-0000-0000000ac71e', 'q1')$$, '42501', 'not allowed', 'cannot write another user''s error bank');
SELECT lives_ok($$SELECT public.increment_error_bank('00000000-0000-0000-0000-00000000f1ee', 'q1')$$, 'can write own error bank (free diagnostic)');
SELECT is(public.is_admin(), false, 'authenticated can still call is_admin');
RESET ROLE;

-- ---------- paying user ----------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000ac71e","role":"authenticated"}', true);
SELECT is((SELECT count(*) FROM public.lesson_content)::int, 1, 'paying user sees lessons');
SELECT is((SELECT count(*) FROM public.v_staging_items_public WHERE form_id = 'DR_TEST')::int, 1, 'paying user sees drill items');
SELECT is((SELECT answer FROM public.get_bank_answers(ARRAY[9001::bigint])), 'B', 'paying user gets drill answers');
RESET ROLE;

-- ---------- service role ----------
SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
SELECT lives_ok($$SELECT public.increment_error_bank('00000000-0000-0000-0000-0000000ac71e', 'q2')$$, 'service role can write any error bank');
SELECT lives_ok($$SELECT public.check_rate_limit('k', 5, 60000)$$, 'service role can call check_rate_limit');
SELECT lives_ok('SELECT public.cleanup_old_webhook_events()', 'service role can call cleanup_old_webhook_events');
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
