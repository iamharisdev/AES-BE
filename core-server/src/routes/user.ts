import app from '@/app';
import { db } from '@/db';
import { env } from '@/env';
import { JwtPayload } from '@/middleware/jwt';
import { tables } from '@/models';
import { UserRole } from '@/models/user';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';
import { sha256 } from 'hono/utils/crypto';
import { jwtMiddleware } from '@/middleware/jwt';

// Register User Schema
const RegisterRequestBodySchema = z.object({
  name: z.string().openapi({ example: 'Nazia' }),
  phoneNumber: z.string().openapi({ example: '03001234567' }),
  password: z.string().openapi({ example: 'xxxxxxxxx' }),
  hospitalId: z.string().openapi({ example: 'uuid-1234' }),
  role: z
    .enum([UserRole.Doctor, UserRole.Admin, UserRole.SuperAdmin, UserRole.HealthWorker])
    .openapi({ example: UserRole.Doctor })
});

const RegisterSuccessResponseSchema = z.object({
  message: z.string().openapi({ example: 'Record Created' }),
  token: z.string().describe('JWT Token for Authentication'),
});

const RegisterConflictSchema = z.object({
  error: z.string().openapi({ example: 'Doctor with the ID is already Created' }),
});

const RegisterBadRequestSchema = z.object({
  error: z.string().openapi({ example: 'Invalid hospitalId format' }),
});

const RegisterNotFoundSchema = z.object({
  error: z.string().openapi({ example: 'Hospital does not exist' }),
});

const registerRoute = createRoute({
  method: 'post',
  operationId: 'registerUser',
  tags: ['User'],
  path: '/user/register',
  summary: 'Register the User in the system',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegisterRequestBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: RegisterSuccessResponseSchema,
        },
      },
      description: 'Register The User',
    },
    400: {
      content: {
        'application/json': {
          schema: RegisterBadRequestSchema,
        },
      },
      description: 'Invalid hospitalId format',
    },
    404: {
      content: {
        'application/json': {
          schema: RegisterNotFoundSchema,
        },
      },
      description: 'Hospital does not exist',
    },
    409: {
      content: {
        'application/json': {
          schema: RegisterConflictSchema,
        },
      },
      description: 'User Already Exists',
    },
  },
});

const registerHandler = app.openapi(registerRoute, async (c) => {
  const details = c.req.valid('json');

  // Validate hospitalId is a valid UUID
  if (!z.string().uuid().safeParse(details.hospitalId).success) {
    return c.json({ error: 'Invalid hospitalId format' }, 400);
  }

  // Validate role
  if (!Object.values(UserRole).includes(details.role)) {
    return c.json({ error: 'Invalid role' }, 400);
  }

  // Check that the hospital exists
  const hospital = await db
    .select()
    .from(tables.hospital)
    .where(eq(tables.hospital.id, details.hospitalId))
    .then(res => res.at(0));

  if (!hospital) {
    return c.json({ error: 'Hospital does not exist' }, 404);
  }

  // Check if the user exists in the database
  const user = await db
    .select()
    .from(tables.user)
    .where(eq(tables.user.phoneNumber, details.phoneNumber))
    .then((user) => user.at(0));

  if (user) {
    return c.json(
      { error: `Record With Phone Number ${details.phoneNumber} already exists` },
      409
    );
  }

  const [newRecord] = await db.insert(tables.user).values({
    hospitalId: details.hospitalId,
    name: details.name,
    phoneNumber: details.phoneNumber,
    encryptedPassword: (await sha256(details.password)) ?? '',
    role: details.role,
  }).returning({
    id: tables.user.id,
    phoneNumber: tables.user.phoneNumber,
    name: tables.user.name,
    role: tables.user.role
  });

  const jwtPayload: JwtPayload = {
    id: newRecord.id,
    phoneNumber: newRecord.phoneNumber,
    name: newRecord.name,
    role: newRecord.role as UserRole
  };

  const token = await sign(jwtPayload, env.JWT_SECRET!, 'HS256');

  return c.json(
    {
      message: 'Account Created',
      token,
    },
    200
  );
});

