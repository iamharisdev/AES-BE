// scripts/create-user.ts
import { db } from "@/db";
import { hospital } from "@/models/hospital";
import { user, UserRole } from "@/models/user";
import { eq } from "drizzle-orm";
import { sha256 } from "hono/utils/crypto";

// 🏥 Fixed hospital ID
const hospitalId = "2636b6de-29fb-4810-b470-e8be37494f8b";

// 🧑 New user details
const name = "Super Admin";
const phoneNumber = "03001234567";
const email = "superadmin@example.com";
const password = "Admin@123";
const role = UserRole.Doctor;

// 🏥 Hospital details
const hospitalName = "Awaaz e Sehat Hospital";
const hospitalAddress = "123 Main Street, Karachi";
const hospitalDescription = "Primary health facility for testing.";

// ✅ Ensure hospital exists
async function ensureHospital() {
  const existing = await db
    .select()
    .from(hospital)
    .where(eq(hospital.id, hospitalId));

  if (existing.length > 0) {
    console.log("🏥 Hospital already exists:", existing[0].name);
    return;
  }

  console.log("🏗 Creating hospital...");
  await db.insert(hospital).values({
    id: hospitalId,
    name: hospitalName,
    address: hospitalAddress,
    description: hospitalDescription,
  });

  console.log("✅ Hospital created successfully.");
}

// 👤 Ensure user exists or create
async function ensureUser() {
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.email, email));

  if (existingUser.length > 0) {
    console.log("👤 User already exists:", existingUser[0].email);
    return;
  }

  const encryptedPassword = await sha256(password);

  console.log("👤 Creating user...");
  const [newUser] = await db
    .insert(user)
    .values({
      hospitalId,
      name,
      phoneNumber,
      email,
      encryptedPassword,
      role,
    })
    .returning();

  console.log("✅ User created successfully:");
  console.table(newUser);
}

// 🚀 Main function
async function main() {
  try {
    await ensureHospital(); // 1️⃣ Ensure hospital
    await ensureUser();     // 2️⃣ Create user after hospital exists
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating hospital/user:", error);
    process.exit(1);
  }
}

main();
