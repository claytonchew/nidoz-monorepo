# Dockerfile

Dockerfiles are split partially to make it easier to maintain a master Dockerfile and single-app Dockerfiles. This is done by using placeholders to dynamically replace builder keys for optimal buid time caching and resulting smaller images.

> [!WARNING]
> You should not modify the `Dockerfile` or `<app*>/Dockerfile` files directly as they will be script-generated. Instead, modify the `Dockerfile.*` and `<app*>/Dockerfile.*` files.

Running the following command will combine `Dockerfile.*` to `Dockerfile` and `<app*>/Dockerfile` respectively.

```bash
pnpm compile:dockerfile
```
