// // deletePatientEverywhere.ts
// import { MongoClient, ObjectId } from "mongodb";
// import { Client } from "pg";
// import dotenv from "dotenv";

// dotenv.config();

// // --- Logging helper ---
// const log = {
//   info: console.log,
//   debug: console.debug,
//   warn: console.warn,
//   error: console.error,
// };

// // --- Normalize phone ---
// function normalizePhoneNumber(phone: string): string {
//   if (!phone) return "";

//   let cleaned = phone.replace(/[^\d+]/g, "");
//   cleaned = cleaned.replace(/^whatsapp:/i, "");
//   if (cleaned.startsWith("0")) {
//     cleaned = "+92" + cleaned.slice(1);
//   } else if (cleaned.startsWith("92")) {
//     cleaned = "+" + cleaned;
//   } else if (!cleaned.startsWith("+")) {
//     cleaned = "+92" + cleaned;
//   }
//   return cleaned;
// }



// // --- Mongo setup ---
// const mongoUri = "mongodb+srv://wahajkhalid:qRF1Xxh0d0rxc7K7@cluster0.nwiebld.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// const mongoDbName = "appa_db";
// const client = new MongoClient(mongoUri);

// // --- Postgres setup ---
// const pgClient = new Client({
//   host: "34.87.36.56",
//   port: 5432,
//   user: "postgres",
//   password: "sOXw0dXUmuZ7nNtTKrO90eXD3F0yWoF9",
//   database: "newProduction",
// });


// // --- Delete from Mongo ---
// async function deleteFromMongo(phone: string) {
//   const normPhone = normalizePhoneNumber(phone);
//   const dbMongo = client.db(mongoDbName);

//   const patientsCol = dbMongo.collection("patients");
//   const chatsCol = dbMongo.collection("patient_chats");
//   const kvCol = dbMongo.collection("emr_kv_memory");
//   const appaThreads = dbMongo.collection("appa_threads");

//   const patientDoc = await patientsCol.findOne({ phoneNumber: normPhone });
//   if (!patientDoc) {
//     log.info(`[MONGO] No patient found | phone=${phone}`);
//     return {};
//   }

//   const mongoId = patientDoc._id;
//   const pgPatientId = patientDoc.pg_patient_id;

//   log.info(`[MONGO] Found patient | _id=${mongoId} | pg_patient_id=${pgPatientId}`);

//   // Delete KV
//   const kvRes = kvCol ? await kvCol.deleteOne({ user_id: normPhone }) : { deletedCount: 0 };
//   log.debug(`[MONGO] Deleted EMR KV docs: ${kvRes.deletedCount}`);

//   // Delete chats
//   const chatsRes = chatsCol ? await chatsCol.deleteMany({ patientId: mongoId }) : { deletedCount: 0 };
//   log.debug(`[MONGO] Deleted patient_chats: ${chatsRes.deletedCount}`);

//   // Delete appa_threads
//   const threadRes = appaThreads
//     ? await appaThreads.deleteMany({
//         $or: [{ user_id: normPhone }, { sender: normPhone }, { phone: normPhone }],
//       })
//     : { deletedCount: 0 };
//   log.debug(`[MONGO] Deleted appa_threads: ${threadRes.deletedCount}`);

//   // Delete patient
//   const patientRes = await patientsCol.deleteOne({ _id: mongoId });
//   log.debug(`[MONGO] Deleted patient doc: ${patientRes.deletedCount}`);

//   log.info(`[MONGO] Summary | kv=${kvRes.deletedCount} | chats=${chatsRes.deletedCount} | threads=${threadRes.deletedCount} | patient=${patientRes.deletedCount}`);

//   return { mongoId, pgPatientId };
// }

// // --- Delete from Postgres ---
// async function deleteFromPostgres(phone: string, mongoId?: ObjectId, pgPatientId?: string) {
//   const normPhone = normalizePhoneNumber(phone);
//   let pid = pgPatientId;

