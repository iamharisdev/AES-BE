import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { EMR } from '@/schemas/emr-combined';
import { createRoute, z } from '@hono/zod-openapi';
import { eq, sql } from 'drizzle-orm';

// --- get-emr-details ---
const GetEmrSuccessResponseSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  content: EMR
});
const GetEmrNotFoundSchema = z.object({
  error: z.string().openapi({ example: 'No Record Found With Patient ID' })
});
const getEmrDetailsRoute = createRoute({
  method: 'get',
  operationId: 'getEmr',
  tags: ['EMR'],
  path: '/emr/id/{id}',
  summary: 'Get EMR Contents',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '01J860QF8AZXB1SMMXHXP2953A' })
    })
  },
  responses: {
    200: {
      content: { 'application/json': { schema: GetEmrSuccessResponseSchema } },
      description: 'Return the EMR Record'
    },
    404: {
      content: { 'application/json': { schema: GetEmrNotFoundSchema } },
      description: 'Not Found'
    }
  }
});
const getEmrDetailsHandler = app.openapi(getEmrDetailsRoute, async c => {
  const { id } = c.req.valid('param');
  const emr = await db
    .select()
    .from(tables.emr)
    .where(eq(tables.emr.id, id))
    .execute()
    .then(res => res.at(0));
  if (!emr) {
    return c.json({ error: `No Emr Record Found With Id ${id}` }, 404);
  }
  return c.json(emr, 200);
});

// --- get-erms-from-phone ---
const GetAllEmrsSuccessSchema = z.object({
  emrs: z.array(
    z.object({
      phone: z.string(),
      visit: z.number(),
      createdAt: z.date(),
      updatedAt: z.date(),
      patientProfile: z.record(z.unknown()),
      presentingComplaint: z.record(z.unknown()),
      currentPregnancy: z.record(z.unknown()),
      trimester: z.record(z.unknown()),
      obsHistory: z.record(z.unknown()),
      gynecologicalHistory: z.record(z.unknown()),
      medicalHistory: z.record(z.unknown()),
      surgicalHistory: z.record(z.unknown()),
      familyHistory: z.record(z.unknown()),
      personalHistory: z.record(z.unknown()),
      socioEconomicHistory: z.record(z.unknown()),
      id: z.string().uuid()
    })
  ),
  prevPregnancies: z.array(z.record(z.unknown()))
});
const GetAllEmrsNotFoundSchema = z.object({
  error: z
    .string()
    .openapi({ example: 'No EMR records found for this phone number' })
});
const getAllEmrsFromPhoneRoute = createRoute({
  method: 'get',
  operationId: 'getAllEmrsFromPhone',
  tags: ['EMR'],
  path: '/emr/getAllEmrsFromPhone/{phoneNumber}',
  summary: 'Get All EMRs for a Patient',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      phoneNumber: z.string().openapi({ example: '3123456789' })
    })
  },
  responses: {
    200: {
      content: { 'application/json': { schema: GetAllEmrsSuccessSchema } },
      description: 'Returns all EMR records for the given phone number'
    },
    404: {
      content: { 'application/json': { schema: GetAllEmrsNotFoundSchema } },
      description: 'Not Found'
    }
  }
});
const getAllEmrsFromPhoneHandler = app.openapi(
  getAllEmrsFromPhoneRoute,
  async c => {
    const { phoneNumber } = c.req.valid('param');
    const emrs = await db
      .select({
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
        medicalHistory: tables.medicalHistory,
        surgicalHistory: tables.surgicalHistory,
        familyHistory: tables.familyHistory,
        personalHistory: tables.personalHistory,
        socioEconomicHistory: tables.socioEconomicHistory,
        id: tables.emr.id,
        hasExamination: sql<boolean>`CASE WHEN ${tables.examination.id} IS NOT NULL THEN TRUE ELSE FALSE END`
      })
      .from(tables.emr)
      .leftJoin(tables.examination, eq(tables.emr.id, tables.examination.id))
      .leftJoin(tables.patient, eq(tables.emr.phone, tables.patient.phoneNumber))
      .leftJoin(tables.presentingComplaint, eq(tables.emr.id, tables.presentingComplaint.emrId))
      .leftJoin(tables.currentPregnancy, eq(tables.emr.id, tables.currentPregnancy.emrId))
      .leftJoin(tables.trimester, eq(tables.emr.id, tables.trimester.emrId))
      .leftJoin(tables.obsHistory, eq(tables.emr.id, tables.obsHistory.emrId))
      .leftJoin(tables.gynecologicalHistory, eq(tables.emr.id, tables.gynecologicalHistory.emrId))
      .leftJoin(tables.medicalHistory, eq(tables.emr.id, tables.medicalHistory.emrId))
      .leftJoin(tables.surgicalHistory, eq(tables.emr.id, tables.surgicalHistory.emrId))
      .leftJoin(tables.familyHistory, eq(tables.emr.id, tables.familyHistory.emrId))
      .leftJoin(tables.personalHistory, eq(tables.emr.id, tables.personalHistory.emrId))
      .leftJoin(tables.socioEconomicHistory, eq(tables.emr.id, tables.socioEconomicHistory.emrId))
      .where(eq(tables.emr.phone, phoneNumber))
      .execute();
    if (!emrs || emrs.length === 0) {
      return c.json(
        { error: `No EMR records found for phone number ${phoneNumber}` },
        404
      );
    }
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

    // Get previous pregnancies for each EMR
    const previousPregnancies = await Promise.all(
      emrs.map(async (emr) => {
        const pregnancies = await db
          .select()
          .from(tables.previousPregnancy)
          .where(eq(tables.previousPregnancy.emrId, emr.id))
          .execute();
        return pregnancies;
      })
    );

    return c.json({ emrs, previousPregnancies }, 200);
  }
);

