#!/usr/bin/env bash
# Builds and (re)deploys both APIs from source already on the droplet. Run this for
# the first deploy (after install.sh) and for every subsequent update.
#
# Usage: sudo bash /opt/wishdem-src/backend/deploy/deploy.sh
set -euo pipefail

SRC_DIR="/opt/wishdem-src"
CUSTOMER_OUT="/var/www/wishdem/customer-api"
ADMIN_OUT="/var/www/wishdem/admin-api"

wait_healthy() {
  local url="$1" name="$2" tries=30
  echo "Waiting for $name to report healthy at $url ..."
  for ((i = 1; i <= tries; i++)); do
    if curl -fs "$url" >/dev/null 2>&1; then
      echo "$name is healthy."
      return 0
    fi
    sleep 2
  done
  echo "$name did not become healthy after $((tries * 2))s — check: journalctl -u $name -n 100 --no-pager"
  return 1
}

echo "== pulling latest source =="
cd "$SRC_DIR"
git pull

echo "== publishing customer-api =="
dotnet publish "$SRC_DIR/backend/src/APIs/WishDem.Customer.Api/WishDem.Customer.Api.csproj" \
  -c Release -o "$CUSTOMER_OUT"

echo "== publishing admin-api =="
dotnet publish "$SRC_DIR/backend/src/APIs/WishDem.Admin.Api/WishDem.Admin.Api.csproj" \
  -c Release -o "$ADMIN_OUT"

chown -R www-data:www-data "$CUSTOMER_OUT" "$ADMIN_OUT"

echo "== restarting customer-api (applies any new EF migrations on boot) =="
systemctl restart wishdem-customer-api
wait_healthy "http://127.0.0.1:5000/health" wishdem-customer-api

echo "== restarting admin-api =="
systemctl restart wishdem-admin-api
wait_healthy "http://127.0.0.1:5001/health" wishdem-admin-api

echo "Deploy complete."
