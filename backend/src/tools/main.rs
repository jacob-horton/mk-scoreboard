use std::io::{self, Write};

use bcrypt::DEFAULT_COST;
use clap::Parser;

fn generate_hashed_password(password: &str) -> String {
    bcrypt::hash(password, DEFAULT_COST).unwrap()
}

/// Tools to help set up mario kart scoreboard
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
enum Command {
    HashPassword {
        /// Password to hash
        #[arg(index = 1)]
        password: Option<String>,
    },
}

fn ask_user_for_password() -> String {
    let mut pass = String::new();
    print!("Password: ");
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut pass).unwrap();

    return pass;
}

fn main() {
    let command = Command::parse();

    match command {
        Command::HashPassword { password } => {
            let password = match password {
                Some(password) => password,
                None => ask_user_for_password(),
            };

            let hash = generate_hashed_password(password.trim());
            println!("{hash}");
        }
    };
}
