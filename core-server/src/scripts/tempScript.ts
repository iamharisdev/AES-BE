
import { db } from "@/db";
import { patientChats } from "@/models/patient-chats";
import { eq } from "drizzle-orm";

async function updateFirst20ChatsLanguage() {
  console.log("Fetching chats...");

  const chats = await db.select().from(patientChats).limit(20);

  console.log("Total chats fetched:", chats.length);
  console.log("Updating first 20 chats → current_language = 'ur'");

  for (const chat of chats) {
    if (!Array.isArray(chat.messages) || chat.messages.length === 0) {
      console.log(`Skipping chat (no messages): ${chat.id}`);
      continue;
    }

    const updatedMessages = chat.messages.map((msg) => ({
      ...msg,
      current_language: "ur",
    }));

    console.log(`Updating chat: ${chat.id}`);

    await db
      .update(patientChats)
      .set({ messages: updatedMessages })
      .where(eq(patientChats.id, chat.id));
  }

  console.log("Done! First 20 chats updated.");
}

updateFirst20ChatsLanguage()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error running script:", err);
    process.exit(1);
  });
