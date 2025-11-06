import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

// Schema for followup questions
const FollowupQuestionsSchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  question: z.string(),
  answer: z.string().optional(),
  followupDate: z.date().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Create schema
const CreateFollowupQuestionsSchema = z.object({
  emrId: z.string().uuid(),
  question: z.string(),
  answer: z.string().optional(),
  followupDate: z.date().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending')
});

// Update schema
const UpdateFollowupQuestionsSchema = CreateFollowupQuestionsSchema.partial();

// Create route
const createFollowupQuestionsRoute = createRoute({
  method: 'post',
  path: '/followup-questions',
  tags: ['Followup Questions'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateFollowupQuestionsSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: FollowupQuestionsSchema
        }
      },
      description: 'Followup question record created successfully'
    }
  }
});

// Get route
const getFollowupQuestionsRoute = createRoute({
  method: 'get',
  path: '/followup-questions/:id',
  tags: ['Followup Questions'],
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
          schema: FollowupQuestionsSchema
        }
      },
      description: 'Followup question record retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Followup question record not found'
    }
  }
});

// Update route
const updateFollowupQuestionsRoute = createRoute({
  method: 'put',
  path: '/followup-questions/:id',
  tags: ['Followup Questions'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateFollowupQuestionsSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: FollowupQuestionsSchema
        }
      },
      description: 'Followup question record updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Followup question record not found'
    }
  }
});

// Delete route
const deleteFollowupQuestionsRoute = createRoute({
  method: 'delete',
  path: '/followup-questions/:id',
  tags: ['Followup Questions'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    })
  },
  responses: {
    204: {
      description: 'Followup question record deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Followup question record not found'
    }
  }
});

const createFollowupQuestionsHandler = () => {
  app.openapi(createFollowupQuestionsRoute, async c => {
    const data = c.req.valid('json');
    const [record] = await db
      .insert(tables.followupQuestions)
      .values(data)
      .returning();
    return c.json(record, 201);
  });
}

const getFollowupQuestionsHandler = () => {
  app.openapi(getFollowupQuestionsRoute, async c => {
    const { id } = c.req.valid('param');
    const [record] = await db
      .select()
      .from(tables.followupQuestions)
      .where(eq(tables.followupQuestions.id, id))
      .execute();

    if (!record) {
      return c.json({ error: 'Followup question record not found' }, 404);
    }

    return c.json(record);
  });
}

const updateFollowupQuestionsHandler = () => {
  app.openapi(updateFollowupQuestionsRoute, async c => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const [record] = await db
      .update(tables.followupQuestions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tables.followupQuestions.id, id))
      .returning();

    if (!record) {
      return c.json({ error: 'Followup question record not found' }, 404);
    }

    return c.json(record);
  });
}

const deleteFollowupQuestionsHandler = () => {
  app.openapi(deleteFollowupQuestionsRoute, async c => {
    const { id } = c.req.valid('param');
    const [record] = await db
      .delete(tables.followupQuestions)
      .where(eq(tables.followupQuestions.id, id))
      .returning();

    if (!record) {
      return c.json({ error: 'Followup question record not found' }, 404);
    }

    return c.body(null, 204);
  });
}

export { createFollowupQuestionsHandler, getFollowupQuestionsHandler, updateFollowupQuestionsHandler, deleteFollowupQuestionsHandler }
