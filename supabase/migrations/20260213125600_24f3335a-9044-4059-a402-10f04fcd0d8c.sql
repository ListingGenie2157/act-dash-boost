
-- Index: sessions by user_id + created_at (daily cap check, session listing)
CREATE INDEX IF NOT EXISTS idx_sessions_user_id_created_at ON public.sessions (user_id, created_at);

-- Index: responses by session_id + question_id (unique lookup, grading)
CREATE UNIQUE INDEX IF NOT EXISTS idx_responses_session_question ON public.responses (session_id, question_id);

-- Index: session_questions by session_id + ord (fetch pinned questions)
CREATE INDEX IF NOT EXISTS idx_session_questions_session_ord ON public.session_questions (session_id, ord);

-- Index: subscriptions by user_id (subscription gating lookups)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);

-- Index: sim_results by user_id + created_at (results history)
CREATE INDEX IF NOT EXISTS idx_sim_results_user_id_created ON public.sim_results (user_id, created_at);
