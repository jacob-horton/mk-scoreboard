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
    utils::{modify_birthday, std_dev},
    AppState,
};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
struct Group {
    id: i32,
    name: String,
    max_score: Option<i32>,
    archived: bool,
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
            archived: g.archived,
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
        archived: group.archived,
    })
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GetStatsData {
    id: i32,
    n: Option<i32>, // Number of games
    skip_most_recent: bool,
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
            player.birthday as birthday,
            game_score.score as points
        FROM player
        INNER JOIN game_score ON game_score.player_id = player.id
        INNER JOIN game ON game_score.game_id = game.id
        WHERE game.group_id = $1
        ORDER BY date DESC",
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

    let most_recent_id = match info.skip_most_recent {
        true => sqlx::query!(
            "SELECT game.id FROM game WHERE game.group_id = $1 ORDER BY date DESC LIMIT 1",
            info.id
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

#[get("/groups/list_players")]
pub async fn list_players(data: Data<AppState>, info: Query<GroupIdData>) -> impl Responder {
    let players = sqlx::query!(
        "SELECT player.id as id, name, birthday
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
                name: modify_birthday(&p.name, &p.birthday),
                id: p.id,
            })
            .collect::<Vec<_>>(),
    )
}
