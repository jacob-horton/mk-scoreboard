use std::io::{self, Write};

use bcrypt::DEFAULT_COST;

fn generate_hashed_password(password: &str) -> String {
    bcrypt::hash(password, DEFAULT_COST).unwrap()
}

fn main() {
    let mut pass = String::new();
    print!("Password: ");
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut pass).unwrap();

    let hash = generate_hashed_password(pass.trim());
    println!("{hash}");
}
