use std::collections::HashMap;

use actix_web::{
    get,
    web::{self, Data, Query},
    HttpResponse, Responder,
};
use chrono::{serde::ts_seconds_option, DateTime, NaiveDate, Utc};
use itertools::Itertools;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use urlencoding::decode;

use crate::{
    utils::{modify_birthday, std_dev},
    AppState,
};

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

fn parse_ids(ids: &str) -> Result<Vec<i32>, ()> {
    decode(ids)
        .map_err(|_| ())?
        .split(',')
        .filter(|x| !x.trim().is_empty())
        .map(|x| x.parse())
        .collect::<Result<Vec<_>, _>>()
        .map_err(|_| ())
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

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HeadToHeadData {
    ids: String,
    group_id: i32,
    n: Option<i32>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HeadToHeadHistorySingle {
    id: i32,
    name: String,
    history: Vec<i32>,
}

#[get("/players/head_to_head_history")]
pub async fn head_to_head_history(
    data: Data<AppState>,
    info: Query<HeadToHeadData>,
) -> impl Responder {
    let ids: Vec<i32> = match parse_ids(&info.ids) {
        Ok(ids) => ids,
        Err(_) => return HttpResponse::BadRequest().body("Could not parse ids"),
    };

    // TODO: use LIMIT for `n`?
    let common_games = sqlx::query!(
        "SELECT game_id
        FROM game_score
        INNER JOIN game ON game.id = game_score.game_id
        WHERE player_id = ANY($1) AND game.group_id = $2
        GROUP BY game_id
        HAVING COUNT(DISTINCT player_id) = $3",
        &ids,
        info.group_id,
        ids.len() as i64,
    )
    .fetch_all(data.pg_pool.as_ref())
    .await
    .unwrap()
    .iter()
    .map(|x| x.game_id)
    .collect_vec();

    let player_games = sqlx::query!(
        "SELECT      
            game_score.player_id as player_id,
            player.name as player_name,
            game_score.score as points,
            player.birthday as player_birthday
        FROM game_score
        INNER JOIN player
	        ON player.id = game_score.player_id
        INNER JOIN game
            ON game.id = game_score.game_id
        WHERE player.id = ANY($1) AND game_id = ANY($2)
        ORDER BY date DESC",
        &ids,
        &common_games
    )
    .fetch_all(data.pg_pool.as_ref())
    .await
    .unwrap();

    let mut players: HashMap<i32, HeadToHeadHistorySingle> = HashMap::with_capacity(2);

    for game in player_games {
        let player = players
            .entry(game.player_id)
            .or_insert(HeadToHeadHistorySingle {
                id: game.player_id,
                name: game.player_name,
                history: Vec::new(),
            });

        if let Some(n) = info.n {
            if player.history.len() as i32 >= n {
                continue;
            }
        }

        player.history.push(game.points);
    }

    let mut response = players
        .into_values()
        .map(|x| HeadToHeadHistorySingle {
            history: x.history.into_iter().rev().collect_vec(),
            ..x
        })
        .collect_vec();
    response.sort_by(|a, b| a.id.cmp(&b.id));
    HttpResponse::Ok().json(response)
}

#[get("/players/head_to_head")]
pub async fn head_to_head(data: Data<AppState>, info: Query<HeadToHeadData>) -> impl Responder {
    let ids: Vec<i32> = match parse_ids(&info.ids) {
        Ok(ids) => ids,
        Err(_) => return HttpResponse::BadRequest().body("Could not parse ids"),
    };

    let common_games = sqlx::query!(
        "SELECT game_id
        FROM game_score
        INNER JOIN game ON game.id = game_score.game_id
        WHERE player_id = ANY($1) AND game.group_id = $2
        GROUP BY game_id
        HAVING COUNT(DISTINCT player_id) = $3",
        &ids,
        info.group_id,
        ids.len() as i64,
    )
    .fetch_all(data.pg_pool.as_ref())
    .await
    .unwrap()
    .iter()
    .map(|x| x.game_id)
    .collect_vec();

    let player_games = sqlx::query!(
        r#"SELECT
            game_score.player_id as player_id,
            game_score.game_id as game_id, 
            player.name as player_name,
            player.birthday as "birthday!: Option<NaiveDate>",
            game_score.score as points
        FROM game_score
        INNER JOIN player
	        ON player.id = game_score.player_id
        INNER JOIN game
            ON game.id = game_score.game_id
        WHERE player.id = ANY($1) AND game_id = ANY($2)
        ORDER BY date DESC"#,
        &ids,
        &common_games
    )
    .fetch_all(data.pg_pool.as_ref())
    .await
    .unwrap();

    // Highest score for each game
    let games = sqlx::query!(
        "SELECT game.id, MAX(game_score.score) as max_score
        FROM game
        INNER JOIN game_score ON game.id = game_score.game_id
        GROUP BY game.id"
    )
    .fetch_all(data.pg_pool.as_ref())
    .await
    .unwrap();

    let games: HashMap<_, _> = games.iter().map(|g| (g.id, g.max_score.unwrap())).collect();

    // Player ID to stats
    let mut players: HashMap<i32, PlayerStats> = HashMap::new();
    for player_game in player_games {
        let player = players.entry(player_game.player_id).or_insert(PlayerStats {
            id: player_game.player_id,
            name: modify_birthday(&player_game.player_name, &player_game.birthday),
            points: 0,
            wins: 0,
            games: 0,
            std_dev: 0.0,
        });

        // Skip if already got the n games
        if let Some(n) = info.n {
            if player.games >= n {
                continue;
            }
        }

        if games.get(&player_game.game_id).unwrap() == &player_game.points {
            player.wins += 1;
        }

        player.games += 1;
        player.points += player_game.points;
        player.std_dev += player_game.points.pow(2) as f32; // Sum squared
    }

    let values = players
        .into_values()
        .map(|p| PlayerStats {
            std_dev: std_dev(p.points as f32, p.std_dev as f32, p.games),
            ..p
        })
        .collect_vec();

    HttpResponse::Ok().json(values)
}
