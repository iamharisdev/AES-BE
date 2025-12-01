import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { patient } from "@/models/patient";
import { trimester } from "@/models/trimester";
import { previousPregnancy } from "@/models/previous-pregnancy";
import { obsHistory } from "@/models/obstetric-history";
import { currentPregnancy } from "@/models/current-pregnancy";
import { gynecologicalHistory } from "@/models/gynecological-history";
import { createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";

// --- Response schema ---
const EMRDropOffResponseSchema = z.object({
  onboarding: z.object({
    totalUsers: z.number(),
    cnicEntered: z.number(),
    nameEntered: z.number(),
    menuEntered: z.number(),
    dropOff: z.object({
      cnic: z.string(),
      name: z.string(),
      menu: z.string(),
    }),
  }),
  emr: z.object({
    started: z.number(),
    layer1: z.object({
      completed: z.number(),
      dropOffBeforeLayer1: z.string(),
    }),
    layer2: z.object({
      started: z.number(),
      completed: z.number(),
      dropOffAfterLayer1: z.string(),
      dropOffBeforeLayer2: z.string(),
    }),
    overallCompletionRate: z.string(),
  }),
});

// --- Route ---
const route = createRoute({
  method: "get",
  operationId: "getEMRDropOffMetrics",
  tags: ["Dashboard"],
  path: "/dashboard/dropoff",
  summary: "Get EMR Drop-off Metrics",
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
      content: { "application/json": { schema: EMRDropOffResponseSchema } },
      description: "EMR Drop-off Metrics",
    },
  },
});

// --- Handler ---
export const getEMRDropOffHandler = () => {
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
          .select({ min: sql`MIN(created_at)` })
          .from(patient);
        const maxRow = await db
          .select({ max: sql`MAX(created_at)` })
          .from(patient);

        const minDate = minRow?.[0]?.min;
        const maxDate = maxRow?.[0]?.max;

        if (!minDate || !maxDate) return c.json({ onboarding: {}, emr: {} });

        start = new Date(minDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(maxDate);
        end.setHours(23, 59, 59, 999);
      }

      const patientsInRange = await db
        .select()
        .from(patient)
        .where(
          sql`created_at >= ${start.toISOString()} AND created_at <= ${end.toISOString()}`
        );

      const totalUsers = patientsInRange.length;

      let cnicEntered = 0,
        nameEntered = 0,
        menuEntered = 0;

      let emrStarted = 0,
        layer1Completed = 0,
        layer2Started = 0,
        layer2Completed = 0;

      for (const p of patientsInRange) {
        if (p.cnic) cnicEntered++;
        if (p.name) nameEntered++;
        // if (p.menuOption) menuEntered++;

        const emrUser = p.cnic && p.name;
        if (!emrUser) continue;
        emrStarted++;

        // --- LAYER 1 ---
        let layer1Complete = false;
        const firstPreg = p.firstPregnancy?.toLowerCase();

        if (firstPreg) {
          if (firstPreg === "true"|| firstPreg) {
            const tri = (
              await db
                .select()
                .from(trimester)
                .where(sql`emr_id = ${p.id}`)
                .limit(1)
            )[0];
            if (tri?.additionalInfo) layer1Complete = true;
          } else if (firstPreg === "false" || !firstPreg) {
            const obs = (
              await db
                .select()
                .from(obsHistory)
                .where(sql`emr_id = ${p.id}`)
                .limit(1)
            )[0];
            if (obs?.childrenBirthMethods) layer1Complete = true;
          }
        }

        if (layer1Complete) layer1Completed++;

        // --- LAYER 2 ---
        let layer2Start = false;
        let layer2Complete = false;

        if (layer1Complete) {
          if (firstPreg === "true" || firstPreg) {
            const curr = (
              await db
                .select()
                .from(currentPregnancy)
                .where(sql`emr_id = ${p.id}`)
                .limit(1)
            )[0];
            const gyn = (
              await db
                .select()
                .from(gynecologicalHistory)
                .where(sql`emr_id = ${p.id}`)
                .limit(1)
            )[0];

            if (curr?.pregnancyMethod) layer2Start = true;
            if (gyn?.papSmearTest) layer2Complete = true;
          } else if (firstPreg === "false" || !firstPreg) {
            const obs = (
              await db
                .select()
                .from(obsHistory)
                .where(sql`emr_id = ${p.id}`)
                .limit(1)
            )[0];
            const prev = (
              await db
                .select()
                .from(previousPregnancy)
                .where(sql`emr_id = ${p.id}`)
                .limit(1)
            )[0];

            if (obs?.oldestChildAge || prev?.childAge) layer2Start = true;
            if (obs?.childrenHealthStatus || prev?.childCondition)
              layer2Complete = true;
          }
        }

        if (layer2Start) layer2Started++;
        if (layer2Complete) layer2Completed++;
      }

      const response = {
        onboarding: {
          totalUsers,
          cnicEntered,
          nameEntered,
          // menuEntered,
          dropOff: {
            cnic:
              (((totalUsers - cnicEntered) / totalUsers) * 100).toFixed(2) +
              "%",
            name:
              (((cnicEntered - nameEntered) / totalUsers) * 100).toFixed(2) +
              "%",
            // menu:
            //   (((nameEntered - menuEntered) / totalUsers) * 100).toFixed(2) +
            //   "%",
          },
        },
        emr: {
          started: emrStarted,
          layer1: {
            completed: layer1Completed,
            dropOffBeforeLayer1:
              (((emrStarted - layer1Completed) / emrStarted) * 100).toFixed(2) +
              "%",
          },
          layer2: {
            started: layer2Started,
            completed: layer2Completed,
            dropOffAfterLayer1:
              (
                ((layer1Completed - layer2Started) / layer1Completed) *
                100
              ).toFixed(2) + "%",
            dropOffBeforeLayer2:
              layer2Started > 0
                ? (
                    ((layer2Started - layer2Completed) / layer2Started) *
                    100
                  ).toFixed(2) + "%"
                : "0%",
          },
          overallCompletionRate:
            emrStarted > 0
              ? ((layer2Completed / emrStarted) * 100).toFixed(2) + "%"
              : "0%",
        },
      };

      return c.json(response);
    } catch (err) {
      console.error("Error in EMR drop-off metrics:", err);
      return c.json({ ok: false, error: "Failed to fetch metrics" }, 500);
    }
  });
};
