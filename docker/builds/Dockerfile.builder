###########################
#    BUILDER CONTAINER    #
###########################
# dockerfile-utils: ignore
FROM installer AS {builder_name}

# Increase the max old space size for Node.js to handle larger memory requirements
ENV NODE_OPTIONS="--max-old-space-size=8192"

RUN pnpm build
