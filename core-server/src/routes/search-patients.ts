import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { createRoute, z } from '@hono/zod-openapi'
import { ilike, or } from 'drizzle-orm'

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
)

const NotFoundSchema = z.object({
  error: z.string().openapi({
    example: 'No patients found for the given search key',
  }),
})

const route = createRoute({
  method: 'get',
  operationId: 'searchPatients',
  tags: ['Patient'],
  path: '/patient/search/{searchKey}',
  summary: 'Search patients by name, phone number, or CNIC',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    query: z.object({
      searchKey: z.string().min(3).openapi({ example: 'Ali' }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: PatientSearchResponseSchema,
        },
      },
      description: 'Returns a list of matching patients',
    },
    404: {
      content: {
        'application/json': {
          schema: NotFoundSchema,
        },
      },
      description: 'Not Found',
    },
  },
})

const handler = app.openapi(route, async (c) => {
  const { searchKey } = c.req.valid('query')

  // 🔍 Perform Fuzzy Search Using ILIKE
  const patients = await db
    .select()
    .from(table.patient.info)
    .where(
      or(
        ilike(table.patient.info.name, `%${searchKey}%`),
        ilike(table.patient.info.phone, `%${searchKey}%`),
        ilike(table.patient.info.cnic, `%${searchKey}%`)
      )
    )
    .execute()


  return c.json(patients, 200)
})

export type SearchPatientsRoute = typeof handler

export default route
