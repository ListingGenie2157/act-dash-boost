-- Create rewards tables and policies

-- Create parents table if not exists
CREATE TABLE IF NOT EXISTS public.parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create parent_links table if not exists  
CREATE TABLE IF NOT EXISTS public.parent_links (
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (parent_id, student_id)
);

-- Create rewards_rules table if not exists
CREATE TABLE IF NOT EXISTS public.rewards_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'DRILL', 'SIM', 'STREAK', etc.
  threshold JSONB NOT NULL, -- {'accuracy': 0.8, 'questions': 5} or {'days': 7}
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rewards_ledger table if not exists
CREATE TABLE IF NOT EXISTS public.rewards_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  rule_id UUID REFERENCES public.rewards_rules(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'DENIED'
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parents
CREATE POLICY "Parents can view their own profile" 
ON public.parents FOR SELECT 
USING (auth.uid() IN (
  SELECT parent_id FROM public.parent_links WHERE parent_id = parents.id
));

CREATE POLICY "Parents can insert their own profile" 
ON public.parents FOR INSERT 
WITH CHECK (true); -- Allow creation, will be restricted by parent_links

-- RLS Policies for parent_links
CREATE POLICY "Students can view their parent links" 
ON public.parent_links FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Parents can view their student links" 
ON public.parent_links FOR SELECT 
USING (auth.uid() IN (
  SELECT parent_id FROM public.parent_links pl WHERE pl.parent_id = parent_links.parent_id
));

CREATE POLICY "Parent links can be managed" 
ON public.parent_links FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS Policies for rewards_rules
CREATE POLICY "Students can view applicable rules" 
ON public.rewards_rules FOR SELECT 
USING (parent_id IN (
  SELECT parent_id FROM public.parent_links WHERE student_id = auth.uid()
));

CREATE POLICY "Parents can manage their rules" 
ON public.rewards_rules FOR ALL 
USING (parent_id IN (
  SELECT parent_id FROM public.parent_links WHERE parent_id = auth.uid()
))
WITH CHECK (parent_id IN (
  SELECT parent_id FROM public.parent_links WHERE parent_id = auth.uid()
));

-- RLS Policies for rewards_ledger
CREATE POLICY "Students can view their earnings" 
ON public.rewards_ledger FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Parents can view their students' earnings" 
ON public.rewards_ledger FOR SELECT 
USING (student_id IN (
  SELECT student_id FROM public.parent_links WHERE parent_id = auth.uid()
));

CREATE POLICY "Students can insert their earnings" 
ON public.rewards_ledger FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Parents can update earnings status" 
ON public.rewards_ledger FOR UPDATE 
USING (student_id IN (
  SELECT student_id FROM public.parent_links WHERE parent_id = auth.uid()
));

-- Insert sample data for testing
INSERT INTO public.parents (email) VALUES ('parent@example.com') ON CONFLICT (email) DO NOTHING;

-- Add a sample rule for drills
INSERT INTO public.rewards_rules (parent_id, type, threshold, amount_cents)
SELECT id, 'DRILL', '{"accuracy": 0.8, "questions": 5}', 50
FROM public.parents WHERE email = 'parent@example.com'
ON CONFLICT DO NOTHING;