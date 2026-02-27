-- 1. Create the 'my_list' table
CREATE TABLE IF NOT EXISTS public.my_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'movie',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, movie_id)
);

-- 2. Turn on Row Level Security (RLS)
ALTER TABLE public.my_list ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Users can only SELECT their own list items
CREATE POLICY "Users can view their own list items"
ON public.my_list
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only INSERT their own list items
CREATE POLICY "Users can insert their own list items"
ON public.my_list
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only DELETE their own list items
CREATE POLICY "Users can delete their own list items"
ON public.my_list
FOR DELETE
USING (auth.uid() = user_id);
