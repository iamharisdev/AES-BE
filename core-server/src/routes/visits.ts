import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { tables } from "@/models";
import { createRoute, z } from "@hono/zod-openapi";

import { desc, eq } from "drizzle-orm";
const CreateVisitRequestSchema = z.object({
  patientId: z.string().uuid(),
  visitDate: z.string().datetime().optional(),

  // ✅ VITALS
  vitals: z
    .object({
      presentingComplaint: z.string().nullable().optional(),
      bloodPressure: z.string().nullable().optional(),
      pulseRate: z.string().nullable().optional(),
      temperature: z.string().nullable().optional(),
      respiratoryRate: z.string().nullable().optional(),
      weight: z.string().nullable().optional(),
      visitDate: z.string().nullable().optional(),
    })
    .optional(),

  // ✅ EXAMINATION
  examination: z
    .object({
      bilateralPedalEdema: z.string().nullable().optional(),
      clubbing: z.string().nullable().optional(),
      koilonychia: z.string().nullable().optional(),
      lymphNodes: z.string().nullable().optional(),
      pallor: z.string().nullable().optional(),
      spine: z.string().nullable().optional(),
      abnormalSpine: z.string().nullable().optional(),
      nippleDeformity: z.string().nullable().optional(),
      nippleDischarge: z.string().nullable().optional(),
      sizeComparison: z.string().nullable().optional(),
      swelling: z.string().nullable().optional(),
      abdominalWallEdema: z.string().nullable().optional(),
      estimatedFetalWeight: z.string().nullable().optional(),
      fetalHeartRate: z.string().nullable().optional(),
      fundalHeight: z.string().nullable().optional(),
      hernialOrfices: z.string().nullable().optional(),
      lie: z.string().nullable().optional(),
      liquor: z.string().nullable().optional(),
      leukonychia: z.string().nullable().optional(),
      presentation: z.string().nullable().optional(),
      prominentVeins: z.string().nullable().optional(),
      pulsations: z.string().nullable().optional(),
      scarTenderness: z.string().nullable().optional(),
      shapeOfAbdomen: z.string().nullable().optional(),
      striae: z.string().nullable().optional(),
      umbilicus: z.string().nullable().optional(),
      perSpeculumFindings: z.string().nullable().optional(),
      perVaginalFindings: z.string().nullable().optional(),
      physicalFindings: z.string().nullable().optional(),
    })
    .optional(),

  // ✅ DIAGNOSTICS
  diagnostics: z
    .object({
      diagnostics: z
        .array(
          z.object({
            name: z.string().nullable().optional(),
            uri: z.string().nullable().optional(),
          })
        )
        .nullable()
        .optional(),
    })
    .optional(),

  // ✅ PROPOSED PLAN
  proposedPlan: z
    .object({
      generalPlan: z.string().nullable().optional(),
      medication: z.array(z.string()).nullable().optional(),
      doctorNotes: z.string().nullable().optional(),
      nextFollowUpTiming: z.string().nullable().optional(),
      advisedLabTests: z.array(z.string()).nullable().optional(),
      createdBy: z.enum(["AI", "Doctor"]).nullable().optional(),
    })
    .optional(),
});



// 🟩 Vitals Response
const VitalsResponseSchema = z.object({
  id: z.string().uuid().optional(),
  visitId: z.string().uuid().optional(),
  presentingComplaint: z.string().nullable().optional(),
  bloodPressure: z.string().nullable().optional(),
  pulseRate: z.string().nullable().optional(),
  temperature: z.string().nullable().optional(),
  respiratoryRate: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  visitDate: z.string().nullable().optional(),
});

