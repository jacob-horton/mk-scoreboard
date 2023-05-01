use std::collections::HashMap;

use actix_web::{
    get,
    web::{self, Data, Query},
    HttpResponse, Responder,
};
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

#[get("/groups/stats")]
pub async fn get_group_stats(
    data: Data<AppState>,
    info: web::Query<GroupIdData>,
) -> impl Responder {
    // Get number of games, player name, and total score
    let players = sqlx::query!(
        "SELECT
            player_id,
            player.name as name,
            SUM(score) as tot_score,
            COUNT(*) as count
        FROM game_score
        INNER JOIN player
            ON game_score.player_id = player.id
        INNER JOIN game
            ON game_score.game_id = game.id
        WHERE game.group_id = $1
        GROUP BY player_id, player.name;",
        info.id
    )
    .fetch_all(data.pg_pool.as_ref())
    .await
    .unwrap();

    // Get (player_id, wins)
    // Counts draws as wins
    let wins = sqlx::query!(
        "SELECT player_id, COUNT(player_id) as count
        FROM game_score
        WHERE (game_id, score) IN (
            SELECT game_id, MAX(score) as score
            FROM game_score
            INNER JOIN game
                ON game_score.game_id = game.id
            WHERE game.group_id = $1
            GROUP BY game_id
        ) GROUP BY player_id",
        info.id
    )
    .fetch_all(data.pg_pool.as_ref())
    .await
    .unwrap();

    let mut wins_map = HashMap::new();
    for win in wins {
        wins_map.insert(win.player_id, win.count.unwrap());
    }

    let players: Vec<_> = players
        .into_iter()
        .map(|player| PlayerStats {
            id: player.player_id,
            name: player.name,
            points: player.tot_score.unwrap() as i32,
            games: player.count.unwrap() as i32,
            wins: wins_map.get(&player.player_id).unwrap_or(&0).to_owned() as i32,
        })
        .collect();

    HttpResponse::Ok().json(players)
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
