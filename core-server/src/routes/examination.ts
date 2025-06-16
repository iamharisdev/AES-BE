import app from "@/app";
import { db } from "@/db";
import { JwtPayload, jwtMiddleware } from "@/middleware/jwt";
import { requireDoctor } from "@/middleware/permissions";
import { tables } from "@/models";
import { createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

// Common schemas
const ExaminationSchema = z.object({
  vitals: z.object({
    bloodPressure: z.string().optional(),
    pr: z.string().optional(),
    rr: z.string().optional(),
    temperature: z.string().optional(),
  }),
  generalExam: z.object({
    bilateralPedalEdema: z.string().optional(),
    clubbing: z.string().optional(),
    jaundice: z.string().optional(),
    koilonychia: z.string().optional(),
    lymphNodes: z.string().optional(),
    pallor: z.string().optional(),
    spine: z.string().optional(),
  }),
  breast: z.object({
    nippleDeformity: z.string().optional(),
    nippleDischarge: z.string().optional(),
    sizeComparison: z.string().optional(),
    swelling: z.string().optional(),
  }),
  abdominalExam: z.object({
    abdominalWallEdema: z.string().optional(),
    estimatedFetalWeight: z.string().optional(),
    fetalHeartRate: z.string().optional(),
    fundalHeight: z.string().optional(),
    hernialOrfices: z.string().optional(),
    lie: z.string().optional(),
    liquor: z.string().optional(),
    presentation: z.string().optional(),
    prominentVeins: z.string().optional(),
    pulsations: z.string().optional(),
    scarTenderness: z.string().optional(),
    shapeOfAbdomen: z.string().optional(),
    striae: z.string().optional(),
    umbilicus: z.string().optional(),
  }),
  perVaginalFindings: z.string().optional(),
  perSpeculumFindings: z.string().optional(),
  systematicExam: z.object({
    cns: z.string().optional(),
    cvs: z.string().optional(),
  }),
});

// --- GET Examination ---
const GetExaminationSuccessSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  updatedByUserId: z.string().uuid().nullable(),
  bloodPressure: z.string().nullable(),
  pr: z.string().nullable(),
  rr: z.string().nullable(),
  temperature: z.string().nullable(),
  bilateralPedalEdema: z.string().nullable(),
  clubbing: z.string().nullable(),
  jaundice: z.string().nullable(),
  koilonychia: z.string().nullable(),
  lymphNodes: z.string().nullable(),
  pallor: z.string().nullable(),
  spine: z.string().nullable(),
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
  presentation: z.string().nullable(),
  prominentVeins: z.string().nullable(),
  pulsations: z.string().nullable(),
  scarTenderness: z.string().nullable(),
  shapeOfAbdomen: z.string().nullable(),
  striae: z.string().nullable(),
  umbilicus: z.string().nullable(),
  perSpeculumFindings: z.string().nullable(),
  perVaginalFindings: z.string().nullable(),
  cns: z.string().nullable(),
  cvs: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

const GetExaminationNotFoundSchema = z.object({
  error: z.string().openapi({ example: 'No Examination Found With EMR ID' }),
});

const getExaminationRoute = createRoute({
  method: 'get',
  operationId: 'getExamination',
  tags: ['Examination'],
  path: '/examination/{emrId}',
  summary: 'Fetches Examination for a specific EMR',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      emrId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GetExaminationSuccessSchema,
        },
      },
      description: 'Examination found',
    },
    404: {
      content: {
        'application/json': {
          schema: GetExaminationNotFoundSchema,
        },
      },
      description: 'Not Found',
    },
  },
});

const getExaminationHandler = app.openapi(getExaminationRoute, async (c) => {
  const { emrId } = c.req.valid('param');
  const record = await db
    .select()
    .from(tables.examination)
    .where(eq(tables.examination.emrId, emrId))
    .execute()
    .then((res) => res.at(0));

  if (!record) {
    return c.json(
      { error: `No Examination Found With EMR ID ${emrId}` },
      404
    );
  }

  return c.json(record, 200);
});

// --- CREATE Examination ---
const CreateExaminationRequestSchema = z.object({
  emrId: z.string().uuid(),
  examination: ExaminationSchema,
});

const CreateExaminationSuccessSchema = z.object({
  id: z.string().uuid(),
  message: z.string(),
});

const CreateExaminationConflictSchema = z.object({
  error: z.string().openapi({ example: "Examination already exist for this EMR" }),
});

