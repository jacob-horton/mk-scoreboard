use std::sync::Arc;

use actix_cors::Cors;
use actix_web::{http, web::Data, App, HttpServer};
use routes::players::{add_game, get_player_stats, list_players};
use sqlx::{postgres::PgPoolOptions, Pool, Postgres};

mod routes;

#[derive(Clone, Debug)]
pub struct AppState {
    pg_pool: Arc<Pool<Postgres>>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let pg_pool = Arc::new(
        PgPoolOptions::new()
            .max_connections(5)
            .connect("postgres://username:password@localhost/mario_kart")
            .await
            .unwrap(),
    );

    HttpServer::new(move || {
        // TODO: properly configure cors
        let cors = Cors::default()
            .allow_any_origin()
            .allowed_methods(vec!["GET", "POST"])
            .allowed_header(http::header::CONTENT_TYPE);

        let state = AppState {
            pg_pool: pg_pool.clone(),
        };

        App::new()
            .app_data(Data::new(state))
            .wrap(cors)
            .service(get_player_stats)
            .service(list_players)
            .service(add_game)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