// 🟩 Examination Response
const ExaminationResponseSchema = z.object({
  id: z.string().uuid().optional(),
  visitId: z.string().uuid().optional(),

  bilateralPedalEdema: z.string().nullable().optional(),
  clubbing: z.string().nullable().optional(),
  koilonychia: z.string().nullable().optional(),
  lymphNodes: z.string().nullable().optional(),
  pallor: z.string().nullable().optional(),
  spine: z.string().nullable().optional(),
  abnormalSpine: z.string().nullable().optional(),
  nippleDeformity: z.string().nullable().optional(),
  nippleDischarge: z.string().nullable().optional(),
  sizeComparison: z.string().nullable().optional(),
  swelling: z.string().nullable().optional(),
  abdominalWallEdema: z.string().nullable().optional(),
  estimatedFetalWeight: z.string().nullable().optional(),
  fetalHeartRate: z.string().nullable().optional(),
  fundalHeight: z.string().nullable().optional(),
  hernialOrfices: z.string().nullable().optional(),
  lie: z.string().nullable().optional(),
  liquor: z.string().nullable().optional(),
  leukonychia: z.string().nullable().optional(),
  presentation: z.string().nullable().optional(),
  prominentVeins: z.string().nullable().optional(),
  pulsations: z.string().nullable().optional(),
  scarTenderness: z.string().nullable().optional(),
  shapeOfAbdomen: z.string().nullable().optional(),
  striae: z.string().nullable().optional(),
  umbilicus: z.string().nullable().optional(),
  perSpeculumFindings: z.string().nullable().optional(),
  perVaginalFindings: z.string().nullable().optional(),
  physicalFindings: z.string().nullable().optional(),

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});


// ✅ Diagnostics Response
const DiagnosticsResponseSchema = z.object({
  id: z.string().uuid().optional(),
  visitId: z.string().uuid().optional(),

  diagnostics: z
    .array(
      z.object({
        name: z.string().optional(),
        uri: z.string().nullable().optional(),
      })
    )
    .optional(),

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});


// ✅ Proposed Plan Response
const ProposedPlanResponseSchema = z.object({
  id: z.string().uuid().optional(),
  visitId: z.string().uuid().optional(),

  generalPlan: z.string().nullable().optional(),
  medication: z.array(z.string()).nullable().optional(),
  nextFollowUpTiming: z.string().nullable().optional(),
  advisedLabTests: z.array(z.string()).nullable().optional(),
  doctorNote: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});


