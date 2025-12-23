// import { db } from "@/db";
// import { patient } from "@/models/patient";
// import { eq, isNull, not, and } from "drizzle-orm";

// async function addMenuValue() {
//   try {
//     // Update patients where BOTH cnic and name exist, and menu is currently null
//     const result = await db
//       .update(patient)
//       .set({ menu: "1" })
//       .where(
//         and(
//           not(eq(patient.cnic, "")),   // cnic is not empty
//           not(eq(patient.name, "")),    // name is not empty
        
//         )
//       );

//     console.log("Patients updated with menu=1:", result);
//   } catch (err) {
//     console.error("Error updating menu values:", err);
//   }
// }

// addMenuValue();
import { db } from "@/db";
import { patientChats } from "@/models/patient-chats";
import { sql } from "drizzle-orm";

const excludedIds = [
  "8683f16e-d76b-47ff-a813-e4b94c4ba667",
  "c36c482a-663b-4cdc-b4be-296257fe26d1",
  "728fe0bd-201b-47a6-aeea-f116039a276b",
  "c45b02c7-ac19-4eb3-8636-48b41323e561",
  "a500c221-9823-45c4-97b6-757c79cbd49d",
  "3affb710-b056-4ed8-92ad-5ec8faaeefb0",
  "6fbfdd9b-0057-4307-8cbe-c593e9510418",
  "77650686-8e09-41f8-b00c-87b88848fdd8",
  "7471f282-3c6d-42d2-b193-562e46c5caa1",
  "2e56a5ea-9555-4d9b-84cc-7109d8e51dde",
  "8f835111-ad65-40c1-8062-a918746c3fce",
  "ced96022-5b71-4404-8991-704095164937",
];

async function updateMongoPatientId() {
  try {
    await db
      .update(patientChats)
      .set({ mongoPatientId: sql`patient_id` }) // ✅ reference column value
      .where(
        sql`patient_id NOT IN (${sql.join(
          excludedIds.map(id => sql`${id}`),
          sql`, `
        )})`
      );

    console.log("Update completed successfully");
  } catch (err) {
    console.error("Error updating mongoPatientId:", err);
  }
}

updateMongoPatientId();
