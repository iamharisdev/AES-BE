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

      const end = new Date(); // current date
      end.setHours(23, 59, 59, 999);

      // Previous range of same length
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
      const [uniqueUsersRes] = await db
        .select({
          count: sql<number>`count(DISTINCT "patient_id")`.as("count"),
        })
        .from(patientChats)
        .where(
          sql`"session_started" >= ${start.toISOString()} AND "session_started" <= ${end.toISOString()}`
        );

      const [prevUniqueUsersRes] = await db
        .select({
          count: sql<number>`count(DISTINCT "patient_id")`.as("count"),
        })
        .from(patientChats)
        .where(
          sql`"session_started" >= ${prevStart.toISOString()} AND "session_started" <= ${prevEnd.toISOString()}`
        );

      const uniqueUsersValue = Number(uniqueUsersRes?.count || 0);
      const uniqueUsersTrend = calculateTrend(
        uniqueUsersValue,
        Number(prevUniqueUsersRes?.count || 0)
      );

      // ------------------------------
      // Active Users (last 14 days within range)
      // ------------------------------
      const activeStart = new Date(end);
      activeStart.setDate(end.getDate() - 13);
      activeStart.setHours(0, 0, 0, 0);

      const prevActiveStart = new Date(activeStart);
      prevActiveStart.setDate(prevActiveStart.getDate() - 14);
      const prevActiveEnd = new Date(activeStart);
      prevActiveEnd.setHours(23, 59, 59, 999);

      const [activeUsersRes] = await db
        .select({
          count: sql<number>`count(DISTINCT "patient_id")`.as("count"),
        })
        .from(patientChats)
        .where(
          sql`"last_message_at" >= ${activeStart.toISOString()} AND "last_message_at" <= ${end.toISOString()}`
        );

      const [prevActiveUsersRes] = await db
        .select({
          count: sql<number>`count(DISTINCT "patient_id")`.as("count"),
        })
        .from(patientChats)
        .where(
          sql`"last_message_at" >= ${prevActiveStart.toISOString()} AND "last_message_at" <= ${prevActiveEnd.toISOString()}`
        );

      const activeUsersValue = Number(activeUsersRes?.count || 0);
      const activeUsersTrend = calculateTrend(
        activeUsersValue,
        Number(prevActiveUsersRes?.count || 0)
      );

      // ------------------------------
      // Total Messages
      // ------------------------------
      const [totalMessagesRes] = await db
        .select({
          count: sql<number>`sum(jsonb_array_length("messages"))`.as("count"),
        })
        .from(patientChats)
        .where(
          sql`"session_started" >= ${start.toISOString()} AND "session_started" <= ${end.toISOString()}`
        );

      const [prevTotalMessagesRes] = await db
        .select({
          count: sql<number>`sum(jsonb_array_length("messages"))`.as("count"),
        })
        .from(patientChats)
        .where(
          sql`"session_started" >= ${prevStart.toISOString()} AND "session_started" <= ${prevEnd.toISOString()}`
        );

      const totalMessagesValue = Number(totalMessagesRes?.count || 0);
      const totalMessagesTrend = calculateTrend(
        totalMessagesValue,
        Number(prevTotalMessagesRes?.count || 0)
      );

      // ------------------------------
      // Onboarding Completion Rate
      // ------------------------------
      const [completedChatsRes] = await db
        .select({ count: sql<number>`count(*)`.as("count") })
        .from(patientChats)
        .where(
          sql`"session_started" >= ${start.toISOString()} AND "session_started" <= ${end.toISOString()} AND jsonb_array_length("messages") >= 3`
        );

      const [totalChatsRes] = await db
        .select({ count: sql<number>`count(*)`.as("count") })
        .from(patientChats)
        .where(
          sql`"session_started" >= ${start.toISOString()} AND "session_started" <= ${end.toISOString()}`
        );

      const onboardingRate = totalChatsRes.count
        ? (completedChatsRes.count / totalChatsRes.count) * 100
        : 0;

      const [prevCompletedChatsRes] = await db
        .select({ count: sql<number>`count(*)`.as("count") })
        .from(patientChats)
        .where(
          sql`"session_started" >= ${prevStart.toISOString()} AND "session_started" <= ${prevEnd.toISOString()} AND jsonb_array_length("messages") >= 3`
        );

      const [prevTotalChatsRes] = await db
        .select({ count: sql<number>`count(*)`.as("count") })
        .from(patientChats)
        .where(
          sql`"session_started" >= ${prevStart.toISOString()} AND "session_started" <= ${prevEnd.toISOString()}`
        );

      const prevOnboardingRate = prevTotalChatsRes.count
        ? (prevCompletedChatsRes.count / prevTotalChatsRes.count) * 100
        : 0;
      const onboardingTrend = calculateTrend(
        onboardingRate,
        prevOnboardingRate
      );

      // ------------------------------
      // Retention Rate (return within 14 days)
      // ------------------------------
      const retentionRaw = await db
        .select({
          patient_id: sql<string>`"patient_id"`.as("patient_id"),
          firstSession: sql`MIN("session_started")`.as("firstSession"),
          lastSession: sql`MAX("session_started")`.as("lastSession"),
        })
        .from(patientChats)
        .groupBy(sql`"patient_id"`);

      const selectedRetention = retentionRaw.filter((row: any) => {
        const first = new Date(row.firstSession);
        const last = new Date(row.lastSession);
        return (
          last >= start &&
          last <= end &&
          (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24) <= 14
        );
      });

      const prevRetention = retentionRaw.filter((row: any) => {
        const first = new Date(row.firstSession);
        const last = new Date(row.lastSession);
        return (
          last >= prevStart &&
          last <= prevEnd &&
          (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24) <= 14
        );
      });

      const calcRetention = (arr: any[]) => {
        let returningUsers = 0;
        arr.forEach((row: any) => {
          const first = new Date(row.firstSession);
          const last = new Date(row.lastSession);
          if (
            (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24) <= 14 &&
            last.getTime() !== first.getTime()
          )
            returningUsers++;
        });
        return arr.length ? (returningUsers / arr.length) * 100 : 0;
      };

      const retentionValue = calcRetention(selectedRetention);
      const retentionTrend = calculateTrend(
        retentionValue,
        calcRetention(prevRetention)
      );

      // ------------------------------
      // Churn Rate
      // ------------------------------
      const prevMonthStart = new Date(start);
      prevMonthStart.setMonth(start.getMonth() - 1, 1);
      prevMonthStart.setHours(0, 0, 0, 0);
      const prevMonthEnd = new Date(start);
      prevMonthEnd.setDate(0);
      prevMonthEnd.setHours(23, 59, 59, 999);

      const currentMonthStart = new Date(start);
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0, 0, 0, 0);

      const prevMonthUsersRaw = await db
        .select({
          patient_id: sql<string>`DISTINCT "patient_id"`.as("patient_id"),
        })
        .from(patientChats)
        .where(
          sql`"last_message_at" >= ${prevMonthStart.toISOString()} AND "last_message_at" <= ${prevMonthEnd.toISOString()}`
        );

      const currentMonthUsersRaw = await db
        .select({
          patient_id: sql<string>`DISTINCT "patient_id"`.as("patient_id"),
        })
        .from(patientChats)
        .where(
          sql`"last_message_at" >= ${currentMonthStart.toISOString()} AND "last_message_at" <= ${end.toISOString()}`
        );

      const prevMonthUsers = prevMonthUsersRaw.map((u: any) => u.patient_id);
      const currentMonthUsers = currentMonthUsersRaw.map(
        (u: any) => u.patient_id
      );
      const churned = prevMonthUsers.filter(
        (id) => !currentMonthUsers.includes(id)
      );
      const churnValue = prevMonthUsers.length
        ? (churned.length / prevMonthUsers.length) * 100
        : 0;
      const churnTrend = calculateTrend(churnValue, 0);

      // ------------------------------
      // Chart Data (last 7 days up to current date)
      // ------------------------------
      const chartData: { day: string; users: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(end);
        dayStart.setDate(end.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const [dayRes] = await db
          .select({
            count: sql<number>`count(DISTINCT "patient_id")`.as("count"),
          })
          .from(patientChats)
          .where(
            sql`"session_started" >= ${dayStart.toISOString()} AND "session_started" <= ${dayEnd.toISOString()}`
          );

        chartData.push({
          day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
          users: Number(dayRes?.count || 0),
        });
      }

      const response = {
        cards: [
          {
            title: "Unique Users",
            value: uniqueUsersValue.toLocaleString(),
            trend: uniqueUsersTrend,
            trendUp: uniqueUsersTrend >= 0,
          },
          {
            title: "Active Users",
            value: activeUsersValue.toLocaleString(),
            subtitle: "currently active",
            trend: activeUsersTrend,
            trendUp: activeUsersTrend >= 0,
          },
          {
            title: "Total Messages",
            value: totalMessagesValue.toLocaleString(),
            trend: totalMessagesTrend,
            trendUp: totalMessagesTrend >= 0,
          },
          {
            title: "Onboarding Completion Rate",
            value: onboardingRate.toFixed(1),
            subtitle: "completed",
            trend: onboardingTrend,
            trendUp: onboardingTrend >= 0,
          },
          {
            title: "Retention Rate",
            value: retentionValue.toFixed(1),
            trend: retentionTrend,
            trendUp: retentionTrend >= 0,
          },
          {
            title: "Churn Rate",
            value: churnValue.toFixed(1),
            trend: churnTrend,
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
