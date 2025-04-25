import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { examinationDetailsTable } from '@/models/examination-details';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

const SuccessResponseSchema = z.object({
  emrId: z.string(),
  doctorId: z.string(),
  modifiedDoctorId: z.string().nullable().optional(),
  generationTime: z.date(),
  updatedAt: z.date(),

  // Vitals
  bloodPressure: z.string().nullable().optional(),
  pr: z.string().nullable().optional(),
  rr: z.string().nullable().optional(),
  temperature: z.string().nullable().optional(),

  // General Exam
  bilateralPedalEdema: z.string().nullable().optional(),
  clubbing: z.string().nullable().optional(),
  jaundice: z.string().nullable().optional(),
  koilonychia: z.string().nullable().optional(),
  lymphNodes: z.string().nullable().optional(),
  pallor: z.string().nullable().optional(),
  spine: z.string().nullable().optional(),

  // Breast Exam
  nippleDeformity: z.string().nullable().optional(),
  nippleDischarge: z.string().nullable().optional(),
  sizeComparison: z.string().nullable().optional(),
  swelling: z.string().nullable().optional(),

  // Abdominal Exam
  abdominalWallEdema: z.string().nullable().optional(),
  estimatedFetalWeight: z.string().nullable().optional(),
  fetalHeartRate: z.string().nullable().optional(),
  fundalHeight: z.string().nullable().optional(),
  hernialOrfices: z.string().nullable().optional(),
  lie: z.string().nullable().optional(),
  liquor: z.string().nullable().optional(),
  presentation: z.string().nullable().optional(),
  prominentVeins: z.string().nullable().optional(),
  pulsations: z.string().nullable().optional(),
  scarTenderness: z.string().nullable().optional(),
  shapeOfAbdomen: z.string().nullable().optional(),
  striae: z.string().nullable().optional(),
  umbilicus: z.string().nullable().optional(),

  // Per Speculum Exam
  perSpeculumFindings: z.string().nullable().optional(),

  // Per Vaginal Exam
  perVaginalFindings: z.string().nullable().optional(),

  // Systematic Exam
  cns: z.string().nullable().optional(),
  cvs: z.string().nullable().optional()
});

const NotFoundSchema = z.object({
  error: z.string().openapi({
    example: 'No Examination Details Found With EMR ID'
  })
});

const route = createRoute({
  method: 'get',
  operationId: 'getExaminationDetails',
  tags: ['Examination'],
  path: '/examination-detail/emr/{emrId}',
  summary: 'Fetches Examination Detail for a specific EMR',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      emrId: z.string().openapi({ example: '01J860QF8AZXB1SMMXHXP2953A' })
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SuccessResponseSchema
        }
      },
      description: 'Examination Detail found'
    },
    404: {
      content: {
        'application/json': {
          schema: NotFoundSchema
        }
      },
      description: 'Not Found'
    }
  }
});

const handler = app.openapi(route, async c => {
  const { emrId } = c.req.valid('param');

  const examinationDetail = await db
    .select()
    .from(examinationDetailsTable)
    .where(eq(examinationDetailsTable.emrId, emrId))
    .limit(1)
    .execute()
    .then(res => res.at(0));

  if (!examinationDetail) {
    return c.json(
      { error: `No Examination Details Found With EMR ID ${emrId}` },
      404
    );
  }

  return c.json(examinationDetail, 200);
});

export type GetExaminationDetailRoute = typeof handler;

export default route;
