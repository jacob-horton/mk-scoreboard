use actix_web::{
    get,
    web::{self, Data, Query},
    HttpResponse, Responder,
};
use chrono::{serde::ts_seconds_option, DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::{utils::modify_birthday, AppState};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlayerStats {
    pub id: i32,
    pub name: String,
    pub wins: i32,
    pub points: i32,
    pub games: i32,
    pub std_dev: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Player {
    pub id: i32,
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HistoryData {
    group_id: i32,
    n: Option<usize>,
}

pub async fn get_player_history(pool: &PgPool, id: i32, group_id: i32, n: Option<i64>) -> Vec<i32> {
    sqlx::query!(
        "SELECT game_score.score
        FROM player
        INNER JOIN game_score
            ON game_score.player_id = player.id
        INNER JOIN game
            ON game_score.game_id = game.id
        WHERE player.id = $1 AND game.group_id = $2
        ORDER BY date DESC
        LIMIT $3",
        id,
        group_id,
        n,
    )
    .fetch_all(pool)
    .await
    .unwrap()
    .into_iter()
    .map(|x| x.score)
    .rev()
    .collect()
}

#[get("/player/{player_id}/history")]
pub async fn player_history(
    data: Data<AppState>,
    info: Query<HistoryData>,
    path: web::Path<i32>,
) -> impl Responder {
    let player_id = path.into_inner();
    HttpResponse::Ok().json(
        get_player_history(
            &data.pg_pool,
            player_id,
            info.group_id,
            info.n.map(|n| n as i64),
        )
        .await,
    )
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StreakResponse {
    scores: Vec<i32>,
    avg: f32,
    std_dev: f32,
}

#[get("/player/{player_id}/best_streak")]
pub async fn player_best_streak(
    data: Data<AppState>,
    info: Query<HistoryData>,
    path: web::Path<i32>,
) -> impl Responder {
    let player_id = path.into_inner();
    let scores = sqlx::query!(
        "SELECT game_score.score
        FROM player
        INNER JOIN game_score
            ON game_score.player_id = player.id
        INNER JOIN game
            ON game_score.game_id = game.id
        WHERE player.id = $1 AND game.group_id = $2
        ORDER BY date ASC",
        player_id,
        info.group_id,
    )
    .fetch_all(data.pg_pool.as_ref())
    .await
    .unwrap()
    .into_iter()
    .map(|x| x.score)
    .collect::<Vec<_>>();

    let streak = match info.n {
        None => scores,
        Some(n) => {
            let windows = scores.windows(n as usize);
            windows
                .max_by(|w1, w2| w1.iter().sum::<i32>().cmp(&w2.iter().sum::<i32>()))
                .unwrap()
                .to_vec()
        }
    };

    if streak.len() == 0 {
        return HttpResponse::Ok().json(StreakResponse {
            scores: Vec::new(),
            avg: 0.0,
            std_dev: 0.0,
        });
    }

    let avg = streak.iter().sum::<i32>() as f32 / streak.len() as f32;
    let std_dev = (streak
        .iter()
        .map(|x| (*x as f32 - avg).powi(2))
        .sum::<f32>() as f32
        / streak.len() as f32)
        .sqrt();

    let streak_resp = StreakResponse {
        scores: streak,
        avg,
        std_dev,
    };

    HttpResponse::Ok().json(streak_resp)
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlayerData {
    name: String,
    #[serde(with = "ts_seconds_option")]
    birthday: Option<DateTime<Utc>>,
}

#[get("/player/{player_id}")]
pub async fn player_name(data: Data<AppState>, path: web::Path<i32>) -> impl Responder {
    let player_id = path.into_inner();
    let player = sqlx::query!(
        r#"SELECT name, birthday as "birthday!: Option<NaiveDate>"
        FROM player
        WHERE player.id = $1"#,
        player_id,
    )
    .fetch_one(data.pg_pool.as_ref())
    .await
    .unwrap();

    let name = modify_birthday(&player.name, &player.birthday);
    let player_data = PlayerData {
        name,
        birthday: None,
    };
    HttpResponse::Ok().json(player_data)
}
