
import { env } from "bun";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";


// Production DB connection
const prodConnString = `postgres://${env.PROD_DATABASE_USERNAME}:${
  env.PROD_DATABASE_PASSWORD
}@${env.PROD_DATABASE_HOST}:${env.PROD_DATABASE_PORT || 5432}/${
  env.PROD_DATABASE_NAME
}`;
const prodClient = postgres(prodConnString);
const prodDb = drizzle(prodClient);

// Development DB connection
const devConnString = `postgres://${env.DATABASE_USERNAME}:${
  env.DATABASE_PASSWORD
}@${env.DATABASE_HOST}:${env.DATABASE_PORT || 5432}/${env.DATABASE_NAME}`;
const devClient = postgres(devConnString);
const devDb = drizzle(devClient);

async function copyAllTables() {
  // Get all tables from production
  const tablesRes = await prodClient.unsafe(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE';
  `);

  const tables = tablesRes.map((row) => row.table_name);

  for (const table of tables) {
    console.log(`Processing table: ${table}`);

    // 1. Truncate dev table first
    await devClient.unsafe(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
    console.log(`Truncated dev table: ${table}`);

    // 2. Get dev table columns
    const devColsRes = await devClient.unsafe(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name='${table}';
    `);
    const devCols = {};
    devColsRes.forEach((row) => {
      devCols[row.column_name] = row.data_type;
    });

    // 3. Fetch all data from production table
    const prodRows = await prodClient.unsafe(`SELECT * FROM ${table}`);
    if (!prodRows.length) {
      console.log(`No data in table ${table}, skipping...`);
      continue;
    }

    // 4. Map prod rows to dev columns
    const devRows = prodRows.map((row) => {
      const newRow = {};
      for (const col in devCols) {
        if (row[col] !== undefined) {
          newRow[col] = row[col];
        } else {
          // Fill dummy value based on type
          const type = devCols[col];
          if (type.includes("int")) newRow[col] = 0;
          else if (type.includes("text") || type.includes("char"))
            newRow[col] = "dummy";
          else if (type.includes("timestamp") || type.includes("date"))
            newRow[col] = new Date();
          else newRow[col] = null;
        }
      }
      return newRow;
    });

    // 5. Insert into dev
    for (const row of devRows) {
      const columns = Object.keys(row).join(", ");
      const values = Object.values(row)
        .map((v) =>
          v instanceof Date
            ? `'${v.toISOString()}'`
            : typeof v === "string"
            ? `'${v}'`
            : v
        )
        .join(", ");
      await devClient.unsafe(
        `INSERT INTO ${table} (${columns}) VALUES (${values})`
      );
    }

    console.log(`Copied ${devRows.length} rows into table ${table}`);
  }

  console.log("All tables copied successfully.");
}

// Run the copy function
copyAllTables().catch(console.error);
