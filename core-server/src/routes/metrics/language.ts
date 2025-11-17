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

// --- Route definition ---
const route = createRoute({
  method: "get",
  operationId: "getLanguageModalityMetrics",
  tags: ["Dashboard"],
  path: "/dashboard/language-modality",
  summary: "Get Language & Modality Behavior Metrics",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: LanguageModalityResponseSchema,
        },
      },
      description: "Language & Modality Metrics",
    },
  },
});

// --- Roman Urdu detection dictionary ---
const romanUrduWords = new Set([
  "aap", "kaise", "hain", "krain", "kya", "ho", "main", "tum",
  "hum", "se", "ko", "hai", "ka", "mein", "de", "sakti", "baad", "mein"
  // Add more common Roman Urdu words
]);

// --- Detect English / Roman Urdu / Mixed ---
const detectEnglishOrRomanUrdu = (text: string): "english" | "romanUrdu" | "mixed" => {
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

// --- Trend calculation helper ---
const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// --- API handler ---
export const getLanguageModalityMetricsHandler = () => {
  app.openapi(route, async (c) => {
    const dateParam = c.req.query("date");
    if (!dateParam)
      return c.json({ ok: false, error: "startDate required" }, 400);

    const startDate = new Date(dateParam);
    const today = new Date();
    const msInDay = 1000 * 60 * 60 * 24;
    const periodDays =
      Math.ceil((today.getTime() - startDate.getTime()) / msInDay) + 1;

    // Previous period
    const prevStartDate = new Date(startDate.getTime() - periodDays * msInDay);
    const prevEndDate = new Date(startDate.getTime() - msInDay);

    // Fetch sessions
    const currentSessions = await db
      .select()
      .from(patientChats)
      .where(
        sql`"session_started" >= ${startDate.toISOString()} AND "session_started" <= ${today.toISOString()}`
      );

    const prevSessions = await db
      .select()
      .from(patientChats)
      .where(
        sql`"session_started" >= ${prevStartDate.toISOString()} AND "session_started" <= ${prevEndDate.toISOString()}`
      );

    // Calculate metrics per period
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
        let langs: Set<"english" | "romanUrdu" | "mixed"> = new Set();

        for (const s of userSessions) {
          for (const msg of s.messages || []) {
            if (msg.kind === "voice") hasVoice = true;
            if (msg.kind === "text") langs.add(detectEnglishOrRomanUrdu(msg.message));
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

      const totalUsers = sessionsByUser.size || 1; // avoid divide by zero
      return {
        voiceOnly: voiceOnlyUsers,
        englishOnly: englishOnlyUsers,
        romanUrduOnly: romanUrduOnlyUsers,
        mixedUsers: mixedUsers,
        voiceOnlyPerc: (voiceOnlyUsers / totalUsers) * 100,
        englishOnlyPerc: (englishOnlyUsers / totalUsers) * 100,
        romanUrduOnlyPerc: (romanUrduOnlyUsers / totalUsers) * 100,
        mixedUsersPerc: (mixedUsers / totalUsers) * 100,
      };
    };

    const currentMetrics = calculateMetrics(currentSessions);
    const prevMetrics = calculateMetrics(prevSessions);

    // Build chart data with values and percentages
    const chartData = [
      { name: "Voice Only", value: currentMetrics.voiceOnly, percentage: currentMetrics.voiceOnlyPerc },
      { name: "Roman Urdu Only", value: currentMetrics.romanUrduOnly, percentage: currentMetrics.romanUrduOnlyPerc },
      { name: "English Only", value: currentMetrics.englishOnly, percentage: currentMetrics.englishOnlyPerc },
      { name: "Mixed Language", value: currentMetrics.mixedUsers, percentage: currentMetrics.mixedUsersPerc },
    ];

    const response = {
      cards: [
        {
          title: "Voice Note–Only Users",
          value: currentMetrics.voiceOnly.toString(),
          subtitle: `${currentMetrics.voiceOnlyPerc.toFixed(1)}%`,
          trend: calculateTrend(currentMetrics.voiceOnly, prevMetrics.voiceOnly).toFixed(1),
          trendUp: currentMetrics.voiceOnly >= prevMetrics.voiceOnly,
        },
        {
          title: "English–Only Users",
          value: currentMetrics.englishOnly.toString(),
          subtitle: `${currentMetrics.englishOnlyPerc.toFixed(1)}%`,
          trend: calculateTrend(currentMetrics.englishOnly, prevMetrics.englishOnly).toFixed(1),
          trendUp: currentMetrics.englishOnly >= prevMetrics.englishOnly,
        },
        {
          title: "Roman Urdu–Only Users",
          value: currentMetrics.romanUrduOnly.toString(),
          subtitle: `${currentMetrics.romanUrduOnlyPerc.toFixed(1)}%`,
          trend: calculateTrend(currentMetrics.romanUrduOnly, prevMetrics.romanUrduOnly).toFixed(1),
          trendUp: currentMetrics.romanUrduOnly >= prevMetrics.romanUrduOnly,
        },
        {
          title: "Mixed-Language Users",
          value: currentMetrics.mixedUsers.toString(),
          subtitle: `${currentMetrics.mixedUsersPerc.toFixed(1)}%`,
          trend: calculateTrend(currentMetrics.mixedUsers, prevMetrics.mixedUsers).toFixed(1),
          trendUp: currentMetrics.mixedUsers >= prevMetrics.mixedUsers,
        },
      ],
      chartData,
    };

    return c.json(response, 200);
  });
};