//   if (!pid) {
//     const res = await pgClient.query(
//       `SELECT id FROM patient WHERE phone_number = $1 LIMIT 1`,
//       [normPhone]
//     );
//     pid = res.rows[0]?.id;
//   }

//   if (!pid) {
//     log.info(`[POSTGRES] No patient found | phone=${phone}`);
//     return;
//   }

//   log.info(`[POSTGRES] Patient resolved | id=${pid}`);

//   // Delete mirrored patient_chats
//   if (mongoId) {
//     try {
//       const res = await pgClient.query(`DELETE FROM patient_chats WHERE mongo_patient_id = $1`, [mongoId.toString()]);
//       log.debug(`[POSTGRES] Deleted patient_chats: ${res.rowCount}`);
//     } catch (err) {
//       log.warn(`[POSTGRES] Failed to delete patient_chats: ${err}`);
//     }
//   }

//   // Delete EMR child tables first to avoid FK violation
//   const emrChildTables = [
//     "obs_history",
//     "current_pregnancy",
//     "presenting_complaint",
//     "gynecological_history",
//     "surgical_history",
//     "family_history",
//     "personal_history",
//     "socio_economic_history",
//     "obstetric_history",
//     "medical_history"
//   ];

//   for (const tbl of emrChildTables) {
//     try {
//       const res = await pgClient.query(
//         `DELETE FROM ${tbl} WHERE emr_id IN (SELECT id FROM emr WHERE patient_id = $1)`,
//         [pid]
//       );
//       log.debug(`[POSTGRES] Deleted ${tbl}: ${res.rowCount}`);
//     } catch (err) {
//       log.warn(`[POSTGRES] Failed to delete ${tbl}: ${err.message}`);
//     }
//   }

//   // Delete EMR rows
//   try {
//     const emrRes = await pgClient.query(`DELETE FROM emr WHERE patient_id = $1`, [pid]);
//     log.debug(`[POSTGRES] Deleted EMR rows: ${emrRes.rowCount}`);
//   } catch (err) {
//     log.warn(`[POSTGRES] Failed to delete EMR rows: ${err.message}`);
//   }

//   // Delete patient
//   try {
//     const patientRes = await pgClient.query(`DELETE FROM patient WHERE id = $1`, [pid]);
//     log.debug(`[POSTGRES] Deleted patient: ${patientRes.rowCount}`);
//   } catch (err) {
//     log.warn(`[POSTGRES] Failed to delete patient: ${err.message}`);
//   }

//   log.info(`[POSTGRES] Completed deletion for patient_id=${pid}`);
// }

// // --- Main ---
// async function main() {
//   const phone = process.argv[2];
//   if (!phone) {
//     log.error("Usage: bun run deletePatientEverywhere.ts <phone>");
//     process.exit(1);
//   }

//   try {
//     await client.connect();
//     await pgClient.connect();

//     const { mongoId, pgPatientId } = await deleteFromMongo(phone);
//     await deleteFromPostgres(phone, mongoId, pgPatientId);

//     log.info("✅ Delete operation completed successfully");
//   } catch (err) {
//     log.error("❌ Failed to delete patient data:", err);
//   } finally {
//     await client.close();
//     await pgClient.end();
//   }
// }

// await main();

// delete patients if refrence not get

// import { Client } from "pg";
// import dotenv from "dotenv";

// dotenv.config();

// const log = console.log;

// const pgClient = new Client({
//   host: "34.87.36.56",
//   port: 5432,
//   user: "postgres",
//   password: "sOXw0dXUmuZ7nNtTKrO90eXD3F0yWoF9",
//   database: "cloneNewProduction",
// });

// // --- Logical link tables that may not have FK constraints
// const logicalLinkTables = [
//   { table: "patient_chats", column: "patient_id" },
//   // You can add more tables here if they reference patient.id but don't have FK
// ];

