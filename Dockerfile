# Builds and runs the Duck Jitsu backend (packages/server) from the duck-jitsu/ monorepo.
# Build context is expected to be the repository root (this file's own directory).

FROM node:22-slim AS build
WORKDIR /app

# better-sqlite3 needs to compile a native addon.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY duck-jitsu/package.json duck-jitsu/package-lock.json duck-jitsu/tsconfig.base.json ./
COPY duck-jitsu/packages/engine/package.json packages/engine/package.json
COPY duck-jitsu/packages/server/package.json packages/server/package.json
COPY duck-jitsu/packages/app/package.json packages/app/package.json

RUN npm ci

COPY duck-jitsu/packages/engine packages/engine
COPY duck-jitsu/packages/server packages/server

RUN npm run build -w packages/engine
RUN npm run build -w packages/server

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages/engine ./packages/engine
COPY --from=build /app/packages/server ./packages/server

EXPOSE 4000
CMD ["node", "packages/server/dist/index.js"]
