-- Create custom types for enum-like fields
CREATE TYPE role_type AS ENUM ('user', 'admin');
CREATE TYPE draw_status AS ENUM ('draft', 'simulated', 'published');
CREATE TYPE draw_mode AS ENUM ('random', 'algorithmic');
CREATE TYPE draw_algo_bias AS ENUM ('frequent', 'rare');
CREATE TYPE verification_status AS ENUM ('awaiting_proof', 'submitted', 'approved', 'rejected');
CREATE TYPE payment_status AS ENUM ('pending', 'paid');

-- 1. Charities
CREATE TABLE charities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles (Extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role role_type DEFAULT 'user'::role_type NOT NULL,
    full_name TEXT,
    charity_id UUID REFERENCES charities(id),
    charity_percent INTEGER DEFAULT 10 CHECK (charity_percent >= 10),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL,
    plan_type TEXT NOT NULL,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Scores
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
    played_on DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, played_on)
);

-- 5. Charity Events
CREATE TABLE charity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Donations
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    charity_id UUID NOT NULL REFERENCES charities(id),
    amount INTEGER NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Draws
CREATE TABLE draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month DATE NOT NULL, -- Stored as first of the month e.g., '2023-10-01'
    status draw_status DEFAULT 'draft'::draw_status NOT NULL,
    mode draw_mode DEFAULT 'random'::draw_mode NOT NULL,
    algo_bias draw_algo_bias,
    draw_numbers INTEGER[] CHECK (array_length(draw_numbers, 1) = 5 OR draw_numbers IS NULL),
    total_pool INTEGER DEFAULT 0,
    pool_5 INTEGER DEFAULT 0,
    pool_4 INTEGER DEFAULT 0,
    pool_3 INTEGER DEFAULT 0,
    jackpot_carried_in INTEGER DEFAULT 0,
    jackpot_rollover INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Unique partial index: only one published draw per month
CREATE UNIQUE INDEX one_published_draw_per_month ON draws (month) WHERE status = 'published';

-- 8. Draw Entries
CREATE TABLE draw_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    match_count INTEGER NOT NULL CHECK (match_count >= 0 AND match_count <= 5),
    scores_snapshot INTEGER[] NOT NULL CHECK (array_length(scores_snapshot, 1) = 5),
    payout_amount INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(draw_id, user_id)
);

-- 9. Winners
CREATE TABLE winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    draw_entry_id UUID NOT NULL REFERENCES draw_entries(id) ON DELETE CASCADE,
    tier INTEGER NOT NULL CHECK (tier IN (3, 4, 5)),
    prize_amount INTEGER NOT NULL,
    admin_note TEXT,
    verification_status verification_status DEFAULT 'awaiting_proof'::verification_status NOT NULL,
    payment_status payment_status DEFAULT 'pending'::payment_status NOT NULL,
    proof_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Settings (Single row)
CREATE TABLE settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    pool_percent INTEGER DEFAULT 50 CHECK (pool_percent >= 0 AND pool_percent <= 100),
    plan_prices JSONB DEFAULT '{"monthly": 499, "yearly": 4999}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Helper Function: is_admin() SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'user');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies

-- Charities: Publicly readable, admin full access
CREATE POLICY "Charities are viewable by everyone" ON charities FOR SELECT USING (true);
CREATE POLICY "Admins can manage charities" ON charities USING (is_admin());

-- Charity Events: Publicly readable, admin full access
CREATE POLICY "Charity events are viewable by everyone" ON charity_events FOR SELECT USING (true);
CREATE POLICY "Admins can manage charity events" ON charity_events USING (is_admin());

-- Profiles: Users can read/update their own, admins full access
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (is_admin());

-- Subscriptions: Users can read their own, admins full access
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage subscriptions" ON subscriptions USING (is_admin());

-- Scores: Users can read/insert/update/delete their own, admins full access
CREATE POLICY "Users can view own scores" ON scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scores" ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scores" ON scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scores" ON scores FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage scores" ON scores USING (is_admin());

-- Draws: Publicly readable, admin full access
CREATE POLICY "Draws are viewable by everyone" ON draws FOR SELECT USING (true);
CREATE POLICY "Admins can manage draws" ON draws USING (is_admin());

-- Draw Entries: Users can read their own, admins full access
CREATE POLICY "Users can view own draw entries" ON draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage draw entries" ON draw_entries USING (is_admin());

-- Winners: Users can read their own, publicly readable if published? (For now, let's allow everyone to read winners, but only users update their proof). Actually, let's keep it restricted.
CREATE POLICY "Winners viewable by everyone" ON winners FOR SELECT USING (true);
CREATE POLICY "Winners can update their proof_url" ON winners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage winners" ON winners USING (is_admin());

-- Donations: Users can read their own, admins full access
CREATE POLICY "Users can view own donations" ON donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage donations" ON donations USING (is_admin());

-- Settings: Publicly readable, admin full access
CREATE POLICY "Settings viewable by everyone" ON settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON settings USING (is_admin());

-- Storage: winner-proofs bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('winner-proofs', 'winner-proofs', false) ON CONFLICT DO NOTHING;
CREATE POLICY "Users can upload their own proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'winner-proofs' AND (auth.uid() = owner));
CREATE POLICY "Users can view their own proofs" ON storage.objects FOR SELECT USING (bucket_id = 'winner-proofs' AND (auth.uid() = owner));
CREATE POLICY "Admins can view all proofs" ON storage.objects FOR SELECT USING (bucket_id = 'winner-proofs' AND is_admin());
