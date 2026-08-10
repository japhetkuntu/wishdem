#!/usr/bin/env bash
# Wipes a previous WishDem deployment attempt off this droplet so install.sh can start
# clean. Run this once before re-running install.sh if you've deployed before and want
# a genuine fresh start.
#
# This DROPS THE POSTGRES DATABASE AND ROLE and FLUSHES REDIS — only run this if
# there's no real data on the droplet worth keeping.
#
# IMPORTANT: this script deletes /opt/wishdem-src, which is where it lives if you
# cloned the repo — run it from a copy outside that tree instead:
#   curl -o /tmp/cleanup.sh https://raw.githubusercontent.com/japhetkuntu/wishdem/main/backend/deploy/cleanup.sh
#   sudo bash /tmp/cleanup.sh
set -euo pipefail

echo "== stopping/disabling services =="
systemctl stop wishdem-customer-api wishdem-admin-api 2>/dev/null || true
systemctl disable wishdem-customer-api wishdem-admin-api 2>/dev/null || true
rm -f /etc/systemd/system/wishdem-customer-api.service /etc/systemd/system/wishdem-admin-api.service
systemctl daemon-reload

echo "== removing Nginx site =="
rm -f /etc/nginx/sites-enabled/wishdem /etc/nginx/sites-available/wishdem
systemctl reload nginx 2>/dev/null || true

echo "== removing published app + logs =="
rm -rf /var/www/wishdem

echo "== removing env files (JWT keys, API tokens, etc — you'll re-fill these) =="
rm -rf /etc/wishdem

echo "== removing source checkout =="
rm -rf /opt/wishdem-src

echo "== dropping the wishdem Postgres role/database =="
sudo -u postgres psql -v ON_ERROR_STOP=1 <<'SQL'
DROP DATABASE IF EXISTS "WishDem";
DROP ROLE IF EXISTS wishdem;
SQL

echo "== flushing Redis =="
redis-cli FLUSHALL 2>/dev/null || true

cat <<'EOF'

Cleanup done. The droplet is back to a bare state (dependencies like .NET, Postgres,
Redis, Nginx, and Certbot are still installed — only the WishDem app/config/data was
removed). Run install.sh next for a fresh setup.
EOF
