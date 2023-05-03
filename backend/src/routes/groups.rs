use std::collections::HashMap;

use actix_web::{
    get,
    web::{self, Data, Query},
    HttpResponse, Responder,
};
use itertools::Itertools;
use serde::{Deserialize, Serialize};

use crate::{
    routes::players::{Player, PlayerStats},
    AppState,
};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
struct Group {
    id: i32,
    name: String,
    max_score: Option<i32>,
}

#[get("/groups/list")]
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
        })
        .collect();
    HttpResponse::Ok().json(groups)
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GroupIdData {
    id: i32,
}

#[get("/groups/get")]
pub async fn get_group(data: Data<AppState>, info: web::Query<GroupIdData>) -> impl Responder {
    let group = sqlx::query!("SELECT * FROM grp WHERE id = $1", info.id)
        .fetch_one(data.pg_pool.as_ref())
        .await
        .unwrap();

    HttpResponse::Ok().json(Group {
        id: group.id,
        name: group.name.to_string(),
        max_score: group.max_score,
    })
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GetStatsData {
    id: i32,
    n: Option<i32>, // Number of games
}

#[get("/groups/stats")]
pub async fn get_group_stats(
    data: Data<AppState>,
    info: web::Query<GetStatsData>,
) -> impl Responder {
    // Players in group
    let player_games = sqlx::query!(
        "SELECT
            game_score.player_id as player_id,
            game_score.game_id as game_id, 
            player.name as player_name,
            game_score.score as points
        FROM player_group
        INNER JOIN player ON player.id = player_group.player_id
        INNER JOIN game_score ON game_score.player_id = player_group.player_id
        INNER JOIN game ON game_score.game_id = game.id
        WHERE player_group.group_id = $1
        ORDER BY date DESC
        ",
        info.id
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
            name: player_game.player_name,
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

#[get("/groups/list_players")]
pub async fn list_players(data: Data<AppState>, info: Query<GroupIdData>) -> impl Responder {
    let players = sqlx::query!(
        "SELECT player.id as id, name
        FROM player
        INNER JOIN player_group
            ON player.id = player_group.player_id
        WHERE group_id = $1",
        info.id
    )
    .fetch_all(data.pg_pool.as_ref())
    .await
    .unwrap();

    HttpResponse::Ok().json(
        players
            .into_iter()
            .map(|p| Player {
                name: p.name,
                id: p.id,
            })
            .collect::<Vec<_>>(),
    )
}
