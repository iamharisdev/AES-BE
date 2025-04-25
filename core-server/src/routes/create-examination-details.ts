import app from "@/app";
import { db } from "@/db";
import { JwtPayload, jwtMiddleware } from "@/middleware/jwt";
import { table } from "@/models";
import { createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

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

const RequestSchema = z.object({
  emrId: z.string().min(1).openapi({ example: "emr-123456" }),
  examination: ExaminationSchema,
});

const route = createRoute({
  method: "post",
  operationId: "createExamination",
  tags: ["Examination"],
  path: "/examination-detail",
  summary: "Create new examination details for a patient EMR",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Examination created successfully",
      content: {
        "application/json": {
          schema: z.object({
            message: z
              .string()
              .openapi({ example: "Examination created successfully" }),
          }),
        },
      },
    },
    409: {
      description: "Conflict - Examination already exists",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().openapi({
              example: "Examination details already exist for this EMR",
            }),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized - Doctor not authenticated",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().openapi({ example: "Unauthorized" }),
          }),
        },
      },
    },
  },
});

const handler = app.openapi(route, async (c) => {
  const body = c.req.valid("json");
  console.log(body, "asdfadsf");
  const jwtPayload = c.get("jwtPayload") as JwtPayload;

  const doctor = await db
    .select()
    .from(table.doctor)
    .where(eq(table.doctor.phoneNumber, jwtPayload.phoneNumber))
    .then((d) => d.at(0));

  if (!doctor) {
    return c.json({ error: "Unauthorized - Doctor not found" }, 401);
  }

  // Check if examination already exists
  const existingExam = await db
    .select()
    .from(table.examinationDetails)
    .where(eq(table.examinationDetails.emrId, body.emrId))
    .then((res) => res.at(0));

  if (existingExam) {
    return c.json(
      { error: "Examination details already exist for this EMR" },
      409
    );
  }

  await db.insert(table.examinationDetails).values({
    doctorId: doctor.doctorId,
    emrId: body.emrId,
    generationTime: new Date(),
    updatedAt: new Date(),
    // Vitals
    bloodPressure: body.examination.vitals.bloodPressure,
    pr: body.examination.vitals.pr,
    rr: body.examination.vitals.rr,
    temperature: body.examination.vitals.temperature,

    // General Exam
    bilateralPedalEdema: body.examination.generalExam.bilateralPedalEdema,
    clubbing: body.examination.generalExam.clubbing,
    jaundice: body.examination.generalExam.jaundice,
    koilonychia: body.examination.generalExam.koilonychia,
    lymphNodes: body.examination.generalExam.lymphNodes,
    pallor: body.examination.generalExam.pallor,
    spine: body.examination.generalExam.spine,

    // Breast
    nippleDeformity: body.examination.breast.nippleDeformity,
    nippleDischarge: body.examination.breast.nippleDischarge,
    sizeComparison: body.examination.breast.sizeComparison,
    swelling: body.examination.breast.swelling,

    // Abdominal Exam
    abdominalWallEdema: body.examination.abdominalExam.abdominalWallEdema,
    estimatedFetalWeight: body.examination.abdominalExam.estimatedFetalWeight,
    fetalHeartRate: body.examination.abdominalExam.fetalHeartRate,
    fundalHeight: body.examination.abdominalExam.fundalHeight,
    hernialOrfices: body.examination.abdominalExam.hernialOrfices,
    lie: body.examination.abdominalExam.lie,
    liquor: body.examination.abdominalExam.liquor,
    presentation: body.examination.abdominalExam.presentation,
    prominentVeins: body.examination.abdominalExam.prominentVeins,
    pulsations: body.examination.abdominalExam.pulsations,
    scarTenderness: body.examination.abdominalExam.scarTenderness,
    shapeOfAbdomen: body.examination.abdominalExam.shapeOfAbdomen,
    striae: body.examination.abdominalExam.striae,
    umbilicus: body.examination.abdominalExam.umbilicus,

    // Per Speculum
    perSpeculumFindings: body.examination.perSpeculumFindings,

    // Per Vaginal
    perVaginalFindings: body.examination.perVaginalFindings,

    // Systematic
    cns: body.examination.systematicExam.cns,
    cvs: body.examination.systematicExam.cvs,
  });

  return c.json({ message: "Examination created successfully" }, 201);
});

export type CreateExaminationRoute = typeof handler;

export default route;
