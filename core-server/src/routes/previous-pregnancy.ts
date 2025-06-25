import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

// Schema for previous pregnancy
const PreviousPregnancySchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  childAge: z.string().nullable(),
  childGender: z.string().nullable(),
  fullTermBirth: z.string().nullable(),
  birthMethod: z.string().nullable(),
  birthPlace: z.string().nullable(),
  contractions: z.string().nullable(),
  durationBirth: z.string().nullable(),
  operationReason: z.string().nullable(),
  postDeliveryProblems: z.string().nullable(),
  childCondition: z.string().nullable(),
  pregnancyProblems: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Create schema
const CreatePreviousPregnancySchema = z.object({
  emrId: z.string().uuid(),
  childAge: z.string().nullable(),
  childGender: z.string().nullable(),
  fullTermBirth: z.string().nullable(),
  birthMethod: z.string().nullable(),
  birthPlace: z.string().nullable(),
  contractions: z.string().nullable(),
  durationBirth: z.string().nullable(),
  operationReason: z.string().nullable(),
  postDeliveryProblems: z.string().nullable(),
  childCondition: z.string().nullable(),
  pregnancyProblems: z.string().nullable()
});

// Update schema
const UpdatePreviousPregnancySchema = CreatePreviousPregnancySchema.partial();

// Create route
const createPreviousPregnancyRoute = createRoute({
  method: 'post',
  path: '/previous-pregnancy',
  tags: ['Previous Pregnancy'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreatePreviousPregnancySchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: PreviousPregnancySchema
        }
      },
      description: 'Previous pregnancy record created successfully'
    }
  }
});

// Get route
const getPreviousPregnancyRoute = createRoute({
  method: 'get',
  path: '/previous-pregnancy/:id',
  tags: ['Previous Pregnancy'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: PreviousPregnancySchema
        }
      },
      description: 'Previous pregnancy record retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Previous pregnancy record not found'
    }
  }
});

// Update route
const updatePreviousPregnancyRoute = createRoute({
  method: 'put',
  path: '/previous-pregnancy/:id',
  tags: ['Previous Pregnancy'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdatePreviousPregnancySchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: PreviousPregnancySchema
        }
      },
      description: 'Previous pregnancy record updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Previous pregnancy record not found'
    }
  }
});

// Delete route
const deletePreviousPregnancyRoute = createRoute({
  method: 'delete',
  path: '/previous-pregnancy/:id',
  tags: ['Previous Pregnancy'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    })
  },
  responses: {
    204: {
      description: 'Previous pregnancy record deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Previous pregnancy record not found'
    }
  }
});

const createPreviousPregnancyHandler = () => {
  app.openapi(createPreviousPregnancyRoute, async c => {
    const data = c.req.valid('json');
    const [record] = await db
      .insert(tables.previousPregnancy)
      .values(data)
      .returning();
    return c.json(record, 201);
  });
}

const getPreviousPregnancyHandler = () => {
  app.openapi(getPreviousPregnancyRoute, async c => {
    const { id } = c.req.valid('param');
    const [record] = await db
      .select()
      .from(tables.previousPregnancy)
      .where(eq(tables.previousPregnancy.id, id))
      .execute();

    if (!record) {
      return c.json({ error: 'Previous pregnancy record not found' }, 404);
    }

    return c.json(record);
  });
}

const updatePreviousPregnancyHandler = () => {
  app.openapi(updatePreviousPregnancyRoute, async c => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const [record] = await db
      .update(tables.previousPregnancy)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tables.previousPregnancy.id, id))
      .returning();

    if (!record) {
      return c.json({ error: 'Previous pregnancy record not found' }, 404);
    }

    return c.json(record);
  });
}

const deletePreviousPregnancyHandler = () => {
  app.openapi(deletePreviousPregnancyRoute, async c => {
    const { id } = c.req.valid('param');
    const [record] = await db
      .delete(tables.previousPregnancy)
      .where(eq(tables.previousPregnancy.id, id))
      .returning();

    if (!record) {
      return c.json({ error: 'Previous pregnancy record not found' }, 404);
    }

    return c.body(null, 204);
  });
}


export { createPreviousPregnancyHandler, getPreviousPregnancyHandler, updatePreviousPregnancyHandler, deletePreviousPregnancyHandler }
