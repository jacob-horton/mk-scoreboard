use std::{env, sync::Arc};

use actix_cors::Cors;
use actix_web::{http, web::Data, App, HttpServer};
use routes::games::{add_game, get_previous_players};
use routes::groups::{
    add_player_to_group, create_group, get_group, get_group_badges, get_group_stats, head_to_head,
    list_groups, list_players, remove_player_from_group,
};
use routes::players::{
    create_player, list_all_players, player_best_streak, player_history, player_name,
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
            .allowed_methods(vec!["GET", "POST", "DELETE"])
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
            .service(create_group)
            .service(player_history)
            .service(player_name)
            .service(create_player)
            .service(get_group_badges)
            .service(player_best_streak)
            .service(head_to_head)
            .service(list_all_players)
            .service(add_player_to_group)
            .service(remove_player_from_group)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
