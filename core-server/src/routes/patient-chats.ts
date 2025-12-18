import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { requireHealthWorker } from "@/middleware/role";
import { patient } from "@/models/patient";
import { patientChats } from "@/models/patient-chats";
import { createRoute, z } from "@hono/zod-openapi";
import { eq, desc, gte, sql } from "drizzle-orm";

// Schemas
const MessageSchema = z.object({
  sender: z.string(),
  message: z.string(),
  timestamp: z.string(),
});

const PatientChatSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string(),
  sessionStarted: z.date(),
  lastMessageAt: z.date().nullable(),
  messages: z.array(MessageSchema).nullable(),
  createdAt: z.date().nullable(),
});

const CreatePatientChatSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  messages: z.array(MessageSchema).optional(),
});

const UpdatePatientChatSchema = z.object({
  messages: z.array(MessageSchema),
});

const ErrorSchema = z.object({
  error: z.string(),
});

// List all patient chats
const listPatientChatsRoute = createRoute({
  method: "get",
  operationId: "listPatientChats",
  tags: ["Patient Chats"],
  path: "/patient-chats",
  summary: "List all patient chat sessions (Health Worker only)",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware, requireHealthWorker],
  request: {
    query: z.object({
      patientId: z.string().optional(),
      limit: z.string().optional().transform((val) => (val ? parseInt(val) : 50)),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(PatientChatSchema),
        },
      },
      description: "Returns list of patient chat sessions",
    },
  },
});




export const listPatientChatsHandler = () => {
  app.openapi(listPatientChatsRoute, async (c) => {
    const { patientId, limit } = c.req.valid("query");

    // 🔹 Only chats from Oct 1, 2025 onwards
    const cutoffDate = new Date("2025-10-01T00:00:00Z");

    let query = db
      .select({
        id: patientChats.id,
        patientId: patientChats.patientId,
        sessionStarted: patientChats.sessionStarted,
        lastMessageAt: patientChats.lastMessageAt,
        messages: patientChats.messages,
        createdAt: patientChats.createdAt,

        // from patient table
        patientPhoneNumber: patient.phoneNumber,
      })
      .from(patientChats)

      // ✅ FIX #1 — CAST uuid → text for JOIN
      .leftJoin(
        patient,
        sql`${patient.id}::text = ${patientChats.patientId}`
      )

      // ✅ FIX #2 — normal date filter (safe)
      .where(gte(patientChats.sessionStarted, cutoffDate))

      .orderBy(desc(patientChats.lastMessageAt));

    // ✅ FIX #3 — CAST patientId filter
    if (patientId) {
      query = query.where(
        sql`${patientChats.patientId} = ${patientId}`
      ) as any;
    }

    query = query.limit(limit || 50) as any;

    const chats = await query.execute();

    return c.json(chats, 200);
  });
};

// Get single patient chat by ID
const getPatientChatByIdRoute = createRoute({
  method: "get",
  operationId: "getPatientChatById",
  tags: ["Patient Chats"],
  path: "/patient-chats/{id}",
  summary: "Get patient chat session by ID (Health Worker only)",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware, requireHealthWorker],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PatientChatSchema,
        },
      },
      description: "Returns patient chat session",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Chat session not found",
    },
  },
});

export const getPatientChatByIdHandler = () => {
  app.openapi(getPatientChatByIdRoute, async (c) => {
    const { id } = c.req.valid("param");

    // Filter date: Only chats from October 1st, 2025 onwards
    const cutoffDate = new Date('2025-10-01T00:00:00Z');

    const [chat] = await db
      .select()
      .from(patientChats)
      .where(eq(patientChats.id, id))
      .execute();

    if (!chat) {
      return c.json({ error: "Chat session not found" }, 404);
    }

    // Check if chat is from the allowed date range
    if (chat.sessionStarted < cutoffDate) {
      return c.json({ error: "Chat session not found" }, 404);
    }

    return c.json(chat, 200);
  });
};

// Create new patient chat session
const createPatientChatRoute = createRoute({
  method: "post",
  operationId: "createPatientChat",
  tags: ["Patient Chats"],
  path: "/patient-chats",
  summary: "Create new patient chat session (Health Worker only)",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware, requireHealthWorker],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreatePatientChatSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: PatientChatSchema,
        },
      },
      description: "Chat session created successfully",
    },
  },
});

