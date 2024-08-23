#!/bin/bash

export PORT=9191

kill -9 $(lsof -t -i :$PORT)

# Start the server in the background (suppress the output)
bun run dev > /dev/null 2>&1 &
# Capture the process ID of the server
SERVER_PID=$!

# Function to check if the server is ready
wait_for_server() {
    local retries=5
    local wait_time=1
    local attempt=0

    while [ $attempt -lt $retries ]; do
        # Check if the server is listening on the port (replace 3000 with your port)
        if nc -z 127.0.0.1 $PORT; then
        echo "Server is up and running"
        return 0
        fi

        echo "Waiting for server to start..."
        attempt=$((attempt + 1))
        sleep $wait_time
    done

    echo "Server did not start in time"
    return 1
}

# Wait for the server to be ready
if wait_for_server; then
    # Run the tests
    bun test --timeout 60000
else
    echo "Server failed to start. Exiting."
    # Kill the server process if it failed to start
    kill -9 $(lsof -t -i :$PORT)
    exit 1
fi

# Kill the server process after tests are run
kill -9 $(lsof -t -i :$PORT)

echo "Server process killed"