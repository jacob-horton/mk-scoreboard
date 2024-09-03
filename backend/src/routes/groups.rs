use std::collections::HashMap;

use actix_web::{
    get,
    web::{self, Data, Path, Query},
    HttpResponse, Responder,
};
use chrono::NaiveDate;
use itertools::Itertools;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use urlencoding::decode;

use crate::{
    routes::players::{Player, PlayerStats},
    utils::{modify_birthday, std_dev},
    AppState,
};

use super::players::get_player_history;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
struct Group {
    id: i32,
    name: String,
    max_score: Option<i32>,
    archived: bool,
}

#[get("/groups")]
pub async fn list_groups(data: Data<AppState>) -> impl Responder {
    let groups = sqlx::query!("SELECT * FROM grp")
        .fetch_all(data.pg_pool.as_ref())
        .await
        .unwrap();

    let groups: Vec<_> = groups
        .iter()
        .map(|g| Group {
            id: g.id,
            name: g.name.to_string(),
            max_score: g.max_score,
            archived: g.archived,
        })
        .collect();
    HttpResponse::Ok().json(groups)
}

#[get("/group/{group_id}")]
pub async fn get_group(data: Data<AppState>, path: web::Path<i32>) -> impl Responder {
    let group_id = path.into_inner();
    let group = sqlx::query!("SELECT * FROM grp WHERE id = $1", group_id)
        .fetch_one(data.pg_pool.as_ref())
        .await
        .unwrap();

    HttpResponse::Ok().json(Group {
        id: group.id,
        name: group.name.to_string(),
        max_score: group.max_score,
        archived: group.archived,
    })
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GetStatsData {
    n: Option<i32>, // Number of games
    skip_most_recent: bool,
}

#[get("/group/{group_id}/stats")]
pub async fn get_group_stats(
    data: Data<AppState>,
    info: web::Query<GetStatsData>,
    path: web::Path<i32>,
) -> impl Responder {
    let group_id = path.into_inner();

    // Players in group
    let player_games = sqlx::query!(
        r#"SELECT
            game_score.player_id as player_id,
            game_score.game_id as game_id, 
            player.name as player_name,
            player.birthday as "birthday!: Option<NaiveDate>",
            game_score.score as points
        FROM player
        INNER JOIN game_score ON game_score.player_id = player.id
        INNER JOIN game ON game_score.game_id = game.id
        WHERE game.group_id = $1
        ORDER BY date DESC"#,
        group_id,
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

    let most_recent_id = match info.skip_most_recent {
        true => sqlx::query!(
            "SELECT game.id FROM game WHERE game.group_id = $1 ORDER BY date DESC LIMIT 1",
            group_id,
        )
        .fetch_one(data.pg_pool.as_ref())
        .await
        .ok()
        .map(|x| x.id),
        false => None,
    };

    // Player ID to stats
    let mut players: HashMap<i32, PlayerStats> = HashMap::new();
    for player_game in player_games {
        if let Some(id) = most_recent_id {
            if player_game.game_id == id {
                continue;
            }
        }

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

#[get("/group/{group_id}/players")]
pub async fn list_players(data: Data<AppState>, path: web::Path<i32>) -> impl Responder {
    let group_id = path.into_inner();

    let players = sqlx::query!(
        r#"SELECT player.id as id, name, birthday as "birthday!: Option<NaiveDate>"
        FROM player
        INNER JOIN player_group
            ON player.id = player_group.player_id
        WHERE group_id = $1"#,
        group_id,
    )
    .fetch_all(data.pg_pool.as_ref())
    .await
    .unwrap();

    HttpResponse::Ok().json(
        players
            .into_iter()
            .map(|p| Player {
                name: modify_birthday(&p.name, &p.birthday),
                id: p.id,
            })
            .collect::<Vec<_>>(),
    )
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
pub struct BadgesWithId {
    id: i32,
    badges: Badges,
}

struct NoMaxScoreErr;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GetBadgesData {
    ids: String,
    group_id: i32,
}

async fn get_badges(pool: &PgPool, group_id: i32) -> Result<Vec<BadgesWithId>, NoMaxScoreErr> {
    let max_score = sqlx::query!("SELECT max_score FROM grp WHERE id = $1", group_id)
        .fetch_one(pool)
        .await
        .unwrap()
        .max_score;

    let player_ids = sqlx::query_scalar!(
        "SELECT player_id FROM player_group WHERE group_id = $1",
        group_id
    )
    .fetch_all(pool)
    .await
    .unwrap();

    let mut all_badges = Vec::with_capacity(player_ids.len());
    for id in player_ids {
        let scores = get_player_history(pool, id, group_id, None).await;

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

        all_badges.push(BadgesWithId { badges, id });
    }

    Ok(all_badges)
}

#[get("/group/{group_id}/badges")]
pub async fn get_group_badges(data: Data<AppState>, path: web::Path<i32>) -> impl Responder {
    let group_id = path.into_inner();
    let badges = get_badges(data.pg_pool.as_ref(), group_id).await;
    match badges {
        Ok(badges) => HttpResponse::Ok().json(badges),
        Err(_) => {
            HttpResponse::BadRequest().body("Group does not have max score, so cannot have badges")
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HeadToHeadData {
    ids: String,
    n: Option<i32>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HeadToHeadHistorySingle {
    id: i32,
    name: String,
    history: Vec<i32>,
}

#[get("/group/{group_id}/head_to_head_history")]
pub async fn head_to_head_history(
    data: Data<AppState>,
    info: Query<HeadToHeadData>,
    path: Path<i32>,
) -> impl Responder {
    let group_id = path.into_inner();
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
        group_id,
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

fn parse_ids(ids: &str) -> Result<Vec<i32>, ()> {
    decode(ids)
        .map_err(|_| ())?
        .split(',')
        .filter(|x| !x.trim().is_empty())
        .map(|x| x.parse())
        .collect::<Result<Vec<_>, _>>()
        .map_err(|_| ())
}

#[get("/group/{group_id}/head_to_head")]
pub async fn head_to_head(
    data: Data<AppState>,
    info: Query<HeadToHeadData>,
    path: Path<i32>,
) -> impl Responder {
    let group_id = path.into_inner();
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
        group_id,
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