export const createPatientChatHandler = () => {
  app.openapi(createPatientChatRoute, async (c) => {
    const { patientId, messages } = c.req.valid("json");

    const now = new Date();

    const [newChat] = await db
      .insert(patientChats)
      .values({
        patientId,
        sessionStarted: now,
        lastMessageAt: messages && messages.length > 0 ? now : null,
        messages: messages || [],
      })
      .returning();

    return c.json(newChat, 201);
  });
};

// Update patient chat (add messages)
const updatePatientChatRoute = createRoute({
  method: "patch",
  operationId: "updatePatientChat",
  tags: ["Patient Chats"],
  path: "/patient-chats/{id}",
  summary: "Update patient chat messages (Health Worker only)",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware, requireHealthWorker],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdatePatientChatSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PatientChatSchema,
        },
      },
      description: "Chat session updated successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Chat session not found",
    },
  },
});

export const updatePatientChatHandler = () => {
  app.openapi(updatePatientChatRoute, async (c) => {
    const { id } = c.req.valid("param");
    const { messages } = c.req.valid("json");

    // Filter date: Only chats from October 1st, 2025 onwards
    const cutoffDate = new Date('2025-10-01T00:00:00Z');

    const [existingChat] = await db
      .select()
      .from(patientChats)
      .where(eq(patientChats.id, id))
      .execute();

    if (!existingChat) {
      return c.json({ error: "Chat session not found" }, 404);
    }

    // Check if chat is from the allowed date range
    if (existingChat.sessionStarted < cutoffDate) {
      return c.json({ error: "Chat session not found" }, 404);
    }

    const [updatedChat] = await db
      .update(patientChats)
      .set({
        messages,
        lastMessageAt: new Date(),
      })
      .where(eq(patientChats.id, id))
      .returning();

    return c.json(updatedChat, 200);
  });
};

// Delete patient chat session
const deletePatientChatRoute = createRoute({
  method: "delete",
  operationId: "deletePatientChat",
  tags: ["Patient Chats"],
  path: "/patient-chats/{id}",
  summary: "Delete patient chat session (Health Worker only)",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware, requireHealthWorker],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: "Chat session deleted successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Chat session not found",
    },
  },
});

export const deletePatientChatHandler = () => {
  app.openapi(deletePatientChatRoute, async (c) => {
    const { id } = c.req.valid("param");

    // Filter date: Only chats from October 1st, 2025 onwards
    const cutoffDate = new Date('2025-10-01T00:00:00Z');

    const [existingChat] = await db
      .select()
      .from(patientChats)
      .where(eq(patientChats.id, id))
      .execute();

    if (!existingChat) {
      return c.json({ error: "Chat session not found" }, 404);
    }

    // Check if chat is from the allowed date range
    if (existingChat.sessionStarted < cutoffDate) {
      return c.json({ error: "Chat session not found" }, 404);
    }

    await db.delete(patientChats).where(eq(patientChats.id, id)).execute();

    return c.json({ message: "Chat session deleted successfully" }, 200);
  });
};

// Add a single message to existing chat
const addMessageToChatRoute = createRoute({
  method: "post",
  operationId: "addMessageToChat",
  tags: ["Patient Chats"],
  path: "/patient-chats/{id}/messages",
  summary: "Add a message to patient chat (Health Worker only)",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware, requireHealthWorker],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PatientChatSchema,
        },
      },
      description: "Message added successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Chat session not found",
    },
  },
});

export const addMessageToChatHandler = () => {
  app.openapi(addMessageToChatRoute, async (c) => {
    const { id } = c.req.valid("param");
    const newMessage = c.req.valid("json");

    // Filter date: Only chats from October 1st, 2025 onwards
    const cutoffDate = new Date('2025-10-01T00:00:00Z');

    const [existingChat] = await db
      .select()
      .from(patientChats)
      .where(eq(patientChats.id, id))
      .execute();

    if (!existingChat) {
      return c.json({ error: "Chat session not found" }, 404);
    }

    // Check if chat is from the allowed date range
    if (existingChat.sessionStarted < cutoffDate) {
      return c.json({ error: "Chat session not found" }, 404);
    }

    const currentMessages = (existingChat.messages as any[]) || [];
    const updatedMessages = [...currentMessages, newMessage];

    const [updatedChat] = await db
      .update(patientChats)
      .set({
        messages: updatedMessages,
        lastMessageAt: new Date(),
      })
      .where(eq(patientChats.id, id))
      .returning();

    return c.json(updatedChat, 200);
  });
};