// --- update-emr ---
const validSections = new Set([
  'patientProfile',
  'presentingComplaint',
  'currentPregnancy',
  'trimester',
  'obsHistory',
  'gynecologicalHistory',
  'medicalHistory',
  'surgicalHistory',
  'familyHistory',
  'personalHistory',
  'socioEconomicHistory'
]);
const UpdateEmrRequestSchema = z.object({
  id: z.string().uuid(),
  updates: z
    .array(
      z.object({
        section: z.string().refine(val => validSections.has(val), {
          message: 'Invalid section name'
        }),
        content: z.object({})
      })
    )
    .min(1)
    .refine(
      updates => {
        const sectionSet = new Set(updates.map(u => u.section));
        return sectionSet.size === updates.length;
      },
      { message: 'Duplicate sections are not allowed' }
    )
});
const UpdateEmrSuccessSchema = z.object({
  message: z.string(),
  updatedFields: z.array(z.string()),
  lastmodified: z.string().datetime()
});
const UpdateEmrNotFoundSchema = z.object({
  error: z.string().openapi({ example: 'No EMR record found with this ID' })
});
const UpdateEmrInternalServerErrorSchema = z.object({
  error: z.string().openapi({ example: 'Internal server error' })
});
const updateEmrRoute = createRoute({
  method: 'put',
  operationId: 'updateEmrSections',
  tags: ['EMR'],
  path: '/emr/updateEmrSections',
  summary: "Update EMR's Sections.",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: { 'application/json': { schema: UpdateEmrRequestSchema } }
    }
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UpdateEmrSuccessSchema } },
      description: 'Updated EMR Sections'
    },
    404: {
      content: { 'application/json': { schema: UpdateEmrNotFoundSchema } },
      description: 'Not Found'
    },
    500: {
      content: {
        'application/json': { schema: UpdateEmrInternalServerErrorSchema }
      },
      description: 'Internal Server Error'
    }
  }
});
const updateEmrHandler = app.openapi(updateEmrRoute, async c => {
  const { id, updates } = await c.req.json();
  const existingEmr = await db
    .select()
    .from(tables.emr)
    .where(eq(tables.emr.id, id))
    .execute()
    .then(res => res.at(0));
  if (!existingEmr) {
    return c.json({ error: `No EMR record found with ID ${id}` }, 404);
  }
  const updateData: Record<string, any> = {};
  updates.forEach((upd: any) => {
    updateData[upd.section] = upd.content;
  });
  updateData['updatedAt'] = new Date();
  const lastmodified = await db
    .update(tables.emr)
    .set(updateData)
    .where(eq(tables.emr.id, id))
    .returning({ updatedAt: tables.emr.updatedAt })
    .execute()
    .then(res => res.at(0)?.updatedAt?.toISOString());
  if (!lastmodified) {
    return c.json({ error: 'Failed to retrieve updated timestamp' }, 500);
  }
  return c.json(
    {
      message: 'EMR updated successfully',
      updatedFields: updates.map((u: any) => u.section),
      lastmodified
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
  }
};

export default emrRoute;
