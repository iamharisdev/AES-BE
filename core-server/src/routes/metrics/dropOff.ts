import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { createRoute, z } from "@hono/zod-openapi";
import { eq, gte, lte } from "drizzle-orm";

import { patient } from "@/models/patient";
import { emr } from "@/models/emr";
import { trimester } from "@/models/trimester";
import { currentPregnancy } from "@/models/current-pregnancy";
import { gynecologicalHistory } from "@/models/gynecological-history";
import { obsHistory } from "@/models/obstetric-history";
import { previousPregnancy } from "@/models/previous-pregnancy";

const DashboardResponseSchema = z.object({
  kpis: z.object({
    emrCompletionRate: z.string(),
    overallDropoffRate: z.string(),
  }),
  onboarding: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      total: z.number(),
      metricKey: z.string(),
    })
  ),
  emr: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      total: z.number(),
      metricKey: z.string(),
    })
  ),
});

const route = createRoute({
  method: "get",
  operationId: "getDashboardMetrics",
  tags: ["Dashboard"],
  path: "/dashboard/dropoff",
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
      content: { "application/json": { schema: DashboardResponseSchema } },
      description: "EMR & Onboarding KPIs",
    },
  },
});

export const getEMRDropOffHandler = () => {
  app.openapi(route, async (c) => {
    try {
      const startDateStr = c.req.query("startDate");
      const endDateStr = c.req.query("endDate");

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (startDateStr) startDate = new Date(startDateStr);
      if (endDateStr) endDate = new Date(endDateStr);

      // FETCH PATIENTS
      let allPatients = await db.select().from(patient);
      if (startDate && endDate) {
        allPatients = allPatients.filter(
          (p) =>
            new Date(p.createdAt) >= startDate! &&
            new Date(p.createdAt) <= endDate!
        );
      }
      const totalOnboarding = allPatients.length;

      const onboardStarted = allPatients.filter(
        (p) =>  p.cnic || p.name || p.menu
      ).length;
      const cnicEntered = allPatients.filter((p) => p.cnic).length;
      const nameEntered = allPatients.filter((p) => p.name).length;
      const menuSelected = allPatients.filter((p) => p.menu).length;


      // FETCH EMRS
      let allEmrs = await db.select().from(emr);
      if (startDate && endDate) {
        allEmrs = allEmrs.filter(
          (e) =>
            new Date(e.createdAt) >= startDate! &&
            new Date(e.createdAt) <= endDate!
        );
      }

      let emrStarted = 0;
      let layer1Complete = 0;
      let layer2Complete = 0;
      let emrSubmitted = 0;

      for (const e of allEmrs) {
        const p = (
          await db.select().from(patient).where(eq(patient.id, e.patientId))
        )[0];
        if (!p) continue;

        if (p.age) {
          emrStarted++;

          const tri = (
            await db.select().from(trimester).where(eq(trimester.emrId, e.id))
          )[0];
          const obs = (
            await db.select().from(obsHistory).where(eq(obsHistory.emrId, e.id))
          )[0];
          const pp = (
            await db
              .select()
              .from(previousPregnancy)
              .where(eq(previousPregnancy.emrId, e.id))
          )[0];

          const layer1Done =
            tri?.additionalInfo ||
            obs?.childrenBirthMethods ||
            pp?.birthMethod ||
            pp?.operationReason;
          if (layer1Done) {
            layer1Complete++;

            const cp = (
              await db
                .select()
                .from(currentPregnancy)
                .where(eq(currentPregnancy.emrId, e.id))
            )[0];

            const layer2Started =
              cp?.pregnancyMethod || pp?.childAge || obs?.oldestChildAge;
            if (layer2Started) {
              const gy = (
                await db
                  .select()
                  .from(gynecologicalHistory)
                  .where(eq(gynecologicalHistory.emrId, e.id))
              )[0];
              const layer2Done =
                gy?.papSmearTest ||
                pp?.childCondition ||
                obs?.childrenHealthStatus;
              if (layer2Done) {
                layer2Complete++;
                emrSubmitted++;
              }
            }
          }
        }
      }

      const emrCompletionRate = emrStarted
        ? ((emrSubmitted / emrStarted) * 100).toFixed(1) + "%"
        : "0%";
      const overallDropoffRate = emrStarted
        ? (100 - parseFloat(emrCompletionRate)).toFixed(1) + "%"
        : "0%";

      return c.json({
        kpis: {
          emrCompletionRate,
          overallDropoffRate,
        },
        onboarding: [
          {
            label: "Started Onboarding",
            value: onboardStarted,
            total: totalOnboarding,
            metricKey: "onboard-started",
          },
          {
            label: "CNIC Entered",
            value: cnicEntered,
            total: totalOnboarding,
            metricKey: "cnic-entered",
          },
          {
            label: "Name Entered",
            value: nameEntered,
            total: totalOnboarding,
            metricKey: "name-entered",
          },
          {
            label: "Menu Option Selected",
            value: menuSelected,
            total: totalOnboarding,
            metricKey: "menu-selected",
          },
        ],
        emr: [
          {
            label: "EMR Started",
            value: emrStarted,
            total: emrStarted,
            metricKey: "emr-started",
          },
          {
            label: "Layer 1 Completed",
            value: layer1Complete,
            total: emrStarted,
            metricKey: "layer1-complete",
          },
          {
            label: "Layer 2 Completed",
            value: layer2Complete,
            total: emrStarted,
            metricKey: "layer2-complete",
          },
          {
            label: "EMR Submitted",
            value: emrSubmitted,
            total: emrStarted,
            metricKey: "emr-submitted",
          },
        ],
      });
    } catch (err) {
      console.error("ERROR in dashboard metrics:", err);
      return c.json(
        { ok: false, error: "Failed to fetch dashboard metrics" },
        500
      );
    }
  });
};
