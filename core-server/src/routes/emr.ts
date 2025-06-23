import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { tables } from "@/models";
import { createRoute, z } from "@hono/zod-openapi";
import { eq, sql, inArray } from "drizzle-orm";

// --- get-emr-details ---
const GetEmrSuccessResponseSchema = z.object({
  emr: z.object({
    id: z.string().uuid(),
    phone: z.string(),
    visit: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
    patient: z.record(z.unknown()),
    presentingComplaint: z.record(z.unknown()),
    currentPregnancy: z.record(z.unknown()),
    trimester: z.record(z.unknown()),
    obsHistory: z.record(z.unknown()),
    gynecologicalHistory: z.record(z.unknown()),
    surgicalHistory: z.record(z.unknown()),
    familyHistory: z.record(z.unknown()),
    personalHistory: z.record(z.unknown()),
    socioEconomicHistory: z.record(z.unknown()),
    redFlags: z.record(z.unknown()),
    followupQuestions: z.record(z.unknown()),
    proposedPlan: z.record(z.unknown()),
    previousPregnancy: z.array(z.record(z.unknown()))
  })
});
const GetEmrNotFoundSchema = z.object({
  error: z.string().openapi({ example: "No Record Found With Patient ID" }),
});
const getEmrDetailsRoute = createRoute({
  method: "get",
  operationId: "getEmr",
  tags: ["EMR"],
  path: "/emr/{id}",
  summary: "Get EMR Contents",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "01J860QF8AZXB1SMMXHXP2953A" }),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: GetEmrSuccessResponseSchema } },
      description: "Return the EMR Record",
    },
    404: {
      content: { "application/json": { schema: GetEmrNotFoundSchema } },
      description: "Not Found",
    },
  },
});
const getEmrDetailsHandler = app.openapi(getEmrDetailsRoute, async (c) => {
  const { id } = c.req.valid("param");
  const emr = await db
    .select({
      id: tables.emr.id,
      phone: tables.emr.phone,
      visit: tables.emr.visit,
      createdAt: tables.emr.createdAt,
      updatedAt: tables.emr.updatedAt,
      patient: tables.patient,
      presentingComplaint: tables.presentingComplaint,
      currentPregnancy: tables.currentPregnancy,
      trimester: tables.trimester,
      obsHistory: tables.obsHistory,
      gynecologicalHistory: tables.gynecologicalHistory,
      surgicalHistory: tables.surgicalHistory,
      familyHistory: tables.familyHistory,
      personalHistory: tables.personalHistory,
      socioEconomicHistory: tables.socioEconomicHistory,
      redFlags: tables.redFlags,
      followupQuestions: tables.followupQuestions,
      proposedPlan: tables.proposedPlan,
      hasExamination: sql<boolean>`CASE WHEN ${tables.examination.id} IS NOT NULL THEN TRUE ELSE FALSE END`
    })
    .from(tables.emr)
    .leftJoin(tables.examination, eq(tables.emr.id, tables.examination.id))
    .leftJoin(tables.patient, eq(tables.emr.phone, tables.patient.phoneNumber))
    .leftJoin(
      tables.presentingComplaint,
      eq(tables.emr.id, tables.presentingComplaint.emrId)
    )
    .leftJoin(
      tables.currentPregnancy,
      eq(tables.emr.id, tables.currentPregnancy.emrId)
    )
    .leftJoin(tables.trimester, eq(tables.emr.id, tables.trimester.emrId))
    .leftJoin(tables.obsHistory, eq(tables.emr.id, tables.obsHistory.emrId))
    .leftJoin(
      tables.gynecologicalHistory,
      eq(tables.emr.id, tables.gynecologicalHistory.emrId)
    )
    .leftJoin(
      tables.surgicalHistory,
      eq(tables.emr.id, tables.surgicalHistory.emrId)
    )
    .leftJoin(
      tables.familyHistory,
      eq(tables.emr.id, tables.familyHistory.emrId)
    )
    .leftJoin(
      tables.personalHistory,
      eq(tables.emr.id, tables.personalHistory.emrId)
    )
    .leftJoin(
      tables.socioEconomicHistory,
      eq(tables.emr.id, tables.socioEconomicHistory.emrId)
    )
    .leftJoin(tables.redFlags, eq(tables.emr.id, tables.redFlags.emrId))
    .leftJoin(
      tables.followupQuestions,
      eq(tables.emr.id, tables.followupQuestions.emrId)
    )
    .leftJoin(tables.proposedPlan, eq(tables.emr.id, tables.proposedPlan.emrId))
    .where(eq(tables.emr.id, id))
    .execute()
    .then(res => res.at(0));

  if (!emr) {
    return c.json({ error: `No Emr Record Found With Id ${id}` }, 404);
  }

  // Get previous pregnancies separately
  const previousPregnancies = await db
    .select()
    .from(tables.previousPregnancy)
    .where(eq(tables.previousPregnancy.emrId, id))
    .execute();

  // Transform the response to match the schema
  const transformedEmr = {
    id: emr.id,
    phone: emr.phone,
    visit: emr.visit,
    createdAt: emr.createdAt,
    updatedAt: emr.updatedAt,
    patient: emr.patient || {},
    presentingComplaint: emr.presentingComplaint || {},
    currentPregnancy: emr.currentPregnancy || {},
    trimester: emr.trimester || {},
    obsHistory: emr.obsHistory || {},
    gynecologicalHistory: emr.gynecologicalHistory || {},
    surgicalHistory: emr.surgicalHistory || {},
    familyHistory: emr.familyHistory || {},
    personalHistory: emr.personalHistory || {},
    socioEconomicHistory: emr.socioEconomicHistory || {},
    redFlags: emr.redFlags || {},
    followupQuestions: emr.followupQuestions || {},
    proposedPlan: emr.proposedPlan || {},
    previousPregnancy: previousPregnancies.map(pregnancy => ({
      id: pregnancy.id,
      emrId: pregnancy.emrId,
      childAge: pregnancy.childAge,
      childGender: pregnancy.childGender,
      fullTermBirth: pregnancy.fullTermBirth,
      birthMethod: pregnancy.birthMethod,
      birthPlace: pregnancy.birthPlace,
      contractions: pregnancy.contractions,
      durationBirth: pregnancy.durationBirth,
      operationReason: pregnancy.operationReason,
      postDeliveryProblems: pregnancy.postDeliveryProblems,
      childCondition: pregnancy.childCondition,
      pregnancyProblems: pregnancy.pregnancyProblems,
      createdAt: pregnancy.createdAt,
      updatedAt: pregnancy.updatedAt
    }))
  };

  return c.json({
    emr: transformedEmr
  }, 200);
});

