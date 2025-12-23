###########################
#    BUILDER CONTAINER    #
###########################
# dockerfile-utils: ignore
FROM installer AS {builder_name}

WORKDIR /app

RUN pnpm build:database-manager
