import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { patientChats } from "@/models/patient-chats";
import { createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";

const EngagementResponseSchema = z.object({
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
      totalSessions: z.number(),
    })
  ),
});

const route = createRoute({
  method: "get",
  operationId: "getEngagementMetrics",
  tags: ["Dashboard"],
  path: "/dashboard/engagement",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  responses: {
    200: {
      content: { "application/json": { schema: EngagementResponseSchema } },
      description: "Engagement Metrics",
    },
  },
});

/* ---------------- HELPERS ---------------- */

const safeNumber = (v: number) => (isNaN(v) || !isFinite(v) ? 0 : v);

const calcTrend = (current: number, previous: number) => {
  const c = safeNumber(current);
  const p = safeNumber(previous);

  if (p === 0 && c === 0) return { trend: 0, trendUp: true };
  if (p === 0) return { trend: 100, trendUp: true };

  const growth = ((c - p) / p) * 100;
  const trendUp = growth >= 0;
  return { trend: `${growth.toFixed(1)}`, trendUp };
};

const formatSessionDuration = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds <= 0) return "0s";

  // Calculate hours, minutes, seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  let result = "";
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0) result += `${minutes}m `;
  result += `${seconds}s`;

  return result.trim();
};


/* ---------------- MAIN HANDLER ---------------- */

