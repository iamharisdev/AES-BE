import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { patient } from "@/models/patient";
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
      userList: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            phone: z.string(),
            lastActivity: z.string().nullable(),
          })
        )
        .optional(),
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
  if (previous < 10) return 0;
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
        start = dayjs(startDateStr).tz(PKT).startOf("day").utc().toDate();
        end = dayjs(endDateStr).tz(PKT).endOf("day").utc().toDate();
      } else {
        const minRow = await db
          .select({ min: sql`MIN(session_started)` })
          .from(patientChats);
        const maxRow = await db
          .select({ max: sql`MAX(session_started)` })
          .from(patientChats);

        const minDate = minRow?.[0]?.min as string | undefined;
        const maxDate = maxRow?.[0]?.max as string | undefined;

        if (!minDate || !maxDate) {
          return c.json({ cards: [], chartData: [] });
        }

        start = dayjs(minDate).tz(PKT).startOf("day").utc().toDate();
        end = dayjs(maxDate).tz(PKT).endOf("day").utc().toDate();
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
      const allChats = await fetchChats();
      // =======================
      // PATIENT MAP
      // =======================
      const patients = await db.select().from(patient);
      const patientMap = new Map(patients.map((p) => [p.id, p]));

      // =======================
      // CHATS BY PATIENT
      // =======================
      const chatsByPatient = new Map<string, typeof currentSessions>();
      for (const s of [...currentSessions, ...previousSessions]) {
        if (!chatsByPatient.has(s.patientId)) {
          chatsByPatient.set(s.patientId, []);
        }
        chatsByPatient.get(s.patientId)!.push(s);
      }

      // =======================
      // MAP USERLIST: FIXED
      // =======================
      // Always include all users in the set, regardless of messages
      const mapUserList = (userIds: Set<string>) =>
        Array.from(userIds).map((id) => {
          const userChats = chatsByPatient.get(id) ?? [];
          const patientData = patientMap.get(id);

          const lastActivity =
            userChats[0]?.lastMessageAt ?? patientData?.createdAt ?? null;

          return {
            id,
            name: patientData?.name || "Unknown",
            phone: patientData?.phoneNumber || "",
            lastActivity,
          };
        });

      // =======================
      // METRICS CALCULATION
      // =======================
      const calculateMetrics = (sessions: typeof currentSessions) => {
        const sessionsByUser = new Map<string, typeof sessions>();
        for (const s of sessions) {
          if (!sessionsByUser.has(s.patientId))
            sessionsByUser.set(s.patientId, []);
          sessionsByUser.get(s.patientId)!.push(s);
        }

        const voiceSet = new Set<string>();
        const textSet = new Set<string>();
        const bothSet = new Set<string>();
        const romanUrduSet = new Set<string>();
        const englishSet = new Set<string>();

        const voiceDur: number[] = [];
        const textDur: number[] = [];
        const bothDur: number[] = [];
        const romanDur: number[] = [];
        const englishDur: number[] = [];

        for (const [userId, userSessions] of sessionsByUser.entries()) {
          let voiceCount = 0,
            textCount = 0,
            totalInbound = 0,
            allUrdu = true,
            hasEnglish = false;

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

          // Classification
          if (voicePerc >= 80) {
            voiceSet.add(userId);
            voiceDur.push(...sessionDurations);
          } else if (voicePerc <= 20) {
            textSet.add(userId);
            textDur.push(...sessionDurations);
          } else {
            bothSet.add(userId);
            bothDur.push(...sessionDurations);
          }

          if (allUrdu) {
            romanUrduSet.add(userId);
            romanDur.push(...sessionDurations);
          }

          if (hasEnglish) {
            englishSet.add(userId);
            englishDur.push(...sessionDurations);
          }
        }

        const avg = (arr: number[]) =>
          arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        const totalUsers = sessionsByUser.size || 1;

        return {
          counts: {
            voice: voiceSet.size,
            text: textSet.size,
            both: bothSet.size,
            roman: romanUrduSet.size,
            english: englishSet.size,
          },
          perc: {
            voice: (voiceSet.size / totalUsers) * 100,
            text: (textSet.size / totalUsers) * 100,
            both: (bothSet.size / totalUsers) * 100,
            roman: (romanUrduSet.size / totalUsers) * 100,
            english: (englishSet.size / totalUsers) * 100,
          },
          avg: {
            voice: avg(voiceDur),
            text: avg(textDur),
            both: avg(bothDur),
            roman: avg(romanDur),
            english: avg(englishDur),
          },
          users: {
            voice: voiceSet,
            text: textSet,
            both: bothSet,
            roman: romanUrduSet,
            english: englishSet,
          },
        };
      };

      const current = calculateMetrics(currentSessions);
      const prev = calculateMetrics(previousSessions);

      const response = {
        cards: [
          {
            title: "Voice Majority Users",
            value: current.counts.voice.toString(),
            subtitle: `${current.perc.voice.toFixed(1)}%`,
            trend: calculateTrend(
              current.counts.voice,
              prev.counts.voice
            ).toFixed(1),
            trendUp: current.counts.voice >= prev.counts.voice,
            avgSessionDuration: formatDuration(current.avg.voice),
            userList: mapUserList(current.users.voice),
          },
          {
            title: "Text Majority Users",
            value: current.counts.text.toString(),
            subtitle: `${current.perc.text.toFixed(1)}%`,
            trend: calculateTrend(
              current.counts.text,
              prev.counts.text
            ).toFixed(1),
            trendUp: current.counts.text >= prev.counts.text,
            avgSessionDuration: formatDuration(current.avg.text),
            userList: mapUserList(current.users.text),
          },
          {
            title: "Both (Text + Voice) Users",
            value: current.counts.both.toString(),
            subtitle: `${current.perc.both.toFixed(1)}%`,
            trend: calculateTrend(
              current.counts.both,
              prev.counts.both
            ).toFixed(1),
            trendUp: current.counts.both >= prev.counts.both,
            avgSessionDuration: formatDuration(current.avg.both),
            userList: mapUserList(current.users.both),
          },
          {
            title: "Roman Urdu–Only Users",
            value: current.counts.roman.toString(),
            subtitle: `${current.perc.roman.toFixed(1)}%`,
            trend: calculateTrend(
              current.counts.roman,
              prev.counts.roman
            ).toFixed(1),
            trendUp: current.counts.roman >= prev.counts.roman,
            avgSessionDuration: formatDuration(current.avg.roman),
            userList: mapUserList(current.users.roman),
          },
          {
            title: "English Users",
            value: current.counts.english.toString(),
            subtitle: `${current.perc.english.toFixed(1)}%`,
            trend: calculateTrend(
              current.counts.english,
              prev.counts.english
            ).toFixed(1),
            trendUp: current.counts.english >= prev.counts.english,
            avgSessionDuration: formatDuration(current.avg.english),
            userList: mapUserList(current.users.english),
          },
        ],
        chartData: [
          {
            name: "Voice",
            value: current.counts.voice,
            percentage: Number(current.perc.voice.toFixed(1)),
          },
          {
            name: "Text",
            value: current.counts.text,
            percentage: Number(current.perc.text.toFixed(1)),
          },
          {
            name: "Both",
            value: current.counts.both,
            percentage: Number(current.perc.both.toFixed(1)),
          },
          {
            name: "Roman Urdu",
            value: current.counts.roman,
            percentage: Number(current.perc.roman.toFixed(1)),
          },
          {
            name: "English",
            value: current.counts.english,
            percentage: Number(current.perc.english.toFixed(1)),
          },
        ],
      };

      return c.json(response, 200);
    } catch (err) {
      console.error("Error in language-modality metrics:", err);
      return c.json({ error: "Failed to fetch metrics" }, 500);
    }
  });
};
