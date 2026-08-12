# syntax=docker/dockerfile:1.7
FROM node:24.19.0-alpine3.24@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/server/package.json apps/server/package.json
COPY packages/game-engine/package.json packages/game-engine/package.json
COPY packages/protocol/package.json packages/protocol/package.json
COPY packages/scenario-sdk/package.json packages/scenario-sdk/package.json

RUN pnpm install --frozen-lockfile

COPY apps/server apps/server
COPY packages/game-engine packages/game-engine
COPY packages/protocol packages/protocol

RUN pnpm --filter @signal-lost/server build \
  && pnpm --filter @signal-lost/server deploy --prod /runtime/server

FROM node:24.19.0-alpine3.24@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS runtime

ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

COPY --from=build --chown=node:node /runtime/server ./

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
