import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

// Schema for personal history
const PersonalHistorySchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  allergyStatus: z.string().nullable(),
  // allergyType: z.string().nullable(),
  substanceUse: z.string().nullable(),
  relationshipDomesticSituation: z.string().nullable(),
  sleepIssues: z.string().nullable(),
  hungerIssues: z.string().nullable(),
  diet: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Create schema
const CreatePersonalHistorySchema = z.object({
  emrId: z.string().uuid(),
  allergyStatus: z.string().nullable(),
  // allergyType: z.string().nullable(),
  substanceUse: z.string().nullable(),
  relationshipDomesticSituation: z.string().nullable(),
  sleepIssues: z.string().nullable(),
  hungerIssues: z.string().nullable(),
  diet: z.string().nullable()
});

// Update schema
const UpdatePersonalHistorySchema = CreatePersonalHistorySchema.partial();

// Create route
const createPersonalHistoryRoute = createRoute({
  method: 'post',
  path: '/personal-history',
  tags: ['Personal History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreatePersonalHistorySchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: PersonalHistorySchema
        }
      },
      description: 'Personal history record created successfully'
    }
  }
});

// Get route
const getPersonalHistoryRoute = createRoute({
  method: 'get',
  path: '/personal-history/:id',
  tags: ['Personal History'],
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
          schema: PersonalHistorySchema
        }
      },
      description: 'Personal history record retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Personal history record not found'
    }
  }
});

// Update route
const updatePersonalHistoryRoute = createRoute({
  method: 'put',
  path: '/personal-history/:id',
  tags: ['Personal History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdatePersonalHistorySchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: PersonalHistorySchema
        }
      },
      description: 'Personal history record updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Personal history record not found'
    }
  }
});

// Delete route
const deletePersonalHistoryRoute = createRoute({
  method: 'delete',
  path: '/personal-history/:id',
  tags: ['Personal History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    })
  },
  responses: {
    204: {
      description: 'Personal history record deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Personal history record not found'
    }
  }
});

const createPersonalHistoryHandler = () => {
  app.openapi(createPersonalHistoryRoute, async c => {
    const data = c.req.valid('json');
    const [record] = await db
      .insert(tables.personalHistory)
      .values(data)
      .returning();
    return c.json(record, 201);
  });
};

const getPersonalHistoryHandler = () => {
  app.openapi(getPersonalHistoryRoute, async c => {
    const { id } = c.req.valid('param');
    const [record] = await db
      .select()
      .from(tables.personalHistory)
      .where(eq(tables.personalHistory.id, id))
      .execute();

    if (!record) {
      return c.json({ error: 'Personal history record not found' }, 404);
    }

    return c.json(record);
  });
};

const updatePersonalHistoryHandler = () => {
  app.openapi(updatePersonalHistoryRoute, async c => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const [record] = await db
      .update(tables.personalHistory)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tables.personalHistory.id, id))
      .returning();

    if (!record) {
      return c.json({ error: 'Personal history record not found' }, 404);
    }

    return c.json(record);
  });
};

const deletePersonalHistoryHandler = () => {
  app.openapi(deletePersonalHistoryRoute, async c => {
    const { id } = c.req.valid('param');
    const [record] = await db
      .delete(tables.personalHistory)
      .where(eq(tables.personalHistory.id, id))
      .returning();

    if (!record) {
      return c.json({ error: 'Personal history record not found' }, 404);
    }

    return c.body(null, 204);
  });
};

const personalHistoryRoute = () => {
  createPersonalHistoryHandler();
  getPersonalHistoryHandler();
  updatePersonalHistoryHandler();
  deletePersonalHistoryHandler();
};

export {
  createPersonalHistoryHandler,
  getPersonalHistoryHandler,
  updatePersonalHistoryHandler,
  deletePersonalHistoryHandler
};

export default personalHistoryRoute;
