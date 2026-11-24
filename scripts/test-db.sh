#!/usr/bin/env bash
# Runs the pgTAP suites against the local Supabase database (needs Docker and a
# running stack: see supabase/tests/README.md).
#
# Everything runs in ONE transaction that is rolled back at the end:
#   production baseline -> migrations newer than the baseline -> each test file.
# Nothing persists in the local database between runs.
set -euo pipefail

cd "$(dirname "$0")/.."
CONTAINER="supabase_db_hhbkmxrzxcswwokmbtbz"
# Migrations the baseline does not already contain (everything after 2026-11-22).
BASELINE_CUTOFF="20261122999999"

migrations=()
for f in supabase/migrations/*.sql; do
  ts="$(basename "$f" | cut -d_ -f1)"
  if [[ "$ts" > "$BASELINE_CUTOFF" ]]; then migrations+=("$f"); fi
done

status=0
for t in supabase/tests/database/*.test.sql; do
  out="$(
    {
      echo "BEGIN;"
      echo "CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;"
      echo "SET search_path = public, extensions;"
      cat supabase/tests/baseline/prod_baseline.sql
      for m in "${migrations[@]}"; do cat "$m"; echo; done
      # The test file's own BEGIN only warns inside this transaction; its final ROLLBACK undoes everything.
      cat "$t"
    } | docker exec -i "$CONTAINER" psql -U postgres -d postgres -X -q -t -A -v ON_ERROR_STOP=1 2>&1
  )" || status=1
  echo "== $t"
  echo "$out" | grep -v '^WARNING:  there is already a transaction in progress' || true
  if echo "$out" | grep -qE '^not ok|Looks like|ERROR'; then status=1; fi
done
exit $status
