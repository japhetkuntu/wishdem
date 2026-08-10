#!/usr/bin/env bash
# One-time droplet provisioning for a bare-metal (no containers) WishDem backend deploy.
# Read this before running it — it's meant to be run section by section on a fresh
# Ubuntu 22.04/24.04 droplet, as root (or via sudo).
#
# Usage: sudo bash install.sh
# Can be scripted non-interactively by exporting REPO_URL, CUSTOMER_API_DOMAIN,
# ADMIN_API_DOMAIN and ACME_EMAIL beforehand (and -E to preserve them under sudo).
set -euo pipefail

# ---------------------------------------------------------------------------
# 0. Fill these in before running, or export them beforehand (see note above).
# ---------------------------------------------------------------------------
REPO_URL="${REPO_URL:-<your-git-repo-url>}"
SRC_DIR="/opt/wishdem-src"

if [[ "$REPO_URL" == "<your-git-repo-url>" ]]; then
  echo "Set REPO_URL first: REPO_URL=git@github.com:you/wishdem.git sudo -E bash install.sh"
  exit 1
fi

read -rp "Customer API domain (e.g. api.yourdomain.com) [${CUSTOMER_API_DOMAIN:-}]: " input
CUSTOMER_API_DOMAIN="${input:-${CUSTOMER_API_DOMAIN:-}}"
read -rp "Admin API domain (e.g. admin-api.yourdomain.com) [${ADMIN_API_DOMAIN:-}]: " input
ADMIN_API_DOMAIN="${input:-${ADMIN_API_DOMAIN:-}}"
read -rp "Email for Let's Encrypt renewal notices [${ACME_EMAIL:-}]: " input
ACME_EMAIL="${input:-${ACME_EMAIL:-}}"
unset input

if [[ -z "$CUSTOMER_API_DOMAIN" || -z "$ADMIN_API_DOMAIN" || -z "$ACME_EMAIL" ]]; then
  echo "All three of CUSTOMER_API_DOMAIN, ADMIN_API_DOMAIN and ACME_EMAIL are required."
  exit 1
fi

echo "== 1/8: base packages =="
apt-get update
apt-get install -y curl wget gnupg apt-transport-https software-properties-common ca-certificates lsb-release git ufw

echo "== 2/8: .NET 8 SDK (Microsoft package feed) =="
if ! command -v dotnet >/dev/null 2>&1; then
  UBUNTU_VERSION="$(lsb_release -rs)"
  wget "https://packages.microsoft.com/config/ubuntu/${UBUNTU_VERSION}/packages-microsoft-prod.deb" -O /tmp/packages-microsoft-prod.deb
  dpkg -i /tmp/packages-microsoft-prod.deb
  rm /tmp/packages-microsoft-prod.deb
  apt-get update
  apt-get install -y dotnet-sdk-8.0
fi
dotnet --version

echo "== 3/8: PostgreSQL =="
apt-get install -y postgresql postgresql-contrib
systemctl enable --now postgresql

echo "A Postgres role/database for WishDem will be created now."
read -rsp "Choose a password for the 'wishdem' Postgres role (used in customer-api.env / admin-api.env later): " PG_PASSWORD
echo
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'wishdem') THEN
    CREATE ROLE wishdem LOGIN PASSWORD '${PG_PASSWORD}';
  ELSE
    ALTER ROLE wishdem WITH PASSWORD '${PG_PASSWORD}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE "WishDem" OWNER wishdem'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'WishDem')\gexec
SQL
echo "Remember this password — put it in the ConnectionStrings__Postgres line of both env files."

echo "== 4/8: Redis (localhost only) =="
apt-get install -y redis-server
sed -i 's/^# *bind .*/bind 127.0.0.1 -::1/' /etc/redis/redis.conf
sed -i 's/^bind .*/bind 127.0.0.1 -::1/' /etc/redis/redis.conf
sed -i 's/^protected-mode .*/protected-mode yes/' /etc/redis/redis.conf
systemctl enable --now redis-server
systemctl restart redis-server

echo "== 5/8: Nginx + Certbot =="
apt-get install -y nginx certbot python3-certbot-nginx
rm -f /etc/nginx/sites-enabled/default
systemctl enable --now nginx

echo "== 6/8: wishdem system user + directories =="
id -u wishdem &>/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin wishdem
mkdir -p /var/www/wishdem/customer-api/logs /var/www/wishdem/admin-api/logs
chown -R wishdem:wishdem /var/www/wishdem
mkdir -p /etc/wishdem
chmod 700 /etc/wishdem

echo "== 7/8: clone source, install service/proxy config =="
if [[ ! -d "$SRC_DIR/.git" ]]; then
  git clone "$REPO_URL" "$SRC_DIR"
fi

install -m 644 "$SRC_DIR/backend/deploy/wishdem-customer-api.service" /etc/systemd/system/wishdem-customer-api.service
install -m 644 "$SRC_DIR/backend/deploy/wishdem-admin-api.service" /etc/systemd/system/wishdem-admin-api.service

sed \
  -e "s/__CUSTOMER_API_DOMAIN__/${CUSTOMER_API_DOMAIN}/g" \
  -e "s/__ADMIN_API_DOMAIN__/${ADMIN_API_DOMAIN}/g" \
  "$SRC_DIR/backend/deploy/nginx.conf" > /etc/nginx/sites-available/wishdem
ln -sf /etc/nginx/sites-available/wishdem /etc/nginx/sites-enabled/wishdem
nginx -t

for f in customer-api admin-api; do
  target="/etc/wishdem/${f}.env"
  if [[ ! -f "$target" ]]; then
    install -m 600 "$SRC_DIR/backend/deploy/${f}.env.example" "$target"
    echo "Created $target from the example — edit it before starting services."
  fi
done

systemctl daemon-reload
systemctl reload nginx

echo "== 8/8: firewall =="
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
echo "Run 'ufw enable' yourself once you've confirmed the SSH rule above is correct."

cat <<EOF

Provisioning done. Remaining manual steps:
  1. Edit /etc/wishdem/customer-api.env and /etc/wishdem/admin-api.env (JWT keys,
     the Postgres password you just set, Spaces keys, Mailtrap/Arkesel creds, CORS
     origins). See backend/deploy/*.env.example for what each key means.
  2. Point both domains' DNS A records at this droplet's IP, then confirm with
     \`dig ${CUSTOMER_API_DOMAIN}\` / \`dig ${ADMIN_API_DOMAIN}\`.
  3. Run 'ufw enable' if you haven't already.
  4. Run backend/deploy/deploy.sh to build and start both APIs.
  5. Once DNS resolves, get certificates (also sets up auto-renewal):
       certbot --nginx -d ${CUSTOMER_API_DOMAIN} -d ${ADMIN_API_DOMAIN} \\
         -m ${ACME_EMAIL} --agree-tos -n --redirect
EOF
