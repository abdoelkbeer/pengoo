-- Create table for store owner WhatsApp alerts
CREATE TABLE IF NOT EXISTS public.admin_alert_settings (
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE PRIMARY KEY,
    alert_phone TEXT,
    is_enabled BOOLEAN DEFAULT false,
    enabled_events JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_alert_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own alert settings" ON public.admin_alert_settings 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert settings" ON public.admin_alert_settings 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert settings" ON public.admin_alert_settings 
FOR UPDATE USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.admin_alert_settings IS 'Stores WhatsApp alert preferences for store owners.';
