import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

// Schema for presenting complaint
const PresentingComplaintSchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  problem: z.string(),
  detail: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Create presenting complaint schema
const CreatePresentingComplaintSchema = z.object({
  emrId: z.string().uuid(),
  problem: z.string(),
  detail: z.string().optional()
});

// Update presenting complaint schema
const UpdatePresentingComplaintSchema = CreatePresentingComplaintSchema.partial();

// Create route
const createPresentingComplaintRoute = createRoute({
  method: 'post',
  path: '/presenting-complaint',
  tags: ['Presenting Complaint'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreatePresentingComplaintSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: PresentingComplaintSchema
        }
      },
      description: 'Presenting complaint created successfully'
    }
  }
});

// Get route
const getPresentingComplaintRoute = createRoute({
  method: 'get',
  path: '/presenting-complaint/:id',
  tags: ['Presenting Complaint'],
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
          schema: PresentingComplaintSchema
        }
      },
      description: 'Presenting complaint retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Presenting complaint not found'
    }
  }
});

// Update route
const updatePresentingComplaintRoute = createRoute({
  method: 'put',
  path: '/presenting-complaint/:id',
  tags: ['Presenting Complaint'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdatePresentingComplaintSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: PresentingComplaintSchema
        }
      },
      description: 'Presenting complaint updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Presenting complaint not found'
    }
  }
});

// Delete route
const deletePresentingComplaintRoute = createRoute({
  method: 'delete',
  path: '/presenting-complaint/:id',
  tags: ['Presenting Complaint'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    })
  },
  responses: {
    204: {
      description: 'Presenting complaint deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Presenting complaint not found'
    }
  }
});

const presentingComplaintRoute = {
  getRoutingPath: () => {
    app.openapi(createPresentingComplaintRoute, async c => {
      const data = c.req.valid('json');
      const [complaint] = await db
        .insert(tables.presentingComplaint)
        .values(data)
        .returning();
      return c.json(complaint, 201);
    });

    app.openapi(getPresentingComplaintRoute, async c => {
      const { id } = c.req.valid('param');
      const [complaint] = await db
        .select()
        .from(tables.presentingComplaint)
        .where(eq(tables.presentingComplaint.id, id))
        .execute();

      if (!complaint) {
        return c.json({ error: 'Presenting complaint not found' }, 404);
      }

      return c.json(complaint, 200);
    });

    app.openapi(updatePresentingComplaintRoute, async c => {
      const { id } = c.req.valid('param');
      const data = c.req.valid('json');

      const [complaint] = await db
        .update(tables.presentingComplaint)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tables.presentingComplaint.id, id))
        .returning();

      if (!complaint) {
        return c.json({ error: 'Presenting complaint not found' }, 404);
      }

      return c.json(complaint, 200);
    });

    app.openapi(deletePresentingComplaintRoute, async c => {
      const { id } = c.req.valid('param');
      const [complaint] = await db
        .delete(tables.presentingComplaint)
        .where(eq(tables.presentingComplaint.id, id))
        .returning();

      if (!complaint) {
        return c.json({ error: 'Presenting complaint not found' }, 404);
      }

      return c.body(null, 204);
    });
  }
};

export default presentingComplaintRoute;
