-- Create tutor_sessions table
CREATE TABLE tutor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('practice', 'quiz', 'test')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tutor_sessions_user_id ON tutor_sessions(user_id);
CREATE INDEX idx_tutor_sessions_last_used ON tutor_sessions(last_used_at DESC);

-- RLS Policies for tutor_sessions
ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON tutor_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON tutor_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON tutor_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create tutor_messages table
CREATE TABLE tutor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES tutor_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tutor_messages_session_id ON tutor_messages(session_id);
CREATE INDEX idx_tutor_messages_created_at ON tutor_messages(created_at DESC);

-- RLS Policies for tutor_messages
ALTER TABLE tutor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their sessions"
  ON tutor_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tutor_sessions
      WHERE tutor_sessions.id = tutor_messages.session_id
      AND tutor_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their sessions"
  ON tutor_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tutor_sessions
      WHERE tutor_sessions.id = tutor_messages.session_id
      AND tutor_sessions.user_id = auth.uid()
    )
  );