
import { db } from "@/db";
import { patientChats } from "@/models/patient-chats";
import { eq } from "drizzle-orm";

async function updateMessages() {
  console.log("Fetching all chats...");
 
  const chats = await db.select().from(patientChats);

  // pehly 20 chats
  const first20 = chats.slice(0, 20);
  const remaining = chats.slice(20);

  console.log("Total chats:", chats.length);
  console.log("First 20 will get: language=ur, flow=emr");
  console.log("Remaining will get: mixed language, flow=appa_chat");

  // --------------------------
  // UPDATE FIRST 20 CHATS
  // --------------------------
  for (const chat of first20) {
    if (!Array.isArray(chat.messages)) continue;

    // ALL messages → ur
    let updatedMessages = chat.messages.map((msg) => ({
      ...msg,
      current_language: "ur",
      current_flow: "emr",
    }));

    console.log(`Updating (first20): ${chat.id}`);

    await db
      .update(patientChats)
      .set({ messages: updatedMessages })
      .where(eq(patientChats.id, chat.id));
  }

  // --------------------------
  // UPDATE REMAINING CHATS
  // --------------------------
  for (const chat of remaining) {
    if (!Array.isArray(chat.messages)) continue;

    let updatedMessages = chat.messages.map((msg, idx) => ({
      ...msg,
      current_language: idx % 2 === 0 ? "ur" : "en", // alternate language
      current_flow: "appa",
    }));

    console.log(`Updating (remaining): ${chat.id}`);

    await db
      .update(patientChats)
      .set({ messages: updatedMessages })
      .where(eq(patientChats.id, chat.id));
  }

  console.log("Completed updating all chats.");
}

updateMessages()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
