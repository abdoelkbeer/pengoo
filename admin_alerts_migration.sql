-- Add send_to_admin flag to notification_rules
ALTER TABLE public.notification_rules 
ADD COLUMN send_to_admin BOOLEAN DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN public.notification_rules.send_to_admin IS 'If true, also send a WhatsApp notification to the store admin phone number.';
