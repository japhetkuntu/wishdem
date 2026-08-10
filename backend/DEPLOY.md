# Deploying the backend to a DigitalOcean droplet (bare metal, no containers)

Both APIs (`WishDem.Customer.Api`, `WishDem.Admin.Api`) run directly on the droplet as
systemd services, talking to a natively-installed PostgreSQL and Redis. Nginx (also
installed natively, not in a container) reverse-proxies two subdomains to them, and
Certbot gets/renews the HTTPS certificates.

The frontends (`customer-portal`, `admin-portal`) stay on Netlify — this only covers
the backend. Everything referenced below lives in [`backend/deploy/`](deploy/).

This droplet: `206.81.16.168`. Repo: https://github.com/japhetkuntu/wishdem (public).

## 0. Starting over on a droplet that's already been deployed to

If you've run `install.sh`/`deploy.sh` here before and want a genuinely clean slate
(e.g. after changing how the services are configured), wipe the previous attempt
first. This stops/removes the systemd services, the published app, the Nginx site,
and **drops the `WishDem` Postgres database/role and flushes Redis** — only run it if
there's no real data on the droplet worth keeping:

```bash
curl -o /tmp/cleanup.sh https://raw.githubusercontent.com/japhetkuntu/wishdem/main/backend/deploy/cleanup.sh
sudo bash /tmp/cleanup.sh
```

(Run it from `/tmp`, not from inside a cloned repo — it deletes `/opt/wishdem-src`,
which would otherwise be the very script running.) Dependencies themselves (.NET,
Postgres, Redis, Nginx, Certbot) are left installed; only the WishDem-specific parts
go. After this, start again from step 1.

## 1. Point DNS at the droplet first

Your domain itself can stay wherever it already lives (Netlify, a registrar, whoever
you bought it from) — DigitalOcean is never involved in DNS here, and doesn't need to
be. You're just adding two subdomain records in whatever DNS panel is authoritative
for the domain today (for a Netlify-managed domain: Netlify -> Domains -> your domain
-> DNS panel -> Add record):

| Type | Host                    | Value            |
|------|-------------------------|-------------------|
| A    | api (or your subdomain) | `206.81.16.168`   |
| A    | admin-api (or your sub) | `206.81.16.168`   |

Everything else about the domain (the apex, `www`, the actual frontend sites) keeps
pointing at Netlify exactly as it does now — adding these two A records doesn't move
or affect any of that, it just carves out two subdomains that resolve to the droplet
instead.

Certbot needs to complete an HTTP challenge, so get DNS live before requesting
certificates (you can still provision and deploy before this finishes propagating,
just not run certbot yet). Confirm propagation with `dig api.yourdomain.com` before
running certbot.

## 2. Provision the droplet

The repo is public, so the droplet can clone it over plain HTTPS — no deploy key
needed. SSH in, then run the provisioning script (installs .NET 8 SDK, PostgreSQL,
Redis, Nginx + Certbot, creates the app directories, clones the repo, installs the
systemd units and Nginx site config — the services run as `www-data`, no dedicated
custom user needed):

```bash
ssh root@206.81.16.168
curl -o install.sh https://raw.githubusercontent.com/japhetkuntu/wishdem/main/backend/deploy/install.sh
REPO_URL=https://github.com/japhetkuntu/wishdem.git sudo -E bash install.sh
```

(Or `git clone https://github.com/japhetkuntu/wishdem.git /opt/wishdem-src` yourself
first and run `backend/deploy/install.sh` from inside it — either way works, the
script skips the clone if `/opt/wishdem-src` already exists.)

It will prompt you for:
- the Customer API domain (e.g. `api.yourdomain.com`)
- the Admin API domain (e.g. `admin-api.yourdomain.com`)
- an email address for Let's Encrypt renewal notices
- a password for the `wishdem` Postgres role — remember it, you need it in step 3

## 3. Fill in secrets

The script copies templates into place; edit the real ones:

```bash
nano /etc/wishdem/customer-api.env   # see backend/deploy/customer-api.env.example
nano /etc/wishdem/admin-api.env      # see backend/deploy/admin-api.env.example
```

Generate the two JWT signing keys (must differ from each other, and can't start with
`dev-only-signing-key` — the app refuses to boot in Production otherwise):

```bash
openssl rand -base64 48   # -> Jwt__SigningKey in customer-api.env
openssl rand -base64 48   # -> Jwt__SigningKey in admin-api.env
```

`Cors__AllowedOrigins__0` in each file must be the exact origin your Netlify-hosted
frontend is served from (e.g. `https://wishdem.com`, no trailing slash) — CORS
rejects anything else. `SuperAdmin__Password` must differ from the default
`ChangeMe123!`. `Mailtrap__ApiToken` is a Mailtrap Sending API token, not an SMTP
password (Mailtrap dashboard -> Sending Domains -> API Tokens).

