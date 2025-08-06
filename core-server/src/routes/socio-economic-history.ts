import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

// Schema for socio economic history
const SocioEconomicHistorySchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  noFamilyMembers: z.string().nullable(),
  financialSituation: z.string().nullable(),
  livingSituation: z.string().nullable(),
  additionalInfo: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Create schema
const CreateSocioEconomicHistorySchema = z.object({
  emrId: z.string().uuid(),
  noFamilyMembers: z.string().nullable(),
  financialSituation: z.string().nullable(),
  livingSituation: z.string().nullable(),
  additionalInfo: z.string().nullable()
});

// Update schema
const UpdateSocioEconomicHistorySchema =
  CreateSocioEconomicHistorySchema.partial();

// Create route
const createSocioEconomicHistoryRoute = createRoute({
  method: 'post',
  path: '/socio-economic-history',
  tags: ['Socio Economic History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateSocioEconomicHistorySchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: SocioEconomicHistorySchema
        }
      },
      description: 'Socio economic history record created successfully'
    }
  }
});

// Get route
const getSocioEconomicHistoryRoute = createRoute({
  method: 'get',
  path: '/socio-economic-history/:id',
  tags: ['Socio Economic History'],
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
          schema: SocioEconomicHistorySchema
        }
      },
      description: 'Socio economic history record retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Socio economic history record not found'
    }
  }
});

// Update route
const updateSocioEconomicHistoryRoute = createRoute({
  method: 'put',
  path: '/socio-economic-history/:id',
  tags: ['Socio Economic History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateSocioEconomicHistorySchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SocioEconomicHistorySchema
        }
      },
      description: 'Socio economic history record updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Socio economic history record not found'
    }
  }
});

// Delete route
const deleteSocioEconomicHistoryRoute = createRoute({
  method: 'delete',
  path: '/socio-economic-history/:id',
  tags: ['Socio Economic History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    })
  },
  responses: {
    204: {
      description: 'Socio economic history record deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Socio economic history record not found'
    }
  }
});

const createSocioEconomicHistoryHandler = () => {
  app.openapi(createSocioEconomicHistoryRoute, async c => {
    const data = c.req.valid('json');
    const [record] = await db
      .insert(tables.socioEconomicHistory)
      .values(data)
      .returning();
    return c.json(record, 201);
  });
};

const getSocioEconomicHistoryHandler = () => {
  app.openapi(getSocioEconomicHistoryRoute, async c => {
    const { id } = c.req.valid('param');
    const [record] = await db
      .select()
      .from(tables.socioEconomicHistory)
      .where(eq(tables.socioEconomicHistory.id, id))
      .execute();

    if (!record) {
      return c.json({ error: 'Socio economic history record not found' }, 404);
    }

    return c.json(record);
  });
};

const updateSocioEconomicHistoryHandler = () => {
  app.openapi(updateSocioEconomicHistoryRoute, async c => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const [record] = await db
      .update(tables.socioEconomicHistory)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tables.socioEconomicHistory.id, id))
      .returning();

    if (!record) {
      return c.json({ error: 'Socio economic history record not found' }, 404);
    }

    return c.json(record);
  });
};

const deleteSocioEconomicHistoryHandler = () => {
  app.openapi(deleteSocioEconomicHistoryRoute, async c => {
    const { id } = c.req.valid('param');
    const [record] = await db
      .delete(tables.socioEconomicHistory)
      .where(eq(tables.socioEconomicHistory.id, id))
      .returning();

    if (!record) {
      return c.json({ error: 'Socio economic history record not found' }, 404);
    }

    return c.body(null, 204);
  });
};

export {
  createSocioEconomicHistoryHandler,
  getSocioEconomicHistoryHandler,
  updateSocioEconomicHistoryHandler,
  deleteSocioEconomicHistoryHandler
};
