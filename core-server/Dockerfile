# Stage 1: Build
FROM oven/bun:latest AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN bun build src/index.ts \
  --minify \
  --sourcemap \
  --target=bun \
  --outfile index.js

# Stage 2: Runtime
FROM oven/bun:latest

WORKDIR /app

COPY --from=builder /app/index.js /app/

# ❌ DO NOT hardcode PORT
# Cloud Run injects PORT automatically

EXPOSE 8000

CMD ["bun", "index.js"]
