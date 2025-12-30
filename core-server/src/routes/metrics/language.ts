import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { patientChats } from "@/models/patient-chats";
import { createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const PKT = "Asia/Karachi";

// --- Response schema ---
const LanguageModalityResponseSchema = z.object({
  cards: z.array(
    z.object({
      title: z.string(),
      value: z.string(),
      subtitle: z.string().optional(),
      trend: z.string(),
      trendUp: z.boolean(),
      avgSessionDuration: z.string(),
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

// =======================
// DURATION FORMATTER
// =======================
function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "0s";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  let out = "";
  if (hours) out += `${hours}h `;
  if (minutes) out += `${minutes}m `;
  out += `${seconds}s`;
  return out.trim();
}

// --- TREND CALCULATION ---
const calculateTrend = (current: number, previous: number) => {
  if (previous < 10) return 0
  console.log(current , previous, ((current - previous) / previous) * 100)
  return ((current - previous) / previous) * 100;
};

// --- Route ---
const route = createRoute({
  method: "get",
  operationId: "getLanguageModalityMetrics",
  tags: ["Dashboard"],
  path: "/dashboard/language-modality",
  summary: "Get Language & Modality Behavior Metrics",
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
      content: {
        "application/json": { schema: LanguageModalityResponseSchema },
      },
      description: "Language & Modality Metrics",
    },
  },
});

// --- Handler ---
export const getLanguageModalityMetricsHandler = () => {
  app.openapi(route, async (c) => {
    try {
      const startDateStr = c.req.query("startDate");
      const endDateStr = c.req.query("endDate");

    let start: Date, end: Date;
   
         if (startDateStr && endDateStr) {
           // Use frontend provided dates, convert to PKT start/end of day
           start = dayjs(startDateStr).tz(PKT).startOf("day").toDate();
           end = dayjs(endDateStr).tz(PKT).endOf("day").toDate();
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
           start = dayjs(minDate).tz(PKT).startOf("day").toDate();
           end = dayjs(maxDate).tz(PKT).endOf("day").toDate();
         }

      const rangeMs = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - rangeMs - 1000);
      const prevEnd = new Date(start.getTime() - 1000);

      const fetchChats = async (from?: Date, to?: Date) => {
        if (from && to) {
          return db
            .select()
            .from(patientChats)
            .where(
              sql`session_started >= ${from.toISOString()} AND session_started <= ${to.toISOString()}`
            );
        }
        return db.select().from(patientChats);
      };

      const currentSessions = await fetchChats(start, end);
      const previousSessions = await fetchChats(prevStart, prevEnd);

      // --- METRICS CALCULATION ---
      const calculateMetrics = (sessions: typeof currentSessions) => {
        const sessionsByUser = new Map();
        for (const s of sessions) {
          const userId = s.patientId;
          if (!sessionsByUser.has(userId)) sessionsByUser.set(userId, []);
          sessionsByUser.get(userId).push(s);
        }

        let voiceMajority = 0;
        let textMajority = 0;
        let bothUsers = 0;
        let romanUrduUsers = 0;
        let englishUsers = 0;

        const voiceSessionsArr: number[] = [];
        const textSessionsArr: number[] = [];
        const bothSessionsArr: number[] = [];
        const romanUrduSessionsArr: number[] = [];
        const englishSessionsArr: number[] = [];

        for (const [userId, userSessions] of sessionsByUser.entries()) {
          let voiceCount = 0;
          let textCount = 0;
          let totalInbound = 0;
          let allUrdu = true;
          let hasEnglish = false;
          const sessionsByDay: Record<string, any[]> = {};

          for (const s of userSessions) {
            for (const msg of s.messages ?? []) {
              if (msg.direction !== "inbound") continue; // only inbound
              const ts = msg.timestamp ? new Date(msg.timestamp) : new Date();
              const dayKey = `${ts.getFullYear()}-${
                ts.getMonth() + 1
              }-${ts.getDate()}`;
              if (!sessionsByDay[dayKey]) sessionsByDay[dayKey] = [];
              sessionsByDay[dayKey].push(msg);

              // Modality count
              if (msg.kind === "voice") voiceCount++;
              else if (msg.kind === "text") textCount++;
              // text+voice messages do NOT increment voice/text counts

              // Language
              const lang = (msg.current_language || "").toLowerCase().trim();
              if (lang !== "ur") allUrdu = false;
              if (
                lang === "en" ||
                (msg.normalized_user_text || "")
                  .toLowerCase()
                  .includes("i want to talk in english")
              )
                hasEnglish = true;

              totalInbound++;
            }
          }

          if (totalInbound === 0) continue;
          const voicePerc = (voiceCount / totalInbound) * 100;

          const sessionDurations: number[] = Object.values(sessionsByDay).map(
            (msgs) => {
              msgs.sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              );
              const startTime = new Date(msgs[0].timestamp).getTime();
              const endTime = new Date(
                msgs[msgs.length - 1].timestamp
              ).getTime();
              return (endTime - startTime) / 1000;
            }
          );

          // CLASSIFY USERS
          if (voicePerc >= 80) {
            voiceMajority++;
            voiceSessionsArr.push(...sessionDurations);
          } else if (voicePerc <= 20) {
            textMajority++;
            textSessionsArr.push(...sessionDurations);
          } else if (voicePerc > 20 && voicePerc < 80) {
            bothUsers++;
            bothSessionsArr.push(...sessionDurations);
          }

          if (allUrdu) {
            romanUrduUsers++;
            romanUrduSessionsArr.push(...sessionDurations);
          }
          if (hasEnglish) {
            englishUsers++;
            englishSessionsArr.push(...sessionDurations);
          }
        }

        const totalUsers = sessionsByUser.size || 1;
        const avg = (arr: number[]) =>
          arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        return {
          voiceMajority,
          textMajority,
          bothUsers,
          romanUrduUsers,
          englishUsers,
          voiceMajorityPerc: (voiceMajority / totalUsers) * 100,
          textMajorityPerc: (textMajority / totalUsers) * 100,
          bothUsersPerc: (bothUsers / totalUsers) * 100,
          romanUrduUsersPerc: (romanUrduUsers / totalUsers) * 100,
          englishUsersPerc: (englishUsers / totalUsers) * 100,
          avgVoiceDuration: avg(voiceSessionsArr),
          avgTextDuration: avg(textSessionsArr),
          avgBothDuration: avg(bothSessionsArr),
          avgRomanUrduDuration: avg(romanUrduSessionsArr),
          avgEnglishDuration: avg(englishSessionsArr),
        };
      };

      const currentMetrics = calculateMetrics(currentSessions);
      const prevMetrics = calculateMetrics(previousSessions);

      const chartData = [
        {
          name: "Voice Majority Users",
          value: currentMetrics.voiceMajority,
          percentage: Number(currentMetrics.voiceMajorityPerc.toFixed(2)),
        },
        {
          name: "Text Majority Users",
          value: currentMetrics.textMajority,
          percentage: Number(currentMetrics.textMajorityPerc.toFixed(2)),
        },
        {
          name: "Both Users",
          value: currentMetrics.bothUsers,
          percentage: Number(currentMetrics.bothUsersPerc.toFixed(2)),
        },
        {
          name: "Roman Urdu Users",
          value: currentMetrics.romanUrduUsers,
          percentage: Number(currentMetrics.romanUrduUsersPerc.toFixed(2)),
        },
        {
          name: "English Users",
          value: currentMetrics.englishUsers,
          percentage: Number(currentMetrics.englishUsersPerc.toFixed(2)),
        },
      ];

      const response = {
        cards: [
          {
            title: "Voice Majority Users",
            value: currentMetrics.voiceMajority.toString(),
            subtitle: `${currentMetrics.voiceMajorityPerc.toFixed(1)}%`,
            trend: calculateTrend(
              currentMetrics.voiceMajority,
              prevMetrics.voiceMajority
            ).toFixed(1),
            trendUp: currentMetrics.voiceMajority >= prevMetrics.voiceMajority,
            avgSessionDuration: formatDuration(currentMetrics.avgVoiceDuration),
          },
          {
            title: "Text Majority Users",
            value: currentMetrics.textMajority.toString(),
            subtitle: `${currentMetrics.textMajorityPerc.toFixed(1)}%`,
            trend: calculateTrend(
              currentMetrics.textMajority,
              prevMetrics.textMajority
            ).toFixed(1),
            trendUp: currentMetrics.textMajority >= prevMetrics.textMajority,
            avgSessionDuration: formatDuration(currentMetrics.avgTextDuration),
          },
          {
            title: "Both (Text + Voice) Users",
            value: currentMetrics.bothUsers.toString(),
            subtitle: `${currentMetrics.bothUsersPerc.toFixed(1)}%`,
            trend: calculateTrend(
              currentMetrics.bothUsers,
              prevMetrics.bothUsers
            ).toFixed(1),
            trendUp: currentMetrics.bothUsers >= prevMetrics.bothUsers,
            avgSessionDuration: formatDuration(currentMetrics.avgBothDuration),
          },
          {
            title: "Roman Urdu–Only Users",
            value: currentMetrics.romanUrduUsers.toString(),
            subtitle: `${currentMetrics.romanUrduUsersPerc.toFixed(1)}%`,
            trend: calculateTrend(
              currentMetrics.romanUrduUsers,
              prevMetrics.romanUrduUsers
            ).toFixed(1),
            trendUp:
              currentMetrics.romanUrduUsers >= prevMetrics.romanUrduUsers,
            avgSessionDuration: formatDuration(
              currentMetrics.avgRomanUrduDuration
            ),
          },
          {
            title: "English Users",
            value: currentMetrics.englishUsers.toString(),
            subtitle: `${currentMetrics.englishUsersPerc.toFixed(1)}%`,
            trend: calculateTrend(
              currentMetrics.englishUsers,
              prevMetrics.englishUsers
            ).toFixed(1),
            trendUp: currentMetrics.englishUsers >= prevMetrics.englishUsers,
            avgSessionDuration: formatDuration(
              currentMetrics.avgEnglishDuration
            ),
          },
        ],
        chartData,
      };

      return c.json(response, 200);
    } catch (err) {
      console.error("Error in language-modality metrics:", err);
      return c.json({ ok: false, error: "Failed to fetch metrics" }, 500);
    }
  });
};
