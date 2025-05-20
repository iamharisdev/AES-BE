import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { tables } from '@/models'
import { RedFlagsSchema } from '@/schemas/red-flags'
import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'

// --- GET Red Flags ---
const GetRedFlagsSuccessSchema = z.object({
  id: z.string().uuid(),
  emrId: z.string(),
  redFlags: RedFlagsSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

const GetRedFlagsNotFoundSchema = z.object({
  error: z.string().openapi({ example: 'No EMR exists with the given EMR ID' }),
})

const getRedFlagsRoute = createRoute({
  method: 'get',
  operationId: 'getRedFlags',
  tags: ['Red Flags'],
  path: '/redflags/{emrId}',
  summary: 'Get Red flags from EMR of a patient, given EMR ID',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      emrId: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GetRedFlagsSuccessSchema,
        },
      },
      description: 'Red flags retrieved successfully',
    },
    404: {
      content: {
        'application/json': {
          schema: GetRedFlagsNotFoundSchema,
        },
      },
      description: 'Not Found',
    },
  },
})

const getRedFlagsHandler = app.openapi(getRedFlagsRoute, async (c) => {
  const { emrId } = c.req.valid('param')
  const record = await db.select()
    .from(tables.redFlags)
    .where(
      eq(tables.redFlags.emrId, emrId),
    )
    .execute()
    .then((res) => res.at(0))

  if (!record) {
    return c.json({ error: 'No EMR record exists with the given EMR ID' }, 404)
  }

  return c.json(record, 200)
})

// --- CREATE Red Flags ---
const CreateRedFlagsRequestSchema = z.object({
  emrId: z.string(),
  redFlags: RedFlagsSchema,
})

const CreateRedFlagsSuccessSchema = z.object({
  id: z.string().uuid(),
  message: z.string(),
})

const CreateRedFlagsConflictSchema = z.object({
  error: z.string().openapi({ example: 'Red flags already exist for this EMR' }),
})

const CreateRedFlagsServerErrorSchema = z.object({
  error: z.string().openapi({ example: 'Failed to create red flags' }),
})

const createRedFlagsRoute = createRoute({
  method: 'post',
  operationId: 'createRedFlags',
  tags: ['Red Flags'],
  path: '/redflags',
  summary: 'Create red flags for a patient EMR',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateRedFlagsRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: CreateRedFlagsSuccessSchema,
        },
      },
      description: 'Red flags created successfully',
    },
    409: {
      content: {
        'application/json': {
          schema: CreateRedFlagsConflictSchema,
        },
      },
      description: 'Conflict - Red flags already exist',
    },
    500: {
      content: {
        'application/json': {
          schema: CreateRedFlagsServerErrorSchema,
        },
      },
      description: 'Internal Server Error',
    },
  },
})

const createRedFlagsHandler = app.openapi(createRedFlagsRoute, async (c) => {
  const { emrId, redFlags } = c.req.valid('json')

  // Check if red flags already exist for this EMR
  const existingRecord = await db.select()
    .from(tables.redFlags)
    .where(eq(tables.redFlags.emrId, emrId))
    .execute()
    .then((res) => res.at(0))

  if (existingRecord) {
    return c.json({ error: 'Red flags already exist for this EMR' }, 409)
  }

  const newRecord = await db.insert(tables.redFlags)
    .values({
      emrId,
      redFlags,
    })
    .returning({ id: tables.redFlags.id })
    .execute()
    .then((res) => res.at(0))

  if (!newRecord) {
    return c.json({ error: 'Failed to create red flags' }, 500)
  }

  return c.json({
    id: newRecord.id,
    message: 'Red flags created successfully',
  }, 201)
})

export type GetRedFlagsRoute = typeof getRedFlagsHandler
export type CreateRedFlagsRoute = typeof createRedFlagsHandler

export { getRedFlagsRoute, createRedFlagsRoute }

export default getRedFlagsRoute
