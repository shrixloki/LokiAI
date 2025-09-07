use actix_web::{get, App, HttpServer, Responder};
use sqlx::postgres::PgPoolOptions;
use dotenv::dotenv;
use std::env;

#[get("/")]
async fn hello() -> impl Responder {
    "Hello from Cross-Chain AI Backend!"
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    println!("Connected to the database!");
    println!("Starting server at http://.bind("127.0.0.1:25000")?");

    HttpServer::new(|| App::new().service(hello))
        .bind("127.0.0.1:25000")?

  // Check if bind returns error
        .run()
        .await
}

