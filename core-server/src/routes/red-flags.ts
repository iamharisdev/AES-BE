import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

// 1. Schemas
const RedFlagsSchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  flag: z.string().nullable(),
  justification: z.string().nullable(),
  severity: z.string().nullable(),
  actionTaken: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const CreateRedFlagsSchema = z.object({
  emrId: z.string().uuid(),
  flag: z.string().nullable(),
  justification: z.string().nullable(),
  severity: z.string().nullable(),
  actionTaken: z.string().nullable()
});

const ErrorSchema = z.object({ error: z.string() });

// 2. OpenAPI Routes
const createRedFlagsRoute = createRoute({
  method: 'post',
  path: '/red-flags',
  tags: ['Red Flags'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateRedFlagsSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: RedFlagsSchema
        }
      },
      description: 'Red flag record created successfully'
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Red flag already exists'
    }
  }
});

const listRedFlagsRoute = createRoute({
  method: 'get',
  path: '/red-flags',
  tags: ['Red Flags'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(RedFlagsSchema)
        }
      },
      description: 'List of red flags'
    }
  }
});

const getRedFlagsByIdRoute = createRoute({
  method: 'get',
  path: '/red-flags/:id',
  tags: ['Red Flags'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({ id: z.string().uuid() })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: RedFlagsSchema
        }
      },
      description: 'Red flag record details'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Red flag not found'
    }
  }
});

const updateRedFlagsRoute = createRoute({
  method: 'put',
  path: '/red-flags/:id',
  tags: ['Red Flags'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: CreateRedFlagsSchema.partial()
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: RedFlagsSchema
        }
      },
      description: 'Red flag updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Red flag not found'
    }
  }
});

const deleteRedFlagsRoute = createRoute({
  method: 'delete',
  path: '/red-flags/:id',
  tags: ['Red Flags'],
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
      description: 'Red flag deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Red flag not found'
    }
  }
});

// 3. Handlers
const createRedFlagsHandler = () => { app.openapi(createRedFlagsRoute, async c => {
  const details = c.req.valid('json');
  const [record] = await db.insert(tables.redFlags).values(details).returning();
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
}
const listRedFlagsHandler = () => { app.openapi(listRedFlagsRoute, async c => {
  const redFlags = await db.select().from(tables.redFlags).execute();
  const mapped = redFlags.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  }));
  return c.json(mapped, 200);
});}

const getRedFlagsByIdHandler = () => { app.openapi(getRedFlagsByIdRoute, async c => {
  const { id } = c.req.valid('param');
  const record = await db
    .select()
    .from(tables.redFlags)
    .where(eq(tables.redFlags.id, id))
    .then(res => res.at(0));
  if (!record) {
    return c.json({ error: 'Red flag not found' }, 404);
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
});}

const updateRedFlagsHandler = () => { app.openapi(updateRedFlagsRoute, async c => {
  const { id } = c.req.valid('param');
  const details = c.req.valid('json');
  const record = await db
    .select()
    .from(tables.redFlags)
    .where(eq(tables.redFlags.id, id))
    .then(res => res.at(0));
  if (!record) {
    return c.json({ error: 'Red flag not found' }, 404);
  }
  const [updated] = await db
    .update(tables.redFlags)
    .set({ ...details, updatedAt: new Date() })
    .where(eq(tables.redFlags.id, id))
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
});}

const deleteRedFlagsHandler = () => { app.openapi(deleteRedFlagsRoute, async c => {
  const { id } = c.req.valid('param');
  const record = await db
    .select()
    .from(tables.redFlags)
    .where(eq(tables.redFlags.id, id))
    .then(res => res.at(0));
  if (!record) {
    return c.json({ error: 'Red flag not found' }, 404);
  }
  await db.delete(tables.redFlags).where(eq(tables.redFlags.id, id));
  return c.json({ message: 'Red flag deleted successfully' }, 200);
});}  


export {
  createRedFlagsHandler,
  listRedFlagsHandler,
  getRedFlagsByIdHandler,
  updateRedFlagsHandler,
  deleteRedFlagsHandler
};
