use actix_web::{get, post, delete, web, HttpResponse, Responder, Result};
use sqlx::PgPool;
use crate::models::settings::{WalletSettings, CreateSettingsRequest, SettingsResponse, SettingsExport};
use crate::auth::verify_wallet_signature;
use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct WalletPath {
    wallet_address: String,
}

#[derive(Deserialize)]
pub struct SignedRequest<T> {
    pub data: T,
    pub signature: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
}

/// Get settings for a specific wallet address
#[get("/api/settings/{wallet_address}")]
pub async fn get_settings(
    path: web::Path<WalletPath>,
    pool: web::Data<PgPool>,
) -> Result<impl Responder> {
    let wallet_address = path.wallet_address.to_lowercase();
    
    // Validate wallet address format
    if !wallet_address.starts_with("0x") || wallet_address.len() != 42 {
        return Ok(HttpResponse::BadRequest().json(ErrorResponse {
            error: "invalid_wallet_address".to_string(),
            message: "Invalid wallet address format".to_string(),
        }));
    }

    match get_wallet_settings(&pool, &wallet_address).await {
        Ok(Some(settings)) => {
            // Update last accessed timestamp
            let _ = update_last_accessed(&pool, &wallet_address).await;
            
            Ok(HttpResponse::Ok().json(SettingsResponse {
                settings,
                message: "Settings retrieved successfully".to_string(),
            }))
        }
        Ok(None) => {
            // Return default settings if none exist
            let default_settings = WalletSettings::new(wallet_address);
            Ok(HttpResponse::Ok().json(SettingsResponse {
                settings: default_settings,
                message: "Default settings returned (no saved settings found)".to_string(),
            }))
        }
        Err(e) => {
            eprintln!("Database error getting settings: {}", e);
            Ok(HttpResponse::InternalServerError().json(ErrorResponse {
                error: "database_error".to_string(),
                message: "Failed to retrieve settings".to_string(),
            }))
        }
    }
}

/// Create or update settings for a specific wallet address
#[post("/api/settings/{wallet_address}")]
pub async fn update_settings(
    path: web::Path<WalletPath>,
    body: web::Json<SignedRequest<CreateSettingsRequest>>,
    pool: web::Data<PgPool>,
) -> Result<impl Responder> {
    let wallet_address = path.wallet_address.to_lowercase();
    let signed_request = body.into_inner();
    
    // Validate wallet address format
    if !wallet_address.starts_with("0x") || wallet_address.len() != 42 {
        return Ok(HttpResponse::BadRequest().json(ErrorResponse {
            error: "invalid_wallet_address".to_string(),
            message: "Invalid wallet address format".to_string(),
        }));
    }

    // Verify wallet signature for security
    match verify_wallet_signature(&wallet_address, &signed_request.signature, &signed_request.message) {
        Ok(true) => {},
        Ok(false) => {
            return Ok(HttpResponse::Unauthorized().json(ErrorResponse {
                error: "invalid_signature".to_string(),
                message: "Wallet signature verification failed".to_string(),
            }));
        }
        Err(e) => {
            eprintln!("Signature verification error: {}", e);
            return Ok(HttpResponse::BadRequest().json(ErrorResponse {
                error: "signature_error".to_string(),
                message: "Failed to verify wallet signature".to_string(),
            }));
        }
    }

    // Get existing settings or create new ones
    let mut settings = match get_wallet_settings(&pool, &wallet_address).await {
        Ok(Some(existing)) => existing,
        Ok(None) => WalletSettings::new(wallet_address.clone()),
        Err(e) => {
            eprintln!("Database error getting existing settings: {}", e);
            return Ok(HttpResponse::InternalServerError().json(ErrorResponse {
                error: "database_error".to_string(),
                message: "Failed to retrieve existing settings".to_string(),
            }));
        }
    };

    // Update settings with new data
    settings.update_from_request(signed_request.data);

    // Save to database
    match upsert_wallet_settings(&pool, &settings).await {
        Ok(updated_settings) => {
            Ok(HttpResponse::Ok().json(SettingsResponse {
                settings: updated_settings,
                message: "Settings updated successfully".to_string(),
            }))
        }
        Err(e) => {
            eprintln!("Database error saving settings: {}", e);
            Ok(HttpResponse::InternalServerError().json(ErrorResponse {
                error: "database_error".to_string(),
                message: "Failed to save settings".to_string(),
            }))
        }
    }
}

