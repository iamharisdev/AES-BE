# Stage 1: Build the web server binary
FROM oven/bun:1.1.22 as builder

WORKDIR /app

COPY package.json bun.lockb /app/

RUN bun install
# Copy the source code into the container

COPY . .

RUN bun build src/index.ts --minify --sourcemap --target=bun --outfile server.js

# Stage 2: Serve the build exclusing the dependencies
FROM oven/bun:1.1.22 as final

WORKDIR /app

COPY --from=builder /app/server.js /app/

ENV PORT=3000

CMD ["bun", "run", "server.js"]