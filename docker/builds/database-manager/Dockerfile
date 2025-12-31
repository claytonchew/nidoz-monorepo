###########################
#     BASE CONTAINER      #
###########################
FROM node:22-alpine AS base

# provide ability to do health checks with `curl`
RUN apk --no-cache add curl

###########################
#   INSTALLER CONTAINER   #
###########################
FROM base AS installer

# Increase the max old space size for Node.js to handle larger memory requirements
ENV NODE_OPTIONS="--max-old-space-size=8192"

# Setup corepack and pnpm – see https://pnpm.io/docker
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# disable corepack integrity keys
# see: https://github.com/nodejs/corepack/issues/625
ENV COREPACK_INTEGRITY_KEYS=0

WORKDIR /app

# disable husky from installing hooks
ENV HUSKY=0
ENV DOCKER_OUTPUT=1

# nx workspace
COPY nx.json ./
ENV NX_SKIP_NX_CACHE=true

# root workspace
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# packages workspace
COPY packages/database/package.json packages/database/
COPY packages/utils/package.json packages/utils/

# workers workspace
COPY workers/database-manager/package.json workers/database-manager/

# layers workspace
COPY layers/base/package.json layers/base/
COPY layers/i18n/package.json layers/i18n/
COPY layers/ui/package.json layers/ui/

# apps workspace
COPY apps/admin-web/package.json apps/admin-web/
COPY apps/resident-web/package.json apps/resident-web/

# PNPM install
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

# packages workspace
COPY packages/database packages/database
COPY packages/utils packages/utils

# workers workspace
COPY workers/database-manager workers/database-manager

# layers workspace
COPY layers/base layers/base
COPY layers/i18n layers/i18n
COPY layers/ui layers/ui

# apps workspace
COPY apps/admin-web apps/admin-web
COPY apps/resident-web apps/resident-web

###########################
#    BUILDER CONTAINER    #
###########################
# dockerfile-utils: ignore
FROM installer AS database-manager-builder

WORKDIR /app

RUN pnpm build:database-manager

###########################
#      APP CONTAINER      #
###########################
# dockerfile-utils: ignore
FROM base AS database-manager
# dockerfile-utils: ignore
COPY --from=database-manager-builder /app/workers/database-manager/.output /app/.output

ENV HOST=0.0.0.0
ENV PORT=80
EXPOSE 80
ENV NODE_ENV=production

ENTRYPOINT ["node", "/app/.output/server/index.mjs" ]
