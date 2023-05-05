use actix_web::{
    get,
    web::{Data, Query},
    HttpResponse, Responder,
};
use serde::{Deserialize, Serialize};

use crate::AppState;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PlayerStats {
    pub id: i32,
    pub name: String,
    pub wins: i32,
    pub points: i32,
    pub games: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Player {
    pub id: i32,
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HistoryData {
    id: i32,
    group_id: i32,
    n: Option<i64>,
}

#[get("/players/history")]
pub async fn player_history(data: Data<AppState>, info: Query<HistoryData>) -> impl Responder {
    let history = sqlx::query!(
        "SELECT game_score.score
        FROM player
        INNER JOIN game_score
            ON game_score.player_id = player.id
        INNER JOIN game
            ON game_score.game_id = game.id
        WHERE player.id = $1 AND game.group_id = $2
        LIMIT $3",
        info.id,
        info.group_id,
        info.n,
    )
    .fetch_all(data.pg_pool.as_ref())
    .await
    .unwrap();

    HttpResponse::Ok().json(history.into_iter().map(|x| x.score).collect::<Vec<_>>())
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlayerIdData {
    id: i32,
}

#[get("/players/name")]
pub async fn player_name(data: Data<AppState>, info: Query<PlayerIdData>) -> impl Responder {
    let player = sqlx::query!(
        "SELECT name
        FROM player
        WHERE player.id = $1",
        info.id,
    )
    .fetch_one(data.pg_pool.as_ref())
    .await
    .unwrap();

    HttpResponse::Ok().json(player.name)
}
