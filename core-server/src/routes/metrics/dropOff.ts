import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { createRoute, z } from "@hono/zod-openapi";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { patient } from "@/models/patient";
import { emr } from "@/models/emr";
import { trimester } from "@/models/trimester";
import { currentPregnancy } from "@/models/current-pregnancy";
import { gynecologicalHistory } from "@/models/gynecological-history";
import { obsHistory } from "@/models/obstetric-history";
import { previousPregnancy } from "@/models/previous-pregnancy";
import { patientChats } from "@/models/patient-chats";

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

      if (startDateStr) {
        startDate = new Date(startDateStr);
        startDate.setHours(0, 0, 0, 0);
      }
      if (endDateStr) {
        endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999);
      }

      // FETCH PATIENTS
      let allPatients = await db.select().from(patient);
      if (startDate && endDate) {
        allPatients = allPatients.filter(
          (p) =>
            new Date(p.createdAt) >= startDate! &&
            new Date(p.createdAt) <= endDate!
        );
      }

      // Fetch lastMessageAt for all patients
      const lastActivityMap: any = {};

      const allChats = await db
        .select({
          patientId: patientChats.patientId,
          lastMessageAt: patientChats.lastMessageAt,
        })
        .from(patientChats)
        .execute();

      for (const chat of allChats) {
        // Take the latest lastMessageAt if multiple chats exist per patient
        if (!lastActivityMap[chat.patientId]) {
          lastActivityMap[chat.patientId] = chat.lastMessageAt;
        } else if (
          chat.lastMessageAt &&
          new Date(chat.lastMessageAt) >
            new Date(lastActivityMap[chat.patientId]!)
        ) {
          lastActivityMap[chat.patientId] = chat.lastMessageAt;
        }
      }

      const totalOnboarding = allPatients.length;

      // Onboarding users arrays
      const onboardStartedUsers = allPatients
        .filter((p) => p.menu)
        .map((p) => ({
          name: p.name,
          phone: p.phoneNumber,
          lastActivity: lastActivityMap[p.id] || null,
          createdAt: p.createdAt,
        }));

      const cnicUsers = allPatients
        .filter((p) => p.cnic)
        .map((p) => ({
          name: p.name,
          phone: p.phoneNumber,
          lastActivity: lastActivityMap[p.id] || null,
          createdAt: p.createdAt,
        }));

      const nameUsers = allPatients
        .filter((p) => p.name)
        .map((p) => ({
          name: p.name,
          phone: p.phoneNumber,
          lastActivity: lastActivityMap[p.id] || null,
          createdAt: p.createdAt,
        }));

      const menuUsers = allPatients
        .filter((p) => p.menu)
        .map((p) => ({
          name: p.name,
          phone: p.phoneNumber,
          lastActivity: lastActivityMap[p.id] || null,
          createdAt: p.createdAt,
        }));

      const onboardStarted = onboardStartedUsers.length;
      const cnicEntered = cnicUsers.length;
      const nameEntered = nameUsers.length;
      const menuSelected = menuUsers.length;

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

      const emrStartedUsers: any[] = [];
      const layer1Users: any[] = [];
      const layer2Users: any[] = [];
      const emrSubmittedUsers: any[] = [];

      for (const e of allEmrs) {
        const p = (
          await db.select().from(patient).where(eq(patient.id, e.patientId))
        )[0];
        if (!p) continue;

        if (p.age) {
          emrStarted++;
          emrStartedUsers.push({
            name: p.name,
            phone: p.phoneNumber,
            lastActivity: lastActivityMap[p.id] || null,
            createdAt: p.createdAt,
          });

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
            layer1Users.push({
              name: p.name,
              phone: p.phoneNumber,
              lastActivity: lastActivityMap[p.id] || null,
              createdAt: p.createdAt,
            });

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
                layer2Users.push({
                  name: p.name,
                  phone: p.phoneNumber,
                  lastActivity: lastActivityMap[p.id] || null,
                  createdAt: p.createdAt,
                });
                emrSubmittedUsers.push({
                  name: p.name,
                  phone: p.phoneNumber,
                  lastActivity: lastActivityMap[p.id] || null,
                  createdAt: p.createdAt,
                });
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

      // 🔹 APPA Dropoff calculation
      let chatQuery = db
        .select({
          id: patientChats.id,
          patientId: patientChats.patientId,
          messages: patientChats.messages,
          createdAt: patientChats.createdAt,
        })
        .from(patientChats);

      const chatConditions = [];
      if (startDate)
        chatConditions.push(gte(patientChats.createdAt, startDate));
      if (endDate) chatConditions.push(lte(patientChats.createdAt, endDate));

      if (chatConditions.length > 0)
        chatQuery = chatQuery.where(and(...chatConditions));

      const chats = await chatQuery.execute();

      const userMap: Record<
        string,
        {
          questionCount: number;
          userInfo: {
            name: string | null;
            phone: string | null;
            lastActivity: string | Date | null;
            createdAt: string | Date | null;
          };
        }
      > = {};

      for (const chat of chats) {
        const appaMessages = (chat.messages || []).filter(
          (msg: any) =>
            msg.current_flow === "APPA_FLOW" && msg.sender === "user"
        );

        
        if (appaMessages.length === 0) continue;

        if (!userMap[chat.patientId]) {
          const patientData = await db
            .select({
              name: patient.name,
              phone: patient.phoneNumber,
              lastActivity: lastActivityMap[chat.patientId] || null,
              createdAt: patient.createdAt,
            })
            .from(patient)
            .where(sql`${patient.id}::text = ${chat.patientId}`)
            .limit(1)
            .execute();

          userMap[chat.patientId] = {
            questionCount: appaMessages.length,
            userInfo: patientData[0] || {
              name: null,
              phone: null,
              lastActivity: null,
              createdAt: null,
            },
          };
        } else {
          userMap[chat.patientId].questionCount += appaMessages.length;
        }
      }

     

      const ask1Users = Object.values(userMap).filter(
        (u) => u.questionCount === 1
      );
      const ask2Users = Object.values(userMap).filter(
        (u) => u.questionCount === 2
      );

      const totalUsers = Object.keys(userMap).length;

      const appaDropoff = [
        {
          label: "Ask 1st question",
          value: ask1Users.length,
          total: totalUsers==0?1:totalUsers,
          metricKey: "ask-1st-question",
          users: ask1Users.map((u) => u.userInfo),
        },
        {
          label: "Ask 2nd question",
          value: ask2Users.length,
          total: totalUsers==0?1:totalUsers,
          metricKey: "ask-2nd-question",
          users: ask2Users.map((u) => u.userInfo),
        },
      ];

      return c.json({
        kpis: { emrCompletionRate, overallDropoffRate },
        onboarding: [
          {
            label: "Started Onboarding",
            value: onboardStarted,
            total: totalOnboarding,
            metricKey: "onboard-started",
            users: onboardStartedUsers,
          },
          {
            label: "CNIC Entered",
            value: cnicEntered,
            total: totalOnboarding,
            metricKey: "cnic-entered",
            users: cnicUsers,
          },
          {
            label: "Name Entered",
            value: nameEntered,
            total: totalOnboarding,
            metricKey: "name-entered",
            users: nameUsers,
          },
          {
            label: "Menu Option Selected",
            value: menuSelected,
            total: totalOnboarding,
            metricKey: "menu-selected",
            users: menuUsers,
          },
        ],
        emr: [
          {
            label: "EMR Started",
            value: emrStarted,
            total: emrStarted == 0 ? 1 : emrStarted,
            metricKey: "emr-started",
            users: emrStartedUsers,
          },
          {
            label: "Layer 1 Completed",
            value: layer1Complete,
            total: emrStarted == 0 ? 1 : emrStarted,
            metricKey: "layer1-complete",
            users: layer1Users,
          },
          {
            label: "Layer 2 Completed",
            value: layer2Complete,
            total: emrStarted == 0 ? 1 : emrStarted,
            metricKey: "layer2-complete",
            users: layer2Users,
          },
          {
            label: "EMR Submitted",
            value: emrSubmitted,
            total: emrStarted == 0 ? 1 : emrStarted,
            metricKey: "emr-submitted",
            users: emrSubmittedUsers,
          },
        ],
        appa: appaDropoff,
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
