# Stage 1: Build the web server binary
FROM oven/bun:latest as builder

WORKDIR /app

COPY package.json bun.lock /app/
RUN bun install

COPY . .
RUN bun build src/index.ts --minify --sourcemap --target=bun --outfile index.js

# Stage 2: Serve the application
FROM oven/bun:latest as final

WORKDIR /app
COPY --from=builder /app/src/index.js /app/

ENV PORT=3000
CMD ["bun", "index.js"]
