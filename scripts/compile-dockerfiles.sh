#!/bin/bash

ROOT_DOCKERFILE_BASE="docker/builds/Dockerfile.base"
ROOT_DOCKERFILE_BUILDER="docker/builds/Dockerfile.builder"

BUILD_DIR="docker/builds"
MASTER_DOCKERFILE=$BUILD_DIR/Dockerfile

# Ensure base Dockerfile exists
if [[ ! -f "$ROOT_DOCKERFILE_BASE" ]]; then
    echo "Error: Base Dockerfile not found at $ROOT_DOCKERFILE_BASE"
    exit 1
fi

# Compile Dockerfiles for each app or worker
echo "Generating single-app Dockerfiles..."

for dir in "$BUILD_DIR"/*/; do
    # Extract directory name
    dir_name=$(basename "$dir")
    builder_name="${dir_name}-builder"

    # Define paths
    APP_DOCKERFILE_BUILDER="$dir/Dockerfile.builder"
    APP_DOCKERFILE_CONTAINER="$dir/Dockerfile.container"
    OUTPUT_DOCKERFILE="$BUILD_DIR/$dir_name/Dockerfile"

    # Check if Dockerfile exists in the directory
    if [[ -f "$APP_DOCKERFILE_BUILDER" && -f "$APP_DOCKERFILE_CONTAINER" ]]; then
        # Combine base Dockerfile with the specific one
        {
            cat "$ROOT_DOCKERFILE_BASE"; echo;
            sed "s/{builder_name}/$builder_name/g" "$APP_DOCKERFILE_BUILDER"; echo;
            sed "s/{builder_name}/$builder_name/g" "$APP_DOCKERFILE_CONTAINER";
        } > "$OUTPUT_DOCKERFILE"

        echo "└── ✅ created $dir_name Dockerfile: $OUTPUT_DOCKERFILE"
    else
        echo "└── 🚨 warning: no Dockerfile partials found in $dir_name"
    fi
done

# Compile master Dockerfile for multi-app build
echo "Generating master Dockerfile..."
builder_name=builder
{
    cat "$ROOT_DOCKERFILE_BASE"; echo;
    sed "s/{builder_name}/$builder_name/g" "$ROOT_DOCKERFILE_BUILDER";
} > "$MASTER_DOCKERFILE"

for dir in "$BUILD_DIR"/*/; do
    # Extract directory name
    dir_name=$(basename "$dir")

    # Define paths
    APP_DOCKERFILE_CONTAINER="$dir/Dockerfile.container"

    # Check if Dockerfile exists in the directory
    if [[ -f "$APP_DOCKERFILE_CONTAINER" ]]; then
        # Combine base Dockerfile with the specific one
        {
            echo;
            sed "s/{builder_name}/$builder_name/g" "$APP_DOCKERFILE_CONTAINER";
        } >> "$MASTER_DOCKERFILE"
        echo "└── ✅ included $dir_name to master Dockerfile"
    else
        echo "└── 🚨 warning: no Dockerfile partials found in $dir_name"
    fi
done

echo "Master Dockerfile generated: $MASTER_DOCKERFILE"

echo "Done."
