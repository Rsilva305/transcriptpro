#!/bin/sh
# Use the PORT environment variable or default to 8000
PORT=${PORT:-8000}
echo "Starting application on port $PORT"
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT 