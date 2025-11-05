// scripts/create-patient-emr.ts
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { sha256 } from "hono/utils/crypto";

// 🧱 Models
import { hospital } from "@/models/hospital";
import { user, UserRole } from "@/models/user";
import { patient } from "@/models/patient";
import { emr } from "@/models/emr";

import { medicalHistory } from "@/models/medical-history";
import { familyHistory } from "@/models/family-history";
import { gynecologicalHistory } from "@/models/gynecological-history";
import { obsHistory } from "@/models/obstetric-history";
import { personalHistory } from "@/models/personal-history";
import { previousPregnancy } from "@/models/previous-pregnancy";
import { surgicalHistory } from "@/models/surgical-history";
import { currentPregnancy } from "@/models/current-pregnancy";

// 🏥 Static configuration
const hospitalId = "2636b6de-29fb-4810-b470-e8be37494f8b";
const hospitalName = "Awaaz e Sehat Hospital";
const hospitalAddress = "123 Main Street, Karachi";
const hospitalDescription = "Primary health facility for testing.";

const doctorName = "Super Admin";
const doctorEmail = "superadmin@example.com";
const doctorPhone = "03001234567";
const doctorPassword = "Admin@123";
const doctorRole = UserRole.Doctor;

// 👩‍🍼 Sample patient info
const samplePatient = {
  name: "Test Patient",
  age: "28",
  cnic: "12345-6789012-3",
  phoneNumber: "03111222333",
  gestationalAge: "12 weeks",
  education: "Intermediate",
  location: "Karachi",
  occupation: "Housewife",
  married_years: "5",
  total_pregnancies: "2",
  living_children: "1",
};

// 🏥 1️⃣ Ensure Hospital
async function ensureHospital() {
  const existing = await db.select().from(hospital).where(eq(hospital.id, hospitalId));
  if (existing.length > 0) {
    console.log("🏥 Hospital already exists:", existing[0].name);
    return existing[0];
  }

  console.log("🏗 Creating hospital...");
  const [newHospital] = await db
    .insert(hospital)
    .values({
      id: hospitalId,
      name: hospitalName,
      address: hospitalAddress,
      description: hospitalDescription,
    })
    .returning();

  console.log("✅ Hospital created:", newHospital.name);
  return newHospital;
}

// 👨‍⚕️ 2️⃣ Ensure User (Doctor)
async function ensureUser() {
  const existing = await db.select().from(user).where(eq(user.email, doctorEmail));
  if (existing.length > 0) {
    console.log("👤 User already exists:", existing[0].email);
    return existing[0];
  }

  const encryptedPassword = await sha256(doctorPassword);

  console.log("👤 Creating user...");
  const [newUser] = await db
    .insert(user)
    .values({
      hospitalId,
      name: doctorName,
      phoneNumber: doctorPhone,
      email: doctorEmail,
      encryptedPassword,
      role: doctorRole,
    })
    .returning();

  console.log("✅ User created successfully:", newUser.email);
  return newUser;
}

// 👩‍🍼 3️⃣ Create Patient
async function createPatient(doctorId: string) {
  console.log("👶 Creating patient...");
  const [newPatient] = await db
    .insert(patient)
    .values({
      ...samplePatient,
      doctorId,
      hospitalId,
    })
    .returning();

  console.log("✅ Patient created:", newPatient.name);
  return newPatient;
}

// 🩺 4️⃣ Create EMR
async function createEmr(patientId: string, phone: string) {
  console.log("🩻 Creating EMR record...");
  const [newEmr] = await db
    .insert(emr)
    .values({
      phone,
      visit: 1,
      patientId,
    })
    .returning();

  console.log("✅ EMR created:", newEmr.id);
  return newEmr;
}

// 📋 5️⃣ Create related EMR records
async function createRelatedEmrTables(emrId: string) {
  console.log("🧩 Creating related EMR tables...");

  await db.insert(currentPregnancy).values({
    emrId,
    pregnancyDetectionMethod: "Urine Test",
    folicAcid: "Yes",
    currentProblems: "Nausea and fatigue",
  });

  await db.insert(medicalHistory).values({
    emrId,
    medicalConditions: "No chronic conditions",
    currentMedications: "Folic acid",
  });

  await db.insert(familyHistory).values({
    emrId,
    familyMedicalConditions: "No known family diseases",
  });

  await db.insert(gynecologicalHistory).values({
    emrId,
    menstrualRegularity: "Regular",
    familyPlanningMethod: "None",
  });

  await db.insert(obsHistory).values({
    emrId,
    childrenBirthMethods: "Normal Delivery",
    childrenBirthDetails: "No complications",
  });

  await db.insert(personalHistory).values({
    emrId,
    diet: "Balanced diet",
    substanceUse: "None",
    allergyStatus: "No known allergies",
  });

  await db.insert(previousPregnancy).values({
    emrId,
    birthMethod: "Normal",
    childCondition: "Healthy",
    pastPregnancyComplications: "None",
  });

  await db.insert(surgicalHistory).values({
    emrId,
    surgicalHistory: "No surgeries",
  });

  console.log("✅ All related EMR tables created successfully!");
}

// 🚀 MAIN FUNCTION
async function main() {
  try {
    console.log("🏁 Starting full setup...");

    const hospitalData = await ensureHospital();
    const userData = await ensureUser();

    const newPatient = await createPatient(userData.id);
    const newEmr = await createEmr(newPatient.id, newPatient.phoneNumber);
    await createRelatedEmrTables(newEmr.id);

    console.log("🎉 Full workflow completed successfully!");
    console.log("🧾 Summary:");
    console.table({
      hospital: hospitalData.name,
      doctor: userData.email,
      patient: newPatient.name,
      emrId: newEmr.id,
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during script:", error);
    process.exit(1);
  }
}

main();
