use serde::{Deserialize, Serialize, Serializer, Deserializer};
use sqlx::FromRow;
use chrono::{DateTime, Utc};
use std::str::FromStr;
use sqlx::types::BigDecimal;

// Custom serialization for BigDecimal to serialize as f64
fn serialize_bigdecimal_as_f64<S>(value: &Option<BigDecimal>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    match value {
        Some(bd) => {
            let float_val: f64 = bd.to_string().parse().unwrap_or(0.0);
            serializer.serialize_some(&float_val)
        }
        None => serializer.serialize_none(),
    }
}

// Custom deserialization for BigDecimal from f64
fn deserialize_bigdecimal_from_f64<'de, D>(deserializer: D) -> Result<Option<BigDecimal>, D::Error>
where
    D: Deserializer<'de>,
{
    let opt_f64: Option<f64> = Option::deserialize(deserializer)?;
    match opt_f64 {
        Some(f) => Ok(Some(BigDecimal::from_str(&f.to_string()).map_err(serde::de::Error::custom)?)),
        None => Ok(None),
    }
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct WalletSettings {
    pub id: i32,
    pub wallet_address: String,
    
    // Profile Information
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    
    // Security Settings
    pub two_factor_enabled: bool,
    pub biometric_enabled: bool,
    pub session_timeout: i32, // minutes
    pub ip_whitelist: Option<Vec<String>>,
    
    // Privacy Settings
    pub data_sharing_enabled: bool,
    pub analytics_enabled: bool,
    pub marketing_emails: bool,
    
    // Notification Preferences
    pub email_notifications: bool,
    pub push_notifications: bool,
    pub sms_notifications: bool,
    pub trade_alerts: bool,
    pub security_alerts: bool,
    
    // Trading Preferences
    #[serde(serialize_with = "serialize_bigdecimal_as_f64", deserialize_with = "deserialize_bigdecimal_from_f64")]
    pub default_slippage: Option<BigDecimal>,
    pub auto_approve_enabled: bool,
    pub gas_price_preference: String, // slow, standard, fast
    pub preferred_dex: String,
    
    // Display Preferences
    pub theme: String, // light, dark, auto
    pub language: String,
    pub currency: String,
    pub timezone: String,
    
    // Advanced Settings
    pub developer_mode: bool,
    pub beta_features: bool,
    pub custom_rpc_urls: serde_json::Value,
    
    // Metadata
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSettingsRequest {
    // Profile Information
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    
    // Security Settings
    pub two_factor_enabled: Option<bool>,
    pub biometric_enabled: Option<bool>,
    pub session_timeout: Option<i32>,
    pub ip_whitelist: Option<Vec<String>>,
    
    // Privacy Settings
    pub data_sharing_enabled: Option<bool>,
    pub analytics_enabled: Option<bool>,
    pub marketing_emails: Option<bool>,
    
    // Notification Preferences
    pub email_notifications: Option<bool>,
    pub push_notifications: Option<bool>,
    pub sms_notifications: Option<bool>,
    pub trade_alerts: Option<bool>,
    pub security_alerts: Option<bool>,
    
    // Trading Preferences
    #[serde(serialize_with = "serialize_bigdecimal_as_f64", deserialize_with = "deserialize_bigdecimal_from_f64")]
    pub default_slippage: Option<BigDecimal>,
    pub auto_approve_enabled: Option<bool>,
    pub gas_price_preference: Option<String>,
    pub preferred_dex: Option<String>,
    
    // Display Preferences
    pub theme: Option<String>,
    pub language: Option<String>,
    pub currency: Option<String>,
    pub timezone: Option<String>,
    
    // Advanced Settings
    pub developer_mode: Option<bool>,
    pub beta_features: Option<bool>,
    pub custom_rpc_urls: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct SettingsResponse {
    pub settings: WalletSettings,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct SettingsExport {
    pub wallet_address: String,
    pub settings: WalletSettings,
    pub exported_at: DateTime<Utc>,
    pub version: String,
}

impl Default for WalletSettings {
    fn default() -> Self {
        Self {
            id: 0,
            wallet_address: String::new(),
            
            // Profile defaults
            display_name: None,
            email: None,
            avatar_url: None,
            bio: None,
            
            // Security defaults
            two_factor_enabled: false,
            biometric_enabled: false,
            session_timeout: 30,
            ip_whitelist: None,
            
            // Privacy defaults
            data_sharing_enabled: false,
            analytics_enabled: true,
            marketing_emails: false,
            
            // Notification defaults
            email_notifications: true,
            push_notifications: true,
            sms_notifications: false,
            trade_alerts: true,
            security_alerts: true,
            
            // Trading defaults
            default_slippage: Some(BigDecimal::from_str("0.50").unwrap()),
            auto_approve_enabled: false,
            gas_price_preference: "standard".to_string(),
            preferred_dex: "uniswap".to_string(),
            
            // Display defaults
            theme: "dark".to_string(),
            language: "en".to_string(),
            currency: "USD".to_string(),
            timezone: "UTC".to_string(),
            
            // Advanced defaults
            developer_mode: false,
            beta_features: false,
            custom_rpc_urls: serde_json::json!({}),
            
            // Metadata
            created_at: Utc::now(),
            updated_at: Utc::now(),
            last_accessed: Utc::now(),
        }
    }
}

impl WalletSettings {
    pub fn new(wallet_address: String) -> Self {
        Self {
            wallet_address,
            ..Default::default()
        }
    }
    
    pub fn update_from_request(&mut self, request: CreateSettingsRequest) {
        if let Some(display_name) = request.display_name {
            self.display_name = Some(display_name);
        }
        if let Some(email) = request.email {
            self.email = Some(email);
        }
        if let Some(avatar_url) = request.avatar_url {
            self.avatar_url = Some(avatar_url);
        }
        if let Some(bio) = request.bio {
            self.bio = Some(bio);
        }
        
        if let Some(two_factor_enabled) = request.two_factor_enabled {
            self.two_factor_enabled = two_factor_enabled;
        }
        if let Some(biometric_enabled) = request.biometric_enabled {
            self.biometric_enabled = biometric_enabled;
        }
        if let Some(session_timeout) = request.session_timeout {
            self.session_timeout = session_timeout;
        }
        if let Some(ip_whitelist) = request.ip_whitelist {
            self.ip_whitelist = Some(ip_whitelist);
        }
        
        if let Some(data_sharing_enabled) = request.data_sharing_enabled {
            self.data_sharing_enabled = data_sharing_enabled;
        }
        if let Some(analytics_enabled) = request.analytics_enabled {
            self.analytics_enabled = analytics_enabled;
        }
        if let Some(marketing_emails) = request.marketing_emails {
            self.marketing_emails = marketing_emails;
        }
        
        if let Some(email_notifications) = request.email_notifications {
            self.email_notifications = email_notifications;
        }
        if let Some(push_notifications) = request.push_notifications {
            self.push_notifications = push_notifications;
        }
        if let Some(sms_notifications) = request.sms_notifications {
            self.sms_notifications = sms_notifications;
        }
        if let Some(trade_alerts) = request.trade_alerts {
            self.trade_alerts = trade_alerts;
        }
        if let Some(security_alerts) = request.security_alerts {
            self.security_alerts = security_alerts;
        }
        
        if let Some(default_slippage) = request.default_slippage {
            self.default_slippage = Some(default_slippage);
        }
        if let Some(auto_approve_enabled) = request.auto_approve_enabled {
            self.auto_approve_enabled = auto_approve_enabled;
        }
        if let Some(gas_price_preference) = request.gas_price_preference {
            self.gas_price_preference = gas_price_preference;
        }
        if let Some(preferred_dex) = request.preferred_dex {
            self.preferred_dex = preferred_dex;
        }
        
        if let Some(theme) = request.theme {
            self.theme = theme;
        }
        if let Some(language) = request.language {
            self.language = language;
        }
        if let Some(currency) = request.currency {
            self.currency = currency;
        }
        if let Some(timezone) = request.timezone {
            self.timezone = timezone;
        }
        
        if let Some(developer_mode) = request.developer_mode {
            self.developer_mode = developer_mode;
        }
        if let Some(beta_features) = request.beta_features {
            self.beta_features = beta_features;
        }
        if let Some(custom_rpc_urls) = request.custom_rpc_urls {
            self.custom_rpc_urls = custom_rpc_urls;
        }
        
        self.updated_at = Utc::now();
    }
}
