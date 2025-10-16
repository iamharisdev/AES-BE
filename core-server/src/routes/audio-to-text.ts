import app from "@/app";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";

const audioToTextRoute = createRoute({
  method: "post",
  path: "/audio-to-text",
  tags: ["Audio"],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z.any(), // accepts Blob or File
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            text: z.string(),
          }),
        },
      },
      description: "Transcribed text returned successfully",
    },
    400: { description: "Invalid or missing file" },
    500: { description: "Transcription failed" },
  },
});

const audioToTextHandler = () => {
  app.openapi(audioToTextRoute, async (c) => {
    try {
      const form = await c.req.formData();
      const audioFile = form.get("file");

      

      // ✅ Validate file
      if (!audioFile || typeof audioFile === "string") {
        console.error("⚠️ No audio file received or invalid format.");
        return c.json({ error: "Audio file missing or invalid" }, 400);
      }

      // ✅ Prepare the form for Whisper API
      const whisperForm = new FormData();
      whisperForm.append(
        "file",
        audioFile,
        // Bun/Node may not auto-assign filename — force one
        (audioFile as any).name || "recording.webm"
      );
      whisperForm.append("model", "whisper-1");

      // ✅ Call OpenAI Whisper API
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
        },
        body: whisperForm,
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("❌ Whisper API error:", errText);
        return c.json({ error: "Failed to transcribe audio" }, 500);
      }

      // ✅ Return transcription
      const data = await response.json();
      return c.json({ text: data.text || "(No speech detected)" }, 200);
    } catch (err) {
      console.error("❌ Server error while transcribing:", err);
      return c.json({ error: "Internal server error" }, 500);
    }
  });
};

export { audioToTextHandler };
