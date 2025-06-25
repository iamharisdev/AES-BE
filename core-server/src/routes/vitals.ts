import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

// 1. Schemas
const VitalsSchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  bloodPressure: z.string().nullable(),
  pulse: z.string().nullable(),
  temperature: z.string().nullable(),
  weight: z.string().nullable(),
  height: z.string().nullable(),
  bmi: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});
const CreateVitalsSchema = z.object({
  emrId: z.string().uuid(),
  bloodPressure: z.string().nullable(),
  pulse: z.string().nullable(),
  temperature: z.string().nullable(),
  weight: z.string().nullable(),
  height: z.string().nullable(),
  bmi: z.string().nullable()
});
const ErrorSchema = z.object({ error: z.string() });

// 2. OpenAPI Routes
const createVitalsRoute = createRoute({
  method: 'post',
  path: '/vitals',
  tags: ['Vitals'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateVitalsSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: VitalsSchema
        }
      },
      description: 'Vitals record created successfully'
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Vitals already exists'
    }
  }
});

const listVitalsRoute = createRoute({
  method: 'get',
  path: '/vitals',
  tags: ['Vitals'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(VitalsSchema)
        }
      },
      description: 'List of vitals'
    }
  }
});

const getVitalsByIdRoute = createRoute({
  method: 'get',
  path: '/vitals/:id',
  tags: ['Vitals'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({ id: z.string().uuid() })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: VitalsSchema
        }
      },
      description: 'Vitals record details'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Vitals not found'
    }
  }
});

const updateVitalsRoute = createRoute({
  method: 'put',
  path: '/vitals/:id',
  tags: ['Vitals'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: CreateVitalsSchema.partial()
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: VitalsSchema
        }
      },
      description: 'Vitals updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Vitals not found'
    }
  }
});

const deleteVitalsRoute = createRoute({
  method: 'delete',
  path: '/vitals/:id',
  tags: ['Vitals'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({ id: z.string().uuid() })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ message: z.string() })
        }
      },
      description: 'Vitals deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Vitals not found'
    }
  }
});

// 3. Handlers
const createVitalsHandler = app.openapi(createVitalsRoute, async c => {
  const details = c.req.valid('json');
  // Optionally check for duplicates here if needed
  const [record] = await db.insert(tables.vitals).values(details).returning();
  const { createdAt, updatedAt, ...rest } = record;
  return c.json(
    {
      ...rest,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString()
    },
    201
  );
});

const listVitalsHandler = app.openapi(listVitalsRoute, async c => {
  const vitals = await db.select().from(tables.vitals).execute();
  const mapped = vitals.map(v => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString()
  }));
  return c.json(mapped, 200);
});

const getVitalsByIdHandler = app.openapi(getVitalsByIdRoute, async c => {
  const { id } = c.req.valid('param');
  const record = await db
    .select()
    .from(tables.vitals)
    .where(eq(tables.vitals.id, id))
    .then(res => res.at(0));
  if (!record) {
    return c.json({ error: 'Vitals not found' }, 404);
  }
  const { createdAt, updatedAt, ...rest } = record;
  return c.json(
    {
      ...rest,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString()
    },
    200
  );
});

const updateVitalsHandler = app.openapi(updateVitalsRoute, async c => {
  const { id } = c.req.valid('param');
  const details = c.req.valid('json');
  const record = await db
    .select()
    .from(tables.vitals)
    .where(eq(tables.vitals.id, id))
    .then(res => res.at(0));
  if (!record) {
    return c.json({ error: 'Vitals not found' }, 404);
  }
  const [updated] = await db
    .update(tables.vitals)
    .set({ ...details, updatedAt: new Date() })
    .where(eq(tables.vitals.id, id))
    .returning();
  const { createdAt, updatedAt, ...rest } = updated;
  return c.json(
    {
      ...rest,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString()
    },
    200
  );
});

const deleteVitalsHandler = app.openapi(deleteVitalsRoute, async c => {
  const { id } = c.req.valid('param');
  const record = await db
    .select()
    .from(tables.vitals)
    .where(eq(tables.vitals.id, id))
    .then(res => res.at(0));
  if (!record) {
    return c.json({ error: 'Vitals not found' }, 404);
  }
  await db.delete(tables.vitals).where(eq(tables.vitals.id, id));
  return c.json({ message: 'Vitals deleted successfully' }, 200);
});

// 4. Export Route Object
const vitalsRoute = {
  getRoutingPath: () => {
    createVitalsHandler;
    listVitalsHandler;
    getVitalsByIdHandler;
    updateVitalsHandler;
    deleteVitalsHandler;
  }
};
export default vitalsRoute;
