-- Strengthen wallet_settings table with better constraints and indexes
-- Fixed version without CURRENT_TIMESTAMP in index predicates

-- Add additional constraints for data validation
ALTER TABLE wallet_settings 
ADD CONSTRAINT check_wallet_address_format 
CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$');

ALTER TABLE wallet_settings 
ADD CONSTRAINT check_email_format 
CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE wallet_settings 
ADD CONSTRAINT check_session_timeout_range 
CHECK (session_timeout >= 5 AND session_timeout <= 1440); -- 5 minutes to 24 hours

ALTER TABLE wallet_settings 
ADD CONSTRAINT check_default_slippage_range 
CHECK (default_slippage IS NULL OR (default_slippage >= 0.01 AND default_slippage <= 50.00));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wallet_settings_created_at ON wallet_settings(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_settings_updated_at ON wallet_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_wallet_settings_last_accessed ON wallet_settings(last_accessed);
CREATE INDEX IF NOT EXISTS idx_wallet_settings_email ON wallet_settings(email) WHERE email IS NOT NULL;

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_wallet_settings_lookup ON wallet_settings(wallet_address, updated_at);

-- Add constraint for theme values
ALTER TABLE wallet_settings 
ADD CONSTRAINT check_theme_values 
CHECK (theme IN ('light', 'dark', 'auto'));

-- Add constraint for gas price preference
ALTER TABLE wallet_settings 
ADD CONSTRAINT check_gas_price_values 
CHECK (gas_price_preference IN ('slow', 'standard', 'fast'));

-- Add constraint for currency values
ALTER TABLE wallet_settings 
ADD CONSTRAINT check_currency_values 
CHECK (currency IN ('USD', 'EUR', 'GBP', 'BTC', 'ETH'));

-- Add constraint for language values
ALTER TABLE wallet_settings 
ADD CONSTRAINT check_language_values 
CHECK (language IN ('en', 'es', 'fr', 'de', 'ja', 'ko', 'zh'));

-- Ensure wallet addresses are stored in lowercase for consistency
CREATE OR REPLACE FUNCTION normalize_wallet_address()
RETURNS TRIGGER AS $$
BEGIN
    NEW.wallet_address = LOWER(NEW.wallet_address);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_wallet_address_trigger
    BEFORE INSERT OR UPDATE ON wallet_settings
    FOR EACH ROW
    EXECUTE FUNCTION normalize_wallet_address();

-- Add function to clean up old inactive settings (optional maintenance)
CREATE OR REPLACE FUNCTION cleanup_inactive_settings(days_inactive INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    cutoff_date := CURRENT_TIMESTAMP - (days_inactive || ' days')::INTERVAL;
    
    DELETE FROM wallet_settings 
    WHERE last_accessed < cutoff_date
    AND created_at < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add function to get settings with automatic last_accessed update
CREATE OR REPLACE FUNCTION get_wallet_settings_with_access_update(p_wallet_address VARCHAR(42))
RETURNS TABLE (
    id INTEGER,
    wallet_address VARCHAR(42),
    display_name VARCHAR(100),
    email VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    two_factor_enabled BOOLEAN,
    biometric_enabled BOOLEAN,
    session_timeout INTEGER,
    ip_whitelist TEXT[],
    data_sharing_enabled BOOLEAN,
    analytics_enabled BOOLEAN,
    marketing_emails BOOLEAN,
    email_notifications BOOLEAN,
    push_notifications BOOLEAN,
    sms_notifications BOOLEAN,
    trade_alerts BOOLEAN,
    security_alerts BOOLEAN,
    default_slippage DECIMAL(5,2),
    auto_approve_enabled BOOLEAN,
    gas_price_preference VARCHAR(20),
    preferred_dex VARCHAR(50),
    theme VARCHAR(20),
    language VARCHAR(10),
    currency VARCHAR(10),
    timezone VARCHAR(50),
    developer_mode BOOLEAN,
    beta_features BOOLEAN,
    custom_rpc_urls JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_accessed TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Update last_accessed timestamp
    UPDATE wallet_settings 
    SET last_accessed = CURRENT_TIMESTAMP 
    WHERE wallet_settings.wallet_address = LOWER(p_wallet_address);
    
    -- Return the settings
    RETURN QUERY
    SELECT ws.id, ws.wallet_address, ws.display_name, ws.email, ws.avatar_url, ws.bio,
           ws.two_factor_enabled, ws.biometric_enabled, ws.session_timeout, ws.ip_whitelist,
           ws.data_sharing_enabled, ws.analytics_enabled, ws.marketing_emails,
           ws.email_notifications, ws.push_notifications, ws.sms_notifications, 
           ws.trade_alerts, ws.security_alerts,
           ws.default_slippage, ws.auto_approve_enabled, ws.gas_price_preference, ws.preferred_dex,
           ws.theme, ws.language, ws.currency, ws.timezone,
           ws.developer_mode, ws.beta_features, ws.custom_rpc_urls,
           ws.created_at, ws.updated_at, ws.last_accessed
    FROM wallet_settings ws
    WHERE ws.wallet_address = LOWER(p_wallet_address);
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE wallet_settings IS 'Stores user preferences and settings per wallet address with automatic normalization and validation';
COMMENT ON COLUMN wallet_settings.wallet_address IS 'Ethereum wallet address (automatically normalized to lowercase)';
COMMENT ON COLUMN wallet_settings.last_accessed IS 'Timestamp of last settings access for cleanup purposes';
COMMENT ON FUNCTION get_wallet_settings_with_access_update(VARCHAR) IS 'Retrieves wallet settings and automatically updates last_accessed timestamp';
COMMENT ON FUNCTION cleanup_inactive_settings(INTEGER) IS 'Removes settings for wallets inactive for specified number of days';
