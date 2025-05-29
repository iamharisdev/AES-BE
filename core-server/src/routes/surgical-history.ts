import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

// Schema for surgical history
const SurgicalHistorySchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  pastSurgeries: z.string().nullable(),
  additionalInfo: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Create schema
const CreateSurgicalHistorySchema = z.object({
  emrId: z.string().uuid(),
  pastSurgeries: z.string().nullable(),
  additionalInfo: z.string().nullable()
});

// Update schema
const UpdateSurgicalHistorySchema = CreateSurgicalHistorySchema.partial();

// Create route
const createSurgicalHistoryRoute = createRoute({
  method: 'post',
  path: '/surgical-history',
  tags: ['Surgical History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateSurgicalHistorySchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: SurgicalHistorySchema
        }
      },
      description: 'Surgical history record created successfully'
    }
  }
});

// Get route
const getSurgicalHistoryRoute = createRoute({
  method: 'get',
  path: '/surgical-history/:id',
  tags: ['Surgical History'],
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
          schema: SurgicalHistorySchema
        }
      },
      description: 'Surgical history record retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Surgical history record not found'
    }
  }
});

// Update route
const updateSurgicalHistoryRoute = createRoute({
  method: 'put',
  path: '/surgical-history/:id',
  tags: ['Surgical History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateSurgicalHistorySchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SurgicalHistorySchema
        }
      },
      description: 'Surgical history record updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Surgical history record not found'
    }
  }
});

// Delete route
const deleteSurgicalHistoryRoute = createRoute({
  method: 'delete',
  path: '/surgical-history/:id',
  tags: ['Surgical History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    })
  },
  responses: {
    204: {
      description: 'Surgical history record deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Surgical history record not found'
    }
  }
});

const surgicalHistoryRoute = {
  getRoutingPath: () => {
    // Create handler
    app.openapi(createSurgicalHistoryRoute, async c => {
      const data = c.req.valid('json');
      const [record] = await db
        .insert(tables.surgicalHistory)
        .values(data)
        .returning();
      return c.json(record, 201);
    });

    // Get handler
    app.openapi(getSurgicalHistoryRoute, async c => {
      const { id } = c.req.valid('param');
      const [record] = await db
        .select()
        .from(tables.surgicalHistory)
        .where(eq(tables.surgicalHistory.id, id))
        .execute();

      if (!record) {
        return c.json({ error: 'Surgical history record not found' }, 404);
      }

      return c.json(record);
    });

    // Update handler
    app.openapi(updateSurgicalHistoryRoute, async c => {
      const { id } = c.req.valid('param');
      const data = c.req.valid('json');

      const [record] = await db
        .update(tables.surgicalHistory)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tables.surgicalHistory.id, id))
        .returning();

      if (!record) {
        return c.json({ error: 'Surgical history record not found' }, 404);
      }

      return c.json(record);
    });

    // Delete handler
    app.openapi(deleteSurgicalHistoryRoute, async c => {
      const { id } = c.req.valid('param');
      const [record] = await db
        .delete(tables.surgicalHistory)
        .where(eq(tables.surgicalHistory.id, id))
        .returning();

      if (!record) {
        return c.json({ error: 'Surgical history record not found' }, 404);
      }

      return c.body(null, 204);
    });
  }
};

export default surgicalHistoryRoute;
