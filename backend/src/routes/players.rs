use serde::{Deserialize, Serialize};

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