// // --- Get all tables/columns that have FK referencing patient.id ---
// async function getFkTables(): Promise<{ table_name: string; column_name: string }[]> {
//   const res = await pgClient.query(
//     `
//     SELECT
//       tc.table_name,
//       kcu.column_name
//     FROM
//       information_schema.table_constraints AS tc
//     JOIN information_schema.key_column_usage AS kcu
//       ON tc.constraint_name = kcu.constraint_name
//     JOIN information_schema.constraint_column_usage AS ccu
//       ON ccu.constraint_name = tc.constraint_name
//     WHERE
//       tc.constraint_type = 'FOREIGN KEY'
//       AND ccu.table_name = 'patient';
//   `
//   );

//   return res.rows;
// }

// // --- Check if patient has any FK or logical links ---
// async function patientHasLinks(
//   pid: string,
//   fkTables: { table_name: string; column_name: string }[]
// ): Promise<boolean> {

//   // 1️⃣ FK tables
//   for (const { table_name, column_name } of fkTables) {
//     const res = await pgClient.query(
//       `SELECT 1 FROM ${table_name} WHERE ${column_name} = $1 LIMIT 1`,
//       [pid]
//     );
//     if (res.rowCount > 0) {
//       log(`❌ Patient id=${pid} linked in table: ${table_name}`);
//       return true;
//     }
//   }

//   // 2️⃣ Logical link tables (manual check)
//   for (const { table, column } of logicalLinkTables) {
//     const res = await pgClient.query(
//       `SELECT 1 FROM ${table} WHERE ${column} = $1 LIMIT 1`,
//       [pid]
//     );
//     if (res.rowCount > 0) {
//       log(`❌ Patient id=${pid} has logical link in table: ${table}`);
//       return true;
//     }
//   }

//   return false;
// }

// // --- Delete orphan patients ---
// async function deleteOrphanPatients() {
//   const fkTables = await getFkTables();

//   log(`👥 Total FK tables referencing patient: ${fkTables.length}`);
//   log(`📝 Also checking logical tables: ${logicalLinkTables.map(t => t.table).join(", ")}`);

//   const patientsRes = await pgClient.query(`SELECT id FROM patient ORDER BY id`);
//   log(`👥 Total patients: ${patientsRes.rowCount}`);

//   let deleted = 0;
//   let skipped = 0;

//   for (const row of patientsRes.rows) {
//     const pid = row.id;

//     const hasLinks = await patientHasLinks(pid, fkTables);

//     if (hasLinks) {
//       skipped++;
//       continue;
//     }

//     // ✅ SAFE DELETE
//     await pgClient.query(`DELETE FROM patient WHERE id = $1`, [pid]);
//     deleted++;
//     log(`🗑️ Deleted orphan patient id=${pid}`);
//   }

//   log("================================");
//   log(`✅ Deleted: ${deleted}`);
//   log(`⏭️ Skipped (linked): ${skipped}`);
// }

// // --- Main ---
// async function main() {
//   try {
//     await pgClient.connect();
//     await deleteOrphanPatients();
//   } catch (err) {
//     console.error("❌ Error:", err);
//   } finally {
//     await pgClient.end();
//   }
// }

// main();


//insert patients


// import { Client } from "pg";
// import fs from "fs";
// import dotenv from "dotenv";

// dotenv.config();

// const pgClient = new Client({
//   host: "34.87.36.56",
//   port: 5432,
//   user: "postgres",
//   password: "sOXw0dXUmuZ7nNtTKrO90eXD3F0yWoF9",
//   database: "cloneNewProduction",
// });

// async function insertPatients(jsonPath: string) {
//   const data = fs.readFileSync(jsonPath, "utf-8");
//   const patients = JSON.parse(data);

//   for (const p of patients) {
//     // Check for existing patient by phone_number
//     const exists = await pgClient.query(
//       "SELECT 1 FROM patient WHERE phone_number = $1 LIMIT 1",
//       [p.phone_number]
//     );

//     if (exists.rowCount > 0) {
//       console.log(`⚠️ Skipping duplicate patient: ${p.phone_number}`);
//       continue;
//     }

//     // Insert patient
//     const columns = Object.keys(p).join(", ");
//     const values = Object.values(p);
//     const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