// ✅ Visit Response
const VisitResponseSchema = z.object({
  id: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  visitDate: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
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

// ✅ Update Visit Request Schema (PATCH)
export const UpdateVisitRequestSchema = CreateVisitRequestSchema.extend({
  visitId: z.string().uuid(),
});

// ✅ Update Visit Response Schema
export const UpdateVisitResponseSchema = z.object({
  message: z.string(),
  visit: VisitResponseSchema,
  vitals: VitalsResponseSchema.optional(),
  examination: ExaminationResponseSchema.optional(),
  diagnostics: DiagnosticsResponseSchema.optional(),
  proposedPlan: ProposedPlanResponseSchema.optional(),
  advisedTests: z.any().optional(),
});

// ✅ ROUTE
export const updateVisitRoute = createRoute({
  method: "patch",
  path: "/visits/:visitId",
  summary:
    "Update visit (PATCH) with vitals, exam, diagnostics & proposed plan",
  tags: ["Visits"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      visitId: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": { schema: UpdateVisitRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Visit updated successfully",
      content: {
        "application/json": { schema: UpdateVisitResponseSchema },
      },
    },
    404: {
      description: "Visit not found",
    },
  },
});

// ✅ HANDLER
const updateVisitHandler = () => {
  app.openapi(updateVisitRoute, async (c) => {
    const { visitId } = c.req.valid("param");
    const payload = c.req.valid("json");

    try {
      const updatedData = await db.transaction(async (tx) => {
        // ✅ Check if visit exists
        const [existingVisit] = await tx
          .select()
          .from(tables.visits)
          .where(eq(tables.visits.id, visitId));

        if (!existingVisit) {
          return c.json({ error: "Visit not found" }, 404);
        }

        // ✅ 1: Update Visit (only if values provided)
        let [visit] = await tx
          .update(tables.visits)
          .set({
            visitDate: payload.visitDate
              ? new Date(payload.visitDate)
              : existingVisit.visitDate,
            updatedAt: new Date(),
          })
          .where(eq(tables.visits.id, visitId))
          .returning();

        // ✅ 2: Vitals — PATCH style (update if exist, else insert)
        let vitals;
        if (payload.vitals) {
          const [existingVitals] = await tx
            .select()
            .from(tables.vitals)
            .where(eq(tables.vitals.visitId, visitId));

          if (existingVitals) {
            [vitals] = await tx
              .update(tables.vitals)
              .set(payload.vitals)
              .where(eq(tables.vitals.visitId, visitId))
              .returning();
          } else {
            [vitals] = await tx
              .insert(tables.vitals)
              .values({ visitId, ...payload.vitals })
              .returning();
          }
        }

        // ✅ 3: Examination
        let examination;
        if (payload.examination) {
          const [existingExam] = await tx
            .select()
            .from(tables.examination)
            .where(eq(tables.examination.visitId, visitId));

          if (existingExam) {
            [examination] = await tx
              .update(tables.examination)
              .set(payload.examination)
              .where(eq(tables.examination.visitId, visitId))
              .returning();
          } else {
            [examination] = await tx
              .insert(tables.examination)
              .values({ visitId, ...payload.examination })
              .returning();
          }
        }

        // ✅ 4: Diagnostics
        let diagnostics;
        if (payload.diagnostics) {
          const [existingDiag] = await tx
            .select()
            .from(tables.diagnostics)
            .where(eq(tables.diagnostics.visitId, visitId));

          if (existingDiag) {
            [diagnostics] = await tx
              .update(tables.diagnostics)
              .set({
                diagnostics: payload.diagnostics.diagnostics,
              })
              .where(eq(tables.diagnostics.visitId, visitId))
              .returning();
          } else {
            [diagnostics] = await tx
              .insert(tables.diagnostics)
              .values({
                visitId,
                diagnostics: payload.diagnostics.diagnostics,
              })
              .returning();
          }
        }

        // ✅ 5: Proposed Plan
        let proposedPlan;
        if (payload.proposedPlan) {
          const [existingPlan] = await tx
            .select()
            .from(tables.proposedPlan)
            .where(eq(tables.proposedPlan.visitId, visitId));

          if (existingPlan) {
            [proposedPlan] = await tx
              .update(tables.proposedPlan)
              .set(payload.proposedPlan)
              .where(eq(tables.proposedPlan.visitId, visitId))
              .returning();
          } else {
            [proposedPlan] = await tx
              .insert(tables.proposedPlan)
              .values({ visitId, ...payload.proposedPlan })
              .returning();
          }
        }

        // ✅ 6: Advised Lab Tests — delete old → insert new
        // ✅ 6: Advised Lab Tests — delete old → insert new
        // ✅ 6: Advised Lab Tests — delete old → insert new
        let advisedTests: (typeof tables.advisedTest.$inferSelect)[] = [];

        if (payload.proposedPlan?.advisedLabTests) {
          await tx
            .delete(tables.advisedTest)
            .where(eq(tables.advisedTest.visitId, visitId));

          advisedTests = await tx
            .insert(tables.advisedTest)
            .values(
              payload.proposedPlan.advisedLabTests.map((test: string) => ({
                visitId,
                testName: test,
                status: "not_submitted" as const,
              }))
            )
            .returning();
        }

        return {
          message: "Visit updated successfully",
          visit,
          vitals,
          examination,
          diagnostics,
          proposedPlan,
          advisedTests,
        };
      });

      return c.json(updatedData, 200);
    } catch (error) {
      console.error("❌ Error updating visit:", error);
      return c.json(
        { error: "Internal Server Error", details: String(error) },
        500
      );
    }
  });
};

export {
  createVisitHandler, getAdvisedTestsHandler, getAllVisitsHandler,
  getVisitDetailsHandler, updateVisitHandler
};

