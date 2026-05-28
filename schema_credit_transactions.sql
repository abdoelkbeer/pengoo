-- Create credit transactions table
CREATE TABLE credit_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('recharge_package', 'recharge_custom', 'admin_adjustment', 'message_usage')),
    status TEXT NOT NULL CHECK (status IN ('completed', 'pending', 'failed')) DEFAULT 'completed',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index for faster query by user
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Set permissions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" 
    ON credit_transactions FOR SELECT 
    USING (auth.uid() = user_id);

-- Admins can view all (via service role)
-- Inserts happen via API routes (Service Role)
