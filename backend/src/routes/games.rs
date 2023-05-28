use std::collections::{HashMap, HashSet};

use actix_web::{
    get,
    http::Error,
    post,
    web::{self, Data, Query},
    HttpResponse, Responder,
};
use itertools::Itertools;
use serde::{Deserialize, Serialize};

use crate::{utils::is_birthday, AppState};

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
    let mut transaction = data.pg_pool.begin().await.unwrap();
    sqlx::query!("INSERT INTO game (group_id) VALUES ($1);", payload.group_id)
        .execute(&mut transaction)
        .await
        .unwrap();

    let birthdays = sqlx::query!(
        "SELECT id, birthday FROM player WHERE id = ANY($1)",
        &payload.scores.iter().map(|x| x.player_id).collect_vec()
    )
    .fetch_all(data.pg_pool.as_ref())
    .await
    .unwrap();

    let mut tenx_multipliers = HashSet::new();
    for birthday in birthdays {
        if is_birthday(&birthday.birthday) {
            tenx_multipliers.insert(birthday.id);
        }
    }

    let game_id = sqlx::query!("SELECT currval(pg_get_serial_sequence('game','id')) as id;")
        .fetch_one(&mut transaction)
        .await
        .unwrap()
        .id
        .unwrap();

    for score in &payload.scores {
        let multiplier = if tenx_multipliers.contains(&score.player_id) {
            10
        } else {
            1
        };

        sqlx::query!(
            "INSERT INTO game_score (score, game_id, player_id) VALUES ($1, $2, $3)",
            score.score * multiplier,
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
