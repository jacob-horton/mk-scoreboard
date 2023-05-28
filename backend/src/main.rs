use std::{env, sync::Arc};

use actix_cors::Cors;
use actix_web::{http, web::Data, App, HttpServer};
use routes::games::{add_game, get_previous_players};
use routes::groups::{get_group, get_group_stats, list_groups, list_players};
use routes::players::{
    head_to_head, head_to_head_history, player_badges, player_history, player_name,
};
use sqlx::{postgres::PgPoolOptions, Pool, Postgres};

mod routes;
mod utils;

#[derive(Clone, Debug)]
pub struct AppState {
    pg_pool: Arc<Pool<Postgres>>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    let db_url = env::var("DATABASE_URL").unwrap();
    let pg_pool = Arc::new(
        PgPoolOptions::new()
            .max_connections(5)
            .connect(&db_url)
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
            .service(list_players)
            .service(add_game)
            .service(get_previous_players)
            .service(get_group_stats)
            .service(list_groups)
            .service(get_group)
            .service(player_history)
            .service(player_name)
            .service(player_badges)
            .service(head_to_head)
            .service(head_to_head_history)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
