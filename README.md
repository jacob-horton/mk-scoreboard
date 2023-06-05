## Dependencies

- `sqlx-cli` (`cargo install sqlx-cli`)

## Setup

### Environment Variables

To set up for development, copy `.env.example` to `.env` and fill it out with the development config
For production, copy it again to `.env.prod` and fill it out with the production config

One of these also needs to be copied to `db/.env` depending on whether you want to set up the production or development database

### Database

To set up the database, run the following commands:

```bash
cd db
source <env-file>
sqlx migrate run
docker-compose up -d
```

### Severs

To build the other docker containers for production, run `./build-containers.sh` (this uses `.env.prod`)
Then, to run, use `docker-compose up -d`