const CreateExaminationUnauthorizedSchema = z.object({
  error: z.string().openapi({ example: 'Unauthorized - Doctor not found' }),
});

const CreateExaminationServerErrorSchema = z.object({
  error: z.string().openapi({ example: 'Failed to create examination' }),
});

const createExaminationRoute = createRoute({
  method: 'post',
  operationId: 'createExamination',
  tags: ['Examination'],
  path: '/examination',
  summary: "Create new examination for a patient EMR",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware, requireDoctor()],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateExaminationRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: CreateExaminationSuccessSchema,
        },
      },
      description: 'Examination created successfully',
    },
    401: {
      content: {
        'application/json': {
          schema: CreateExaminationUnauthorizedSchema,
        },
      },
      description: 'Unauthorized',
    },
    409: {
      content: {
        'application/json': {
          schema: CreateExaminationConflictSchema,
        },
      },
      description: 'Conflict - Examination already exist',
    },
    500: {
      content: {
        'application/json': {
          schema: CreateExaminationServerErrorSchema,
        },
      },
      description: 'Server Error',
    },
  },
});

const createExaminationHandler = app.openapi(createExaminationRoute, async (c) => {
  const { emrId, examination } = c.req.valid('json');
  const jwtPayload = c.get('jwtPayload') as JwtPayload;

  const user = await db
    .select()
    .from(tables.user)
    .where(eq(tables.user.phoneNumber, jwtPayload.phoneNumber))
    .then((d) => d.at(0));

  if (!user) {
    return c.json({ error: 'Unauthorized - Doctor not found' }, 401);
  }

  // Check if examination already exist for this EMR
  const existingRecord = await db
    .select()
    .from(tables.examination)
    .where(eq(tables.examination.emrId, emrId))
    .execute()
    .then((res) => res.at(0));

  if (existingRecord) {
    return c.json({ error: "Examination already exist for this EMR" }, 409);
  }

  // Create new record
  const newRecord = await db
    .insert(tables.examination)
    .values({
      emrId,
      userId: user.id,
      bloodPressure: examination.vitals.bloodPressure,
      pr: examination.vitals.pr,
      rr: examination.vitals.rr,
      temperature: examination.vitals.temperature,
      bilateralPedalEdema: examination.generalExam.bilateralPedalEdema,
      clubbing: examination.generalExam.clubbing,
      jaundice: examination.generalExam.jaundice,
      koilonychia: examination.generalExam.koilonychia,
      lymphNodes: examination.generalExam.lymphNodes,
      pallor: examination.generalExam.pallor,
      spine: examination.generalExam.spine,
      nippleDeformity: examination.breast.nippleDeformity,
      nippleDischarge: examination.breast.nippleDischarge,
      sizeComparison: examination.breast.sizeComparison,
      swelling: examination.breast.swelling,
      abdominalWallEdema: examination.abdominalExam.abdominalWallEdema,
      estimatedFetalWeight: examination.abdominalExam.estimatedFetalWeight,
      fetalHeartRate: examination.abdominalExam.fetalHeartRate,
      fundalHeight: examination.abdominalExam.fundalHeight,
      hernialOrfices: examination.abdominalExam.hernialOrfices,
      lie: examination.abdominalExam.lie,
      liquor: examination.abdominalExam.liquor,
      presentation: examination.abdominalExam.presentation,
      prominentVeins: examination.abdominalExam.prominentVeins,
      pulsations: examination.abdominalExam.pulsations,
      scarTenderness: examination.abdominalExam.scarTenderness,
      shapeOfAbdomen: examination.abdominalExam.shapeOfAbdomen,
      striae: examination.abdominalExam.striae,
      umbilicus: examination.abdominalExam.umbilicus,
      perSpeculumFindings: examination.perSpeculumFindings,
      perVaginalFindings: examination.perVaginalFindings,
      cns: examination.systematicExam.cns,
      cvs: examination.systematicExam.cvs,
    })
    .returning({ id: tables.examination.id })
    .execute()
    .then((res) => res.at(0));

  if (!newRecord) {
    return c.json({ error: 'Failed to create examination' }, 500);
  }

  return c.json({
    id: newRecord.id,
    message: 'Examination created successfully',
  }, 201);
});

// --- UPDATE Examination ---
const UpdateExaminationRequestSchema = z.object({
  examination: ExaminationSchema,
});

