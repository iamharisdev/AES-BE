import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

// Schema for gynecological history
const GynecologicalHistorySchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  familyPlanning: z.string().nullable(),
  familyPlanningMethod: z.string().nullable(),
  papSmearTest: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Create schema
const CreateGynecologicalHistorySchema = z.object({
  emrId: z.string().uuid(),
  familyPlanning: z.string().nullable(),
  familyPlanningMethod: z.string().nullable(),
  papSmearTest: z.string().nullable()
});

// Update schema
const UpdateGynecologicalHistorySchema = CreateGynecologicalHistorySchema.partial();

// Create route
const createGynecologicalHistoryRoute = createRoute({
  method: 'post',
  path: '/gynecological-history',
  tags: ['Gynecological History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateGynecologicalHistorySchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: GynecologicalHistorySchema
        }
      },
      description: 'Gynecological history record created successfully'
    }
  }
});

// Get route
const getGynecologicalHistoryRoute = createRoute({
  method: 'get',
  path: '/gynecological-history/:id',
  tags: ['Gynecological History'],
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
          schema: GynecologicalHistorySchema
        }
      },
      description: 'Gynecological history record retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Gynecological history record not found'
    }
  }
});

// Update route
const updateGynecologicalHistoryRoute = createRoute({
  method: 'put',
  path: '/gynecological-history/:id',
  tags: ['Gynecological History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateGynecologicalHistorySchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GynecologicalHistorySchema
        }
      },
      description: 'Gynecological history record updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Gynecological history record not found'
    }
  }
});

// Delete route
const deleteGynecologicalHistoryRoute = createRoute({
  method: 'delete',
  path: '/gynecological-history/:id',
  tags: ['Gynecological History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    })
  },
  responses: {
    204: {
      description: 'Gynecological history record deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Gynecological history record not found'
    }
  }
});

const createGynecologicalHistoryHandler = () => {
  app.openapi(createGynecologicalHistoryRoute, async c => {
    const data = c.req.valid('json');
    const [record] = await db
      .insert(tables.gynecologicalHistory)
      .values(data)
      .returning();
    return c.json(record, 201);
  });
}

const getGynecologicalHistoryHandler = () => {
  app.openapi(getGynecologicalHistoryRoute, async c => {
    const { id } = c.req.valid('param');
    const [record] = await db
      .select()
      .from(tables.gynecologicalHistory)
      .where(eq(tables.gynecologicalHistory.id, id))
      .execute();

    if (!record) {
      return c.json({ error: 'Gynecological history record not found' }, 404);
    }

    return c.json(record);
  });
}

const updateGynecologicalHistoryHandler = () => {
  app.openapi(updateGynecologicalHistoryRoute, async c => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const [record] = await db
      .update(tables.gynecologicalHistory)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tables.gynecologicalHistory.id, id))
      .returning();

    if (!record) {
      return c.json({ error: 'Gynecological history record not found' }, 404);
    }

    return c.json(record);
  });
}

const deleteGynecologicalHistoryHandler = () => {
  app.openapi(deleteGynecologicalHistoryRoute, async c => {
    const { id } = c.req.valid('param');
    const [record] = await db
      .delete(tables.gynecologicalHistory)
      .where(eq(tables.gynecologicalHistory.id, id))
      .returning();

    if (!record) {
      return c.json({ error: 'Gynecological history record not found' }, 404);
    }

    return c.body(null, 204);
  });
}

export { createGynecologicalHistoryHandler, getGynecologicalHistoryHandler, updateGynecologicalHistoryHandler, deleteGynecologicalHistoryHandler }
