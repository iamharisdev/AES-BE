import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

// 1. Schemas
const DiagnosticsSchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  content: z.object({
    diagnostics: z.string(),
    riskFactors: z.string(),
    proposedPlan: z.string()
  }),
  createdAt: z.string(),
  updatedAt: z.string()
});

const CreateDiagnosticsSchema = z.object({
  emrId: z.string().uuid(),
  content: z.object({
    diagnostics: z.string(),
    riskFactors: z.string(),
    proposedPlan: z.string()
  })
});

const UpdateDiagnosticsSchema = z.object({
  content: z.object({
    diagnostics: z.string(),
    riskFactors: z.string(),
    proposedPlan: z.string()
  })
});

const ErrorSchema = z.object({ error: z.string() });

// 2. OpenAPI Routes
const createDiagnosticsRoute = createRoute({
  method: 'post',
  path: '/diagnostics',
  tags: ['Diagnostics'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateDiagnosticsSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: DiagnosticsSchema
        }
      },
      description: 'Diagnostics record created successfully'
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Diagnostics already exists'
    }
  }
});

const getDiagnosticsByEmrRoute = createRoute({
  method: 'get',
  path: '/diagnostics/:emrId',
  tags: ['Diagnostics'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({ emrId: z.string().uuid() })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: DiagnosticsSchema
        }
      },
      description: 'Diagnostics record retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Diagnostics not found'
    }
  }
});

const updateDiagnosticsRoute = createRoute({
  method: 'put',
  path: '/diagnostics/:id',
  tags: ['Diagnostics'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: UpdateDiagnosticsSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: DiagnosticsSchema
        }
      },
      description: 'Diagnostics record updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Diagnostics not found'
    }
  }
});

const deleteDiagnosticsRoute = createRoute({
  method: 'delete',
  path: '/diagnostics/:id',
  tags: ['Diagnostics'],
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
      description: 'Diagnostics record deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Diagnostics not found'
    }
  }
});

// 3. Route Handlers
const createDiagnosticsHandler = () => {
  app.openapi(createDiagnosticsRoute, async c => {
    try {
      const { emrId, content } = c.req.valid('json');

      // Check if diagnostics already exists for this EMR
      const existingDiagnostics = await db
        .select()
        .from(tables.diagnostics)
        .where(eq(tables.diagnostics.emrId, emrId))
        .limit(1);

      if (existingDiagnostics.length > 0) {
        return c.json(
          { error: 'Diagnostics already exists for this EMR' },
          409
        );
      }

      const [diagnostics] = await db
        .insert(tables.diagnostics)
        .values({
          emrId,
          content
        })
        .returning();

      return c.json(diagnostics, 201);
    } catch (error) {
      console.error('Error creating diagnostics:', error);
      return c.json({ error: 'Failed to create diagnostics' }, 500);
    }
  });
};

const getDiagnosticsByEmrHandler = () => {
  app.openapi(getDiagnosticsByEmrRoute, async c => {
    try {
      const { emrId } = c.req.valid('param');

      const diagnostics = await db
        .select()
        .from(tables.diagnostics)
        .where(eq(tables.diagnostics.emrId, emrId))
        .limit(1);

      if (diagnostics.length === 0) {
        return c.json({ error: 'Diagnostics not found' }, 404);
      }

      return c.json(diagnostics[0]);
    } catch (error) {
      console.error('Error retrieving diagnostics:', error);
      return c.json({ error: 'Failed to retrieve diagnostics' }, 500);
    }
  });
};

const updateDiagnosticsHandler = () => {
  app.openapi(updateDiagnosticsRoute, async c => {
    try {
      const { id } = c.req.valid('param');
      const { content } = c.req.valid('json');

      const [updatedDiagnostics] = await db
        .update(tables.diagnostics)
        .set({
          content,
          updatedAt: new Date()
        })
        .where(eq(tables.diagnostics.id, id))
        .returning();

      if (!updatedDiagnostics) {
        return c.json({ error: 'Diagnostics not found' }, 404);
      }

      return c.json(updatedDiagnostics);
    } catch (error) {
      console.error('Error updating diagnostics:', error);
      return c.json({ error: 'Failed to update diagnostics' }, 500);
    }
  });
};

const deleteDiagnosticsHandler = () => {
  app.openapi(deleteDiagnosticsRoute, async c => {
    try {
      const { id } = c.req.valid('param');

      const [deletedDiagnostics] = await db
        .delete(tables.diagnostics)
        .where(eq(tables.diagnostics.id, id))
        .returning();

      if (!deletedDiagnostics) {
        return c.json({ error: 'Diagnostics not found' }, 404);
      }

      return c.json({ message: 'Diagnostics deleted successfully' });
    } catch (error) {
      console.error('Error deleting diagnostics:', error);
      return c.json({ error: 'Failed to delete diagnostics' }, 500);
    }
  });
};

export {
  createDiagnosticsHandler,
  getDiagnosticsByEmrHandler,
  updateDiagnosticsHandler,
  deleteDiagnosticsHandler
};