const UpdateExaminationSuccessSchema = z.object({
  message: z.string(),
});

const UpdateExaminationNotFoundSchema = z.object({
  error: z.string().openapi({ example: "Examination not found for this EMR" }),
});

const UpdateExaminationUnauthorizedSchema = z.object({
  error: z.string().openapi({ example: 'Unauthorized - Doctor not found' }),
});

const updateExaminationRoute = createRoute({
  method: 'put',
  operationId: 'updateExamination',
  tags: ['Examination'],
  path: '/examination/{emrId}',
  summary: "Update examination for a patient EMR",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware, requireDoctor()],
  request: {
    params: z.object({
      emrId: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateExaminationRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UpdateExaminationSuccessSchema,
        },
      },
      description: 'Examination updated successfully',
    },
    401: {
      content: {
        'application/json': {
          schema: UpdateExaminationUnauthorizedSchema,
        },
      },
      description: 'Unauthorized',
    },
    404: {
      content: {
        'application/json': {
          schema: UpdateExaminationNotFoundSchema,
        },
      },
      description: 'Not Found',
    },
  },
});

const updateExaminationHandler = app.openapi(updateExaminationRoute, async (c) => {
  const { emrId } = c.req.valid('param');
  const { examination } = c.req.valid('json');
  const jwtPayload = c.get('jwtPayload') as JwtPayload;

  const user = await db
    .select()
    .from(tables.user)
    .where(eq(tables.user.phoneNumber, jwtPayload.phoneNumber))
    .then((d) => d.at(0));

  if (!user) {
    return c.json({ error: 'Unauthorized - Doctor not found' }, 401);
  }

  // Check if examination exists for this EMR
  const existingRecord = await db
    .select()
    .from(tables.examination)
    .where(eq(tables.examination.emrId, emrId))
    .execute()
    .then((res) => res.at(0));

  if (!existingRecord) {
    return c.json({ error: "Examination not found for this EMR" }, 404);
  }

  // Update the record
  await db
    .update(tables.examination)
    .set({
      updatedByUserId: user.id,
      bloodPressure: examination.vitals.bloodPressure,
      pr: examination.vitals.pr,
      rr: examination.vitals.rr,
      temperature: examination.vitals.temperature,
      bilateralPedalEdema: examination.generalExam.bilateralPedalEdema,
      clubbing: examination.generalExam.clubbing,
      jaundice: examination.generalExam.jaundice,
      koilonychia: examination.generalExam.koilonychia,
      lymphNodes: examination.generalExam.lymphNodes,
      pallor: examination.generalExam.pallor,
      spine: examination.generalExam.spine,
      nippleDeformity: examination.breast.nippleDeformity,
      nippleDischarge: examination.breast.nippleDischarge,
      sizeComparison: examination.breast.sizeComparison,
      swelling: examination.breast.swelling,
      abdominalWallEdema: examination.abdominalExam.abdominalWallEdema,
      estimatedFetalWeight: examination.abdominalExam.estimatedFetalWeight,
      fetalHeartRate: examination.abdominalExam.fetalHeartRate,
      fundalHeight: examination.abdominalExam.fundalHeight,
      hernialOrfices: examination.abdominalExam.hernialOrfices,
      lie: examination.abdominalExam.lie,
      liquor: examination.abdominalExam.liquor,
      presentation: examination.abdominalExam.presentation,
      prominentVeins: examination.abdominalExam.prominentVeins,
      pulsations: examination.abdominalExam.pulsations,
      scarTenderness: examination.abdominalExam.scarTenderness,
      shapeOfAbdomen: examination.abdominalExam.shapeOfAbdomen,
      striae: examination.abdominalExam.striae,
      umbilicus: examination.abdominalExam.umbilicus,
      perSpeculumFindings: examination.perSpeculumFindings,
      perVaginalFindings: examination.perVaginalFindings,
      cns: examination.systematicExam.cns,
      cvs: examination.systematicExam.cvs,
      updatedAt: new Date()
    })
    .where(eq(tables.examination.emrId, emrId));

  return c.json({ message: 'Examination updated successfully' }, 200);
});

export type GetExaminationRoute = typeof getExaminationHandler;
export type CreateExaminationRoute = typeof createExaminationHandler;
export type UpdateExaminationRoute = typeof updateExaminationHandler;

export {
  getExaminationRoute,
  createExaminationRoute,
  updateExaminationRoute
};

export default getExaminationRoute;
