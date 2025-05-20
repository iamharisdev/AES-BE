import app from '@/app';
import { db } from '@/db';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { jwtMiddleware } from '@/middleware/jwt';
import { requireSuperAdmin } from '@/middleware/role';

const RequestBodySchema = z.object({
  name: z.string().openapi({ example: 'General Hospital' }),
  address: z.string().openapi({ example: '123 Main St' }),
  description: z.string().optional().openapi({ example: 'A leading healthcare facility' }),
});

const SuccessResponseSchema = z.object({
  message: z.string().openapi({ example: 'Hospital created successfully' }),
  id: z.string().uuid(),
});

const ConflictSchema = z.object({
  error: z.string().openapi({ example: 'Hospital with this name already exists' }),
});

const route = createRoute({
  method: 'post',
  operationId: 'createHospital',
  tags: ['Hospital'],
  path: '/hospital',
  summary: 'Create a new hospital',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware, requireSuperAdmin],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RequestBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
      description: 'Hospital created successfully',
    },
    409: {
      content: {
        'application/json': {
          schema: ConflictSchema,
        },
      },
      description: 'Hospital already exists',
    },
  },
});

const handler = app.openapi(route, async (c) => {
  const details = c.req.valid('json');

  // Check if the hospital already exists
  const existingHospital = await db
    .select()
    .from(tables.hospital)
    .where(eq(tables.hospital.name, details.name))
    .then((res) => res.at(0));

  if (existingHospital) {
    return c.json(
      { error: `Hospital with name ${details.name} already exists` },
      409
    );
  }

  const [newRecord] = await db.insert(tables.hospital).values({
    name: details.name,
    address: details.address,
    description: details.description,
  }).returning({ id: tables.hospital.id });

  return c.json(
    {
      message: 'Hospital created successfully',
      id: newRecord.id,
    },
    200
  );
});

// GET all hospitals
const listRoute = createRoute({
  method: 'get',
  operationId: 'listHospitals',
  tags: ['Hospital'],
  path: '/hospital',
  summary: 'List all hospitals',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware, requireSuperAdmin],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(z.object({
            id: z.string().uuid(),
            name: z.string(),
            address: z.string(),
            description: z.string().optional(),
          })),
        },
      },
      description: 'List of hospitals',
    },
  },
});

const listHandler = app.openapi(listRoute, async (c) => {
  const hospitals = await db.select().from(tables.hospital).execute();
  const mappedHospitals = hospitals.map(h => ({
    id: h.id,
    name: h.name,
    address: h.address,
    description: h.description || undefined,
  }));
  return c.json(mappedHospitals, 200);
});

// GET hospital by ID
const getByIdRoute = createRoute({
  method: 'get',
  operationId: 'getHospitalById',
  tags: ['Hospital'],
  path: '/hospital/{id}',
  summary: 'Get hospital by ID',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware, requireSuperAdmin],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            id: z.string().uuid(),
            name: z.string(),
            address: z.string(),
            description: z.string().optional(),
          }),
        },
      },
      description: 'Hospital details',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: 'Hospital not found',
    },
  },
});

const getByIdHandler = app.openapi(getByIdRoute, async (c) => {
  const { id } = c.req.valid('param');
  const hospital = await db.select().from(tables.hospital).where(eq(tables.hospital.id, id)).then(res => res.at(0));
  if (!hospital) {
    return c.json({ error: 'Hospital not found' }, 404);
  }
  const mappedHospital = {
    id: hospital.id,
    name: hospital.name,
    address: hospital.address,
    description: hospital.description || undefined,
  };
  return c.json(mappedHospital, 200);
});

// PUT update hospital
const updateRoute = createRoute({
  method: 'put',
  operationId: 'updateHospital',
  tags: ['Hospital'],
  path: '/hospital/{id}',
  summary: 'Update hospital by ID',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware, requireSuperAdmin],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: RequestBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: 'Hospital updated successfully',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: 'Hospital not found',
    },
  },
});

const updateHandler = app.openapi(updateRoute, async (c) => {
  const { id } = c.req.valid('param');
  const details = c.req.valid('json');
  const hospital = await db.select().from(tables.hospital).where(eq(tables.hospital.id, id)).then(res => res.at(0));
  if (!hospital) {
    return c.json({ error: 'Hospital not found' }, 404);
  }
  await db.update(tables.hospital).set({
    name: details.name,
    address: details.address,
    description: details.description,
  }).where(eq(tables.hospital.id, id));
  return c.json({ message: 'Hospital updated successfully' }, 200);
});

// DELETE hospital
const deleteRoute = createRoute({
  method: 'delete',
  operationId: 'deleteHospital',
  tags: ['Hospital'],
  path: '/hospital/{id}',
  summary: 'Delete hospital by ID',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware, requireSuperAdmin],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: 'Hospital deleted successfully',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: 'Hospital not found',
    },
  },
});

const deleteHandler = app.openapi(deleteRoute, async (c) => {
  const { id } = c.req.valid('param');
  const hospital = await db.select().from(tables.hospital).where(eq(tables.hospital.id, id)).then(res => res.at(0));
  if (!hospital) {
    return c.json({ error: 'Hospital not found' }, 404);
  }
  await db.delete(tables.hospital).where(eq(tables.hospital.id, id));
  return c.json({ message: 'Hospital deleted successfully' }, 200);
});

export type CreateHospitalRoute = typeof handler;
export type ListHospitalsRoute = typeof listHandler;
export type GetHospitalByIdRoute = typeof getByIdHandler;
export type UpdateHospitalRoute = typeof updateHandler;
export type DeleteHospitalRoute = typeof deleteHandler;

export { listRoute, getByIdRoute, updateRoute, deleteRoute };

export default route;
