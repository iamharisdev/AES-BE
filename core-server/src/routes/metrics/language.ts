import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { patientChats } from "@/models/patient-chats";
import { createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";

// --- Response schema ---
const LanguageModalityResponseSchema = z.object({
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
      name: z.string(),
      value: z.number(),
      percentage: z.number(),
    })
  ),
});

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
      startDate: z.string().optional().describe("Start of range (ISO)"),
      endDate: z.string().optional().describe("End of range (ISO)"),
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

// --- Roman Urdu dictionary ---
const romanUrduWords = new Set([
  "aap",
  "kaise",
  "hain",
  "krain",
  "kya",
  "ho",
  "main",
  "tum",
  "hum",
  "se",
  "ko",
  "hai",
  "ka",
  "mein",
  "de",
  "sakti",
  "baad",
  "mein",
]);

// --- Detect language ---
const detectEnglishOrRomanUrdu = (
  text: string
): "english" | "romanUrdu" | "mixed" => {
  if (!text) return "english";

  const words = text
    .toLowerCase()
    .replace(/[^a-z\u0600-\u06FF\s]/gi, "")
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "english";

  let romanCount = 0;
  let englishCount = 0;

  for (const word of words) {
    if (romanUrduWords.has(word)) romanCount++;
    else if (/^[a-z]+$/i.test(word)) englishCount++;
  }

  if (romanCount > 0 && englishCount === 0) return "romanUrdu";
  if (englishCount > 0 && romanCount === 0) return "english";
  return "mixed";
};

// --- Trend helper ---
const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// --- Main Handler ---
export const getLanguageModalityMetricsHandler = () => {
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
        // No dates → use whole DB
        const minRow = await db
          .select({ min: sql`MIN(session_started)` })
          .from(patientChats);
        const maxRow = await db
          .select({ max: sql`MAX(session_started)` })
          .from(patientChats);

        const minDate = minRow?.[0]?.min;
        const maxDate = maxRow?.[0]?.max;

        if (!minDate || !maxDate) return c.json({ cards: [], chartData: [] });

        start = new Date(minDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(maxDate);
        end.setHours(23, 59, 59, 999);
      }

      const rangeMs = end.getTime() - start.getTime();

      // Previous period for trend
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

      // --- Calculate Metrics ---
      const calculateMetrics = (sessions: typeof currentSessions) => {
        const sessionsByUser = new Map<string, typeof sessions>();
        for (const s of sessions) {
          const userId = s.patientId;
          if (!sessionsByUser.has(userId)) sessionsByUser.set(userId, []);
          sessionsByUser.get(userId)!.push(s);
        }

        let voiceOnlyUsers = 0;
        let englishOnlyUsers = 0;
        let romanUrduOnlyUsers = 0;
        let mixedUsers = 0;

        for (const userSessions of sessionsByUser.values()) {
          let hasVoice = false;
          const langs = new Set<"english" | "romanUrdu" | "mixed">();

          for (const s of userSessions) {
            for (const msg of s.messages || []) {
              if (msg.kind === "voice") hasVoice = true;
              else if (msg.kind === "text")
                langs.add(detectEnglishOrRomanUrdu(msg.message));
            }
          }

          if (hasVoice && langs.size === 0) voiceOnlyUsers++;
          else if (langs.size === 1) {
            const lang = Array.from(langs)[0];
            if (lang === "english") englishOnlyUsers++;
            else if (lang === "romanUrdu") romanUrduOnlyUsers++;
            else mixedUsers++;
          } else if (langs.size > 1) mixedUsers++;
        }

        const totalUsers = sessionsByUser.size || 1;

        return {
          voiceOnly: voiceOnlyUsers,
          englishOnly: englishOnlyUsers,
          romanUrduOnly: romanUrduOnlyUsers,
          mixedUsers,
          voiceOnlyPerc: (voiceOnlyUsers / totalUsers) * 100,
          englishOnlyPerc: (englishOnlyUsers / totalUsers) * 100,
          romanUrduOnlyPerc: (romanUrduOnlyUsers / totalUsers) * 100,
          mixedUsersPerc: (mixedUsers / totalUsers) * 100,
        };
      };

      const currentMetrics = calculateMetrics(currentSessions);
      const prevMetrics = calculateMetrics(previousSessions);

      // --- Chart Data ---
      const chartData = [
        {
          name: "Voice Only",
          value: currentMetrics.voiceOnly,
          percentage: currentMetrics.voiceOnlyPerc,
        },
        {
          name: "Roman Urdu Only",
          value: currentMetrics.romanUrduOnly,
          percentage: currentMetrics.romanUrduOnlyPerc,
        },
        {
          name: "English Only",
          value: currentMetrics.englishOnly,
          percentage: currentMetrics.englishOnlyPerc,
        },
        {
          name: "Mixed Language",
          value: currentMetrics.mixedUsers,
          percentage: currentMetrics.mixedUsersPerc,
        },
      ];

      // --- Response ---
      const response = {
        cards: [
          {
            title: "Voice Note–Only Users",
            value: currentMetrics.voiceOnly.toString(),
            subtitle: `${currentMetrics.voiceOnlyPerc.toFixed(1)}`,
            trend: calculateTrend(
              currentMetrics.voiceOnly,
              prevMetrics.voiceOnly
            ).toFixed(1),
            trendUp: currentMetrics.voiceOnly >= prevMetrics.voiceOnly,
          },
          {
            title: "English–Only Users",
            value: currentMetrics.englishOnly.toString(),
            subtitle: `${currentMetrics.englishOnlyPerc.toFixed(1)}`,
            trend: calculateTrend(
              currentMetrics.englishOnly,
              prevMetrics.englishOnly
            ).toFixed(1),
            trendUp: currentMetrics.englishOnly >= prevMetrics.englishOnly,
          },
          {
            title: "Roman Urdu–Only Users",
            value: currentMetrics.romanUrduOnly.toString(),
            subtitle: `${currentMetrics.romanUrduOnlyPerc.toFixed(1)}`,
            trend: calculateTrend(
              currentMetrics.romanUrduOnly,
              prevMetrics.romanUrduOnly
            ).toFixed(1),
            trendUp: currentMetrics.romanUrduOnly >= prevMetrics.romanUrduOnly,
          },
          {
            title: "Mixed-Language Users",
            value: currentMetrics.mixedUsers.toString(),
            subtitle: `${currentMetrics.mixedUsersPerc.toFixed(1)}%`,
            trend: calculateTrend(
              currentMetrics.mixedUsers,
              prevMetrics.mixedUsers
            ).toFixed(1),
            trendUp: currentMetrics.mixedUsers >= prevMetrics.mixedUsers,
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
