import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

// 1. Schemas
const MedicalHistorySchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  currentMedications: z.string().nullable(),
  medicalConditions: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const CreateMedicalHistorySchema = z.object({
  emrId: z.string().uuid(),
  currentMedications: z.string().nullable(),
  medicalConditions: z.string().nullable()
});

const UpdateMedicalHistorySchema = z.object({
  currentMedications: z.string().nullable(),
  medicalConditions: z.string().nullable()
});

const ErrorSchema = z.object({ error: z.string() });

// 2. OpenAPI Routes
const createMedicalHistoryRoute = createRoute({
  method: 'post',
  path: '/medical-history',
  tags: ['Medical History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateMedicalHistorySchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: MedicalHistorySchema
        }
      },
      description: 'Medical history record created successfully'
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Medical history already exists'
    }
  }
});

const getMedicalHistoryByEmrRoute = createRoute({
  method: 'get',
  path: '/medical-history/:emrId',
  tags: ['Medical History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({ emrId: z.string().uuid() })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: MedicalHistorySchema
        }
      },
      description: 'Medical history record retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Medical history not found'
    }
  }
});

const updateMedicalHistoryRoute = createRoute({
  method: 'put',
  path: '/medical-history/:id',
  tags: ['Medical History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: UpdateMedicalHistorySchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: MedicalHistorySchema
        }
      },
      description: 'Medical history record updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Medical history not found'
    }
  }
});

const deleteMedicalHistoryRoute = createRoute({
  method: 'delete',
  path: '/medical-history/:id',
  tags: ['Medical History'],
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
      description: 'Medical history record deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Medical history not found'
    }
  }
});

// 3. Route Handlers
const createMedicalHistoryHandler = () => {
  app.openapi(createMedicalHistoryRoute, async c => {
    try {
      const { emrId, currentMedications, medicalConditions } =
        c.req.valid('json');

      // Check if medical history already exists for this EMR
      const existingMedicalHistory = await db
        .select()
        .from(tables.medicalHistory)
        .where(eq(tables.medicalHistory.emrId, emrId))
        .limit(1);

      if (existingMedicalHistory.length > 0) {
        return c.json(
          { error: 'Medical history already exists for this EMR' },
          409
        );
      }

      const [medicalHistory] = await db
        .insert(tables.medicalHistory)
        .values({
          emrId,
          currentMedications,
          medicalConditions
        })
        .returning();

      return c.json(medicalHistory, 201);
    } catch (error) {
      console.error('Error creating medical history:', error);
      return c.json({ error: 'Failed to create medical history' }, 500);
    }
  });
};

const getMedicalHistoryByEmrHandler = () => {
  app.openapi(getMedicalHistoryByEmrRoute, async c => {
    try {
      const { emrId } = c.req.valid('param');

      const medicalHistory = await db
        .select()
        .from(tables.medicalHistory)
        .where(eq(tables.medicalHistory.emrId, emrId))
        .limit(1);

      if (medicalHistory.length === 0) {
        return c.json({ error: 'Medical history not found' }, 404);
      }

      return c.json(medicalHistory[0]);
    } catch (error) {
      console.error('Error retrieving medical history:', error);
      return c.json({ error: 'Failed to retrieve medical history' }, 500);
    }
  });
};

const updateMedicalHistoryHandler = () => {
  app.openapi(updateMedicalHistoryRoute, async c => {
    try {
      const { id } = c.req.valid('param');
      const { currentMedications, medicalConditions } = c.req.valid('json');

      const [updatedMedicalHistory] = await db
        .update(tables.medicalHistory)
        .set({
          currentMedications,
          medicalConditions,
          updatedAt: new Date()
        })
        .where(eq(tables.medicalHistory.id, id))
        .returning();

      if (!updatedMedicalHistory) {
        return c.json({ error: 'Medical history not found' }, 404);
      }

      return c.json(updatedMedicalHistory);
    } catch (error) {
      console.error('Error updating medical history:', error);
      return c.json({ error: 'Failed to update medical history' }, 500);
    }
  });
};

const deleteMedicalHistoryHandler = () => {
  app.openapi(deleteMedicalHistoryRoute, async c => {
    try {
      const { id } = c.req.valid('param');

      const [deletedMedicalHistory] = await db
        .delete(tables.medicalHistory)
        .where(eq(tables.medicalHistory.id, id))
        .returning();

      if (!deletedMedicalHistory) {
        return c.json({ error: 'Medical history not found' }, 404);
      }

      return c.json({ message: 'Medical history deleted successfully' });
    } catch (error) {
      console.error('Error deleting medical history:', error);
      return c.json({ error: 'Failed to delete medical history' }, 500);
    }
  });
};

export {
  createMedicalHistoryHandler,
  getMedicalHistoryByEmrHandler,
  updateMedicalHistoryHandler,
  deleteMedicalHistoryHandler
};
