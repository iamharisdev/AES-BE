// ... existing code ...
import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { createRoute, z } from '@hono/zod-openapi'

const DoctorSchema = z.object({
  doctorId: z.string().openapi({ example: 'uuid-1234' }),
  name: z.string().openapi({ example: 'Nazia' }),
  phoneNumber: z.string().openapi({ example: '03001234567' }),
  maternityHomeName: z.string().openapi({ example: 'Zacha Bacha Clinic' }),
})

const route = createRoute({
  method: 'get',
  operationId: 'getDoctors',
  tags: ['Doctor'],
  path: '/doctors',
  summary: 'Fetch all doctors',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(DoctorSchema),
        },
      },
      description: 'List of all doctors',
    },
  },
})

export const getDoctorsRoute = () =>{


 app.openapi(route, async (c) => {
  const doctors = await db.select().from(table.doctor).execute()
  return c.json(doctors, 200)
})

}
