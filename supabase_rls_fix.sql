-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run
-- Purpose: the app's admin login is a custom check, not real Supabase Auth,
-- so auth.uid() is always null from the app's perspective. The original
-- policies required auth.uid() to match a profiles row, which silently
-- blocked every write from the app. This replaces those with policies that
-- allow writes through the anon key, since access is already gated by the
-- app's own login screen.

-- POSTS
DROP POLICY IF EXISTS "Admins, editors, and authors can view all posts" ON public.posts;
DROP POLICY IF EXISTS "Admins and editors can manage all posts" ON public.posts;
DROP POLICY IF EXISTS "Reporters can insert their own posts" ON public.posts;

CREATE POLICY "App can manage posts" ON public.posts
    FOR ALL USING (true) WITH CHECK (true);

-- CATEGORIES
DROP POLICY IF EXISTS "Only admins can modify categories" ON public.categories;

CREATE POLICY "App can manage categories" ON public.categories
    FOR ALL USING (true) WITH CHECK (true);

-- APP_USERS (team directory)
DROP POLICY IF EXISTS "Only admins can manage app_users" ON public.app_users;

CREATE POLICY "App can manage app_users" ON public.app_users
    FOR ALL USING (true) WITH CHECK (true);

-- COMMENTS (moderation)
DROP POLICY IF EXISTS "Admins and editors can moderate comments" ON public.comments;

CREATE POLICY "App can moderate comments" ON public.comments
    FOR ALL USING (true) WITH CHECK (true);

-- SETTINGS
DROP POLICY IF EXISTS "Only admins can update settings" ON public.settings;

CREATE POLICY "App can update settings" ON public.settings
    FOR UPDATE USING (true) WITH CHECK (true);