//     await pgClient.query(
//       `INSERT INTO patient (${columns}) VALUES (${placeholders})`,
//       values
//     );

//     console.log(`✅ Inserted patient: ${p.phone_number}`);
//   }
// }

// async function main() {
//   try {
//     await pgClient.connect();
//     await insertPatients("/home/shahzaib-malik/projects/Nodejs/core-backend/core-server/src/scripts/patient.json"); // your JSON file path
//   } catch (err) {
//     console.error("❌ Error:", err);
//   } finally {
//     await pgClient.end();
//   }
// }

// main();


//delete orphanChats

// import { Client } from "pg";
// import dotenv from "dotenv";

// dotenv.config();

// const pgClient = new Client({
//   host: "34.87.36.56",
//   port: 5432,
//   user: "postgres",
//   password: "sOXw0dXUmuZ7nNtTKrO90eXD3F0yWoF9",
//   database: "cloneNewProduction",
// });

// async function listOrphanChats() {
//   await pgClient.connect();

//   // Orphan chats with valid UUID
//   const res = await pgClient.query(`
//     SELECT *
//     FROM patient_chats
//     WHERE patient_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
//       AND patient_id::uuid NOT IN (SELECT id FROM patient)
//   `);

//   console.log(`👀 Orphan chats with valid UUIDs: ${res.rowCount}`);
//   console.table(res.rows);

//   // Orphan chats with invalid UUID
//   const invalidRes = await pgClient.query(`
//     SELECT *
//     FROM patient_chats
//     WHERE patient_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
//   `);

//   console.log(`👀 Chats with invalid patient_id: ${invalidRes.rowCount}`);
//   console.table(invalidRes.rows);

//   await pgClient.end();
// }

// listOrphanChats();


// insert patient chats

import { Client } from "pg";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();


const pgClient = new Client({
  host: "34.87.36.56",
  port: 5432,
  user: "postgres",
  password: "sOXw0dXUmuZ7nNtTKrO90eXD3F0yWoF9",
  database: "cloneNewProduction",
});

// --- Helper: check valid UUID ---
function isValidUUID(uuid: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

// --- Insert patient_chats safely ---
async function insertPatientChats(jsonPath: string) {
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);
  console.log(data.length)
  const chats = Array.isArray(data) ? data : data.chats;

  if (!Array.isArray(chats)) throw new Error("Invalid JSON format, expected array or { chats: [...] }");

  for (const chat of chats) {
    const patientId = chat.patient_id;

    // 1️⃣ Ignore invalid UUIDs
    if (!patientId || !isValidUUID(patientId)) {
      console.warn(`⚠️ Skipping invalid patient_id: ${patientId}`);
      continue;
    }

    // 2️⃣ Check if patient exists
    const patientRes = await pgClient.query(
      "SELECT 1 FROM patient WHERE id = $1 LIMIT 1",
      [patientId]
    );

    if (patientRes.rowCount === 0) {
      console.warn(`⚠️ Skipping chat: patient_id ${patientId} does not exist in patient table`);
      continue;
    }

    // 3️⃣ Check duplicate in patient_chats
    const existsRes = await pgClient.query(
      "SELECT 1 FROM patient_chats WHERE patient_id = $1 LIMIT 1",
      [patientId]
    );

    if (existsRes.rowCount > 0) {
      console.log(`⏭️ Skipping duplicate chat for patient_id: ${patientId}`);
      continue;
    }

    // 4️⃣ Insert chat
    const columns = Object.keys(chat).join(", ");
    const values = Object.values(chat);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

    await pgClient.query(
      `INSERT INTO patient_chats (${columns}) VALUES (${placeholders})`,
      values
    );

    console.log(`✅ Inserted chat for patient_id: ${patientId}`);
  }
}
// --- Main ---
async function main() {
  try {
    await pgClient.connect();

    // Pass your JSON file path here
 
    await insertPatientChats("/home/shahzaib-malik/projects/Nodejs/core-backend/core-server/src/scripts/patient_chats.json"); 
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await pgClient.end();
  }
}

main();