// --- get-erms-from-phone ---
const GetAllEmrsSuccessSchema = z.object({
  emrs: z.array(
    z.object({
      id: z.string().uuid(),
      phone: z.string(),
      visit: z.number(),
      createdAt: z.date(),
      updatedAt: z.date(),
      patient: z.record(z.unknown()),
      presentingComplaint: z.record(z.unknown()),
      currentPregnancy: z.record(z.unknown()),
      trimester: z.record(z.unknown()),
      obsHistory: z.record(z.unknown()),
      gynecologicalHistory: z.record(z.unknown()),
      surgicalHistory: z.record(z.unknown()),
      familyHistory: z.record(z.unknown()),
      personalHistory: z.record(z.unknown()),
      socioEconomicHistory: z.record(z.unknown()),
      redFlags: z.record(z.unknown()),
      followupQuestions: z.record(z.unknown()),
      proposedPlan: z.record(z.unknown()),
      previousPregnancy: z.array(z.record(z.unknown())),
    })
  )
});
const GetAllEmrsNotFoundSchema = z.object({
  error: z
    .string()
    .openapi({ example: "No EMR records found for this phone number" }),
});
const getAllEmrsFromPhoneRoute = createRoute({
  method: "get",
  operationId: "getAllEmrsFromPhone",
  tags: ["EMR"],
  path: "/emr/getAllEmrsFromPhone/{phoneNumber}",
  summary: "Get All EMRs for a Patient",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      phoneNumber: z.string().openapi({ example: "3123456789" }),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: GetAllEmrsSuccessSchema } },
      description: "Returns all EMR records for the given phone number",
    },
    404: {
      content: { "application/json": { schema: GetAllEmrsNotFoundSchema } },
      description: "Not Found",
    },
  },
});
const getAllEmrsFromPhoneHandler = app.openapi(
  getAllEmrsFromPhoneRoute,
  async (c) => {
    const { phoneNumber } = c.req.valid("param");

    // First, get the basic EMR records without joins to avoid duplicates
    const emrs = await db
      .select({
        id: tables.emr.id,
        phone: tables.emr.phone,
        visit: tables.emr.visit,
        createdAt: tables.emr.createdAt,
        updatedAt: tables.emr.updatedAt,
      })
      .from(tables.emr)
      .where(eq(tables.emr.phone, phoneNumber))
      .execute();

    if (!emrs || emrs.length === 0) {
      return c.json(
        { error: `No EMR records found for phone number ${phoneNumber}` },
        404
      );
    }

    // Get patient info
    const patientInfo = await db
      .select()
      .from(tables.patient)
      .where(eq(tables.patient.phoneNumber, phoneNumber))
      .execute();
    if (!patientInfo || patientInfo.length === 0) {
      return c.json(
        { error: `No Patient records found for phone number ${phoneNumber}` },
        404
      );
    }

    const emrIds = emrs.map(emr => emr.id);

    // Get all related data separately to avoid cartesian products
    const [
      presentingComplaints,
      currentPregnancies,
      trimesters,
      obsHistories,
      gynecologicalHistories,
      surgicalHistories,
      familyHistories,
      personalHistories,
      socioEconomicHistories,
      redFlags,
      followupQuestions,
      proposedPlans,
      allPreviousPregnancies
    ] = await Promise.all([
      db.select().from(tables.presentingComplaint).where(inArray(tables.presentingComplaint.emrId, emrIds)).execute(),
      db.select().from(tables.currentPregnancy).where(inArray(tables.currentPregnancy.emrId, emrIds)).execute(),
      db.select().from(tables.trimester).where(inArray(tables.trimester.emrId, emrIds)).execute(),
      db.select().from(tables.obsHistory).where(inArray(tables.obsHistory.emrId, emrIds)).execute(),
      db.select().from(tables.gynecologicalHistory).where(inArray(tables.gynecologicalHistory.emrId, emrIds)).execute(),
      db.select().from(tables.surgicalHistory).where(inArray(tables.surgicalHistory.emrId, emrIds)).execute(),
      db.select().from(tables.familyHistory).where(inArray(tables.familyHistory.emrId, emrIds)).execute(),
      db.select().from(tables.personalHistory).where(inArray(tables.personalHistory.emrId, emrIds)).execute(),
      db.select().from(tables.socioEconomicHistory).where(inArray(tables.socioEconomicHistory.emrId, emrIds)).execute(),
      db.select().from(tables.redFlags).where(inArray(tables.redFlags.emrId, emrIds)).execute(),
      db.select().from(tables.followupQuestions).where(inArray(tables.followupQuestions.emrId, emrIds)).execute(),
      db.select().from(tables.proposedPlan).where(inArray(tables.proposedPlan.emrId, emrIds)).execute(),
      db.select().from(tables.previousPregnancy).where(inArray(tables.previousPregnancy.emrId, emrIds)).execute()
    ]);

    // Create lookup maps for efficient data retrieval
    const createLookupMap = (data: any[], key: string) => {
      return data.reduce((acc, item) => {
        const emrId = item[key];
        if (!acc[emrId]) {
          acc[emrId] = item;
        }
        return acc;
      }, {} as Record<string, any>);
    };

    // Create lookup maps for data that can have multiple records per EMR
    const createGroupedLookupMap = (data: any[], key: string) => {
      return data.reduce((acc, item) => {
        const emrId = item[key];
        if (!acc[emrId]) {
          acc[emrId] = [];
        }
        acc[emrId].push(item);
        return acc;
      }, {} as Record<string, any[]>);
    };

    const presentingComplaintsMap = createLookupMap(presentingComplaints, 'emrId');
    const currentPregnanciesMap = createLookupMap(currentPregnancies, 'emrId');
    const trimestersMap = createLookupMap(trimesters, 'emrId');
    const obsHistoriesMap = createLookupMap(obsHistories, 'emrId');
    const gynecologicalHistoriesMap = createLookupMap(gynecologicalHistories, 'emrId');
    const surgicalHistoriesMap = createLookupMap(surgicalHistories, 'emrId');
    const familyHistoriesMap = createLookupMap(familyHistories, 'emrId');
    const personalHistoriesMap = createLookupMap(personalHistories, 'emrId');
    const socioEconomicHistoriesMap = createLookupMap(socioEconomicHistories, 'emrId');
    const redFlagsMap = createGroupedLookupMap(redFlags, 'emrId');
    const followupQuestionsMap = createGroupedLookupMap(followupQuestions, 'emrId');
    const proposedPlansMap = createLookupMap(proposedPlans, 'emrId');

    // Group previous pregnancies by EMR ID
    const previousPregnanciesByEmrId = allPreviousPregnancies.reduce((acc, pregnancy) => {
      const emrId = pregnancy.emrId;
      if (!acc[emrId]) {
        acc[emrId] = [];
      }
      acc[emrId].push(pregnancy);
      return acc;
    }, {} as Record<string, any[]>);

    // Transform the response to match the schema
    const transformedEmrs = emrs.map(emr => ({
      id: emr.id,
      phone: emr.phone,
      visit: emr.visit,
      createdAt: emr.createdAt,
      updatedAt: emr.updatedAt,
      patient: patientInfo[0] || {},
      presentingComplaint: presentingComplaintsMap[emr.id] || {},
      currentPregnancy: currentPregnanciesMap[emr.id] || {},
      trimester: trimestersMap[emr.id] || {},
      obsHistory: obsHistoriesMap[emr.id] || {},
      gynecologicalHistory: gynecologicalHistoriesMap[emr.id] || {},
      surgicalHistory: surgicalHistoriesMap[emr.id] || {},
      familyHistory: familyHistoriesMap[emr.id] || {},
      personalHistory: personalHistoriesMap[emr.id] || {},
      socioEconomicHistory: socioEconomicHistoriesMap[emr.id] || {},
      redFlags: redFlagsMap[emr.id] || [],
      followupQuestions: followupQuestionsMap[emr.id] || [],
      proposedPlan: proposedPlansMap[emr.id] || {},
      previousPregnancy: (previousPregnanciesByEmrId[emr.id] || []).map(pregnancy => ({
        id: pregnancy.id,
        emrId: pregnancy.emrId,
        childAge: pregnancy.childAge,
        childGender: pregnancy.childGender,
        fullTermBirth: pregnancy.fullTermBirth,
        birthMethod: pregnancy.birthMethod,
        birthPlace: pregnancy.birthPlace,
        contractions: pregnancy.contractions,
        durationBirth: pregnancy.durationBirth,
        operationReason: pregnancy.operationReason,
        postDeliveryProblems: pregnancy.postDeliveryProblems,
        childCondition: pregnancy.childCondition,
        pregnancyProblems: pregnancy.pregnancyProblems,
        createdAt: pregnancy.createdAt,
        updatedAt: pregnancy.updatedAt
      })),
    }));

    return c.json({ emrs: transformedEmrs }, 200);
  }
);