/// Delete all settings for a specific wallet address
#[delete("/api/settings/{wallet_address}")]
pub async fn delete_settings(
    path: web::Path<WalletPath>,
    body: web::Json<SignedRequest<serde_json::Value>>,
    pool: web::Data<PgPool>,
) -> Result<impl Responder> {
    let wallet_address = path.wallet_address.to_lowercase();
    let signed_request = body.into_inner();
    
    // Validate wallet address format
    if !wallet_address.starts_with("0x") || wallet_address.len() != 42 {
        return Ok(HttpResponse::BadRequest().json(ErrorResponse {
            error: "invalid_wallet_address".to_string(),
            message: "Invalid wallet address format".to_string(),
        }));
    }

    // Verify wallet signature for security
    match verify_wallet_signature(&wallet_address, &signed_request.signature, &signed_request.message) {
        Ok(true) => {},
        Ok(false) => {
            return Ok(HttpResponse::Unauthorized().json(ErrorResponse {
                error: "invalid_signature".to_string(),
                message: "Wallet signature verification failed".to_string(),
            }));
        }
        Err(e) => {
            eprintln!("Signature verification error: {}", e);
            return Ok(HttpResponse::BadRequest().json(ErrorResponse {
                error: "signature_error".to_string(),
                message: "Failed to verify wallet signature".to_string(),
            }));
        }
    }

    match delete_wallet_settings(&pool, &wallet_address).await {
        Ok(deleted) => {
            if deleted {
                Ok(HttpResponse::Ok().json(serde_json::json!({
                    "message": "Settings deleted successfully",
                    "wallet_address": wallet_address
                })))
            } else {
                Ok(HttpResponse::NotFound().json(ErrorResponse {
                    error: "not_found".to_string(),
                    message: "No settings found for this wallet address".to_string(),
                }))
            }
        }
        Err(e) => {
            eprintln!("Database error deleting settings: {}", e);
            Ok(HttpResponse::InternalServerError().json(ErrorResponse {
                error: "database_error".to_string(),
                message: "Failed to delete settings".to_string(),
            }))
        }
    }
}

/// Export settings as JSON for a specific wallet address
#[get("/api/settings/{wallet_address}/export")]
pub async fn export_settings(
    path: web::Path<WalletPath>,
    pool: web::Data<PgPool>,
) -> Result<impl Responder> {
    let wallet_address = path.wallet_address.to_lowercase();
    
    // Validate wallet address format
    if !wallet_address.starts_with("0x") || wallet_address.len() != 42 {
        return Ok(HttpResponse::BadRequest().json(ErrorResponse {
            error: "invalid_wallet_address".to_string(),
            message: "Invalid wallet address format".to_string(),
        }));
    }

    match get_wallet_settings(&pool, &wallet_address).await {
        Ok(Some(settings)) => {
            let export = SettingsExport {
                wallet_address: wallet_address.clone(),
                settings,
                exported_at: Utc::now(),
                version: "1.0".to_string(),
            };
            
            Ok(HttpResponse::Ok()
                .append_header(("Content-Disposition", format!("attachment; filename=\"chainflow-settings-{}.json\"", &wallet_address[..8])))
                .json(export))
        }
        Ok(None) => {
            Ok(HttpResponse::NotFound().json(ErrorResponse {
                error: "not_found".to_string(),
                message: "No settings found for this wallet address".to_string(),
            }))
        }
        Err(e) => {
            eprintln!("Database error exporting settings: {}", e);
            Ok(HttpResponse::InternalServerError().json(ErrorResponse {
                error: "database_error".to_string(),
                message: "Failed to export settings".to_string(),
            }))
        }
    }
}

/// Reset settings to defaults for a specific wallet address
#[post("/api/settings/{wallet_address}/reset")]
pub async fn reset_settings(
    path: web::Path<WalletPath>,
    body: web::Json<SignedRequest<serde_json::Value>>,
    pool: web::Data<PgPool>,
) -> Result<impl Responder> {
    let wallet_address = path.wallet_address.to_lowercase();
    let signed_request = body.into_inner();
    
    // Validate wallet address format
    if !wallet_address.starts_with("0x") || wallet_address.len() != 42 {
        return Ok(HttpResponse::BadRequest().json(ErrorResponse {
            error: "invalid_wallet_address".to_string(),
            message: "Invalid wallet address format".to_string(),
        }));
    }

    // Verify wallet signature for security
    match verify_wallet_signature(&wallet_address, &signed_request.signature, &signed_request.message) {
        Ok(true) => {},
        Ok(false) => {
            return Ok(HttpResponse::Unauthorized().json(ErrorResponse {
                error: "invalid_signature".to_string(),
                message: "Wallet signature verification failed".to_string(),
            }));
        }
        Err(e) => {
            eprintln!("Signature verification error: {}", e);
            return Ok(HttpResponse::BadRequest().json(ErrorResponse {
                error: "signature_error".to_string(),
                message: "Failed to verify wallet signature".to_string(),
            }));
        }
    }

    // Create default settings
    let default_settings = WalletSettings::new(wallet_address.clone());

    // Save default settings to database
    match upsert_wallet_settings(&pool, &default_settings).await {
        Ok(settings) => {
            Ok(HttpResponse::Ok().json(SettingsResponse {
                settings,
                message: "Settings reset to defaults successfully".to_string(),
            }))
        }
        Err(e) => {
            eprintln!("Database error resetting settings: {}", e);
            Ok(HttpResponse::InternalServerError().json(ErrorResponse {
                error: "database_error".to_string(),
                message: "Failed to reset settings".to_string(),
            }))
        }
    }
}

