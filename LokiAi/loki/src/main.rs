use actix_cors::Cors;
use actix_web::{
    get, post,
    middleware::DefaultHeaders,
    web, App, HttpResponse, HttpServer, Responder,
};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, FromRow, PgPool};
use chrono::Utc;
use uuid::Uuid;
use ethers::core::types::Signature;
use ethers::utils::{hash_message, to_checksum};
use std::str::FromStr;

#[derive(Serialize, FromRow)]
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
async fn get_users(db: web::Data<PgPool>) -> impl Responder {
    let result = sqlx::query_as::<_, User>(
        r#"
        SELECT id, name, email, wallet_address
        FROM users
        ORDER BY id DESC
        "#,
    )
    .fetch_all(db.get_ref())
    .await;

    match result {
        Ok(users) => HttpResponse::Ok().json(users),
        Err(e) => {
            eprintln!("DB error: {e}");
            HttpResponse::InternalServerError().body("Failed to fetch users")
        }
    }
}

#[post("/users")]
async fn create_user(db: web::Data<PgPool>, body: web::Json<CreateUserRequest>) -> impl Responder {
    let CreateUserRequest {
        name,
        email,
        wallet_address,
    } = body.into_inner();

    let result = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (name, email, wallet_address)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, wallet_address
        "#,
    )
    .bind(name)
    .bind(email)
    .bind(wallet_address)
    .fetch_one(db.get_ref())
    .await;

    match result {
        Ok(user) => HttpResponse::Ok().json(user),
        Err(e) => {
            eprintln!("DB insert error: {e}");
            // Surface constraint errors as 400
            if let Some(db_err) = e.as_database_error() {
                return HttpResponse::BadRequest().body(db_err.to_string());
            }
            HttpResponse::InternalServerError().body("Failed to create user")
        }
    }
}

#[post("/verify-wallet")]
async fn verify_wallet(body: web::Json<VerifyWalletRequest>) -> impl Responder {
    let VerifyWalletRequest {
        wallet_address,
        signature,
        message,
    } = body.into_inner();

    // Validate wallet address format
    if !wallet_address.starts_with("0x") || wallet_address.len() != 42 {
        return HttpResponse::BadRequest().json(VerifyWalletResponse {
            valid: false,
            message: "Invalid wallet address format".to_string(),
        });
    }

    // Verify the signature cryptographically
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
    // Parse the signature
    let signature = Signature::from_str(signature)?;
    
    // Hash the message using Ethereum's message signing format
    let message_hash = hash_message(message);
    
    // Recover the address from the signature
    let recovered_address = signature.recover(message_hash)?;
    
    // Convert both addresses to checksum format for comparison
    let expected_address = wallet_address.to_lowercase();
    let recovered_address_str = format!("0x{:x}", recovered_address).to_lowercase();
    
    Ok(expected_address == recovered_address_str)
}

#[post("/challenge")]
async fn generate_challenge(body: web::Json<ChallengeRequest>) -> impl Responder {
    let ChallengeRequest { wallet_address } = body.into_inner();
    
    // Generate a unique challenge message
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
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Create a connection pool
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    // Ensure users table exists (idempotent)
    if let Err(e) = sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE
        )
        "#,
    )
    .execute(&pool)
    .await
    {
        eprintln!("Warning: failed to ensure users table: {e}");
    }

    // Ensure wallet_address column exists (idempotent)
    if let Err(e) = sqlx::query(
        r#"ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(64) UNIQUE"#,
    )
    .execute(&pool)
    .await
    {
        eprintln!("Warning: failed to ensure wallet_address column: {e}");
    }

    let pool_data = web::Data::new(pool);

    let addr = ("127.0.0.1", 25000);
    println!("Starting server on http://{}:{}", addr.0, addr.1);

    HttpServer::new(move || {
        // Explicit CORS allowing the Vite dev server origin
        let cors = Cors::default()
            .allowed_origin("http://127.0.0.1:5173")
            .allowed_origin("http://localhost:5173")
            .allow_any_method()
            .allow_any_header()
            .supports_credentials()
            .max_age(3600);

        App::new()
            .app_data(pool_data.clone())
            // Ensure CORS headers are present even on error responses
            .wrap(DefaultHeaders::new()
                .add(("Access-Control-Allow-Origin", "*"))
                .add(("Access-Control-Allow-Headers", "*"))
                .add(("Access-Control-Allow-Methods", "*")))
            .wrap(cors)
            .service(get_users)
            .service(create_user)
            .service(generate_challenge)
            .service(verify_wallet)
            .service(health_check)
    })
    .bind(addr)?
    .run()
    .await
}
