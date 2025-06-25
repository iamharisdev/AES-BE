import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

// Schema for trimester
const TrimesterSchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  fetusMovement: z.string().nullable(),
  ultrasound: z.string().nullable(),
  checkupRegularity: z.string().nullable(),
  hbLevel: z.string().nullable(),
  trimesterProblems: z.string().nullable(),
  sugarBloodPressure: z.string().nullable(),
  strengthMeds: z.string().nullable(),
  pregProblems: z.string().nullable(),
  additionalInfo: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Create trimester schema
const CreateTrimesterSchema = z.object({
  emrId: z.string().uuid(),
  fetusMovement: z.string().nullable(),
  ultrasound: z.string().nullable(),
  checkupRegularity: z.string().nullable(),
  hbLevel: z.string().nullable(),
  trimesterProblems: z.string().nullable(),
  sugarBloodPressure: z.string().nullable(),
  strengthMeds: z.string().nullable(),
  pregProblems: z.string().nullable(),
  additionalInfo: z.string().nullable()
});

// Update trimester schema
const UpdateTrimesterSchema = CreateTrimesterSchema.partial();

// Create route
const createTrimesterRoute = createRoute({
  method: 'post',
  path: '/trimester',
  tags: ['Trimester'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateTrimesterSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: TrimesterSchema
        }
      },
      description: 'Trimester record created successfully'
    }
  }
});

// Get route
const getTrimesterRoute = createRoute({
  method: 'get',
  path: '/trimester/:id',
  tags: ['Trimester'],
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
          schema: TrimesterSchema
        }
      },
      description: 'Trimester record retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Trimester record not found'
    }
  }
});

// Update route
const updateTrimesterRoute = createRoute({
  method: 'put',
  path: '/trimester/:id',
  tags: ['Trimester'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateTrimesterSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TrimesterSchema
        }
      },
      description: 'Trimester record updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Trimester record not found'
    }
  }
});

// Delete route
const deleteTrimesterRoute = createRoute({
  method: 'delete',
  path: '/trimester/:id',
  tags: ['Trimester'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    })
  },
  responses: {
    204: {
      description: 'Trimester record deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Trimester record not found'
    }
  }
});

const createTrimesterHandler = () => {
  app.openapi(createTrimesterRoute, async c => {
    const data = c.req.valid('json');
    const [record] = await db
      .insert(tables.trimester)
      .values(data)
      .returning();
    return c.json(record, 201);
  });
}

const getTrimesterHandler = () => {
  app.openapi(getTrimesterRoute, async c => {
    const { id } = c.req.valid('param');
    const [record] = await db
      .select()
      .from(tables.trimester)
      .where(eq(tables.trimester.id, id))
      .execute();

    if (!record) {
      return c.json({ error: 'Trimester record not found' }, 404);
    }

    return c.json(record);
  });
}

const updateTrimesterHandler = () => {
  app.openapi(updateTrimesterRoute, async c => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const [record] = await db
      .update(tables.trimester)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tables.trimester.id, id))
      .returning();

    if (!record) {
      return c.json({ error: 'Trimester record not found' }, 404);
    }

    return c.json(record);
  });
}

const deleteTrimesterHandler = () => {
  app.openapi(deleteTrimesterRoute, async c => {
    const { id } = c.req.valid('param');
    const [record] = await db
      .delete(tables.trimester)
      .where(eq(tables.trimester.id, id))
      .returning();

    if (!record) {
      return c.json({ error: 'Trimester record not found' }, 404);
    }

    return c.body(null, 204);
  });
}


export { createTrimesterHandler, getTrimesterHandler, updateTrimesterHandler, deleteTrimesterHandler }
