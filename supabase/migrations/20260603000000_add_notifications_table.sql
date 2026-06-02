-- ==========================================================
-- SQL MIGRATION: NOTIFICATIONS TABLE
-- Stores user notifications for dashboard alerts
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,               -- e.g., 'info', 'warning', 'error'
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Policy: Users can insert their own notifications (system use)
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (true);

-- Policy: Users can update read status of their notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
