-- Create wallet_settings table for storing user preferences per wallet address
CREATE TABLE IF NOT EXISTS wallet_settings (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    
    -- Profile Information
    display_name VARCHAR(100),
    email VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    
    -- Security Settings
    two_factor_enabled BOOLEAN DEFAULT false,
    biometric_enabled BOOLEAN DEFAULT false,
    session_timeout INTEGER DEFAULT 30, -- minutes
    ip_whitelist TEXT[], -- array of IP addresses
    
    -- Privacy Settings
    data_sharing_enabled BOOLEAN DEFAULT false,
    analytics_enabled BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    
    -- Notification Preferences
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    trade_alerts BOOLEAN DEFAULT true,
    security_alerts BOOLEAN DEFAULT true,
    
    -- Trading Preferences
    default_slippage DECIMAL(5,2) DEFAULT 0.50,
    auto_approve_enabled BOOLEAN DEFAULT false,
    gas_price_preference VARCHAR(20) DEFAULT 'standard', -- slow, standard, fast
    preferred_dex VARCHAR(50) DEFAULT 'uniswap',
    
    -- Display Preferences
    theme VARCHAR(20) DEFAULT 'dark', -- light, dark, auto
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(10) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Advanced Settings
    developer_mode BOOLEAN DEFAULT false,
    beta_features BOOLEAN DEFAULT false,
    custom_rpc_urls JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster wallet address lookups
CREATE INDEX IF NOT EXISTS idx_wallet_settings_address ON wallet_settings(wallet_address);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wallet_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallet_settings_updated_at
    BEFORE UPDATE ON wallet_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_settings_updated_at();
