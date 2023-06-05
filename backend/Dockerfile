FROM rust:1.68.2-buster

ARG DATABASE_URL

WORKDIR /usr/src/app

COPY . .

RUN cargo build --release

CMD cargo run --release
