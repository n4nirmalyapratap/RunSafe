# Docker deployment

A production-style container stack for RunSafe. Three services (`db`, `api`,
`web`) plus a one-shot `migrate` job, wired together by `docker-compose.yml`.

## Quick start

```bash
cp .env.docker.example .env.docker
# fill in CLERK_SECRET_KEY + VITE_CLERK_PUBLISHABLE_KEY at minimum

docker compose --env-file .env.docker up --build
```

When the build finishes the SPA is served at <http://localhost:8000> and
proxies `/api/*` to the api container.

## Services

| Service   | Image                                    | Port (host) | Purpose                                                 |
| --------- | ---------------------------------------- | ----------- | ------------------------------------------------------- |
| `db`      | `postgres:17-alpine`                     | `5432`      | Postgres with persistent `db_data` volume.              |
| `migrate` | built from `docker/Dockerfile.migrate`   | —           | Runs `drizzle-kit push` once and exits.                 |
| `api`     | built from `docker/Dockerfile.api`       | (internal)  | Esbuild-bundled Express server on `:8080`.              |
| `web`     | built from `docker/Dockerfile.web`       | `8000`      | Vite SPA built statically and served by nginx.          |

## How it's wired

- The web container's nginx config (`docker/nginx.conf`) proxies
  `location /api/` to `http://api:8080` over the internal Docker network, so
  the SPA's relative `/api/...` calls Just Work without CORS gymnastics.
- The api container is a self-contained esbuild bundle — the runtime image
  has no `node_modules`, only `dist/`, keeping it small (~200MB).
- `migrate` blocks `api` startup via `depends_on.condition:
  service_completed_successfully`, so the schema is always present before the
  api starts serving traffic.
- The Vite build needs `VITE_CLERK_PUBLISHABLE_KEY` at build time (Vite
  inlines `import.meta.env.*`), so it's wired through `build.args` rather
  than runtime env.

## Common operations

```bash
# Rebuild a single service after code changes
docker compose --env-file .env.docker up --build api

# Re-run the schema push (e.g. after a Drizzle change)
docker compose --env-file .env.docker run --rm migrate

# Tail logs
docker compose --env-file .env.docker logs -f api web

# Tear down (keeps DB volume)
docker compose --env-file .env.docker down

# Tear down AND wipe the DB volume
docker compose --env-file .env.docker down -v
```

## Deploying to a registry

Each Dockerfile is independently buildable for shipping to ECR / GCR / GHCR:

```bash
docker build -t registry.example.com/runsafe/api:$(git rev-parse --short HEAD) \
  -f docker/Dockerfile.api .

docker build \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx \
  --build-arg BASE_PATH=/ \
  -t registry.example.com/runsafe/web:$(git rev-parse --short HEAD) \
  -f docker/Dockerfile.web .
```

Point the api at your managed Postgres via `DATABASE_URL`, run `migrate`
once after each deploy that changes the schema, and route the web container
behind your TLS-terminating load balancer.
