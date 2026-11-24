-- Test-only baseline: the production shape (2026-11-22) of every object the
-- access-lockdown migrations touch. The repo's migration history does not
-- replay from scratch (20250911214734 uses CREATE POLICY IF NOT EXISTS), so the
-- local test database is built from this file instead:
--   psql -f supabase/tests/baseline/prod_baseline.sql, then the new migrations.
-- Definitions copied from pg_get_functiondef / pg_get_viewdef / pg_policies on
-- project hhbkmxrzxcswwokmbtbz. FKs to skills/forms are omitted (not under test).

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_type text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.error_bank (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  last_missed_at timestamptz NOT NULL DEFAULT now(),
  miss_count integer DEFAULT 1,
  PRIMARY KEY (user_id, question_id)
);

CREATE TABLE public.rate_limits (
  key text PRIMARY KEY,
  count integer DEFAULT 1,
  window_start timestamptz DEFAULT now()
);

CREATE TABLE public.stripe_webhook_events (
  id text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lesson_content (
  id bigint PRIMARY KEY,
  skill_code text NOT NULL UNIQUE,
  overview_html text NOT NULL,
  independent_practice_answers text,
  skill_id text
);

CREATE TABLE public.passages (
  id text PRIMARY KEY,
  form_id text NOT NULL,
  section text NOT NULL,
  title text,
  passage_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.staging_items (
  staging_id bigserial PRIMARY KEY,
  form_id text NOT NULL,
  section text NOT NULL,
  ord integer NOT NULL,
  passage_id text,
  passage_title text,
  passage_text text,
  skill_code text NOT NULL,
  difficulty text NOT NULL,
  question text NOT NULL,
  choice_a text NOT NULL,
  choice_b text NOT NULL,
  choice_c text NOT NULL,
  choice_d text NOT NULL,
  answer text NOT NULL,
  explanation text,
  lesson_code text,
  image_url text,
  image_caption text,
  image_position text DEFAULT 'above_question',
  underlined_text text,
  reference_number integer,
  position_in_passage integer,
  calculator_allowed boolean DEFAULT true
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_items ENABLE ROW LEVEL SECURITY;

-- Functions (verbatim from production)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  RETURN public.has_role(auth.uid(), 'admin');
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_error_bank(p_user_id uuid, p_question_id text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO error_bank (user_id, question_id, miss_count, last_missed_at)
  VALUES (p_user_id, p_question_id, 1, now())
  ON CONFLICT (user_id, question_id)
  DO UPDATE SET
    miss_count = error_bank.miss_count + 1,
    last_missed_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key text, p_limit integer, p_window_ms integer)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_window_start TIMESTAMPTZ := now() - (p_window_ms || ' milliseconds')::interval;
  v_count INTEGER;
BEGIN
  DELETE FROM rate_limits WHERE window_start < now() - interval '1 hour';
  INSERT INTO rate_limits (key, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE SET
    count = CASE WHEN rate_limits.window_start < v_window_start THEN 1 ELSE rate_limits.count + 1 END,
    window_start = CASE WHEN rate_limits.window_start < v_window_start THEN now() ELSE rate_limits.window_start END
  RETURNING count INTO v_count;
  RETURN jsonb_build_object('allowed', v_count <= p_limit, 'count', v_count);
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_events()
 RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  DELETE FROM stripe_webhook_events WHERE received_at < now() - interval '7 days';
$function$;

CREATE OR REPLACE FUNCTION public.get_bank_answers(p_ids bigint[])
 RETURNS TABLE(staging_id bigint, answer text, explanation text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT s.staging_id, s.answer, s.explanation
  FROM public.staging_items s
  WHERE auth.uid() IS NOT NULL
    AND s.staging_id = ANY (p_ids[1:100])
    AND s.form_id LIKE 'DR\_%';
$function$;
REVOKE EXECUTE ON FUNCTION public.get_bank_answers(bigint[]) FROM public, anon;

-- Trigger functions: bodies are not under test, only their EXECUTE grants.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.update_mastery_on_response() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.check_sim_results_daily_limit() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN RETURN NEW; END; $$;

-- Policies (production)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own error bank" ON public.error_bank FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own errors" ON public.error_bank FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own errors" ON public.error_bank FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "No direct access to rate_limits" ON public.rate_limits FOR SELECT TO authenticated USING (false);
CREATE POLICY lesson_content_read_all ON public.lesson_content FOR SELECT USING (true);
CREATE POLICY passages_public_read ON public.passages FOR SELECT USING (true);
CREATE POLICY staging_admin_select ON public.staging_items FOR SELECT USING (is_admin());
CREATE POLICY staging_admin_insert ON public.staging_items FOR INSERT WITH CHECK (is_admin());
CREATE POLICY staging_admin_update ON public.staging_items FOR UPDATE USING (is_admin());
CREATE POLICY staging_admin_delete ON public.staging_items FOR DELETE USING (is_admin());

CREATE VIEW public.v_staging_items_public AS
 SELECT staging_id, form_id, section, ord, skill_code, question,
    choice_a, choice_b, choice_c, choice_d, difficulty,
    passage_id, passage_text, passage_title, underlined_text, reference_number,
    position_in_passage, image_url, image_caption, image_position,
    calculator_allowed, lesson_code
   FROM staging_items
  WHERE form_id ~~ 'DR\_%'::text OR form_id ~~ 'FA\_%'::text OR form_id ~~ 'FB\_%'::text
     OR form_id ~~ 'FC\_%'::text OR form_id ~ '^C[1-5]_'::text OR form_id ~~ 'D2%'::text OR form_id ~~ 'ONB%'::text;
REVOKE ALL ON public.v_staging_items_public FROM anon;
