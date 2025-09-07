use actix_cors::Cors;
use actix_web::{
    get, post,
    middleware::DefaultHeaders,
    web, App, HttpResponse, HttpServer, Responder,
};
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPoolOptions;
use chrono::Utc;
use uuid::Uuid;
use ethers::core::types::Signature;
use ethers::utils::hash_message;
use std::str::FromStr;

mod models;
mod handlers;
mod auth;

#[derive(Serialize)]
struct User {
    id: i32,
    name: String,
    email: String,
    wallet_address: Option<String>,
}

#[derive(Deserialize)]
struct CreateUserRequest {
    name: String,
    email: String,
    #[serde(rename = "walletAddress")]
    wallet_address: Option<String>,
}

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

#[get("/users")]
async fn get_users() -> impl Responder {
    // Mock users for demo without database
    let users = vec![
        User {
            id: 1,
            name: "Demo User".to_string(),
            email: "demo@example.com".to_string(),
            wallet_address: Some("0x742d35Cc6Cd3B7a8917fe5b3B8b3C9f5d5e5d9a".to_string()),
        }
    ];
    HttpResponse::Ok().json(users)
}

#[post("/users")]
async fn create_user(body: web::Json<CreateUserRequest>) -> impl Responder {
    let CreateUserRequest {
        name,
        email,
        wallet_address,
    } = body.into_inner();

    // Mock user creation for demo without database
    let new_user = User {
        id: chrono::Utc::now().timestamp() as i32,
        name,
        email,
        wallet_address,
    };

    HttpResponse::Ok().json(new_user)
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
        "timestamp": Utc::now().to_rfc3339()
    }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    
    // Try to connect to database
    let pool = match std::env::var("DATABASE_URL") {
        Ok(database_url) => {
            println!("🔄 Connecting to database...");
            match PgPoolOptions::new()
                .max_connections(5)
                .connect(&database_url)
                .await
            {
                Ok(pool) => {
                    println!("✅ Database connected successfully!");
                    
                    // Run migrations
                    match sqlx::migrate!("../../migrations").run(&pool).await {
                        Ok(_) => println!("✅ Database migrations completed"),
                        Err(e) => eprintln!("⚠️ Migration error: {}", e),
                    }
                    
                    Some(pool)
                }
                Err(e) => {
                    eprintln!("❌ Failed to connect to database: {}", e);
                    eprintln!("🔧 Running in mock mode without database...");
                    None
                }
            }
        }
        Err(_) => {
            eprintln!("⚠️ DATABASE_URL not set, running in mock mode...");
            None
        }
    };

    let addr = "127.0.0.1:25001";
    println!("🚀 Starting Chainflow Sentinel Backend Server");
    println!("📍 Server running on: http://{}", addr);
    println!("✅ Health check: http://{}/health", addr);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://127.0.0.1:5173")
            .allowed_origin("http://localhost:5173")
            .allowed_origin("http://127.0.0.1:5174")
            .allowed_origin("http://localhost:5174")
            .allow_any_method()
            .allow_any_header()
            .supports_credentials()
            .max_age(3600);

        let mut app = App::new()
            .wrap(DefaultHeaders::new()
                .add(("Access-Control-Allow-Origin", "*"))
                .add(("Access-Control-Allow-Headers", "*"))
                .add(("Access-Control-Allow-Methods", "*")))
            .wrap(cors)
            .service(generate_challenge)
            .service(verify_wallet)
            .service(health_check);

        // Add database-dependent routes if we have a database connection
        if let Some(ref pool) = pool {
            app = app
                .app_data(web::Data::new(pool.clone()))
                .service(get_users)
                .service(create_user)
                .service(handlers::settings::get_settings)
                .service(handlers::settings::update_settings)
                .service(handlers::settings::delete_settings)
                .service(handlers::settings::export_settings)
                .service(handlers::settings::reset_settings);
        } else {
            // Mock routes for when database is not available
            app = app
                .service(get_users)
                .service(create_user);
        }

        app
    })
    .bind(addr)?
    .run()
    .await
}
