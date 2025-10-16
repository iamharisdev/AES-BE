import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { tables } from "@/models";
import { DiagnosticsContentSchema } from "@/models/diagnostics";
import { createRoute, z } from "@hono/zod-openapi";

import { desc, eq } from "drizzle-orm";
import { json } from "stream/consumers";

const CreateVisitRequestSchema = z.object({
  patientId: z.string().uuid(),
  visitDate: z.string().datetime().optional(),

  // ✅ VITALS (matches vitals table)
  vitals: z
    .object({
      presentingComplaint: z.string().optional(),
      bloodPressure: z.string().optional(),
      pulseRate: z.string().optional(),
      temperature: z.string().optional(),
      respiratoryRate: z.string().optional(),
      weight: z.string().optional(),
      visitDate: z.string().optional(),
    })
    .optional(),

  // ✅ EXAMINATION (matches examination table)
  examination: z
    .object({
      bilateralPedalEdema: z.string().optional(),
      clubbing: z.string().optional(),
      koilonychia: z.string().optional(),
      lymphNodes: z.string().optional(),
      pallor: z.string().optional(),
      spine: z.string().optional(),
      abnormalSpine: z.string().optional(),
      nippleDeformity: z.string().optional(),
      nippleDischarge: z.string().optional(),
      sizeComparison: z.string().optional(),
      swelling: z.string().optional(),
      abdominalWallEdema: z.string().optional(),
      estimatedFetalWeight: z.string().optional(),
      fetalHeartRate: z.string().optional(),
      fundalHeight: z.string().optional(),
      hernialOrfices: z.string().optional(),
      lie: z.string().optional(),
      liquor: z.string().optional(),
      leukonychia: z.string().optional(),
      presentation: z.string().optional(),
      prominentVeins: z.string().optional(),
      pulsations: z.string().optional(),
      scarTenderness: z.string().optional(),
      shapeOfAbdomen: z.string().optional(),
      striae: z.string().optional(),
      umbilicus: z.string().optional(),
      perSpeculumFindings: z.string().optional(),
      perVaginalFindings: z.string().optional(),
      physicalFindings: z.string().optional(),
    })
    .optional(),

  diagnostics: z
    .object({
      diagnostics: DiagnosticsContentSchema,
    })
    .optional(),

  // ✅ PROPOSED PLAN (matches proposed_plan table)
  proposedPlan: z
    .object({
      generalPlan: z.string().optional(),
      medication: z.array(z.string()).optional(),
      nextFollowUpTiming: z.string().optional(), // ISO date string
      advisedLabTests: z.array(z.string()).optional(),
      createdBy: z.enum(["AI", "Doctor"]).optional(),
    })
    .optional(),
});

// 🟩 Vitals Response
const VitalsResponseSchema = z.object({
  id: z.string().uuid(),
  visitId: z.string().uuid(),
  presentingComplaint: z.string().nullable(),
  bloodPressure: z.string().nullable(),
  pulseRate: z.string().nullable(),
  temperature: z.string().nullable(),
  respiratoryRate: z.string().nullable(),
  weight: z.string().nullable(),
  visitDate: z.string().nullable(),
});

