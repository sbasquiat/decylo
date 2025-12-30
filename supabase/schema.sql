-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  display_name TEXT,
  timezone TEXT DEFAULT 'UTC'
);

-- Decisions table
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('career', 'money', 'health', 'relationships', 'life_lifestyle', 'growth_learning', 'time_priorities', 'other')),
  context TEXT NOT NULL,
  success_outcome TEXT,
  constraints TEXT,
  risky_assumption TEXT,
  chosen_option_id UUID,
  confidence_int INTEGER CHECK (confidence_int >= 0 AND confidence_int <= 100),
  next_action TEXT,
  next_action_due_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'decided', 'completed'))
);

-- Options table
CREATE TABLE options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  notes TEXT,
  impact_int INTEGER NOT NULL CHECK (impact_int >= 0 AND impact_int <= 10),
  effort_int INTEGER NOT NULL CHECK (effort_int >= 0 AND effort_int <= 10),
  risk_int INTEGER NOT NULL CHECK (risk_int >= 0 AND risk_int <= 10),
  total_score_int INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checkins table
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  focus TEXT,
  completed_bool BOOLEAN DEFAULT false,
  mood_int INTEGER CHECK (mood_int >= 1 AND mood_int <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Outcomes table (Decylo Outcome Model)
CREATE TABLE outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  outcome_score_int INTEGER NOT NULL CHECK (outcome_score_int IN (1, 0, -1)),
  outcome_reflection_text TEXT NOT NULL,
  learning_reflection_text TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Legacy fields (for backward compatibility during migration)
  outcome_status TEXT CHECK (outcome_status IN ('won', 'neutral', 'lost')),
  what_happened TEXT,
  lesson TEXT
);

-- Indexes
CREATE INDEX idx_decisions_user_id ON decisions(user_id);
CREATE INDEX idx_decisions_date ON decisions(date);
CREATE INDEX idx_decisions_status ON decisions(status);
CREATE INDEX idx_options_decision_id ON options(decision_id);
CREATE INDEX idx_checkins_user_id ON checkins(user_id);
CREATE INDEX idx_checkins_date ON checkins(date);
CREATE INDEX idx_outcomes_decision_id ON outcomes(decision_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Decisions policies
CREATE POLICY "Users can view own decisions" ON decisions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decisions" ON decisions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decisions" ON decisions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decisions" ON decisions
  FOR DELETE USING (auth.uid() = user_id);

-- Options policies
CREATE POLICY "Users can view own options" ON options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = options.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own options" ON options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = options.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own options" ON options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = options.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own options" ON options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = options.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

-- Checkins policies
CREATE POLICY "Users can view own checkins" ON checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON checkins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON checkins
  FOR DELETE USING (auth.uid() = user_id);

-- Outcomes policies
CREATE POLICY "Users can view own outcomes" ON outcomes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = outcomes.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own outcomes" ON outcomes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = outcomes.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own outcomes" ON outcomes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = outcomes.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own outcomes" ON outcomes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = outcomes.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on decisions
CREATE TRIGGER update_decisions_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

