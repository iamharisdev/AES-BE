# Stage 1: Build the web server binary
FROM oven/bun:1.2.2 as builder

WORKDIR /app

# Copy dependencies for installation
COPY package.json bun.lockb /app/

# Install dependencies using Bun
RUN bun install

# Copy the source code to the container
COPY . .

# Build the project
RUN bun build src/index.ts --minify --sourcemap --target=bun --outfile server.js

# Set the PORT environment variable (required by Cloud Run)
ENV PORT=3000

# Command to run the application
CMD ["bun", "run", "server.js"]
