use actix_web::{
    get,
    http::Error,
    post,
    web::{self, Data, Query},
    HttpResponse, Responder,
};
use serde::{Deserialize, Serialize};

use crate::AppState;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Game {
    scores: Vec<GameScore>,
    group_id: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GameScore {
    player_id: i32,
    score: i32,
}

#[post("/game/add")]
pub async fn add_game(
    data: Data<AppState>,
    payload: web::Json<Game>,
) -> Result<HttpResponse, Error> {
    println!("{data:?}");
    let mut transaction = data.pg_pool.begin().await.unwrap();
    sqlx::query!("INSERT INTO game (group_id) VALUES ($1);", payload.group_id)
        .execute(&mut transaction)
        .await
        .unwrap();

    let game_id = sqlx::query!("SELECT currval(pg_get_serial_sequence('game','id')) as id;")
        .fetch_one(&mut transaction)
        .await
        .unwrap()
        .id
        .unwrap();

    for score in &payload.scores {
        sqlx::query!(
            "INSERT INTO game_score (score, game_id, player_id) VALUES ($1, $2, $3)",
            score.score,
            game_id as i32,
            score.player_id,
        )
        .execute(&mut transaction)
        .await
        .unwrap();
    }

    transaction.commit().await.unwrap();

    Ok(HttpResponse::Ok().body("Game added successfully"))
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GroupIdData {
    group_id: i32,
}

#[get("/game/previous_players")]
pub async fn get_previous_players(
    data: Data<AppState>,
    info: Query<GroupIdData>,
) -> impl Responder {
    let players = sqlx::query!(
        "SELECT player_id
        FROM game
        INNER JOIN game_score
            ON game.id = game_score.game_id
        WHERE group_id = $1
        ORDER BY date DESC
        LIMIT 4",
        info.group_id
    )
    .fetch_all(data.pg_pool.as_ref())
    .await
    .unwrap();

    let player_ids: Vec<_> = players.iter().map(|p| p.player_id).collect();
    HttpResponse::Ok().json(player_ids)
}
