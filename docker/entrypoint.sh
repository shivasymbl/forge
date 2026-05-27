#!/bin/sh
set -e

# Run hourly-rollup backfill before migrations.
# Migration 103 (drop_legacy_daily_rollups) guards against running until the
# new task_usage_hourly pipeline has caught up. Running the backfill first
# stamps the watermark so the guard passes cleanly on every upgrade.
# Safe to run repeatedly — it is idempotent.
echo "Running task_usage_hourly backfill (pre-migration guard)..."
./backfill_task_usage_hourly

echo "Running database migrations..."
./migrate up

echo "Starting server..."
exec ./server
