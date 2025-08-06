import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

// Schema for obstetric history
const ObstetricHistorySchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  childAge: z.string().nullable(),
  childGender: z.string().nullable(),
  fullTermBirth: z.string().nullable(),
  birthPlace: z.string().nullable(),
  birthMethod: z.string().nullable(),
  contractions: z.string().nullable(),
  birthDuration: z.string().nullable(),
  operationReason: z.string().nullable(),
  birthWeight: z.string().nullable(),
  postDeliveryProblems: z.string().nullable(),
  childHealthStatus: z.string().nullable(),
  childSchoolStatus: z.string().nullable(),
  pregnancyProblems: z.string().nullable(),
  childrenAges: z.string().nullable(),
  childrenGenders: z.string().nullable(),
  childrenBirthPlaces: z.string().nullable(),
  childrenBirthMethods: z.string().nullable(),
  childrenContractions: z.string().nullable(),
  childrenBirthDurations: z.string().nullable(),
  childrenOperationReasons: z.string().nullable(),
  childrenBirthWeights: z.string().nullable(),
  childrenHealthStatus: z.string().nullable(),
  childrenSchoolStatus: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Create schema
const CreateObstetricHistorySchema = z.object({
  emrId: z.string().uuid(),
  childAge: z.string().nullable(),
  childGender: z.string().nullable(),
  fullTermBirth: z.string().nullable(),
  birthPlace: z.string().nullable(),
  birthMethod: z.string().nullable(),
  contractions: z.string().nullable(),
  birthDuration: z.string().nullable(),
  operationReason: z.string().nullable(),
  birthWeight: z.string().nullable(),
  postDeliveryProblems: z.string().nullable(),
  childHealthStatus: z.string().nullable(),
  childSchoolStatus: z.string().nullable(),
  pregnancyProblems: z.string().nullable(),
  childrenAges: z.string().nullable(),
  childrenGenders: z.string().nullable(),
  childrenBirthPlaces: z.string().nullable(),
  childrenBirthMethods: z.string().nullable(),
  childrenContractions: z.string().nullable(),
  childrenBirthDurations: z.string().nullable(),
  childrenOperationReasons: z.string().nullable(),
  childrenBirthWeights: z.string().nullable(),
  childrenHealthStatus: z.string().nullable(),
  childrenSchoolStatus: z.string().nullable()
});

// Update schema
const UpdateObstetricHistorySchema = CreateObstetricHistorySchema.partial();

// Create route
const createObstetricHistoryRoute = createRoute({
  method: 'post',
  path: '/obstetric-history',
  tags: ['Obstetric History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateObstetricHistorySchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: ObstetricHistorySchema
        }
      },
      description: 'Obstetric history record created successfully'
    }
  }
});

// Get route
const getObstetricHistoryRoute = createRoute({
  method: 'get',
  path: '/obstetric-history/:id',
  tags: ['Obstetric History'],
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
          schema: ObstetricHistorySchema
        }
      },
      description: 'Obstetric history record retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Obstetric history record not found'
    }
  }
});

// Update route
const updateObstetricHistoryRoute = createRoute({
  method: 'put',
  path: '/obstetric-history/:id',
  tags: ['Obstetric History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateObstetricHistorySchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ObstetricHistorySchema
        }
      },
      description: 'Obstetric history record updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Obstetric history record not found'
    }
  }
});

// Delete route
const deleteObstetricHistoryRoute = createRoute({
  method: 'delete',
  path: '/obstetric-history/:id',
  tags: ['Obstetric History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    })
  },
  responses: {
    204: {
      description: 'Obstetric history record deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Obstetric history record not found'
    }
  }
});

const createObstetricHistoryHandler = () => {
  app.openapi(createObstetricHistoryRoute, async c => {
    const data = c.req.valid('json');
    const [record] = await db
      .insert(tables.obsHistory)
      .values(data)
      .returning();
    return c.json(record, 201);
  });
};

const getObstetricHistoryHandler = () => {
  app.openapi(getObstetricHistoryRoute, async c => {
    const { id } = c.req.valid('param');
    const [record] = await db
      .select()
      .from(tables.obsHistory)
      .where(eq(tables.obsHistory.id, id))
      .execute();

    if (!record) {
      return c.json({ error: 'Obstetric history record not found' }, 404);
    }

    return c.json(record);
  });
};

const updateObstetricHistoryHandler = () => {
  app.openapi(updateObstetricHistoryRoute, async c => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const [record] = await db
      .update(tables.obsHistory)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tables.obsHistory.id, id))
      .returning();

    if (!record) {
      return c.json({ error: 'Obstetric history record not found' }, 404);
    }

    return c.json(record);
  });
};

const deleteObstetricHistoryHandler = () => {
  app.openapi(deleteObstetricHistoryRoute, async c => {
    const { id } = c.req.valid('param');
    const [record] = await db
      .delete(tables.obsHistory)
      .where(eq(tables.obsHistory.id, id))
      .returning();

    if (!record) {
      return c.json({ error: 'Obstetric history record not found' }, 404);
    }

    return c.body(null, 204);
  });
};

export {
  createObstetricHistoryHandler,
  getObstetricHistoryHandler,
  updateObstetricHistoryHandler,
  deleteObstetricHistoryHandler
};
