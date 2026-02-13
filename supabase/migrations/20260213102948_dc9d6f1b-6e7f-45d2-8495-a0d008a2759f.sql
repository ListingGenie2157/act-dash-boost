
-- Pin questions to sessions to prevent form ID enumeration / scraping
CREATE TABLE public.session_questions (
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  ord integer NOT NULL,
  passage_id text,
  PRIMARY KEY (session_id, ord)
);

CREATE INDEX idx_session_questions_session ON public.session_questions(session_id);

ALTER TABLE public.session_questions ENABLE ROW LEVEL SECURITY;

-- Users can only read questions pinned to their own sessions
CREATE POLICY "Users view own session questions"
  ON public.session_questions FOR SELECT
  USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));

-- No INSERT/UPDATE/DELETE for users — only service_role writes
