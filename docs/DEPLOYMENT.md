# Deployment

No public deployment exists yet.

Production infrastructure, identity, secret management, database networking, certificates, security headers, backup behavior, observability, and cost controls require a dedicated reviewed implementation phase. Development commands do not send test data to a production service.

Until that phase is complete, this repository documents only local development and must not be represented as production-ready.

## Server container foundation

The root `Dockerfile` is a reproducible, digest-pinned, multi-stage server build. Its runtime stage contains the compiled Fastify service and production dependencies only, runs as the pre-existing non-root `node` user, exposes port 3000, and checks `/health/live`.

Build and run it only as a local container foundation until the production checklist is complete:

```text
docker build --tag signal-lost-server:local .
docker run --rm --publish 127.0.0.1:3000:3000 signal-lost-server:local
```

Docker is not available on every development host. A successful TypeScript/server build does not by itself certify an image; CI or a deployment phase must build and scan the actual image.