// 🟩 Examination Response
const ExaminationResponseSchema = z.object({
  id: z.string().uuid(),
  visitId: z.string().uuid(),
  bilateralPedalEdema: z.string().nullable(),
  clubbing: z.string().nullable(),
  koilonychia: z.string().nullable(),
  lymphNodes: z.string().nullable(),
  pallor: z.string().nullable(),
  spine: z.string().nullable(),
  abnormalSpine: z.string().nullable(),
  nippleDeformity: z.string().nullable(),
  nippleDischarge: z.string().nullable(),
  sizeComparison: z.string().nullable(),
  swelling: z.string().nullable(),
  abdominalWallEdema: z.string().nullable(),
  estimatedFetalWeight: z.string().nullable(),
  fetalHeartRate: z.string().nullable(),
  fundalHeight: z.string().nullable(),
  hernialOrfices: z.string().nullable(),
  lie: z.string().nullable(),
  liquor: z.string().nullable(),
  leukonychia: z.string().nullable(),
  presentation: z.string().nullable(),
  prominentVeins: z.string().nullable(),
  pulsations: z.string().nullable(),
  scarTenderness: z.string().nullable(),
  shapeOfAbdomen: z.string().nullable(),
  striae: z.string().nullable(),
  umbilicus: z.string().nullable(),
  perSpeculumFindings: z.string().nullable(),
  perVaginalFindings: z.string().nullable(),
  physicalFindings: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// 🟩 Diagnostics Response
const DiagnosticsResponseSchema = z.object({
  id: z.string().uuid(),
  visitId: z.string().uuid(),
  diagnostics: z.array(
    z.object({
      name: z.string(),
      uri: z.string().nullable().optional(),
    })
  ),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// 🟩 Proposed Plan Response
const ProposedPlanResponseSchema = z.object({
  id: z.string().uuid(),
  visitId: z.string().uuid(),
  generalPlan: z.string().nullable(),
  medication: z.array(z.string()).nullable(),
  nextFollowUpTiming: z.string().nullable(),
  advisedLabTests: z.array(z.string()).nullable(),
  createdBy: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// 🟩 Visit Response
const VisitResponseSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  visitDate: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const CreateVisitResponseSchema = z.object({
  message: z
    .string()
    .openapi({ example: "Visit created successfully with all records" }),
  visit: VisitResponseSchema,
  vitals: VitalsResponseSchema.optional(),
  examination: ExaminationResponseSchema.optional(),
  diagnostics: DiagnosticsResponseSchema.optional(),
  proposedPlan: ProposedPlanResponseSchema.optional(),
});

const createVisitRoute = createRoute({
  method: "post",
  path: "/visits",
  summary:
    "Create visit with vitals, examination, diagnostics, and proposed plan",
  tags: ["Visits"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        "application/json": { schema: CreateVisitRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: CreateVisitResponseSchema } },
      description: "Visit created successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().openapi({ example: "Patient not found" }),
          }),
        },
      },
      description: "Patient not found",
    },
  },
});

const createVisitHandler = () => {
  app.openapi(createVisitRoute, async (c) => {
    const payload: any = c.req.valid("json");

    console.log("payload:=>  ", JSON.stringify(payload));

    try {
      // 🧩 Run all insert operations inside a transaction for safety
      const result = await db.transaction(async (tx) => {
        // 1️⃣ Create main visit
        const [visit] = await tx
          .insert(tables.visits)
          .values({
            patientId: payload.patientId,
            visitDate: payload.visitDate
              ? new Date(payload.visitDate)
              : undefined,
          })
          .returning();

        // Safety check
        if (!visit?.id) throw new Error("Visit could not be created.");

        // 2️⃣ Related records — only if `visit.id` exists
        let vitals, examination, diagnostics, proposedPlan, advisedTests;

        if (payload.vitals) {
          [vitals] = await tx
            .insert(tables.vitals)
            .values({
              visitId: visit.id,
              ...payload.vitals,
            })
            .returning();
        }

        if (payload.examination) {
          console.log(payload.examination);

          [examination] = await tx
            .insert(tables.examination)
            .values({
              visitId: visit.id,
              ...payload.examination,
            })
            .returning();
        }

        if (payload.diagnostics) {
          [diagnostics] = await tx
            .insert(tables.diagnostics)
            .values({
              visitId: visit.id, // force correct id
              diagnostics: payload.diagnostics?.diagnostics ?? [],
            })
            .returning();
        }
        if (payload.proposedPlan) {
          [proposedPlan] = await tx
            .insert(tables.proposedPlan)
            .values({
              visitId: visit.id,
              ...payload.proposedPlan,
            })
            .returning();
        }

        if (payload.proposedPlan.advisedLabTests) {
          const advisedList =
            payload.proposedPlan.advisedLabTests?.length > 0
              ? payload.proposedPlan.advisedLabTests
              : ["Ultrasound scan", "CBC", "Anti - HCV"];

          advisedTests = await tx
            .insert(tables.advisedTest)
            .values(
              advisedList.map((testName: string) => ({
                visitId: visit.id,
                testName,
                status: "not_submitted", // default
              }))
            )
            .returning();
        }

        // 3️⃣ Return full created structure
        return {
          message: "Full visit created successfully",
          visit,
          vitals,
          examination,
          diagnostics,
          proposedPlan,
          advisedTests,
        };
      });

      return c.json(result, 200);
    } catch (err) {
      console.error("❌ Error creating full visit:", err);
      return c.json(
        { error: "Internal Server Error", details: String(err) },
        500
      );
    }
  });
};

const VisitSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  visitDate: z.string().datetime(),
  createdAt: z.string().datetime(),
});

const getAllVisitsRoute = createRoute({
  method: "get",
  operationId: "getAllVisits",
  tags: ["Visits"],
  path: "/visits",
  summary: "Fetch all visits",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(VisitSchema),
        },
      },
      description: "List of all visits",
    },
  },
});

const getAllVisitsHandler = () => {
  app.openapi(getAllVisitsRoute, async (c) => {
    const patientId = c.req.query("patientId"); // or use c.req.valid("query") if schema defined

    try {
      if (!patientId) {
        return c.json({ error: "Missing patientId parameter" }, 400);
      }

      const visits = await db
        .select()
        .from(tables.visits)
        .where(eq(tables.visits.patientId, patientId));

      return c.json(visits, 200);
    } catch (error) {
      console.error("❌ Error fetching visits:", error);
      return c.json(
        {
          error: "Internal Server Error",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  });
};

const getVisitDetailsRoute = createRoute({
  method: "get", // ✅ lowercase literal, matches `Method` type
  path: "/visits/:id",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: "Visit details fetched successfully",
    },
    404: {
      description: "Visit not found",
    },
  },
});

const getVisitDetailsHandler = () => {
  app.openapi(getVisitDetailsRoute, async (c) => {
    const { id } = c.req.valid("param");

    console.log("params:=>  ", id);

    try {
      // 1️⃣ Fetch main visit record

      const [visit] = await db
        .select()
        .from(tables.visits)
        .where(eq(tables.visits.id, id));

      if (!visit) {
        return c.json({ error: "Visit not found" }, 404);
      }

      // 2️⃣ Fetch related tables in parallel
      const [vitals] = await db
        .select()
        .from(tables.vitals)
        .where(eq(tables.vitals.visitId, id));

      const [examination] = await db
        .select()
        .from(tables.examination)
        .where(eq(tables.examination.visitId, id));

      const [diagnostics] = await db
        .select()
        .from(tables.diagnostics)
        .where(eq(tables.diagnostics.visitId, id));

      const [proposedPlan] = await db
        .select()
        .from(tables.proposedPlan)
        .where(eq(tables.proposedPlan.visitId, id));

      // 3️⃣ Build response
      const fullVisit = {
        ...visit,
        vitals: vitals ?? null,
        examination: examination ?? null,
        diagnostics: diagnostics ?? null,
        proposedPlan: proposedPlan ?? null,
      };

      return c.json(fullVisit, 200);
    } catch (error) {
      console.error("❌ Error fetching visit details:", error);
      return c.json(
        {
          error: "Internal Server Error",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  });
};

export const getAdvisedTestsRoute = createRoute({
  method: "get", // ✅ correct type — lowercase literal, not string variable
  path: "/visits/:patientId/advised-tests",
  summary: "Get advised lab tests from previous visit",
  tags: ["Visits"],
  request: {
    params: z.object({
      patientId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: "List of advised tests from previous visit",
    },
    404: {
      description: "No previous visit found for this patient",
    },
  },
});

const getAdvisedTestsHandler = () => {
  app.openapi(getAdvisedTestsRoute, async (c) => {
    const patientId = c.req.param("patientId");

    try {
      // 1️⃣ Get last visit of the patient
      const [lastVisit] = await db
        .select()
        .from(tables.visits)
        .where(eq(tables.visits.patientId, patientId))
        .orderBy(desc(tables.visits.visitDate))
        .limit(1);

      if (!lastVisit) {
        return c.json({ advisedTests: [] }, 200);
      }

      // 2️⃣ Get advised tests for that visit
      const advisedTests = await db
        .select()
        .from(tables.advisedTest)
        .where(eq(tables.advisedTest.visitId, lastVisit.id));

      return c.json({ advisedTests }, 200);
    } catch (err) {
      console.error("❌ Error fetching advised tests:", err);
      return c.json(
        { error: "Internal Server Error", details: String(err) },
        500
      );
    }
  });
};

export {
  createVisitHandler,
  getAllVisitsHandler,
  getVisitDetailsHandler,
  getAdvisedTestsHandler,
};
