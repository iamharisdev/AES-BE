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

      // Previous period
      const prevStart = new Date(start.getTime() - rangeMs - 1000);
      const prevEnd = new Date(start.getTime() - 1000);

      const fetchChats = async (from?: Date, to?: Date) => {
        if (from && to) {
          return db
            .select()
            .from(patientChats)
            .where(
              sql`session_started >= ${from.toISOString()} 
              AND session_started <= ${to.toISOString()}`
            );
        }
        return db.select().from(patientChats);
      };

      const currentSessions = await fetchChats(start, end);
      const previousSessions = await fetchChats(prevStart, prevEnd);

      // --- METRICS CALCULATION ---
      const calculateMetrics = (sessions: typeof currentSessions) => {
        const sessionsByUser = new Map<string, typeof sessions>();

        for (const s of sessions) {
          const userId = s.patientId;
          if (!sessionsByUser.has(userId)) sessionsByUser.set(userId, []);
          sessionsByUser.get(userId)!.push(s);
        }

        let voiceMajority = 0;
        let textMajority = 0;
        let bothUsers = 0;

        let romanUrduUsers = 0;
        let englishUsers = 0;

        for (const userSessions of sessionsByUser.values()) {
          let voiceCount = 0;
          let textCount = 0;
          let totalMsg = 0;

          let allUrdu = true;
          let hasEnglish = false;

          for (const s of userSessions) {
            for (const msg of s.messages ?? []) {
              // Count modality
              if (msg.kind === "voice") voiceCount++;
              if (msg.kind === "text") textCount++;

              // Count language
              const lang = (msg.language || "").toLowerCase();
              if (lang !== "ur") allUrdu = false;
              if (lang === "en") hasEnglish = true;

              totalMsg++;
            }
          }

          if (totalMsg === 0) continue;

          const voicePerc = (voiceCount / totalMsg) * 100;
          const textPerc = (textCount / totalMsg) * 100;

          // --- Modality Rules ---
          if (voicePerc >= 80 && textPerc <= 20) voiceMajority++;
          else if (textPerc >= 80 && voicePerc <= 20) textMajority++;
          else if (voicePerc > 20 && voicePerc < 80) bothUsers++;

          // --- Language Rules ---
          if (allUrdu) romanUrduUsers++;
          if (hasEnglish) englishUsers++;
        }

        const totalUsers = sessionsByUser.size || 1;

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
        };
      };

      const currentMetrics = calculateMetrics(currentSessions);
      const prevMetrics = calculateMetrics(previousSessions);

      // --- Chart Data ---
      const chartData = [
        {
          name: "Voice Majority Users",
          value: currentMetrics.voiceMajority,
          percentage: currentMetrics.voiceMajorityPerc,
        },
        {
          name: "Text Majority Users",
          value: currentMetrics.textMajority,
          percentage: currentMetrics.textMajorityPerc,
        },
        {
          name: "Both Users",
          value: currentMetrics.bothUsers,
          percentage: currentMetrics.bothUsersPerc,
        },
        {
          name: "Roman Urdu Users",
          value: currentMetrics.romanUrduUsers,
          percentage: currentMetrics.romanUrduUsersPerc,
        },
        {
          name: "English Users",
          value: currentMetrics.englishUsers,
          percentage: currentMetrics.englishUsersPerc,
        },
      ];

      // --- Cards Response ---
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
