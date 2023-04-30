use std::collections::HashMap;

use actix_web::{get, web::Data, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

use crate::AppState;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PlayerStats {
    id: i32,
    name: String,
    wins: i32,
    points: i32,
    games: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Player {
    id: i32,
    name: String,
}

#[get("/players/list")]
pub async fn list_players(data: Data<AppState>) -> impl Responder {
    let players = sqlx::query!(
        "SELECT id, name
        FROM player"
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

#[get("/players/stats")]
pub async fn get_player_stats(data: Data<AppState>) -> impl Responder {
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
        GROUP BY player_id, player.name;"
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
          GROUP BY game_id
        ) GROUP BY player_id"
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
