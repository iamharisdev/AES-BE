import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { patientChats } from "@/models/patient-chats";
import { createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";

const SuccessResponseSchema = z.object({
  cards: z.array(
    z.object({
      title: z.string(),
      value: z.string(),
      subtitle: z.string().optional(),
      trend: z.string(),
      trendUp: z.boolean(),
    })
  ),
  chartData: z.array(
    z.object({
      day: z.string(),
      users: z.number(),
    })
  ),
});

const route = createRoute({
  method: "get",
  operationId: "getReachActivationMetrics",
  tags: ["Dashboard"],
  path: "/dashboard/reach-activation",
  summary: "Get Reach & Activation Metrics for Dashboard",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    query: z.object({
      startDate: z
        .string()
        .datetime()
        .describe("Start of selected range (ISO 8601)"),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
      description: "Reach & Activation Metrics",
    },
  },
});

const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  const percent = ((current - previous) / previous) * 100;
  return Math.round(Math.min(Math.max(percent, -100), 100));
};

export const getReachActivationMetricsHandler = () => {
  app.openapi(route, async (c) => {
    try {
      const { startDate } = c.req.valid("query");

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      // ------------------------------
      // Previous range of same length
      // ------------------------------
      const prevStart = new Date(start);
      prevStart.setDate(
        start.getDate() - (end.getDate() - start.getDate() + 1)
      );
      prevStart.setHours(0, 0, 0, 0);
      const prevEnd = new Date(start);
      prevEnd.setHours(23, 59, 59, 999);

      // ------------------------------
      // Unique Users
      // ------------------------------
      const getUniqueUsers = async (from: Date, to: Date) => {
        try {
          const [res] = await db
            .select({
              count: sql<number>`count(DISTINCT "patient_id")`.as("count"),
            })
            .from(patientChats)
            .where(
              sql`"session_started" >= ${from.toISOString()} AND "session_started" <= ${to.toISOString()}`
            );
          return Number(res?.count || 0);
        } catch {
          return 0;
        }
      };

      const uniqueUsersValue = await getUniqueUsers(start, end);
      const prevUniqueUsersValue = await getUniqueUsers(prevStart, prevEnd);
      const uniqueUsersTrend = calculateTrend(
        uniqueUsersValue,
        prevUniqueUsersValue
      );

      // ------------------------------
      // Active Users (last 14 days)
      // ------------------------------
      const getActiveUsers = async (from: Date, to: Date) => {
        try {
          const [res] = await db
            .select({
              count: sql<number>`count(DISTINCT "patient_id")`.as("count"),
            })
            .from(patientChats)
            .where(
              sql`"last_message_at" >= ${from.toISOString()} AND "last_message_at" <= ${to.toISOString()}`
            );
          return Number(res?.count || 0);
        } catch {
          return 0;
        }
      };

      const activeStart = new Date(end);
      activeStart.setDate(end.getDate() - 13);
      activeStart.setHours(0, 0, 0, 0);
      const prevActiveStart = new Date(activeStart);
      prevActiveStart.setDate(prevActiveStart.getDate() - 14);
      const prevActiveEnd = new Date(activeStart);
      prevActiveEnd.setHours(23, 59, 59, 999);

      const activeUsersValue = await getActiveUsers(activeStart, end);
      const prevActiveUsersValue = await getActiveUsers(
        prevActiveStart,
        prevActiveEnd
      );
      const activeUsersTrend = calculateTrend(
        activeUsersValue,
        prevActiveUsersValue
      );

      // ------------------------------
      // Total Messages
      // ------------------------------
      const getTotalMessages = async (from: Date, to: Date) => {
        try {
          const [res] = await db
            .select({
              count: sql<number>`sum(jsonb_array_length("messages"))`.as(
                "count"
              ),
            })
            .from(patientChats)
            .where(
              sql`"session_started" >= ${from.toISOString()} AND "session_started" <= ${to.toISOString()}`
            );
          return Number(res?.count || 0);
        } catch {
          return 0;
        }
      };

      const totalMessagesValue = await getTotalMessages(start, end);
      const prevTotalMessagesValue = await getTotalMessages(prevStart, prevEnd);
      const totalMessagesTrend = calculateTrend(
        totalMessagesValue,
        prevTotalMessagesValue
      );

      // ------------------------------
      // Onboarding Completion Rate
      // ------------------------------
      const getOnboardingRate = async (from: Date, to: Date) => {
        try {
          const [completedRes] = await db
            .select({ count: sql<number>`count(*)`.as("count") })
            .from(patientChats)
            .where(
              sql`"session_started" >= ${from.toISOString()} AND "session_started" <= ${to.toISOString()} AND jsonb_array_length("messages") >= 3`
            );

          const [totalRes] = await db
            .select({ count: sql<number>`count(*)`.as("count") })
            .from(patientChats)
            .where(
              sql`"session_started" >= ${from.toISOString()} AND "session_started" <= ${to.toISOString()}`
            );

          return totalRes.count
            ? (completedRes.count / totalRes.count) * 100
            : 0;
        } catch {
          return 0;
        }
      };

      const onboardingRate = await getOnboardingRate(start, end);
      const prevOnboardingRate = await getOnboardingRate(prevStart, prevEnd);
      const onboardingTrend = calculateTrend(
        onboardingRate,
        prevOnboardingRate
      );

      // ------------------------------
      // Retention Rate (Static, last 14 days return)
      // ------------------------------
      const retentionRate = await (async () => {
        try {
          const retentionRaw = await db
            .select({
              patient_id: sql<string>`"patient_id"`.as("patient_id"),
              firstSession: sql`MIN("session_started")`.as("firstSession"),
              lastSession: sql`MAX("session_started")`.as("lastSession"),
            })
            .from(patientChats)
            .groupBy(sql`"patient_id"`);

          const returningUsers = retentionRaw.filter((row: any) => {
            const first = new Date(row.firstSession);
            const last = new Date(row.lastSession);
            return (
              last.getTime() !== first.getTime() &&
              (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24) <= 14
            );
          });

          return retentionRaw.length
            ? (returningUsers.length / retentionRaw.length) * 100
            : 0;
        } catch {
          return 0;
        }
      })();

      const retentionTrend = 0; // static, no previous comparison

      // ------------------------------
      // Churn Rate (Static)
      // ------------------------------
      const churnRate = await (async () => {
        try {
          const now = new Date();
          const prevMonthStart = new Date(now);
          prevMonthStart.setMonth(now.getMonth() - 1, 1);
          prevMonthStart.setHours(0, 0, 0, 0);
          const prevMonthEnd = new Date(now);
          prevMonthEnd.setDate(0);
          prevMonthEnd.setHours(23, 59, 59, 999);

          const currentMonthStart = new Date(now);
          currentMonthStart.setDate(1);
          currentMonthStart.setHours(0, 0, 0, 0);

          const prevUsersRaw = await db
            .select({
              patient_id: sql<string>`DISTINCT "patient_id"`.as("patient_id"),
            })
            .from(patientChats)
            .where(
              sql`"last_message_at" >= ${prevMonthStart.toISOString()} AND "last_message_at" <= ${prevMonthEnd.toISOString()}`
            );

          const currentUsersRaw = await db
            .select({
              patient_id: sql<string>`DISTINCT "patient_id"`.as("patient_id"),
            })
            .from(patientChats)
            .where(
              sql`"last_message_at" >= ${currentMonthStart.toISOString()} AND "last_message_at" <= ${now.toISOString()}`
            );

          const prevUsers = prevUsersRaw.map((u: any) => u.patient_id);
          const currentUsers = currentUsersRaw.map((u: any) => u.patient_id);

          const churned = prevUsers.filter((id) => !currentUsers.includes(id));
          return prevUsers.length
            ? (churned.length / prevUsers.length) * 100
            : 0;
        } catch {
          return 0;
        }
      })();

      const churnTrend = 0; // static, no previous comparison

      // ------------------------------
      // Chart Data (Last 7 days)
      // ------------------------------
      const chartData: { day: string; users: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        try {
          const dayStart = new Date(end);
          dayStart.setDate(end.getDate() - i);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);

          const [res] = await db
            .select({
              count: sql<number>`count(DISTINCT "patient_id")`.as("count"),
            })
            .from(patientChats)
            .where(
              sql`"session_started" >= ${dayStart.toISOString()} AND "session_started" <= ${dayEnd.toISOString()}`
            );

          chartData.push({
            day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
            users: Number(res?.count || 0),
          });
        } catch {
          chartData.push({ day: "N/A", users: 0 });
        }
      }

      const response = {
        cards: [
          {
            title: "Unique Users",
            value: uniqueUsersValue.toLocaleString(),
            trend: uniqueUsersTrend.toString(),
            trendUp: uniqueUsersTrend >= 0,
          },
          {
            title: "Active Users",
            value: activeUsersValue.toLocaleString(),
            subtitle: "currently active",
            trend: activeUsersTrend.toString(),
            trendUp: activeUsersTrend >= 0,
          },
          {
            title: "Total Messages",
            value: totalMessagesValue.toLocaleString(),
            trend: totalMessagesTrend.toString(),
            trendUp: totalMessagesTrend >= 0,
          },
          {
            title: "Onboarding Completion Rate",
            value: onboardingRate.toFixed(1),
            subtitle: "completed",
            trend: onboardingTrend.toString(),
            trendUp: onboardingTrend >= 0,
          },
          {
            title: "Retention Rate",
            value: retentionRate.toFixed(1),
            trend: retentionTrend.toString(),
            trendUp: retentionTrend >= 0,
          },
          {
            title: "Churn Rate",
            value: churnRate.toFixed(1),
            trend: churnTrend.toString(),
            trendUp: churnTrend < 0,
          },
        ],
        chartData,
      };

      return c.json(response, 200);
    } catch (err) {
      console.error("Error in reach-activation:", err);
      return c.json({ error: "Failed to fetch metrics" }, 500);
    }
  });
};
