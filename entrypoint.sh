#!/bin/sh
set -e

echo "Running migrations..."
pnpm migration:run:prod

echo "Starting server..."
exec pnpm start