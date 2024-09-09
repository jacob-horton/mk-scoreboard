use actix_web::{
    delete, get,
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
    sid: String,
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

fn generate_refresh_token(user_id: i32, sid: Uuid) -> String {
    // 5 year expiry
    let exp = (Utc::now() + Duration::days(5 * 365)).timestamp();

    // Not before 4 minutes (access token expires in 5, don't want spam before then)
    let nbf = (Utc::now() + Duration::minutes(4)).timestamp();

    let claims = Claims {
        sub: user_id.to_string(),
        sid: sid.to_string(),
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

fn generate_access_token(name: &str, sid: Uuid) -> String {
    // 5 mins expiry
    let exp = (Utc::now() + Duration::minutes(5)).timestamp();

    let claims = Claims {
        sub: name.to_string(),
        nbf: Utc::now().timestamp(),
        token_type: TokenType::Access,
        sid: sid.to_string(),
        exp,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(include_bytes!("../jwt_secret.dat")),
    )
    .unwrap()
}

async fn create_session(pool: &PgPool, user_id: i32) -> Uuid {
    let sid = Uuid::new_v4();

    sqlx::query!(
        "INSERT INTO admin_session (id, user_id) VALUES ($1, $2)",
        sid,
        user_id,
    )
    .execute(pool)
    .await
    .unwrap();

    return sid;
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

    let sid = create_session(data.pg_pool.as_ref(), admin_user.id).await;
    let access_token = generate_access_token(&info.name, sid);
    let refresh_token = generate_refresh_token(admin_user.id, sid);

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

    let sid: Uuid = Uuid::parse_str(&token.claims.sid).unwrap();
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

    let access_token = generate_access_token(&user_name, sid);

    HttpResponse::Ok()
        .content_type(ContentType::plaintext())
        .body(access_token)
}

#[delete("/auth")]
pub async fn delete_session(data: Data<AppState>, auth: BearerAuth) -> impl Responder {
    let token = decode::<Claims>(
        auth.token(),
        &DecodingKey::from_secret(include_bytes!("../jwt_secret.dat")),
        &Validation::default(),
    );

    let Ok(token) = token else {
        return HttpResponse::Unauthorized()
            .content_type(ContentType::plaintext())
            .body("Invalid token");
    };

    let sid: Uuid = Uuid::parse_str(&token.claims.sid).unwrap();
    sqlx::query!(r#"DELETE FROM admin_session WHERE id = $1"#, sid)
        .execute(data.pg_pool.as_ref())
        .await
        .unwrap();

    HttpResponse::NoContent().finish()
}