## 4. First deploy

```bash
sudo bash /opt/wishdem-src/backend/deploy/deploy.sh
```

This publishes both APIs, restarts `wishdem-customer-api` (which applies all EF Core
migrations against the fresh database on boot), waits for it to report healthy, then
restarts and health-checks `wishdem-admin-api`.

Then, once DNS has actually propagated (`dig` from step 1), get the certificate —
`install.sh` printed the exact command with your domains/email already filled in, e.g.:

```bash
sudo ufw enable   # if you haven't already
sudo certbot --nginx -d api.yourdomain.com -d admin-api.yourdomain.com \
  -m you@yourdomain.com --agree-tos -n --redirect
```

This single command gets one certificate covering both domains, edits
`/etc/nginx/sites-available/wishdem` in place to add the `listen 443 ssl` blocks and
an http->https redirect, and sets up auto-renewal (the `certbot` apt package installs
a `certbot.timer` systemd timer that runs twice daily — nothing else to configure).

Verify:

```bash
curl https://api.yourdomain.com/health
curl https://admin-api.yourdomain.com/health
```

Both should return `Healthy`. If certbot fails, double-check DNS actually resolves to
the droplet's IP first (`dig`), and that port 80 is reachable (`ufw status`,
`systemctl status nginx`).

## 5. Everyday workflow: shipping updates

Every future release is the same two steps, whether it's a code change, a config
change, or both:

**Code changed?** Push to `main` as usual, then on the droplet:

```bash
sudo bash /opt/wishdem-src/backend/deploy/deploy.sh
```

That's the whole release process — `git pull`, republish both APIs, restart
`wishdem-customer-api` (applying any new EF migrations automatically), health-check
it, then restart and health-check `wishdem-admin-api`. Nginx/certbot don't need
touching again unless you're changing domains.

**Only an env var changed** (new API key, rotated secret, CORS origin, etc.) — no
need to rebuild anything, just edit the file and restart that one service:

```bash
sudo nano /etc/wishdem/customer-api.env    # or admin-api.env
sudo systemctl restart wishdem-customer-api
```

You can do this at any time, independently of `deploy.sh` — env files are only read
when the service starts, so a restart is what picks up the change (there's no live
reload). If both a code change and an env change are going out together, edit the env
file first, then run `deploy.sh` — its restart will pick up both.

## 6. Useful commands

```bash
# Tail logs for one service
journalctl -u wishdem-customer-api -f

# Service status
systemctl status wishdem-customer-api wishdem-admin-api nginx

# Restart a single service (e.g. after an env var change)
sudo nano /etc/wishdem/customer-api.env
sudo systemctl restart wishdem-customer-api

# Check the Nginx site config / reload after editing it
sudo nginx -t && sudo systemctl reload nginx

# Confirm certbot's auto-renewal is set up, or force a dry run
systemctl status certbot.timer
sudo certbot renew --dry-run

# psql shell
sudo -u postgres psql -d WishDem

# Back up the database
sudo -u postgres pg_dump WishDem > "backup-$(date +%F).sql"
```

## Notes / things worth knowing

- **Postgres and Redis are bound to `127.0.0.1` only** (`install.sh` sets Redis's
  `bind`/`protected-mode`; the default Postgres install already only listens on
  localhost unless you change `postgresql.conf`) — neither is reachable from the
  internet, and no firewall rule opens their ports. Don't add one unless you
  specifically need external DB access (an SSH tunnel is safer than opening the port).
- **Both API services are also loopback-only** (`ASPNETCORE_URLS=http://127.0.0.1:...`
  in their systemd units) — Nginx is the only thing that can reach them, and Nginx is
  the only service with 80/443 open in the firewall.
- **The app refuses to start in Production** with the default dev JWT signing key or
  the default `ChangeMe123!` SuperAdmin password — if a service won't stay up, check
  `journalctl -u <service>` first, it's likely one of these guards.
- **OTP/password-reset codes are never echoed in API responses in Production**,
  regardless of the `ReturnCodeInResponse` config flag (that flag is dev-only and
  hard-gated in code) — real delivery goes out over the Mailtrap/Arkesel config you set.
- **systemd auto-restarts each API on crash** (`Restart=on-failure` in the unit
  files) and both services are `WantedBy=multi-user.target`, so they come back after
  a droplet reboot without you doing anything.
- **certbot's nginx plugin edits `/etc/nginx/sites-available/wishdem` directly** —
  seeing new `listen 443 ssl` blocks and certificate paths appear in that file after
  running certbot is expected, not something to revert.
- Backups: set up a cron job (`crontab -e` as root) calling the `pg_dump` command
  above on a schedule, piped somewhere off-droplet (e.g. a Spaces bucket) — this repo
  doesn't automate that for you.
