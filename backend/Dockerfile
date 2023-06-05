FROM rust:buster

ARG DATABASE_URL

WORKDIR /usr/src/app

COPY . .

RUN cargo build --release

CMD cargo run --release
