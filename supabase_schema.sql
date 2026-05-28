-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users (Managed by Supabase Auth, we extend it via public.users profile if needed)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. stores (WooCommerce Integration)
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  store_url TEXT NOT NULL,
  consumer_key TEXT,
  consumer_secret TEXT,
  webhook_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. whatsapp_connections (Device Connections)
CREATE TABLE public.whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  session_name TEXT NOT NULL,
  status TEXT DEFAULT 'DISCONNECTED', -- 'CONNECTED', 'DISCONNECTED', 'QR_READY'
  qr_code TEXT,
  phone_number TEXT,
  engine_type TEXT DEFAULT 'WEB', -- 'WEB' or 'META'
  meta_phone_number_id TEXT,
  meta_waba_id TEXT,
  meta_access_token TEXT,
  meta_verify_token TEXT,
  meta_signup_data JSONB, -- Store raw response from Embedded Signup
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ... (rest of the file remains same, adding to platform_settings at the end)

ALTER TABLE IF EXISTS public.platform_settings
ADD COLUMN IF NOT EXISTS meta_app_id TEXT,
ADD COLUMN IF NOT EXISTS meta_embedded_signup_config_id TEXT;

-- 4. notification_rules (User Automations)
CREATE TABLE public.notification_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- e.g. 'order.created', 'order.processing', 'order.completed'
  message_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. logs (Message Sending Logs)
CREATE TABLE public.message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  message_body TEXT NOT NULL,
  status TEXT NOT NULL, -- 'SENT', 'FAILED', 'PENDING'
  error_details TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. abandoned_carts (Tracking Carts)
CREATE TABLE public.abandoned_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  cart_token TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  cart_total DECIMAL,
  items JSONB,
  scheduled_time TIMESTAMPTZ,
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'RECOVERED'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own stores" ON public.stores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stores" ON public.stores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stores" ON public.stores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stores" ON public.stores FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own whatsapp_connections" ON public.whatsapp_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own whatsapp_connections" ON public.whatsapp_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own whatsapp_connections" ON public.whatsapp_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own whatsapp_connections" ON public.whatsapp_connections FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own rules" ON public.notification_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rules" ON public.notification_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON public.notification_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules" ON public.notification_rules FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own logs" ON public.message_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.message_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Abandoned carts (Using store_id to link to user)
CREATE POLICY "Users can view own abandoned_carts" ON public.abandoned_carts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.stores WHERE stores.id = abandoned_carts.store_id AND stores.user_id = auth.uid())
);
CREATE POLICY "Users can update own abandoned_carts" ON public.abandoned_carts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.stores WHERE stores.id = abandoned_carts.store_id AND stores.user_id = auth.uid())
);

-- Trigger to automatically stringify newly created auth.users into public.user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. system_logs (Platform and Error Logging)
CREATE TABLE public.system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level TEXT NOT NULL, -- 'INFO', 'WARN', 'ERROR', 'CRITICAL'
    source TEXT NOT NULL, -- e.g. 'whatsapp-worker', 'webhook', 'admin', 'system'
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions and Plans (Added for documentation)
ALTER TABLE IF EXISTS public.subscriptions
ADD COLUMN IF NOT EXISTS max_messages_override INTEGER,
ADD COLUMN IF NOT EXISTS max_whatsapp_numbers_override INTEGER,
ADD COLUMN IF NOT EXISTS max_stores_override INTEGER;

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
-- Admins (service_role) or specific users can view logs. We'll allow authenticated users to view logs if they are admins (for now, maybe just rely on service_role from the Admin Panel).
CREATE POLICY "Admins can view system logs" ON public.system_logs FOR SELECT USING (auth.jwt()->>'role' = 'service_role' OR auth.uid() IN (SELECT id FROM public.user_profiles));

-- 8. Add system logs configurations to platform_settings (assuming it exists, we alter it if needed or create if not exist but from previous chats I know it exists)
-- This is a safe ALTER TABLE statement assuming the table was already created
ALTER TABLE IF EXISTS public.platform_settings
ADD COLUMN IF NOT EXISTS enable_system_logs BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS log_level TEXT DEFAULT 'INFO',
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port INTEGER,
ADD COLUMN IF NOT EXISTS smtp_user TEXT,
ADD COLUMN IF NOT EXISTS smtp_password TEXT,
ADD COLUMN IF NOT EXISTS smtp_sender_email TEXT,
ADD COLUMN IF NOT EXISTS smtp_sender_name TEXT,
ADD COLUMN IF NOT EXISTS active_payment_gateway TEXT DEFAULT 'fawaterk',
ADD COLUMN IF NOT EXISTS fawaterk_api_key TEXT,
ADD COLUMN IF NOT EXISTS fawaterk_webhook_secret TEXT,
ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT,
ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT,
ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT,
ADD COLUMN IF NOT EXISTS favicon_url TEXT;
