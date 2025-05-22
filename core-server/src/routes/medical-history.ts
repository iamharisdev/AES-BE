import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

// Schema for medical history
const MedicalHistorySchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  chronicDiseases: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  hospitalizations: z.string().optional(),
  bloodTransfusions: z.string().optional(),
  diabetes: z.string().optional(),
  hypertension: z.string().optional(),
  heartDisease: z.string().optional(),
  asthma: z.string().optional(),
  thyroid: z.string().optional(),
  other: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Create schema
const CreateMedicalHistorySchema = z.object({
  emrId: z.string().uuid(),
  chronicDiseases: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  hospitalizations: z.string().optional(),
  bloodTransfusions: z.string().optional(),
  diabetes: z.string().optional(),
  hypertension: z.string().optional(),
  heartDisease: z.string().optional(),
  asthma: z.string().optional(),
  thyroid: z.string().optional(),
  other: z.string().optional()
});

// Update schema
const UpdateMedicalHistorySchema = CreateMedicalHistorySchema.partial();

// Create route
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
    }
  }
});

// Get route
const getMedicalHistoryRoute = createRoute({
  method: 'get',
  path: '/medical-history/:id',
  tags: ['Medical History'],
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
          schema: MedicalHistorySchema
        }
      },
      description: 'Medical history record retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Medical history record not found'
    }
  }
});

// Update route
const updateMedicalHistoryRoute = createRoute({
  method: 'put',
  path: '/medical-history/:id',
  tags: ['Medical History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    }),
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
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Medical history record not found'
    }
  }
});

// Delete route
const deleteMedicalHistoryRoute = createRoute({
  method: 'delete',
  path: '/medical-history/:id',
  tags: ['Medical History'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    })
  },
  responses: {
    204: {
      description: 'Medical history record deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'Medical history record not found'
    }
  }
});

// Create handler
app.openapi(createMedicalHistoryRoute, async c => {
  const data = c.req.valid('json');
  const [record] = await db
    .insert(tables.medicalHistory)
    .values(data)
    .returning();
  return c.json(record, 201);
});

// Get handler
app.openapi(getMedicalHistoryRoute, async c => {
  const { id } = c.req.valid('param');
  const [record] = await db
    .select()
    .from(tables.medicalHistory)
    .where(eq(tables.medicalHistory.id, id))
    .execute();

  if (!record) {
    return c.json({ error: 'Medical history record not found' }, 404);
  }

  return c.json(record);
});

// Update handler
app.openapi(updateMedicalHistoryRoute, async c => {
  const { id } = c.req.valid('param');
  const data = c.req.valid('json');

  const [record] = await db
    .update(tables.medicalHistory)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tables.medicalHistory.id, id))
    .returning();

  if (!record) {
    return c.json({ error: 'Medical history record not found' }, 404);
  }

  return c.json(record);
});

// Delete handler
app.openapi(deleteMedicalHistoryRoute, async c => {
  const { id } = c.req.valid('param');
  const [record] = await db
    .delete(tables.medicalHistory)
    .where(eq(tables.medicalHistory.id, id))
    .returning();

  if (!record) {
    return c.json({ error: 'Medical history record not found' }, 404);
  }

  return c.body(null, 204);
});

const medicalHistoryRoute = {
  getRoutingPath: () => {
    app.openapi(createMedicalHistoryRoute, async c => {
      const data = c.req.valid('json');
      const [record] = await db
        .insert(tables.medicalHistory)
        .values(data)
        .returning();
      return c.json(record, 201);
    });

    app.openapi(getMedicalHistoryRoute, async c => {
      const { id } = c.req.valid('param');
      const [record] = await db
        .select()
        .from(tables.medicalHistory)
        .where(eq(tables.medicalHistory.id, id))
        .execute();

      if (!record) {
        return c.json({ error: 'Medical history record not found' }, 404);
      }

      return c.json(record);
    });

    app.openapi(updateMedicalHistoryRoute, async c => {
      const { id } = c.req.valid('param');
      const data = c.req.valid('json');

      const [record] = await db
        .update(tables.medicalHistory)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tables.medicalHistory.id, id))
        .returning();

      if (!record) {
        return c.json({ error: 'Medical history record not found' }, 404);
      }

      return c.json(record);
    });

    app.openapi(deleteMedicalHistoryRoute, async c => {
      const { id } = c.req.valid('param');
      const [record] = await db
        .delete(tables.medicalHistory)
        .where(eq(tables.medicalHistory.id, id))
        .returning();

      if (!record) {
        return c.json({ error: 'Medical history record not found' }, 404);
      }

      return c.body(null, 204);
    });
  }
};

export default medicalHistoryRoute;
