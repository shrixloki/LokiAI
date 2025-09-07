use actix_cors::Cors;
use actix_web::{
    get, post,
    middleware::DefaultHeaders,
    web, App, HttpResponse, HttpServer, Responder,
};
use serde::{Deserialize, Serialize};
use chrono::Utc;
use uuid::Uuid;
use ethers::core::types::Signature;
use ethers::utils::hash_message;
use std::str::FromStr;

#[derive(Deserialize)]
struct ChallengeRequest {
    #[serde(rename = "walletAddress")]
    wallet_address: String,
}

#[derive(Serialize)]
struct ChallengeResponse {
    message: String,
}

#[derive(Deserialize)]
struct VerifyWalletRequest {
    #[serde(rename = "walletAddress")]
    wallet_address: String,
    signature: String,
    message: String,
}

#[derive(Serialize)]
struct VerifyWalletResponse {
    valid: bool,
    message: String,
}

#[post("/verify-wallet")]
async fn verify_wallet(body: web::Json<VerifyWalletRequest>) -> impl Responder {
    let VerifyWalletRequest {
        wallet_address,
        signature,
        message,
    } = body.into_inner();

    if !wallet_address.starts_with("0x") || wallet_address.len() != 42 {
        return HttpResponse::BadRequest().json(VerifyWalletResponse {
            valid: false,
            message: "Invalid wallet address format".to_string(),
        });
    }

    match verify_ethereum_signature(&wallet_address, &signature, &message) {
        Ok(true) => HttpResponse::Ok().json(VerifyWalletResponse {
            valid: true,
            message: "Wallet signature verified successfully".to_string(),
        }),
        Ok(false) => HttpResponse::BadRequest().json(VerifyWalletResponse {
            valid: false,
            message: "Invalid signature - wallet ownership verification failed".to_string(),
        }),
        Err(e) => {
            eprintln!("Signature verification error: {}", e);
            HttpResponse::BadRequest().json(VerifyWalletResponse {
                valid: false,
                message: format!("Signature verification failed: {}", e),
            })
        }
    }
}

fn verify_ethereum_signature(
    wallet_address: &str,
    signature: &str,
    message: &str,
) -> Result<bool, Box<dyn std::error::Error>> {
    let signature = Signature::from_str(signature)?;
    let message_hash = hash_message(message);
    let recovered_address = signature.recover(message_hash)?;
    let expected_address = wallet_address.to_lowercase();
    let recovered_address_str = format!("0x{:x}", recovered_address).to_lowercase();
    Ok(expected_address == recovered_address_str)
}

#[post("/challenge")]
async fn generate_challenge(body: web::Json<ChallengeRequest>) -> impl Responder {
    let ChallengeRequest { wallet_address } = body.into_inner();
    
    let timestamp = Utc::now().timestamp();
    let message = format!(
        "Please sign this message to verify your wallet ownership.\n\nWallet: {}\nTimestamp: {}\nNonce: {}",
        wallet_address,
        timestamp,
        Uuid::new_v4().to_string()[..8].to_string()
    );
    
    HttpResponse::Ok().json(ChallengeResponse { message })
}

#[get("/health")]
async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "timestamp": Utc::now().to_rfc3339(),
        "message": "Backend server is running without database"
    }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let addr = "127.0.0.1:25001";
    println!("🚀 Starting Chainflow Sentinel Backend Server");
    println!("📍 Server running on: http://{}", addr);
    println!("🔧 Mode: Standalone (no database required)");
    println!("✅ Health check: http://{}/health", addr);

    HttpServer::new(|| {
        let cors = Cors::default()
            .allowed_origin("http://127.0.0.1:5173")
            .allowed_origin("http://localhost:5173")
            .allowed_origin("http://127.0.0.1:5174")
            .allowed_origin("http://localhost:5174")
            .allow_any_method()
            .allow_any_header()
            .supports_credentials()
            .max_age(3600);

        App::new()
            .wrap(DefaultHeaders::new()
                .add(("Access-Control-Allow-Origin", "*"))
                .add(("Access-Control-Allow-Headers", "*"))
                .add(("Access-Control-Allow-Methods", "*")))
            .wrap(cors)
            .service(generate_challenge)
            .service(verify_wallet)
            .service(health_check)
    })
    .bind(addr)?
    .run()
    .await
}
