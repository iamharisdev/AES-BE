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
    proposedPlan: z.array(z.record(z.unknown())),
    previousPregnancy: z.array(z.record(z.unknown())),
  }),
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
const getEmrDetailsHandler = () => {
  app.openapi(getEmrDetailsRoute, async (c) => {
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
        hasExamination: sql<boolean>`CASE WHEN ${tables.examination.id} IS NOT NULL THEN TRUE ELSE FALSE END`,
      })
      .from(tables.emr)
      .leftJoin(tables.examination, eq(tables.emr.id, tables.examination.id))
      .leftJoin(
        tables.patient,
        eq(tables.emr.phone, tables.patient.phoneNumber)
      )
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
      .where(eq(tables.emr.id, id))
      .execute()
      .then((res) => res.at(0));

    if (!emr) {
      return c.json({ error: `No Emr Record Found With Id ${id}` }, 404);
    }

    // Get previous pregnancies separately
    const previousPregnancies = await db
      .select()
      .from(tables.previousPregnancy)
      .where(eq(tables.previousPregnancy.emrId, id))
      .execute();

    // Get all proposed plans separately
    const proposedPlans = await db
      .select()
      .from(tables.proposedPlan)
      .where(eq(tables.proposedPlan.emrId, id))
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
      proposedPlan: proposedPlans,
      previousPregnancy: previousPregnancies.map((pregnancy) => ({
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
        updatedAt: pregnancy.updatedAt,
      })),
    };

    return c.json(
      {
        emr: transformedEmr,
      },
      200
    );
  });
};

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
      proposedPlan: z.array(z.record(z.unknown())),
      previousPregnancy: z.array(z.record(z.unknown())),
    })
  ),
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
const getAllEmrsFromPhoneHandler = () => {
  app.openapi(getAllEmrsFromPhoneRoute, async (c) => {
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

    if (emrs.length === 0) {
      return c.json(
        { error: `No EMR records found for phone number ${phoneNumber}` },
        404
      );
    }

    // Get all related data for these EMRs
    const emrIds = emrs.map((emr) => emr.id);

    const [patientInfo] = await db
      .select()
      .from(tables.patient)
      .where(eq(tables.patient.phoneNumber, phoneNumber))
      .execute();

    const presentingComplaints = await db
      .select()
      .from(tables.presentingComplaint)
      .where(inArray(tables.presentingComplaint.emrId, emrIds))
      .execute();

    const currentPregnancies = await db
      .select()
      .from(tables.currentPregnancy)
      .where(inArray(tables.currentPregnancy.emrId, emrIds))
      .execute();

    const trimesters = await db
      .select()
      .from(tables.trimester)
      .where(inArray(tables.trimester.emrId, emrIds))
      .execute();

    const obsHistories = await db
      .select()
      .from(tables.obsHistory)
      .where(inArray(tables.obsHistory.emrId, emrIds))
      .execute();

    const gynecologicalHistories = await db
      .select()
      .from(tables.gynecologicalHistory)
      .where(inArray(tables.gynecologicalHistory.emrId, emrIds))
      .execute();

        const medicalHistory = await db
      .select()
      .from(tables.medicalHistory)
      .where(inArray(tables.medicalHistory.emrId, emrIds))
      .execute();

    const surgicalHistories = await db
      .select()
      .from(tables.surgicalHistory)
      .where(inArray(tables.surgicalHistory.emrId, emrIds))
      .execute();

    const familyHistories = await db
      .select()
      .from(tables.familyHistory)
      .where(inArray(tables.familyHistory.emrId, emrIds))
      .execute();

    const personalHistories = await db
      .select()
      .from(tables.personalHistory)
      .where(inArray(tables.personalHistory.emrId, emrIds))
      .execute();

    const socioEconomicHistories = await db
      .select()
      .from(tables.socioEconomicHistory)
      .where(inArray(tables.socioEconomicHistory.emrId, emrIds))
      .execute();

    const redFlags = await db
      .select()
      .from(tables.redFlags)
      .where(inArray(tables.redFlags.emrId, emrIds))
      .execute();

    const followupQuestions = await db
      .select()
      .from(tables.followupQuestions)
      .where(inArray(tables.followupQuestions.emrId, emrIds))
      .execute();

    // const proposedPlans = await db
    //   .select()
    //   .from(tables.proposedPlan)
    //   .where(inArray(tables.proposedPlan.emrId, emrIds))
    //   .execute();

    const allPreviousPregnancies = await db
      .select()
      .from(tables.previousPregnancy)
      .where(inArray(tables.previousPregnancy.emrId, emrIds))
      .execute();

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

    const presentingComplaintsMap = createLookupMap(
      presentingComplaints,
      "emrId"
    );
    const currentPregnanciesMap = createLookupMap(currentPregnancies, "emrId");
    const trimestersMap = createLookupMap(trimesters, "emrId");
    const obsHistoriesMap = createLookupMap(obsHistories, "emrId");
    const medicalHistoryMap = createLookupMap(medicalHistory,'emrId');
    const gynecologicalHistoriesMap = createLookupMap(
      gynecologicalHistories,
      "emrId"
    );
    const surgicalHistoriesMap = createLookupMap(surgicalHistories, "emrId");
    const familyHistoriesMap = createLookupMap(familyHistories, "emrId");
    const personalHistoriesMap = createLookupMap(personalHistories, "emrId");
    const socioEconomicHistoriesMap = createLookupMap(
      socioEconomicHistories,
      "emrId"
    );
    const redFlagsMap = createGroupedLookupMap(redFlags, "emrId");
    const followupQuestionsMap = createGroupedLookupMap(
      followupQuestions,
      "emrId"
    );
    // const proposedPlansMap = createGroupedLookupMap(proposedPlans, "emrId");

    // Group previous pregnancies by EMR ID
    const previousPregnanciesByEmrId = allPreviousPregnancies.reduce(
      (acc, pregnancy) => {
        const emrId = pregnancy.emrId;
        if (!acc[emrId]) {
          acc[emrId] = [];
        }
        acc[emrId].push(pregnancy);
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Transform the response to match the schema
    const transformedEmrs = emrs.map((emr) => ({
      id: emr.id,
      phone: emr.phone,
      visit: emr.visit,
      createdAt: emr.createdAt,
      updatedAt: emr.updatedAt,
      patient: patientInfo || {},
      presentingComplaint: presentingComplaintsMap[emr.id] || {},
      currentPregnancy: currentPregnanciesMap[emr.id] || {},
      trimester: trimestersMap[emr.id] || {},
      obsHistory: obsHistoriesMap[emr.id] || {},
      medicalHistory:medicalHistoryMap[emr.id]||{},
      gynecologicalHistory: gynecologicalHistoriesMap[emr.id] || {},
      surgicalHistory: surgicalHistoriesMap[emr.id] || {},
      familyHistory: familyHistoriesMap[emr.id] || {},
      personalHistory: personalHistoriesMap[emr.id] || {},
      socioEconomicHistory: socioEconomicHistoriesMap[emr.id] || {},
      redFlags: redFlagsMap[emr.id] || [],
      followupQuestions: followupQuestionsMap[emr.id] || [],
      //  proposedPlan: proposedPlansMap[emr.id] || [],
      previousPregnancy: (previousPregnanciesByEmrId[emr.id] || []).map(
        (pregnancy) => ({
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
          updatedAt: pregnancy.updatedAt,
        })
      ),
    }));

    return c.json({ emrs: transformedEmrs }, 200);
  });
};

// get erms from cnic
const GetAllEmrsFromCnicSuccessSchema = z.object({
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
      proposedPlan: z.array(z.record(z.unknown())),
      previousPregnancy: z.array(z.record(z.unknown())),
    })
  ),
});
const GetAllEmrsFromCnicNotFoundSchema = z.object({
  error: z.string().openapi({ example: "No EMR records found for this CNIC" }),
});
const getAllEmrsFromCnicRoute = createRoute({
  method: "get",
  operationId: "getAllEmrsFromCnic",
  tags: ["EMR"],
  path: "/emr/getAllEmrsFromCnic/{cnic}",
  summary: "Get All EMRs for a Patient by CNIC",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      cnic: z.string().openapi({ example: "35202-1234567-8" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: GetAllEmrsFromCnicSuccessSchema },
      },
      description: "Returns all EMR records for the given CNIC",
    },
    404: {
      content: {
        "application/json": { schema: GetAllEmrsFromCnicNotFoundSchema },
      },
      description: "Not Found",
    },
  },
});
const getAllEmrsFromCnicHandler = () => {
  app.openapi(getAllEmrsFromCnicRoute, async (c) => {
    const { cnic } = c.req.valid("param");

    // First, get the patient by CNIC
    const patient = await db
      .select()
      .from(tables.patient)
      .where(eq(tables.patient.cnic, cnic))
      .execute()
      .then((res) => res.at(0));

    if (!patient) {
      return c.json({ error: `No patient found with CNIC ${cnic}` }, 404);
    }

    // Get all EMRs for this patient"s phone number
    const emrs = await db
      .select({
        id: tables.emr.id,
        phone: tables.emr.phone,
        visit: tables.emr.visit,
        createdAt: tables.emr.createdAt,
        updatedAt: tables.emr.updatedAt,
      })
      .from(tables.emr)
      .where(eq(tables.emr.phone, patient.phoneNumber))
      .execute();

    if (emrs.length === 0) {
      return c.json({ error: `No EMR records found for CNIC ${cnic}` }, 404);
    }

    // Get all related data for these EMRs
    const emrIds = emrs.map((emr) => emr.id);

    const presentingComplaints = await db
      .select()
      .from(tables.presentingComplaint)
      .where(inArray(tables.presentingComplaint.emrId, emrIds))
      .execute();

    const currentPregnancies = await db
      .select()
      .from(tables.currentPregnancy)
      .where(inArray(tables.currentPregnancy.emrId, emrIds))
      .execute();

    const trimesters = await db
      .select()
      .from(tables.trimester)
      .where(inArray(tables.trimester.emrId, emrIds))
      .execute();

    const obsHistories = await db
      .select()
      .from(tables.obsHistory)
      .where(inArray(tables.obsHistory.emrId, emrIds))
      .execute();

    const gynecologicalHistories = await db
      .select()
      .from(tables.gynecologicalHistory)
      .where(inArray(tables.gynecologicalHistory.emrId, emrIds))
      .execute();

    const surgicalHistories = await db
      .select()
      .from(tables.surgicalHistory)
      .where(inArray(tables.surgicalHistory.emrId, emrIds))
      .execute();

    const familyHistories = await db
      .select()
      .from(tables.familyHistory)
      .where(inArray(tables.familyHistory.emrId, emrIds))
      .execute();

    const personalHistories = await db
      .select()
      .from(tables.personalHistory)
      .where(inArray(tables.personalHistory.emrId, emrIds))
      .execute();

    const socioEconomicHistories = await db
      .select()
      .from(tables.socioEconomicHistory)
      .where(inArray(tables.socioEconomicHistory.emrId, emrIds))
      .execute();

    const redFlags = await db
      .select()
      .from(tables.redFlags)
      .where(inArray(tables.redFlags.emrId, emrIds))
      .execute();

    const followupQuestions = await db
      .select()
      .from(tables.followupQuestions)
      .where(inArray(tables.followupQuestions.emrId, emrIds))
      .execute();

    const proposedPlans = await db
      .select()
      .from(tables.proposedPlan)
      .where(inArray(tables.proposedPlan.emrId, emrIds))
      .execute();

    const allPreviousPregnancies = await db
      .select()
      .from(tables.previousPregnancy)
      .where(inArray(tables.previousPregnancy.emrId, emrIds))
      .execute();

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

    const presentingComplaintsMap = createLookupMap(
      presentingComplaints,
      "emrId"
    );
    const currentPregnanciesMap = createLookupMap(currentPregnancies, "emrId");
    const trimestersMap = createLookupMap(trimesters, "emrId");
    const obsHistoriesMap = createLookupMap(obsHistories, "emrId");
    const gynecologicalHistoriesMap = createLookupMap(
      gynecologicalHistories,
      "emrId"
    );
    const surgicalHistoriesMap = createLookupMap(surgicalHistories, "emrId");
    const familyHistoriesMap = createLookupMap(familyHistories, "emrId");
    const personalHistoriesMap = createLookupMap(personalHistories, "emrId");
    const socioEconomicHistoriesMap = createLookupMap(
      socioEconomicHistories,
      "emrId"
    );
    const redFlagsMap = createGroupedLookupMap(redFlags, "emrId");
    const followupQuestionsMap = createGroupedLookupMap(
      followupQuestions,
      "emrId"
    );
    const proposedPlansMap = createGroupedLookupMap(proposedPlans, "emrId");

    // Group previous pregnancies by EMR ID
    const previousPregnanciesByEmrId = allPreviousPregnancies.reduce(
      (acc, pregnancy) => {
        const emrId = pregnancy.emrId;
        if (!acc[emrId]) {
          acc[emrId] = [];
        }
        acc[emrId].push(pregnancy);
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Transform the response to match the schema
    const transformedEmrs = emrs.map((emr) => ({
      id: emr.id,
      phone: emr.phone,
      visit: emr.visit,
      createdAt: emr.createdAt,
      updatedAt: emr.updatedAt,
      patient: patient || {},
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
      proposedPlan: proposedPlansMap[emr.id] || [],
      previousPregnancy: (previousPregnanciesByEmrId[emr.id] || []).map(
        (pregnancy) => ({
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
          updatedAt: pregnancy.updatedAt,
        })
      ),
    }));

    return c.json({ emrs: transformedEmrs }, 200);
  });
};

// --- update-emr ---
const validSections = new Set([
  "patient",
  "presentingComplaint",
  "currentPregnancy",
  "trimester",
  "obsHistory",
  "gynecologicalHistory",
  "surgicalHistory",
  "familyHistory",
  "personalHistory",
  "socioEconomicHistory",
  "redFlags",
  "followupQuestions",
  "proposedPlan",
  "previousPregnancy",
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
const updateEmrHandler = () => {
  app.openapi(updateEmrRoute, async (c) => {
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
};

// --- Create EMR Schema ---
const CreateEmrRequestSchema = z.object({
  phone: z.string(),
  patientId: z.string(),
  visit: z.number(),
  patient: z.record(z.unknown()).optional(),
  currentPregnancy: z.record(z.unknown()).optional(),
  obsHistory: z.record(z.unknown()).optional(),
  gynecologicalHistory: z.record(z.unknown()).optional(),
  surgicalHistory: z.record(z.unknown()).optional(),
  familyHistory: z.record(z.unknown()).optional(),
  personalHistory: z.record(z.unknown()).optional(),
  socioEconomicHistory: z.record(z.unknown()).optional(),
  previousPregnancy: z.array(z.record(z.unknown())).optional(),
});

const CreateEmrSuccessSchema = z.object({
  message: z.string(),
  emrId: z.string().uuid(),
  createdAt: z.string().datetime(),
});

// --- Create EMR Route ---
const createEmrRoute = createRoute({
  method: "post",
  operationId: "createEmr",
  tags: ["EMR"],
  path: "/emr/create",
  summary: "Create a new EMR record",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: { "application/json": { schema: CreateEmrRequestSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: CreateEmrSuccessSchema } },
      description: "EMR created successfully",
    },
    500: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Internal Server Error",
    },
  },
});

const createEmrHandler = () => {
  app.openapi(createEmrRoute, async (c) => {
    try {
      const body = await c.req.json();
      const { patientId, phone, patient } = body;

      // 1️⃣ Check if patient exists (by ID or phone)
      const existingPatient = await db
        .select()
        .from(tables.patient)
        .where(
          patientId
            ? eq(tables.patient.id, patientId)
            : eq(tables.patient.phoneNumber, phone)
        )
        .then((res) => res.at(0));

      let finalPatientId = patientId;

      if (existingPatient) {
        finalPatientId = existingPatient.id;

        // 2️⃣ Update existing patient with any new info provided
        if (patient && Object.keys(patient).length > 0) {
          await db
            .update(tables.patient)
            .set({
              ...patient,
              updatedAt: new Date(),
            })
            .where(eq(tables.patient.id, finalPatientId))
            .execute();
        }
      }

      // 4️⃣ Create EMR for that patient
      const [insertedEmr] = await db
        .insert(tables.emr)
        .values({
          phone,
          patientId: finalPatientId,
          visit: body.visit || 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({
          id: tables.emr.id,
          createdAt: tables.emr.createdAt,
        });

      const emrId = insertedEmr.id;

      // 5️⃣ Helper for inserting JSON sections
      const insertJsonSection = async (table: any, data: any) => {
        if (data && Object.keys(data).length > 0) {
          await db
            .insert(table)
            .values({ emrId, ...data })
            .execute();
        }
      };

      // 6️⃣ Insert related sections
      await insertJsonSection(tables.currentPregnancy, body.currentPregnancy);
      await insertJsonSection(tables.obsHistory, body.obsHistory);
      await insertJsonSection(
        tables.gynecologicalHistory,
        body.gynecologicalHistory
      );
      await insertJsonSection(tables.surgicalHistory, body.surgicalHistory);
      await insertJsonSection(tables.familyHistory, body.familyHistory);
      await insertJsonSection(tables.personalHistory, body.personalHistory);
      await insertJsonSection(tables.medicalHistory, body.medicalHistory);
      await insertJsonSection(
        tables.socioEconomicHistory,
        body.socioEconomicHistory
      );

      // 7️⃣ Handle previousPregnancy array
      if (
        Array.isArray(body.previousPregnancy) &&
        body.previousPregnancy.length > 0
      ) {
        const pregnancies = body.previousPregnancy.map((p) => ({
          emrId,
          ...p,
        }));
        await db.insert(tables.previousPregnancy).values(pregnancies).execute();
      }

      // 8️⃣ Respond success
      return c.json(
        {
          message: "EMR created successfully",
          patientId: finalPatientId,
          emrId,
          createdAt:
            insertedEmr.createdAt instanceof Date
              ? insertedEmr.createdAt.toISOString()
              : new Date().toISOString(),
        },
        200
      );
    } catch (err: any) {
      console.error("❌ Error creating EMR:", err);
      return c.json({ error: err.message || "Internal Server Error" }, 500);
    }
  });
};

const UpdateEmrDataRequestSchema = CreateEmrRequestSchema.omit({ visit: true }) // we don’t want visit enforced for updates
  .extend({
    emrId: z.string().uuid().optional(), // only required for update
  });

const updateEmrDataRoute = createRoute({
  method: "patch",
  path: "/emr/update",
  operationId: "updateEmr",
  tags: ["EMR"],
  summary: "Update an existing EMR record",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: { "application/json": { schema: UpdateEmrDataRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "EMR updated successfully",
      content: { "application/json": { schema: CreateEmrSuccessSchema } },
    },
    404: {
      description: "EMR not found",
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
    },
    500: {
      description: "Internal Server Error",
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
    },
  },
});

// ✅ Update Handler
const updateEmrDataHandler = () => {
  app.openapi(updateEmrDataRoute, async (c) => {
    try {
      const body = await c.req.json();
      const { emrId, patientId, phone, patient } = body;

      // 🛑 1️⃣ Validate EMR ID
      if (!emrId) return c.json({ error: "emrId is required for update" }, 400);

      // 2️⃣ Check if EMR exists
      const existingEmr = await db
        .select()
        .from(tables.emr)
        .where(eq(tables.emr.id, emrId))
        .then((res) => res.at(0));

      if (!existingEmr) {
        return c.json({ error: "EMR not found" }, 404);
      }

      // 🧹 Utility: remove timestamp/id fields that cause Drizzle errors
      const sanitize = (obj: any) => {
        if (!obj || typeof obj !== "object") return obj;
        const { id, emrId, createdAt, updatedAt, ...rest } = obj;
        return rest;
      };

      // 3️⃣ Update patient (if provided)
      if (patientId && patient && Object.keys(patient).length > 0) {
        const safePatient = sanitize(patient);
        await db
          .update(tables.patient)
          .set({
            ...safePatient,
            updatedAt: new Date(),
          })
          .where(eq(tables.patient.id, patientId))
          .execute();
      }

      // 4️⃣ Update EMR base record
      await db
        .update(tables.emr)
        .set({
          phone,
          updatedAt: new Date(),
        })
        .where(eq(tables.emr.id, emrId))
        .execute();

      // 5️⃣ Helper for updating/inserting JSON sections
      const upsertSection = async (table: any, data: any) => {
        if (!data || Object.keys(data).length === 0) return;
        const cleanData = sanitize(data);

        const existingSection = await db
          .select()
          .from(table)
          .where(eq(table.emrId, emrId))
          .then((res) => res.at(0));

        if (existingSection) {
          await db
            .update(table)
            .set(cleanData)
            .where(eq(table.emrId, emrId))
            .execute();
        } else {
          await db
            .insert(table)
            .values({ emrId, ...cleanData })
            .execute();
        }
      };

      // 6️⃣ Update or insert related sections
      await upsertSection(tables.currentPregnancy, body.currentPregnancy);
      await upsertSection(tables.obsHistory, body.obsHistory);
      await upsertSection(
        tables.gynecologicalHistory,
        body.gynecologicalHistory
      );
      await upsertSection(tables.surgicalHistory, body.surgicalHistory);
      await upsertSection(tables.familyHistory, body.familyHistory);
      await upsertSection(tables.personalHistory, body.personalHistory);
       await upsertSection(tables.medicalHistory, body.medicalHistory);
      await upsertSection(
        tables.socioEconomicHistory,
        body.socioEconomicHistory
      );

      // 7️⃣ Handle previousPregnancy array (replace all existing)
      if (Array.isArray(body.previousPregnancy)) {
        await db
          .delete(tables.previousPregnancy)
          .where(eq(tables.previousPregnancy.emrId, emrId));
        if (body.previousPregnancy.length > 0) {
          const pregnancies = body.previousPregnancy.map((p) => ({
            emrId,
            ...sanitize(p),
          }));
          await db
            .insert(tables.previousPregnancy)
            .values(pregnancies)
            .execute();
        }
      }

      // ✅ Success
      return c.json(
        {
          message: "EMR updated successfully",
          emrId,
          updatedAt: new Date().toISOString(),
        },
        200
      );
    } catch (err: any) {
      console.error("❌ Error updating EMR:", err);
      return c.json({ error: err.message || "Internal Server Error" }, 500);
    }
  });
};

export {
  getEmrDetailsHandler,
  getAllEmrsFromPhoneHandler,
  getAllEmrsFromCnicHandler,
  updateEmrHandler,
  createEmrHandler,
  updateEmrDataHandler,
};
