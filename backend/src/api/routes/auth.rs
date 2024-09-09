use actix_web::{
    get,
    http::header::ContentType,
    post,
    web::{self, Data},
    HttpResponse, Responder,
};
use actix_web_httpauth::extractors::bearer::BearerAuth;
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::AppState;

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
enum TokenType {
    Refresh,
    Access,
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: i64,
    nbf: i64,
    sid: Option<String>,
    token_type: TokenType,
}

pub async fn is_authorised(token: &str) -> bool {
    match decode::<Claims>(
        token,
        &DecodingKey::from_secret(include_bytes!("../jwt_secret.dat")),
        &Validation::default(),
    ) {
        Ok(token) => token.claims.token_type == TokenType::Access,
        Err(_) => false,
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AuthData {
    name: String,
    password: String,
}

async fn generate_refresh_token(pool: &PgPool, user_id: i32) -> String {
    // 5 year expiry
    let exp = (Utc::now() + Duration::days(5 * 365)).timestamp();

    // Not before 4 minutes (access token expires in 5, don't want spam before then)
    let nbf = (Utc::now() + Duration::minutes(4)).timestamp();

    let sid = Uuid::new_v4();

    sqlx::query!(
        "INSERT INTO admin_session (id, user_id) VALUES ($1, $2)",
        sid,
        user_id,
    )
    .execute(pool)
    .await
    .unwrap();

    let claims = Claims {
        sub: user_id.to_string(),
        sid: Some(sid.to_string()),
        token_type: TokenType::Refresh,
        nbf,
        exp,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(include_bytes!("../jwt_secret.dat")),
    )
    .unwrap()
}

fn generate_access_token(name: &str) -> String {
    // 5 mins expiry
    let exp = (Utc::now() + Duration::minutes(5)).timestamp();

    let claims = Claims {
        sub: name.to_string(),
        nbf: Utc::now().timestamp(),
        token_type: TokenType::Access,
        sid: None,
        exp,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(include_bytes!("../jwt_secret.dat")),
    )
    .unwrap()
}

#[derive(Debug, Serialize, Deserialize)]
struct AuthResponse {
    access_token: String,
    refresh_token: String,
}

#[post("/auth")]
pub async fn login(data: Data<AppState>, info: web::Json<AuthData>) -> impl Responder {
    let admin_user = sqlx::query!(
        "SELECT id, password_hash FROM admin_user WHERE username = $1;",
        info.name
    )
    .fetch_one(data.pg_pool.as_ref())
    .await;

    let Ok(admin_user) = admin_user else {
        return HttpResponse::Unauthorized()
            .content_type(ContentType::plaintext())
            .body("Invalid credentials");
    };

    if !bcrypt::verify(&info.password, &admin_user.password_hash).unwrap_or(false) {
        return HttpResponse::Unauthorized()
            .content_type(ContentType::plaintext())
            .body("Invalid credentials");
    }

    let access_token = generate_access_token(&info.name);
    let refresh_token = generate_refresh_token(data.pg_pool.as_ref(), admin_user.id).await;

    let resp = AuthResponse {
        access_token,
        refresh_token,
    };

    HttpResponse::Ok().json(resp)
}

#[get("/auth/refresh")]
pub async fn refresh_auth_token(data: Data<AppState>, auth: BearerAuth) -> impl Responder {
    let token = decode::<Claims>(
        auth.token(),
        &DecodingKey::from_secret(include_bytes!("../jwt_secret.dat")),
        &Validation::default(),
    );

    let Ok(token) = token else {
        return HttpResponse::Unauthorized()
            .content_type(ContentType::plaintext())
            .body("Invalid refresh token");
    };

    let sid: String = token.claims.sid.unwrap();
    let sid: Uuid = Uuid::parse_str(&sid).unwrap();
    let user_name = sqlx::query_scalar!(
        r#"SELECT admin_user.username
        FROM admin_session
        LEFT JOIN admin_user
        ON admin_user.id = admin_session.user_id
        WHERE admin_session.id = $1;"#,
        sid
    )
    .fetch_one(data.pg_pool.as_ref())
    .await;

    let Ok(user_name) = user_name else {
        return HttpResponse::Unauthorized()
            .content_type(ContentType::plaintext())
            .body("Session expired");
    };

    let access_token = generate_access_token(&user_name);

    HttpResponse::Ok()
        .content_type(ContentType::plaintext())
        .body(access_token)
}
