import { Client } from "pg";

/**
 * DEV DATABASE
 */
const devClient = new Client({
  host: "34.87.36.56",
  port: 5432,
  user: "postgres",
  password: "sOXw0dXUmuZ7nNtTKrO90eXD3F0yWoF9",
  database: "development",
});

/**
 * NEW PRODUCTION DATABASE
 */
const prodClient = new Client({
  host: "34.87.36.56",
  port: 5432,
  user: "postgres",
  password: "sOXw0dXUmuZ7nNtTKrO90eXD3F0yWoF9",
  database: "newProduction",
});

async function syncPatientIds() {
  await devClient.connect();
  await prodClient.connect();

  console.log("✅ Connected to both databases");

  /**
   * 1️⃣ Dev DB se mongo_patient_id → patient_id mapping uthao
   */
  const devRows = await devClient.query(`
    SELECT mongo_patient_id, patient_id
    FROM patient_chats
    WHERE mongo_patient_id IS NOT NULL
  `);

  console.log(`📦 Dev records found: ${devRows.rowCount}`);

  let updated = 0;

  /**
   * 2️⃣ newProduction me update karo
   */
  for (const row of devRows.rows) {
    const res = await prodClient.query(
      `
      UPDATE patient_chats
      SET patient_id = $1
      WHERE mongo_patient_id = $2
        AND patient_id IS DISTINCT FROM $1
      `,
      [row.patient_id, row.mongo_patient_id]
    );

    if (res.rowCount > 0) {
      updated += res.rowCount;
    }
  }

  console.log(`✅ Total updated rows in newProduction: ${updated}`);

  await devClient.end();
  await prodClient.end();

  console.log("🎉 Sync completed successfully");
}

syncPatientIds().catch((err) => {
  console.error("❌ Error:", err);
});
