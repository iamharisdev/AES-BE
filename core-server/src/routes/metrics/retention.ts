import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { patientChats } from "@/models/patient-chats";
import { reminderDelivery } from "@/models/reminder-delivery";
import { createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";

// --- Response Schema ---
const ReEngagementResponseSchema = z.object({
  cards: z.array(
    z.object({
      title: z.string(),
      value: z.string(),
      subtitle: z.string().optional(),
    })
  ),
  chartData: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
      percentage: z.number(),
    })
  ),
});

// --- Route ---
const route = createRoute({
  method: "get",
  operationId: "getReEngagementRate",
  tags: ["Dashboard"],
  path: "/dashboard/retention",
  summary: "Get Re-engagement Rate (24h)",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  responses: {
    200: {
      content: { "application/json": { schema: ReEngagementResponseSchema } },
      description: "Re-engagement metrics",
    },
  },
});

// --- Handler ---
export const getRetentionMetricsHandler = () => {
  app.openapi(route, async (c) => {
    try {
      // Fetch all reminders that were sent
      const reminders = await db
        .select()
        .from(reminderDelivery)
        .where(sql`sent_at IS NOT NULL`);

      // Fetch all patient chats
      const chats = await db.select().from(patientChats);

      let reEngagedCount = 0;

      reminders.forEach((reminder) => {
        const sentTime = new Date(reminder.sentAt);
        const patientId = reminder.patientId.toString();

        // Find all chats for this patient after reminder
        const patientChatsList = chats
          .filter((chat) => chat.patientId.toString() === patientId)
          .map((chat) => new Date(chat.sessionStarted))
          .sort((a, b) => a.getTime() - b.getTime());

        const nextChat = patientChatsList.find(
          (chatDate) => chatDate.getTime() > sentTime.getTime()
        );

        if (
          nextChat &&
          (nextChat.getTime() - sentTime.getTime()) / (1000 * 60 * 60) <= 24
        ) {
          reEngagedCount++;
        }
      });

      const totalReminders = reminders.length || 1; // prevent divide by zero
      const reEngagementRate = (reEngagedCount / totalReminders) * 100;

      const response = {
        cards: [
          {
            title: "Re-engagement Rate (24h)",
            value: reEngagedCount.toString(),
            subtitle: `${reEngagementRate.toFixed(1)}%`,
          },
        ],
        chartData: [
          {
            name: "Re-engagement Rate (24h)",
            value: reEngagedCount,
            percentage: reEngagementRate,
          },
        ],
      };

      return c.json(response, 200);
    } catch (err) {
      console.error("Error fetching re-engagement rate:", err);
      return c.json(
        { ok: false, error: "Failed to fetch re-engagement rate" },
        500
      );
    }
  });
};
