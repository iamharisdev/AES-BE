import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { patientChats } from "@/models/patient-chats";
import { createRoute, z } from "@hono/zod-openapi";
import { and, gte, lte } from "drizzle-orm";

// ---------- Response Schema ----------
const ResponseTimeSchema = z.object({
  cards: z.array(
    z.object({
      title: z.string(),
      value: z.string(),
      subtitle: z.string().optional(),
      trend: z.string(),
      trendUp: z.boolean(),
    })
  ),
});

// ---------- Route ----------
const route = createRoute({
  method: "get",
  operationId: "getBotResponseTimeMetrics",
  tags: ["Dashboard"],
  path: "/dashboard/response-quality",
  summary: "Get Bot Response Time Metrics",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    query: z.object({
      startDate: z.string().optional().describe("Start of range (ISO)"),
      endDate: z.string().optional().describe("End of range (ISO)"),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: ResponseTimeSchema } },
      description: "Bot Response Time Metrics",
    },
  },
});

// ---------- Trend Helper ----------
const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

// ---------- Fetch chats helper ----------
const fetchChats = (from?: Date, to?: Date) => {
  if (from && to) {
    return db
      .select()
      .from(patientChats)
      .where(
        and(
          gte(patientChats.sessionStarted, from),
          lte(patientChats.sessionStarted, to)
        )
      );
  }
  return db.select().from(patientChats);
};

// ---------- Compute latency ----------
const computeLatency = (chats: (typeof patientChats)[]) => {
  let totalLatency = 0;
  let count = 0;

  for (const chat of chats) {
    const msgs = (chat.messages || []).sort(
      (a: any, b: any) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let lastUserTime: Date | null = null;

    for (const msg of msgs) {
      const sender = msg.sender?.toLowerCase();
      const ts = new Date(msg.timestamp);

      if (isNaN(ts.getTime())) continue;

      if (sender === "user") {
        lastUserTime = ts;
      } else if ((sender === "assistant" || sender === "bot") && lastUserTime) {
        const diff = ts.getTime() - lastUserTime.getTime();
        if (diff >= 0 && diff < 5 * 60 * 1000) {
          totalLatency += diff;
          count++;
        }
        lastUserTime = null;
      }
    }
  }

  return { avg: count ? totalLatency / count : 0, count };
};

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "0s";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  let result = "";
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0) result += `${minutes}m `;
  result += `${seconds}s`;

  return result.trim();
}

// ---------- Handler ----------
export const getResponseQualityMetricsHandler = () => {
  app.openapi(route, async (c) => {
    try {
      const startDateStr = c.req.query("startDate");
      const endDateStr = c.req.query("endDate");

      let start: Date;
      let end: Date;

      if (startDateStr && endDateStr) {
        start = new Date(startDateStr);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);
      } else {
        // Fetch full DB range if dates are not provided
        const minRow = await db
          .select({ min: patientChats.sessionStarted })
          .from(patientChats)
          .limit(1);
        const maxRow = await db
          .select({ max: patientChats.sessionStarted })
          .from(patientChats)
          .limit(1);

        const minDate = minRow?.[0]?.min;
        const maxDate = maxRow?.[0]?.max;

        if (!minDate || !maxDate) {
          return c.json({ cards: [] });
        }

        start = new Date(minDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(maxDate);
        end.setHours(23, 59, 59, 999);
      }

      // --- Previous period for trend ---
      const rangeMs = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - rangeMs);
      const prevEnd = new Date(end.getTime() - rangeMs);

      // --- Fetch chats ---
      const currentChats = await fetchChats(start, end);
      const previousChats = await fetchChats(prevStart, prevEnd);

      // --- Compute latency ---
      const current = computeLatency(currentChats);
      const previous = computeLatency(previousChats);
      const trend = calculateTrend(current.avg, previous.avg);

      // --- Build response ---
      return c.json(
        {
          cards: [
            {
              title: "Bot Response Time (ms)",
              value: formatDuration(current.avg),
              subtitle: `${current.count} responses analyzed`,
              trend: trend.toString(),
              trendUp: trend >= 0,
            },
          ],
        },
        200
      );
    } catch (err) {
      console.error("Error fetching response time metrics:", err);
      return c.json({ error: "Failed to fetch metrics" }, 500);
    }
  });
};