// Login User Schema
const LoginRequestBodySchema = z.object({
  phoneNumber: z.string().openapi({ example: '03001234567' }),
  password: z.string().openapi({ example: 'xxxxxxxxx' }),
});

const LoginSuccessResponseSchema = z.object({
  message: z.string().openapi({ example: 'Login Successful' }),
  token: z.string().describe('JWT Token for Authentication'),
  user: z.object({
    name: z.string(),
    phoneNumber: z.string(),
    role: z.string(),
    id: z.string().uuid(),
  }),
});

const UnauthorizedSchema = z.object({
  error: z.string().openapi({ example: 'Invalid phone number or password' }),
});

const loginRoute = createRoute({
  method: 'post',
  operationId: 'loginUser',
  tags: ['User'],
  path: '/user/login',
  summary: 'Login user into the system',
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginRequestBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: LoginSuccessResponseSchema,
        },
      },
      description: 'Login Successful',
    },
    401: {
      content: {
        'application/json': {
          schema: UnauthorizedSchema,
        },
      },
      description: 'Unauthorized',
    },
  },
});

const loginHandler = app.openapi(loginRoute, async (c) => {
  const details = c.req.valid('json');

  // Check if the user exists in the database
  const user = await db
    .select()
    .from(tables.user)
    .where(eq(tables.user.phoneNumber, details.phoneNumber))
    .then((user) => user.at(0));

  if (!user) {
    return c.json(
      { error: 'Invalid phone number or password' },
      401
    );
  }

  // Verify password
  const encryptedPassword = (await sha256(details.password)) ?? '';
  if (user.encryptedPassword !== encryptedPassword) {
    return c.json(
      { error: 'Invalid phone number or password' },
      401
    );
  }

  const jwtPayload: JwtPayload = {
    id: user.id,
    phoneNumber: details.phoneNumber,
    name: user.name,
    role: user.role as UserRole,
  };

  const token = await sign(jwtPayload, env.JWT_SECRET!, 'HS256');
  return c.json(
    {
      message: 'Login Successful',
      token,
      user: {
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        id: user.id,
      },
    },
    200
  );
});

// Get All Users Schema
const userSchema = z.object({
  id: z.string().openapi({ example: 'uuid-1234' }),
  hospitalId: z.string().openapi({ example: 'uuid-1234' }),
  name: z.string().openapi({ example: 'Nazia' }),
  phoneNumber: z.string().openapi({ example: '03001234567' }),
});

const getUsersRoute = createRoute({
  method: 'get',
  operationId: 'getUsers',
  tags: ['User'],
  path: '/users',
  summary: 'Fetch all users',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(userSchema),
        },
      },
      description: 'List of all users',
    },
  },
});

const getUsersHandler = app.openapi(getUsersRoute, async (c) => {
  const users = await db.select().from(tables.user).execute();
  return c.json(users, 200);
});

// Get User Info Schema
const getUserInfoRoute = createRoute({
  method: 'get',
  operationId: 'getUserInfo',
  tags: ['User'],
  path: '/user/info',
  summary: 'Fetch user info',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string(),
            phoneNumber: z.string(),
            hospitalId: z.string(),
          }),
        },
      },
      description: 'User info',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: 'User not found',
    },
  },
});

const getUserInfoHandler = app.openapi(getUserInfoRoute, async (c) => {
  const { phoneNumber } = c.get('jwtPayload');

  const user = await db
    .select()
    .from(tables.user)
    .where(eq(tables.user.phoneNumber, phoneNumber))
    .then((res) => res.at(0));

  if (!user) {
    return c.json({ error: `No user record exists with phone number ${phoneNumber}` }, 404);
  }

  return c.json({
    name: user.name,
    phoneNumber: user.phoneNumber,
    hospitalId: user.hospitalId,
  }, 200);
});

export type RegisterUserRoute = typeof registerHandler;
export type LoginUserRoute = typeof loginHandler;
export type GetUsersRoute = typeof getUsersHandler;
export type GetUserInfoRoute = typeof getUserInfoHandler;

export { registerRoute, loginRoute, getUsersRoute, getUserInfoRoute };

export default registerRoute;
