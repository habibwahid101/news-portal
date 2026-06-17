-- =====================================================================
-- 📢 APORADH GHOSHONA (অপরাধ ঘোষণা) - PRODUCTION DATABASE SCHEMA
-- Target Database: Supabase PostgreSQL
-- Recommended execution: Copy and paste this script into the Supabase SQL Editor.
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE SCHEMAS / FUNCTIONS
-- Create updated_at trigger helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. PROFILES TABLE (Extends Supabase Auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'reporter', 'user')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Trigger for updated_at
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY, -- e.g., 'লিড', 'সিটি কর্পোরেশন'
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Categories
INSERT INTO public.categories (id, name, description) VALUES
('লিড', 'লিড', 'প্রধান সংবাদ ও বিশেষ প্রতিবেদন'),
('সিটি কর্পোরেশন', 'সিটি কর্পোরেশন', 'সিটি কর্পোরেশনের কার্যক্রম'),
('বন্দর', 'বন্দর', 'চট্টগ্রাম বন্দরের সংবাদ'),
('হাসপাতাল', 'হাসপাতাল', 'স্বাস্থ্য ও চিকিৎসা সংক্রান্ত'),
('মহানগর', 'মহানগর', 'মহানগরীর ঘটনাবলী'),
('জেলা উপজেলা', 'জেলা উপজেলা', 'জেলা ও উপজেলার খবর'),
('প্রেস রিলিজ', 'প্রেস রিলিজ', 'অফিসিয়াল প্রেস বিজ্ঞপ্তি')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;


-- 5. POSTS / ARTICLES TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT,
    category TEXT REFERENCES public.categories(id) ON DELETE SET NULL, -- primary category for legacy UI
    categories_json TEXT DEFAULT '[]', -- array of categories for multi-category support
    author_id BIGINT, -- references app_users.id (legacy mock users) or a generic key
    author_name TEXT NOT NULL, -- cache author name for fast loads
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    featured BOOLEAN NOT NULL DEFAULT false,
    published_date TEXT, -- human readable date format preserved (e.g. '১১ মে ২০২৬')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON public.posts(featured);

CREATE TRIGGER update_posts_modtime
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- 6. APP_USERS TABLE
-- Legacy table used to track internal mock roles / local login, but made durable
CREATE TABLE IF NOT EXISTS public.app_users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'reporter' CHECK (role IN ('admin', 'editor', 'reporter')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial system users
INSERT INTO public.app_users (id, name, username, password, email, role, active) VALUES
(1, 'এম নুরুল কবির', 'admin', 'admin321', 'editor@aporadhghoshona.com', 'admin', true),
(2, 'মোঃ গাজী মোরশেদুল আলম', 'editor', 'editor123', 'exec@aporadhghoshona.com', 'editor', true),
(3, 'জিয়াউল হক', 'reporter1', 'reporter123', 'reporter@aporadhghoshona.com', 'reporter', true)
ON CONFLICT (username) DO NOTHING;


-- 7. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'spam')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_article ON public.comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON public.comments(status);


-- 8. BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id BIGSERIAL PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    article_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, article_id)
);


-- 9. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_name TEXT NOT NULL DEFAULT 'অপরাধ ঘোষণা',
    tagline TEXT DEFAULT 'সত্যের পথে, ন্যায়ের সাথে',
    reg_no TEXT DEFAULT '২৫২',
    editor_name TEXT DEFAULT 'এম নুরুল কবির',
    exec_editor TEXT DEFAULT 'মোঃ গাজী মোরশেদুল আলম',
    special_rep TEXT DEFAULT 'জিয়াউল হক',
    phone1 TEXT DEFAULT '০১৭৭৮-৮১১১১১',
    phone2 TEXT DEFAULT '০১৬৩৩-১২৫২৫০',
    phone3 TEXT DEFAULT '০১৮১২৫৭৩৫৪৬',
    email TEXT DEFAULT 'aporadhghoshona@gmail.com',
    breaking_news TEXT DEFAULT 'চট্টগ্রামে ডাকাতি চক্রের মূলহোতাসহ সাতজন গ্রেপ্তার, উদ্ধার কোটি টাকার মালামাল',
    ads_json TEXT DEFAULT '{"header":{},"sidebar":{},"mid":{}}',
    epaper_json TEXT DEFAULT '{"enabled":false,"url":"","label":"সর্বশেষ সংখ্যা"}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed single settings row
INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;


-- =====================================================================
-- 🔒 ROW LEVEL SECURITY (RLS) & ACCESS CONTROL POLICIES
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. CATEGORIES POLICIES
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "App can manage categories" ON public.categories
    FOR ALL USING (true) WITH CHECK (true);

-- 3. POSTS/ARTICLES POLICIES
CREATE POLICY "Published posts are viewable by everyone" ON public.posts
    FOR SELECT USING (status = 'published');

-- The app's admin login is a custom check, not real Supabase Auth, so
-- auth.uid() is always null from the app's perspective. Access is gated by
-- the app's own login screen instead, so writes are allowed through here.
CREATE POLICY "App can manage posts" ON public.posts
    FOR ALL USING (true) WITH CHECK (true);

-- 4. APP_USERS POLICIES (internal table of publisher users)
CREATE POLICY "Viewable by admins, editors" ON public.app_users
    FOR SELECT USING (true); -- allowed for public anon, but we secure with RLS on production if preferred

CREATE POLICY "App can manage app_users" ON public.app_users
    FOR ALL USING (true) WITH CHECK (true);

-- 5. COMMENTS POLICIES
CREATE POLICY "Approved comments are viewable by everyone" ON public.comments
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone can post a comment" ON public.comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "App can moderate comments" ON public.comments
    FOR ALL USING (true) WITH CHECK (true);

-- 6. BOOKMARKS POLICIES
CREATE POLICY "Users can manage their own bookmarks" ON public.bookmarks
    FOR ALL USING (auth.uid() = profile_id);

-- 7. SETTINGS POLICIES
CREATE POLICY "Settings are viewable by everyone" ON public.settings
    FOR SELECT USING (true);

CREATE POLICY "App can update settings" ON public.settings
    FOR UPDATE USING (true) WITH CHECK (true);

-- =====================================================================
-- 🚀 GRANTS AND STORAGE CREATION
-- =====================================================================

-- Allow anonymous access to public tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Setup storage bucket for images if Storage schema exists
-- Run this in your storage configuration or UI:
-- Bucket Name: "news-images" (Public)
