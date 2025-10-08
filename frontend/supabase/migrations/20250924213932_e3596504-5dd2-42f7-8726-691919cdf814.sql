-- Create user profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username text UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create test results table
CREATE TABLE public.test_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions integer NOT NULL CHECK (total_questions > 0),
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'medium', 'advanced')),
  module_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now(),
  test_date date NOT NULL DEFAULT CURRENT_DATE
);

-- Create friendships table
CREATE TABLE public.friendships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Test results policies
CREATE POLICY "Users can view own test results" ON public.test_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test results" ON public.test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Friends can view each other's test results
CREATE POLICY "Friends can view test results" ON public.test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted' 
      AND ((f.requester_id = auth.uid() AND f.addressee_id = user_id)
           OR (f.addressee_id = auth.uid() AND f.requester_id = user_id))
    )
  );

-- Friendships policies
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendship status" ON public.friendships
  FOR UPDATE USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data->>'display_name', new.email)
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_test_results_user_date ON public.test_results(user_id, test_date DESC);
CREATE INDEX idx_test_results_score ON public.test_results(score DESC, completed_at DESC);
CREATE INDEX idx_friendships_status ON public.friendships(status);
CREATE INDEX idx_profiles_username ON public.profiles(username);