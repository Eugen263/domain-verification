#!/bin/sh
set -e

echo "Running database migrations..."
node --import tsx/esm node_modules/typeorm/cli.js migration:run -d dist/config/database.js

echo "Starting application..."
exec node --import tsx/esm dist/index.js