// Database helper functions
async fn get_wallet_settings(pool: &PgPool, wallet_address: &str) -> Result<Option<WalletSettings>, sqlx::Error> {
    // Use the database function that automatically updates last_accessed
    sqlx::query_as::<_, WalletSettings>(
        r#"
        SELECT * FROM get_wallet_settings_with_access_update($1)
        "#,
    )
    .bind(wallet_address.to_lowercase())
    .fetch_optional(pool)
    .await
}

async fn upsert_wallet_settings(pool: &PgPool, settings: &WalletSettings) -> Result<WalletSettings, sqlx::Error> {
    sqlx::query_as::<_, WalletSettings>(
        r#"
        INSERT INTO wallet_settings (
            wallet_address, display_name, email, avatar_url, bio,
            two_factor_enabled, biometric_enabled, session_timeout, ip_whitelist,
            data_sharing_enabled, analytics_enabled, marketing_emails,
            email_notifications, push_notifications, sms_notifications, trade_alerts, security_alerts,
            default_slippage, auto_approve_enabled, gas_price_preference, preferred_dex,
            theme, language, currency, timezone,
            developer_mode, beta_features, custom_rpc_urls,
            created_at, updated_at, last_accessed
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
            $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
        )
        ON CONFLICT (wallet_address) 
        DO UPDATE SET
            display_name = EXCLUDED.display_name,
            email = EXCLUDED.email,
            avatar_url = EXCLUDED.avatar_url,
            bio = EXCLUDED.bio,
            two_factor_enabled = EXCLUDED.two_factor_enabled,
            biometric_enabled = EXCLUDED.biometric_enabled,
            session_timeout = EXCLUDED.session_timeout,
            ip_whitelist = EXCLUDED.ip_whitelist,
            data_sharing_enabled = EXCLUDED.data_sharing_enabled,
            analytics_enabled = EXCLUDED.analytics_enabled,
            marketing_emails = EXCLUDED.marketing_emails,
            email_notifications = EXCLUDED.email_notifications,
            push_notifications = EXCLUDED.push_notifications,
            sms_notifications = EXCLUDED.sms_notifications,
            trade_alerts = EXCLUDED.trade_alerts,
            security_alerts = EXCLUDED.security_alerts,
            default_slippage = EXCLUDED.default_slippage,
            auto_approve_enabled = EXCLUDED.auto_approve_enabled,
            gas_price_preference = EXCLUDED.gas_price_preference,
            preferred_dex = EXCLUDED.preferred_dex,
            theme = EXCLUDED.theme,
            language = EXCLUDED.language,
            currency = EXCLUDED.currency,
            timezone = EXCLUDED.timezone,
            developer_mode = EXCLUDED.developer_mode,
            beta_features = EXCLUDED.beta_features,
            custom_rpc_urls = EXCLUDED.custom_rpc_urls,
            updated_at = EXCLUDED.updated_at,
            last_accessed = EXCLUDED.last_accessed
        RETURNING id, wallet_address, display_name, email, avatar_url, bio,
                  two_factor_enabled, biometric_enabled, session_timeout, ip_whitelist,
                  data_sharing_enabled, analytics_enabled, marketing_emails,
                  email_notifications, push_notifications, sms_notifications, trade_alerts, security_alerts,
                  default_slippage, auto_approve_enabled, gas_price_preference, preferred_dex,
                  theme, language, currency, timezone,
                  developer_mode, beta_features, custom_rpc_urls,
                  created_at, updated_at, last_accessed
        "#,
    )
    .bind(&settings.wallet_address)
    .bind(&settings.display_name)
    .bind(&settings.email)
    .bind(&settings.avatar_url)
    .bind(&settings.bio)
    .bind(settings.two_factor_enabled)
    .bind(settings.biometric_enabled)
    .bind(settings.session_timeout)
    .bind(&settings.ip_whitelist)
    .bind(settings.data_sharing_enabled)
    .bind(settings.analytics_enabled)
    .bind(settings.marketing_emails)
    .bind(settings.email_notifications)
    .bind(settings.push_notifications)
    .bind(settings.sms_notifications)
    .bind(settings.trade_alerts)
    .bind(settings.security_alerts)
    .bind(settings.default_slippage.clone())
    .bind(settings.auto_approve_enabled)
    .bind(&settings.gas_price_preference)
    .bind(&settings.preferred_dex)
    .bind(&settings.theme)
    .bind(&settings.language)
    .bind(&settings.currency)
    .bind(&settings.timezone)
    .bind(settings.developer_mode)
    .bind(settings.beta_features)
    .bind(&settings.custom_rpc_urls)
    .bind(settings.created_at)
    .bind(settings.updated_at)
    .bind(settings.last_accessed)
    .fetch_one(pool)
    .await
}

async fn delete_wallet_settings(pool: &PgPool, wallet_address: &str) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM wallet_settings WHERE wallet_address = $1")
        .bind(wallet_address)
        .execute(pool)
        .await?;
    
    Ok(result.rows_affected() > 0)
}

async fn update_last_accessed(pool: &PgPool, wallet_address: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE wallet_settings SET last_accessed = CURRENT_TIMESTAMP WHERE wallet_address = $1")
        .bind(wallet_address)
        .execute(pool)
        .await?;
    
    Ok(())
}
