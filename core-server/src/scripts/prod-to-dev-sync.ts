import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import "dotenv/config";

const {
  DATABASE_HOST,
  DATABASE_USERNAME,
  DATABASE_PASSWORD,
} = process.env;

if (!DATABASE_HOST || !DATABASE_USERNAME || !DATABASE_PASSWORD) {
  console.error("❌ Missing database environment variables");
  process.exit(1);
}

// ⚠️ Explicit DB names (safety)
const PROD_DB = "production";
const DEV_DB = "development";

// Backup directory
const BACKUP_DIR = path.join(process.cwd(), "db_backups");
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Timestamp
const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const DEV_BACKUP_FILE = path.join(
  BACKUP_DIR,
  `dev_backup_${timestamp}.dump`
);

const PROD_DUMP_FILE = path.join(
  BACKUP_DIR,
  `prod_dump_${timestamp}.dump`
);

// Command runner
function run(cmd: string) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, {
    stdio: "inherit",
    env: {
      ...process.env,
      PGPASSWORD: DATABASE_PASSWORD,
    },
  });
}

try {
  console.log("🚀 Starting PROD → DEV database sync");

  // 1️⃣ Backup DEV
  console.log("\n📦 Creating DEV backup...");
  run(
    `pg_dump -h ${DATABASE_HOST} -U ${DATABASE_USERNAME} -d ${DEV_DB} -F c -f ${DEV_BACKUP_FILE}`
  );

  // 2️⃣ Reset DEV schema
  console.log("\n🧹 Cleaning DEV database...");
  run(
    `psql -h ${DATABASE_HOST} -U ${DATABASE_USERNAME} -d ${DEV_DB} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`
  );

  // 3️⃣ Dump PROD
  console.log("\n📥 Dumping PROD database...");
  run(
    `pg_dump -h ${DATABASE_HOST} -U ${DATABASE_USERNAME} -d ${PROD_DB} -F c -f ${PROD_DUMP_FILE}`
  );

  // 4️⃣ Restore into DEV
  console.log("\n📤 Restoring PROD into DEV...");
  run(
    `pg_restore -h ${DATABASE_HOST} -U ${DATABASE_USERNAME} -d ${DEV_DB} -c ${PROD_DUMP_FILE}`
  );

  console.log("\n✅ PROD → DEV sync completed successfully");
  console.log(`🗂 Dev backup saved at: ${DEV_BACKUP_FILE}`);
} catch (err) {
  console.error("\n❌ Database sync failed");
  console.error(err);
  process.exit(1);
}
