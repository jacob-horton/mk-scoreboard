use actix_web::{
    post,
    web::{self, Data},
    HttpResponse, Responder,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

pub async fn is_authorised(token: &str) -> bool {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(include_bytes!("../jwt_secret.dat")),
        &Validation::default(),
    )
    .is_ok()
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AuthData {
    name: String,
    password: String,
}

#[post("/auth")]
pub async fn login(data: Data<AppState>, info: web::Json<AuthData>) -> impl Responder {
    let password_hash = sqlx::query_scalar!(
        "SELECT password_hash FROM admin_user WHERE username = $1;",
        info.name
    )
    .fetch_one(data.pg_pool.as_ref())
    .await;

    let Ok(password_hash) = password_hash else {
        return HttpResponse::Unauthorized().body("Invalid credentials");
    };

    if !bcrypt::verify(&info.password, &password_hash).unwrap_or(false) {
        return HttpResponse::Unauthorized().body("Invalid credentials");
    }

    // 5 years into future
    let ages_away = (Utc::now() + Duration::days(5 * 365)).timestamp();

    let claims = Claims {
        sub: info.name.clone(),
        exp: ages_away as usize,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(include_bytes!("../jwt_secret.dat")),
    )
    .unwrap();

    HttpResponse::Ok().body(token)
}
