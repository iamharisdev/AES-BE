# Stage 1: Build the web server binary
FROM oven/bun:1.1.22 as builder
# Set the working directory inside the container
WORKDIR /app
COPY package.json bun.lockb /app/
RUN bun install
# Copy the source code into the container
COPY . .
RUN bun build src/index.ts --minify --sourcemap --target=bun --outfile server.js

ENV PORT=3000

CMD bun run server.js