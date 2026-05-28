-- 1. Update plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS intro_price_monthly NUMERIC,
ADD COLUMN IF NOT EXISTS intro_price_yearly NUMERIC,
ADD COLUMN IF NOT EXISTS intro_period_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_price_monthly NUMERIC,
ADD COLUMN IF NOT EXISTS original_price_yearly NUMERIC;

-- 2. Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
    discount_value NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    max_usages INTEGER,
    used_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id),
ADD COLUMN IF NOT EXISTS period_number INTEGER DEFAULT 1;

-- 4. Create coupon_usages table (to prevent multiple uses by same user if desired)
CREATE TABLE IF NOT EXISTS coupon_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(coupon_id, user_id)
);

-- 5. Helper function for incrementing usage (optional)
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE coupons
    SET used_count = used_count + 1
    WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS for coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Admin policies for coupons (adjust as needed for your admin roles)
CREATE POLICY "Admins can manage coupons" ON coupons
FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM platform_settings WHERE is_admin = true)); 
-- Note: Replace the above check with your actual admin check logic if different.

-- Public can view active coupons (for validation)
CREATE POLICY "Public can view active coupons" ON coupons
FOR SELECT USING (is_active = true);
