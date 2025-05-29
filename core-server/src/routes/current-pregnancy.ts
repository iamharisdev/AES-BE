import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

// Schema for current pregnancy
const CurrentPregnancySchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  pregnancyDetectionMethod: z.string().nullable(),
  pregnancyConsent: z.string().nullable(),
  pregnancyClinicalFindings: z.string().nullable(),
  urineTest: z.string().nullable(),
  ultrasound: z.string().nullable(),
  folicAcid: z.string().nullable(),
  bloodUrineTest: z.string().nullable(),
  bloodUrineTestTypes: z.string().nullable(),
  earlyPregProblems: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Create schema
const CreateCurrentPregnancySchema = z.object({
  emrId: z.string().uuid(),
  pregnancyDetectionMethod: z.string().nullable(),
  pregnancyConsent: z.string().nullable(),
  pregnancyClinicalFindings: z.string().nullable(),
  urineTest: z.string().nullable(),
  ultrasound: z.string().nullable(),
  folicAcid: z.string().nullable(),
  bloodUrineTest: z.string().nullable(),
  bloodUrineTestTypes: z.string().nullable(),
  earlyPregProblems: z.string().nullable()
});

// Update schema
const UpdateCurrentPregnancySchema = CreateCurrentPregnancySchema.partial();

// Create route
const createCurrentPregnancyRoute = createRoute({
  method: 'post',
  path: '/current-pregnancy',
  tags: ['Current Pregnancy'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateCurrentPregnancySchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: CurrentPregnancySchema
        }
      },
      description: 'Current pregnancy record created successfully'
    }
  }
});

// Get route
const getCurrentPregnancyRoute = createRoute({
  method: 'get',
  path: '/current-pregnancy/:id',
  tags: ['Current Pregnancy'],
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
          schema: CurrentPregnancySchema
        }
      },
      description: 'Current pregnancy record retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Current pregnancy record not found'
    }
  }
});

// Update route
const updateCurrentPregnancyRoute = createRoute({
  method: 'put',
  path: '/current-pregnancy/:id',
  tags: ['Current Pregnancy'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateCurrentPregnancySchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: CurrentPregnancySchema
        }
      },
      description: 'Current pregnancy record updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Current pregnancy record not found'
    }
  }
});

// Delete route
const deleteCurrentPregnancyRoute = createRoute({
  method: 'delete',
  path: '/current-pregnancy/:id',
  tags: ['Current Pregnancy'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    })
  },
  responses: {
    204: {
      description: 'Current pregnancy record deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Current pregnancy record not found'
    }
  }
});

const currentPregnancyRoute = {
  getRoutingPath: () => {
    // Create handler
    app.openapi(createCurrentPregnancyRoute, async c => {
      const data = c.req.valid('json');
      const [record] = await db
        .insert(tables.currentPregnancy)
        .values(data)
        .returning();
      return c.json(record, 201);
    });

    // Get handler
    app.openapi(getCurrentPregnancyRoute, async c => {
      const { id } = c.req.valid('param');
      const [record] = await db
        .select()
        .from(tables.currentPregnancy)
        .where(eq(tables.currentPregnancy.id, id))
        .execute();

      if (!record) {
        return c.json({ error: 'Current pregnancy record not found' }, 404);
      }

      return c.json(record);
    });

    // Update handler
    app.openapi(updateCurrentPregnancyRoute, async c => {
      const { id } = c.req.valid('param');
      const data = c.req.valid('json');

      const [record] = await db
        .update(tables.currentPregnancy)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tables.currentPregnancy.id, id))
        .returning();

      if (!record) {
        return c.json({ error: 'Current pregnancy record not found' }, 404);
      }

      return c.json(record);
    });

    // Delete handler
    app.openapi(deleteCurrentPregnancyRoute, async c => {
      const { id } = c.req.valid('param');
      const [record] = await db
        .delete(tables.currentPregnancy)
        .where(eq(tables.currentPregnancy.id, id))
        .returning();

      if (!record) {
        return c.json({ error: 'Current pregnancy record not found' }, 404);
      }

      return c.body(null, 204);
    });
  }
};

export default currentPregnancyRoute;
