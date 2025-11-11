import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// 1. Schemas
const QRCodeSchema = z.object({
  id: z.string().uuid(),
  token: z.string(),
  patientId: z.string().uuid(),
  expiresAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const CreateQRCodeSchema = z.object({
  patientId: z.string().uuid(),
  expiresAt: z.string().datetime()
});

const UpdateQRCodeSchema = z.object({
  expiresAt: z.string().datetime()
});

const ErrorSchema = z.object({ error: z.string() });

// 2. OpenAPI Routes
const createQRCodeRoute = createRoute({
  method: 'post',
  path: '/qr-code',
  tags: ['QR Code'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateQRCodeSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: QRCodeSchema
        }
      },
      description: 'QR code created successfully'
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'QR code already exists for this patient'
    }
  }
});

const getQRCodeByTokenRoute = createRoute({
  method: 'get',
  path: '/qr-code/token/:token',
  tags: ['QR Code'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({ token: z.string() })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: QRCodeSchema
        }
      },
      description: 'QR code retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'QR code not found'
    }
  }
});

const getQRCodeByPatientRoute = createRoute({
  method: 'get',
  path: '/qr-code/patient/:patientId',
  tags: ['QR Code'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({ patientId: z.string().uuid() })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: QRCodeSchema
        }
      },
      description: 'QR code retrieved successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'QR code not found'
    }
  }
});

const updateQRCodeRoute = createRoute({
  method: 'put',
  path: '/qr-code/:id',
  tags: ['QR Code'],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: UpdateQRCodeSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: QRCodeSchema
        }
      },
      description: 'QR code updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'QR code not found'
    }
  }
});

const deleteQRCodeRoute = createRoute({
  method: 'delete',
  path: '/qr-code/:id',
  tags: ['QR Code'],
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
      description: 'QR code deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'QR code not found'
    }
  }
});

// 3. Route Handlers
const createQRCodeHandler = () => {
  app.openapi(createQRCodeRoute, async c => {
    try {
      const { patientId, expiresAt } = c.req.valid('json');

      // Check if QR code already exists for this patient
      const existingQRCode = await db
        .select()
        .from(tables.qrCode)
        .where(eq(tables.qrCode.patientId, patientId))
        .limit(1);

      if (existingQRCode.length > 0) {
        return c.json(
          { error: 'QR code already exists for this patient' },
          409
        );
      }

      // Generate a unique token
      const token = randomBytes(32).toString('hex');

      const [qrCode] = await db
        .insert(tables.qrCode)
        .values({
          token,
          patientId,
          expiresAt: new Date(expiresAt)
        })
        .returning();

      return c.json(qrCode, 201);
    } catch (error) {
      console.error('Error creating QR code:', error);
      return c.json({ error: 'Failed to create QR code' }, 500);
    }
  });
};

const getQRCodeByTokenHandler = () => {
  app.openapi(getQRCodeByTokenRoute, async c => {
    try {
      const { token } = c.req.valid('param');

      const qrCode = await db
        .select()
        .from(tables.qrCode)
        .where(eq(tables.qrCode.token, token))
        .limit(1);

      if (qrCode.length === 0) {
        return c.json({ error: 'QR code not found' }, 404);
      }

      // Check if QR code has expired
      if (new Date() > new Date(qrCode[0].expiresAt)) {
        return c.json({ error: 'QR code has expired' }, 410);
      }

      return c.json(qrCode[0]);
    } catch (error) {
      console.error('Error retrieving QR code:', error);
      return c.json({ error: 'Failed to retrieve QR code' }, 500);
    }
  });
};

const getQRCodeByPatientHandler = () => {
  app.openapi(getQRCodeByPatientRoute, async c => {
    try {
      const { patientId } = c.req.valid('param');

      const qrCode = await db
        .select()
        .from(tables.qrCode)
        .where(eq(tables.qrCode.patientId, patientId))
        .limit(1);

      if (qrCode.length === 0) {
        return c.json({ error: 'QR code not found' }, 404);
      }

      return c.json(qrCode[0]);
    } catch (error) {
      console.error('Error retrieving QR code:', error);
      return c.json({ error: 'Failed to retrieve QR code' }, 500);
    }
  });
};

const updateQRCodeHandler = () => {
  app.openapi(updateQRCodeRoute, async c => {
    try {
      const { id } = c.req.valid('param');
      const { expiresAt } = c.req.valid('json');

      const [updatedQRCode] = await db
        .update(tables.qrCode)
        .set({
          expiresAt: new Date(expiresAt),
          updatedAt: new Date()
        })
        .where(eq(tables.qrCode.id, id))
        .returning();

      if (!updatedQRCode) {
        return c.json({ error: 'QR code not found' }, 404);
      }

      return c.json(updatedQRCode);
    } catch (error) {
      console.error('Error updating QR code:', error);
      return c.json({ error: 'Failed to update QR code' }, 500);
    }
  });
};

const deleteQRCodeHandler = () => {
  app.openapi(deleteQRCodeRoute, async c => {
    try {
      const { id } = c.req.valid('param');

      const [deletedQRCode] = await db
        .delete(tables.qrCode)
        .where(eq(tables.qrCode.id, id))
        .returning();

      if (!deletedQRCode) {
        return c.json({ error: 'QR code not found' }, 404);
      }

      return c.json({ message: 'QR code deleted successfully' });
    } catch (error) {
      console.error('Error deleting QR code:', error);
      return c.json({ error: 'Failed to delete QR code' }, 500);
    }
  });
};

export {
  createQRCodeHandler,
  getQRCodeByTokenHandler,
  getQRCodeByPatientHandler,
  updateQRCodeHandler,
  deleteQRCodeHandler
};
