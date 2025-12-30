import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { table } from "@/models";
import { createRoute, z } from "@hono/zod-openapi";
import { desc, ilike, or } from "drizzle-orm";

const PatientSearchResponseSchema = z.array(
  z.object({
    patientId: z.string().uuid(),
    phone: z.string(),
    name: z.string(),
    location: z.string(),
    cnic: z.string(),
    generationTime: z.date(),
    prevPregnancies: z.record(z.unknown()).nullable(),
  })
);

const NotFoundSchema = z.object({
  error: z.string().openapi({
    example: "No patients found for the given search key",
  }),
});

const route = createRoute({
  method: "get",
  operationId: "searchPatients",
  tags: ["Patient"],
  path: "/patient/search",
  summary: "Search patients by name, phone number, or CNIC",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    query: z.object({
      searchKey: z
        .string()
        .trim()
        .min(3)
        .optional()
        .or(z.literal("").transform(() => undefined)),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PatientSearchResponseSchema,
        },
      },
      description: "Returns a list of matching patients",
    },
    404: {
      content: {
        "application/json": {
          schema: NotFoundSchema,
        },
      },
      description: "Not Found",
    },
  },
});

export const searchPatients = ()=>{



app.openapi(route, async (c) => {
  const { searchKey } = c.req.valid("query");
  let patients;

  if (searchKey && searchKey.trim().length >= 3) {
    patients = await db
      .select()
      .from(table.patient.info)
      .where(
        or(
          ilike(table.patient.info.name, `%${searchKey}%`),
          ilike(table.patient.info.phone, `%${searchKey}%`),
          ilike(table.patient.info.cnic, `%${searchKey}%`)
        )
      )
      .orderBy(desc(table.patient.info.generationTime)) // 👈 sort by latest
      .limit(50)
      .execute();

    if (patients.length === 0) {
      return c.json(
        { error: "No patients found for the given search key" },
        404
      );
    }
  } else {
    // Return initial 20 records
    patients = await db
      .select()
      .from(table.patient.info)
      .orderBy(desc(table.patient.info.generationTime)) // 👈 sort by latest
      .limit(20)
      .execute();
  }

  return c.json(patients, 200);
})
}


