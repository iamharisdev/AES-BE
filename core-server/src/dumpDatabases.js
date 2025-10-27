const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");



const DATABASE_HOST= "34.87.36.56"
const DATABASE_USERNAME="postgres"
const DATABASE_NAME="development"
const DATABASE_PASSWORD="sOXw0dXUmuZ7nNtTKrO90eXD3F0yWoF9"

const MONGO_URI =
  "mongodb+srv://aes-dev:SnF89JEtOeRt9gWC@cluster0.rykuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// === DIRECTORY SETUP ===
const backupDir = path.resolve(process.cwd(), "db_dumps");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const pgDumpFile = path.join(
  backupDir,
  `postgres-${DATABASE_NAME}-${timestamp}.sql`
);
const mongoDumpDir = path.join(backupDir, `mongo-${timestamp}`);

// === PLATFORM-AWARE COMMANDS ===
const isWindows = process.platform === "win32";

const pgDumpCommand = isWindows
  ? `set PGPASSWORD=${DATABASE_PASSWORD} && pg_dump -h ${DATABASE_HOST} -U ${DATABASE_USERNAME}  -d ${DATABASE_NAME} -F p -f "${pgDumpFile}"`
  : `PGPASSWORD=${DATABASE_PASSWORD} pg_dump -h ${DATABASE_HOST} -U ${DATABASE_USERNAME}  -d ${DATABASE_NAME} -F p > "${pgDumpFile}"`;

const mongoDumpCommand = `mongodump --uri="${MONGO_URI}" --out="${mongoDumpDir}"`;

// === EXEC HELPER ===
function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve();
      }
    });
  });
}

// === MAIN FUNCTION ===
async function runBackups() {
  console.log("🚀 Starting database backup...");

  try {
    await runCommand(pgDumpCommand);
    console.log(`✅ PostgreSQL dump completed: ${pgDumpFile}`);
  } catch (err) {
    console.error("❌ PostgreSQL dump failed:", err.message);
  }

  try {
    await runCommand(mongoDumpCommand);
    console.log(`✅ MongoDB dump completed: ${mongoDumpDir}`);
  } catch (err) {
    console.error("❌ MongoDB dump failed:", err.message);
  }
}

// === RUN ===
runBackups().catch((err) => {
  console.error("❌ Unexpected error:", err.message);
});
