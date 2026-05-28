-- Add custom message templates column to admin_alert_settings
ALTER TABLE public.admin_alert_settings
ADD COLUMN IF NOT EXISTS event_templates JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN public.admin_alert_settings.event_templates IS 'Custom WhatsApp message templates per event type. Keys are event IDs, values are message strings with {customer_name}, {order_number}, {order_total} placeholders.';