// --- update-emr ---
const validSections = new Set([
  'patient',
  'presentingComplaint',
  'currentPregnancy',
  'trimester',
  'obsHistory',
  'gynecologicalHistory',
  'surgicalHistory',
  'familyHistory',
  'personalHistory',
  'socioEconomicHistory',
  'redFlags',
  'followupQuestions',
  'proposedPlan',
  'previousPregnancy'
]);
const UpdateEmrRequestSchema = z.object({
  id: z.string().uuid(),
  updates: z
    .array(
      z.object({
        section: z.string().refine((val) => validSections.has(val), {
          message: "Invalid section name",
        }),
        content: z.object({}),
      })
    )
    .min(1)
    .refine(
      (updates) => {
        const sectionSet = new Set(updates.map((u) => u.section));
        return sectionSet.size === updates.length;
      },
      { message: "Duplicate sections are not allowed" }
    ),
});
const UpdateEmrSuccessSchema = z.object({
  message: z.string(),
  updatedFields: z.array(z.string()),
  lastmodified: z.string().datetime(),
});
const UpdateEmrNotFoundSchema = z.object({
  error: z.string().openapi({ example: "No EMR record found with this ID" }),
});
const UpdateEmrInternalServerErrorSchema = z.object({
  error: z.string().openapi({ example: "Internal server error" }),
});
const updateEmrRoute = createRoute({
  method: "put",
  operationId: "updateEmrSections",
  tags: ["EMR"],
  path: "/emr/updateEmrSections",
  summary: "Update EMR's Sections.",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: { "application/json": { schema: UpdateEmrRequestSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: UpdateEmrSuccessSchema } },
      description: "Updated EMR Sections",
    },
    404: {
      content: { "application/json": { schema: UpdateEmrNotFoundSchema } },
      description: "Not Found",
    },
    500: {
      content: {
        "application/json": { schema: UpdateEmrInternalServerErrorSchema },
      },
      description: "Internal Server Error",
    },
  },
});
const updateEmrHandler = app.openapi(updateEmrRoute, async (c) => {
  const { id, updates } = await c.req.json();
  const existingEmr = await db
    .select()
    .from(tables.emr)
    .where(eq(tables.emr.id, id))
    .execute()
    .then((res) => res.at(0));
  if (!existingEmr) {
    return c.json({ error: `No EMR record found with ID ${id}` }, 404);
  }
  const updateData: Record<string, any> = {};
  updates.forEach((upd: any) => {
    updateData[upd.section] = upd.content;
  });
  updateData["updatedAt"] = new Date();
  const lastmodified = await db
    .update(tables.emr)
    .set(updateData)
    .where(eq(tables.emr.id, id))
    .returning({ updatedAt: tables.emr.updatedAt })
    .execute()
    .then((res) => res.at(0)?.updatedAt?.toISOString());
  if (!lastmodified) {
    return c.json({ error: "Failed to retrieve updated timestamp" }, 500);
  }
  return c.json(
    {
      message: "EMR updated successfully",
      updatedFields: updates.map((u: any) => u.section),
      lastmodified,
    },
    200
  );
});

export type GetEmrDetailsRoute = typeof getEmrDetailsHandler;
export type GetAllEmrsFromPhoneRoute = typeof getAllEmrsFromPhoneHandler;
export type UpdateEmrRoute = typeof updateEmrHandler;

const emrRoute = {
  getRoutingPath: () => {
    app.openapi(getEmrDetailsRoute, getEmrDetailsHandler);
    app.openapi(getAllEmrsFromPhoneRoute, getAllEmrsFromPhoneHandler);
    app.openapi(updateEmrRoute, updateEmrHandler);
  },
};

export default emrRoute;
