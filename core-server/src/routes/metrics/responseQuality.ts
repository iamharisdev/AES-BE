import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { patientChats } from "@/models/patient-chats";
import { createRoute, z } from "@hono/zod-openapi";
import { and, gte, lte, sql } from "drizzle-orm";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const PKT = "Asia/Karachi";


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
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: ResponseTimeSchema } },
      description: "Bot Response Time Metrics",
    },
  },
});

// ---------- Helpers ----------
const calculateTrend = (current: number, previous: number) => {
  if (previous < 10) return 0
  return Math.round(((current - previous) / previous) * 100);
};

// Fetch chats in a date range (or all if range is undefined)
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

// Compute latency between user and bot messages strictly in date range
const computeLatency = (chats: any[], start: Date, end: Date) => {
  let totalLatency = 0;
  let count = 0;

  for (const chat of chats) {
    const msgs = (chat.messages || [])
      .filter((m: any) => {
        const ts = new Date(m.timestamp);
        return ts >= start && ts <= end;
      })
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let lastUserTime: Date | null = null;

    for (const msg of msgs) {
      const sender = msg.sender?.toLowerCase();
      const ts = new Date(msg.timestamp);
      if (isNaN(ts.getTime())) continue;

      if (sender === "user") {
        lastUserTime = ts;
      } else if ((sender === "assistant" || sender === "bot") && lastUserTime) {
        const diff = ts.getTime() - lastUserTime.getTime();
        if (diff >= 0 && diff < 15 * 60 * 1000) { // ignore delays >5min
          totalLatency += diff;
          count++;
        }
        lastUserTime = null;
      }
    }
  }

  return { avg: count ? totalLatency / count : 0, count };
};

// Format seconds into human-readable string
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

// ---------- Main Handler ----------
export const getResponseQualityMetricsHandler = () => {
  app.openapi(route, async (c) => {
    try {
      const startDateStr = c.req.query("startDate");
      const endDateStr = c.req.query("endDate");

      let start: Date, end: Date;

      if (startDateStr && endDateStr) {
        // Use frontend provided dates, convert to PKT start/end of day
        start = dayjs(startDateStr).tz(PKT).startOf("day").utc().toDate();
        end = dayjs(endDateStr).tz(PKT).endOf("day").utc().toDate();
      } else {
        // Fetch min/max from database
        const minRow = await db
          .select({ min: sql`MIN(session_started)` })
          .from(patientChats);
        const maxRow = await db
          .select({ max: sql`MAX(session_started)` })
          .from(patientChats);
        const minDate = minRow?.[0]?.min as string | undefined;
        const maxDate = maxRow?.[0]?.max as string | undefined;

        if (!minDate || !maxDate) return c.json({ cards: [], chartData: [] });

        // Convert min/max dates to PKT start/end of day
        start = dayjs(minDate).tz(PKT).startOf("day").utc().toDate();
        end = dayjs(maxDate).tz(PKT).endOf("day").utc().toDate();
      }

      // Previous period for trend calculation
      const rangeMs = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - rangeMs);
      const prevEnd = new Date(end.getTime() - rangeMs);

      // Fetch chats
      const currentChats = await fetchChats(start, end);
      const previousChats = await fetchChats(prevStart, prevEnd);

      // Compute latency
      const current = computeLatency(currentChats, start, end);
      const previous = computeLatency(previousChats, prevStart, prevEnd);

      const trend = calculateTrend(current.avg, previous.avg);

      return c.json(
        {
          cards: [
            {
              title: "Bot Response Time",
              value: formatDuration(current.avg / 1000), // convert ms → seconds
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
