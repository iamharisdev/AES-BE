import { db } from "@/db";
import { patient } from "@/models/patient";
import { eq, isNull, not, and } from "drizzle-orm";

async function addMenuValue() {
  try {
    // Update patients where BOTH cnic and name exist, and menu is currently null
    const result = await db
      .update(patient)
      .set({ menu: "1" })
      .where(
        and(
          not(eq(patient.cnic, "")),   // cnic is not empty
          not(eq(patient.name, "")),    // name is not empty
        
        )
      );

    console.log("Patients updated with menu=1:", result);
  } catch (err) {
    console.error("Error updating menu values:", err);
  }
}

addMenuValue();