export const getEngagementMetricsHandler = () => {
  app.openapi(route, async (c) => {
    const dateParam = c.req.query("date");
    if (!dateParam)
      return c.json({ ok: false, error: "startDate required" }, 400);

    const startDate = new Date(dateParam);
    const now = new Date();

    const msInDay = 1000 * 60 * 60 * 24;

    /* ---------------- Fetch Current Period ---------------- */
    const sessions = await db
      .select()
      .from(patientChats)
      .where(
        sql`"session_started" >= ${startDate.toISOString()} 
            AND "session_started" <= ${now.toISOString()}`
      );

    /* ---------------- Fetch Last Period ---------------- */
    const periodDays =
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    const lastStart = new Date(startDate.getTime() - periodDays * msInDay);
    const lastEnd = new Date(startDate.getTime());

    const lastSessions = await db
      .select()
      .from(patientChats)
      .where(
        sql`"session_started" >= ${lastStart.toISOString()} 
            AND "session_started" <= ${lastEnd.toISOString()}`
      );

    /* ---------------- Group by User ---------------- */
    const groupSessions = (list: typeof sessions) => {
      const m = new Map<string, typeof sessions>();
      for (const s of list) {
        if (!m.has(s.patientId)) m.set(s.patientId, []);
        m.get(s.patientId)!.push(s);
      }
      return m;
    };

    const sessionsByUser = groupSessions(sessions);
    const lastSessionsByUser = groupSessions(lastSessions);

    /* ---------------- Current Values ---------------- */
    const totalUsers = sessionsByUser.size;
    const totalSessions = sessions.length;

    const avgSessionsPerUser =
      totalUsers > 0 ? totalSessions / totalUsers : 0;

    const messagesPerUser = [...sessionsByUser.values()].map((arr) =>
      arr.reduce((sum, s) => sum + (s.messages?.length || 0), 0)
    );

    const sorted = [...messagesPerUser].sort((a, b) => a - b);
    const p90 = sorted[Math.floor(sorted.length * 0.9)] || 0;
    const powerUsers = messagesPerUser.filter((m) => m > p90).length;

    const totalMessagesAll = sessions.reduce(
      (sum, s) => sum + (s.messages?.length || 0),
      0
    );
    const avgMessagesPerSession = safeNumber(
      totalSessions === 0
        ? 0
        : totalMessagesAll / totalSessions
    );

    const totalDurationMs = sessions.reduce((sum, s) => {
      const start = new Date(s.sessionStarted).getTime();
      const end = s.lastMessageAt
        ? new Date(s.lastMessageAt).getTime()
        : start;
      return sum + (end - start);
    }, 0);

    const avgSessionDurationSec = safeNumber(
      totalSessions === 0 ? 0 : totalDurationMs / totalSessions / 1000
    );

    const weekDiff =
      (now.getTime() - startDate.getTime()) / msInDay / 7;

    const weeklySessionsPerUser =
      weekDiff > 0 && totalUsers > 0
        ? safeNumber(totalSessions / totalUsers / weekDiff)
        : 0;

    const activeDaysPerUser = [...sessionsByUser.values()].map((arr) => {
      return new Set(
        arr.map((s) => new Date(s.sessionStarted).toDateString())
      ).size;
    });

    const avgActiveDaysPerUser = activeDaysPerUser.length
      ? safeNumber(
          activeDaysPerUser.reduce((a, b) => a + b, 0) /
            activeDaysPerUser.length
        )
      : 0;

    /* ---------------- Last Period Values (for trends) ---------------- */

    const getLastVal = {
      totalSessions: lastSessions.length,
      avgSessionsPerUser:
        lastSessionsByUser.size > 0
          ? lastSessions.length / lastSessionsByUser.size
          : 0,
      powerUsers: (() => {
        const arr = [...lastSessionsByUser.values()].map((u) =>
          u.reduce((s, x) => s + (x.messages?.length || 0), 0)
        );
        const sorted2 = [...arr].sort((a, b) => a - b);
        const p90_2 = sorted2[Math.floor(sorted2.length * 0.9)] || 0;
        return arr.filter((m) => m > p90_2).length;
      })(),
      avgMessagesPerSession:
        lastSessions.length > 0
          ? safeNumber(
              lastSessions.reduce(
                (sum, s) => sum + (s.messages?.length || 0),
                0
              ) / lastSessions.length
            )
          : 0,
      avgSessionDuration: (() => {
        const total = lastSessions.reduce((sum, s) => {
          const start = new Date(s.sessionStarted).getTime();
          const end = s.lastMessageAt
            ? new Date(s.lastMessageAt).getTime()
            : start;
          return sum + (end - start);
        }, 0);
        return lastSessions.length
          ? safeNumber(total / lastSessions.length / 1000)
          : 0;
      })(),
      weeklySessionsPerUser:
        lastSessionsByUser.size > 0
          ? safeNumber(
              lastSessions.length / lastSessionsByUser.size / weekDiff
            )
          : 0,
      avgActiveDaysPerUser: (() => {
        const arr = [...lastSessionsByUser.values()].map((u) => {
          return new Set(
            u.map((s) => new Date(s.sessionStarted).toDateString())
          ).size;
        });
        return arr.length
          ? safeNumber(arr.reduce((x, y) => x + y, 0) / arr.length)
          : 0;
      })(),
    };

    /* ---------------- Trends ---------------- */
    const trends = {
      totalSessions: calcTrend(totalSessions, getLastVal.totalSessions),
      avgSessionsPerUser: calcTrend(
        avgSessionsPerUser,
        getLastVal.avgSessionsPerUser
      ),
      powerUsers: calcTrend(powerUsers, getLastVal.powerUsers),
      avgMessagesPerSession: calcTrend(
        avgMessagesPerSession,
        getLastVal.avgMessagesPerSession
      ),
      avgSessionDuration: calcTrend(
        avgSessionDurationSec,
        getLastVal.avgSessionDuration
      ),
      weeklySessionsPerUser: calcTrend(
        weeklySessionsPerUser,
        getLastVal.weeklySessionsPerUser
      ),
      avgActiveDaysPerUser: calcTrend(
        avgActiveDaysPerUser,
        getLastVal.avgActiveDaysPerUser
      ),
    };

    /* ---------------- Chart Data (Last 7 Days) ---------------- */
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const dStart = new Date(d);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);

      const count = sessions.filter(
        (s) =>
          s.sessionStarted >= dStart &&
          s.sessionStarted <= dEnd
      ).length;

      chartData.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        users: count,
      });
    }

    /* ---------------- Response ---------------- */
    const response = {
      cards: [
        {
          title: "Total Sessions",
          value: totalSessions.toString(),
          trend: trends.totalSessions.trend,
          trendUp: trends.totalSessions.trendUp,
        },
        {
          title: "Avg Sessions per User",
          value: avgSessionsPerUser.toFixed(1),
          trend: trends.avgSessionsPerUser.trend,
          trendUp: trends.avgSessionsPerUser.trendUp,
        },
        {
          title: "Power Users",
          value: powerUsers.toString(),
          trend: trends.powerUsers.trend,
          trendUp: trends.powerUsers.trendUp,
        },
        {
          title: "Avg Messages per Session",
          value: avgMessagesPerSession.toFixed(1),
          trend: trends.avgMessagesPerSession.trend,
          trendUp: trends.avgMessagesPerSession.trendUp,
        },
        {
          title: "Avg Session Duration",
          value: formatSessionDuration(avgSessionDurationSec),
          trend: trends.avgSessionDuration.trend,
          trendUp: trends.avgSessionDuration.trendUp,
        },
        {
          title: "Weekly Sessions per User",
          value: weeklySessionsPerUser.toFixed(1),
          trend: trends.weeklySessionsPerUser.trend,
          trendUp: trends.weeklySessionsPerUser.trendUp,
        },
        {
          title: "Total Active Days per User",
          value: avgActiveDaysPerUser.toFixed(1),
          trend: trends.avgActiveDaysPerUser.trend,
          trendUp: trends.avgActiveDaysPerUser.trendUp,
        },
      ],
      chartData,
    };

    return c.json(response, 200);
  });
};
