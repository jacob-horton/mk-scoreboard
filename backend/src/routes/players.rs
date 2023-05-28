use std::collections::HashMap;

use actix_web::{
    get,
    web::{Data, Query},
    HttpResponse, Responder,
};
use itertools::Itertools;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use urlencoding::decode;

use crate::{utils::modify_birthday, AppState};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
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

async fn get_history(pool: &PgPool, id: i32, group_id: i32, n: Option<i64>) -> Vec<i32> {
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

#[get("/players/history")]
pub async fn player_history(data: Data<AppState>, info: Query<HistoryData>) -> impl Responder {
    HttpResponse::Ok().json(get_history(&data.pg_pool, info.id, info.group_id, info.n).await)
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Badges {
    star: usize,
    gold: usize,
    silver: usize,
    bronze: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GetBadgesData {
    ids: String,
    group_id: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BadgesWithId {
    id: i32,
    badges: Badges,
}

struct NoMaxScoreErr;

async fn get_badges(
    pool: &PgPool,
    group_id: i32,
    ids: &[i32],
) -> Result<Vec<BadgesWithId>, NoMaxScoreErr> {
    let max_score = sqlx::query!("SELECT max_score FROM grp WHERE id = $1", group_id)
        .fetch_one(pool)
        .await
        .unwrap()
        .max_score;

    let mut all_badges = Vec::with_capacity(ids.len());
    for id in ids {
        let scores = get_history(pool, *id, group_id, None).await;

        // TODO: find correct response for error
        let max_score = match max_score {
            Some(n) => n,
            None => return Err(NoMaxScoreErr),
        } as f32;

        let mut badges: Badges = Default::default();

        let star_score = max_score;
        let gold_score = 0.94 * max_score;
        let silver_score = 0.88 * max_score;
        let bronze_score = 0.83 * max_score;

        for score in scores {
            let score = score as f32;
            if score >= star_score {
                badges.star += 1;
            } else if score >= gold_score {
                badges.gold += 1;
            } else if score >= silver_score {
                badges.silver += 1;
            } else if score >= bronze_score {
                badges.bronze += 1;
            }
        }

        all_badges.push(BadgesWithId { badges, id: *id });
    }

    Ok(all_badges)
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

#[get("/players/badges")]
pub async fn player_badges(data: Data<AppState>, info: Query<GetBadgesData>) -> impl Responder {
    let ids: Vec<i32> = match parse_ids(&info.ids) {
        Ok(ids) => ids,
        Err(_) => return HttpResponse::BadRequest().body("Could not parse ids"),
    };

    let badges = get_badges(data.pg_pool.as_ref(), info.group_id, &ids).await;
    match badges {
        Ok(badges) => HttpResponse::Ok().json(badges),
        Err(_) => {
            HttpResponse::BadRequest().body("Group does not have max score, so cannot have badges")
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlayerIdData {
    id: i32,
}

#[get("/players/name")]
pub async fn player_name(data: Data<AppState>, info: Query<PlayerIdData>) -> impl Responder {
    let player = sqlx::query!(
        "SELECT name, birthday
        FROM player
        WHERE player.id = $1",
        info.id,
    )
    .fetch_one(data.pg_pool.as_ref())
    .await
    .unwrap();

    let name = modify_birthday(&player.name, &player.birthday);
    HttpResponse::Ok().json(name)
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
            game_score.score as points
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
        "SELECT      
            game_score.player_id as player_id,
            game_score.game_id as game_id, 
            player.name as player_name,
            player.birthday as birthday,
            game_score.score as points
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
        let mut player = players.entry(player_game.player_id).or_insert(PlayerStats {
            id: player_game.player_id,
            name: modify_birthday(&player_game.player_name, &player_game.birthday),
            points: 0,
            wins: 0,
            games: 0,
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
    }

    HttpResponse::Ok().json(players.values().collect_vec())
}
