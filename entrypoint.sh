#!/bin/sh
set -e

echo "Waiting for postgres..."

until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done

echo "Running migrations..."
pnpm migration:run:prod

echo "Starting server..."
exec pnpm start