#!/bin/bash
source .env.prod

# Pass through:
# - Database URL for SQLx to use when building
# - VITE_SERVERADDR to Vite to compile into the application
echo VITE_SERVERADDR=$VITE_SERVERADDR
docker-compose build --build-arg DATABASE_URL=$DATABASE_URL --build-arg VITE_SERVERADDR=$VITE_SERVERADDR
