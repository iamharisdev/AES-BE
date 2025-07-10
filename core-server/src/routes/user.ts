import app from '@/app';
import { db } from '@/db';
import { env } from '@/env';
import { JwtPayload } from '@/middleware/jwt';
import { tables } from '@/models';
import { UserRole } from '@/models/user';
import { createRoute, z } from '@hono/zod-openapi';
import { eq, and } from 'drizzle-orm';
import { sign } from 'hono/jwt';
import { sha256 } from 'hono/utils/crypto';
import { jwtMiddleware } from '@/middleware/jwt';
import { sendEmail } from '@/services/email';


// Register User Schema
const RegisterRequestBodySchema = z.object({
  name: z.string().openapi({ example: 'Nazia' }),
  phoneNumber: z.string().openapi({ example: '03001234567' }),
  password: z.string().openapi({ example: 'xxxxxxxxx' }),
  hospitalId: z.string().uuid().optional().openapi({ example: 'uuid-1234' }),
  role: z
    .enum([
      UserRole.Doctor,
      UserRole.Admin,
      UserRole.SuperAdmin,
      UserRole.HealthWorker
    ])
    .openapi({ example: UserRole.Doctor })
});

const RegisterSuccessResponseSchema = z.object({
  message: z.string().openapi({ example: 'Record Created' }),
  token: z.string().describe('JWT Token for Authentication')
});

const RegisterConflictSchema = z.object({
  error: z
    .string()
    .openapi({ example: 'Doctor with the ID is already Created' })
});

const RegisterBadRequestSchema = z.object({
  error: z.string().openapi({ example: 'Invalid hospitalId format' })
});

const RegisterNotFoundSchema = z.object({
  error: z.string().openapi({ example: 'Hospital does not exist' })
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
          schema: RegisterRequestBodySchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: RegisterSuccessResponseSchema
        }
      },
      description: 'Register The User'
    },
    400: {
      content: {
        'application/json': {
          schema: RegisterBadRequestSchema
        }
      },
      description: 'Invalid hospitalId format'
    },
    404: {
      content: {
        'application/json': {
          schema: RegisterNotFoundSchema
        }
      },
      description: 'Hospital does not exist'
    },
    409: {
      content: {
        'application/json': {
          schema: RegisterConflictSchema
        }
      },
      description: 'User Already Exists'
    }
  }
});

const registerHandler = () => {
  app.openapi(registerRoute, async c => {
    const details = c.req.valid('json');

    // Validate role
    if (!Object.values(UserRole).includes(details.role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    // Validate hospitalId based on role
    if (details.role !== UserRole.SuperAdmin) {
      if (!details.hospitalId) {
        return c.json(
          { error: 'hospitalId is required!' },
          400
        );
      }
      // Validate hospitalId is a valid UUID
      if (!z.string().uuid().safeParse(details.hospitalId).success) {
        return c.json({ error: 'Invalid hospitalId format' }, 400);
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
    }

    // Check if the user exists in the database
    const user = await db
      .select()
      .from(tables.user)
      .where(eq(tables.user.phoneNumber, details.phoneNumber))
      .then(user => user.at(0));

    if (user) {
      return c.json(
        {
          error: `Record With Phone Number ${details.phoneNumber} already exists`
        },
        409
      );
    }

    const [newRecord] = await db
      .insert(tables.user)
      .values({
        hospitalId: details.hospitalId,
        name: details.name,
        phoneNumber: details.phoneNumber,
        encryptedPassword: (await sha256(details.password)) ?? '',
        role: details.role
      })
      .returning({
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
        token
      },
      200
    );
  });
}

// Login User Schema
const LoginRequestBodySchema = z.object({
  phoneNumber: z.string().openapi({ example: '03001234567' }),
  password: z.string().openapi({ example: 'xxxxxxxxx' })
});

const LoginSuccessResponseSchema = z.object({
  message: z.string().openapi({ example: 'Login Successful' }),
  token: z.string().describe('JWT Token for Authentication'),
  user: z.object({
    name: z.string(),
    phoneNumber: z.string(),
    role: z.string(),
    id: z.string().uuid()
  })
});

const UnauthorizedSchema = z.object({
  error: z.string().openapi({ example: 'Invalid phone number or password' })
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
          schema: LoginRequestBodySchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: LoginSuccessResponseSchema
        }
      },
      description: 'Login Successful'
    },
    401: {
      content: {
        'application/json': {
          schema: UnauthorizedSchema
        }
      },
      description: 'Unauthorized'
    }
  }
});

const loginHandler = () => {
  app.openapi(loginRoute, async c => {
    const details = c.req.valid('json');

    // Check if the user exists in the database
    const user = await db
      .select()
      .from(tables.user)
      .where(eq(tables.user.phoneNumber, details.phoneNumber))
      .then(user => user.at(0));

    if (!user) {
      return c.json({ error: 'Invalid phone number or password' }, 401);
    }

    // Verify password
    const encryptedPassword = (await sha256(details.password)) ?? '';
    if (user.encryptedPassword !== encryptedPassword) {
      return c.json({ error: 'Invalid phone number or password' }, 401);
    }

    const jwtPayload: JwtPayload = {
      id: user.id,
      phoneNumber: details.phoneNumber,
      name: user.name,
      role: user.role as UserRole
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
          id: user.id
        }
      },
      200
    );
  });
}

// Get All Users Schema
const userSchema = z.object({
  id: z.string().openapi({ example: 'uuid-1234' }),
  hospitalId: z.string().nullable().openapi({ example: 'uuid-1234' }),
  name: z.string().openapi({ example: 'Nazia' }),
  phoneNumber: z.string().openapi({ example: '03001234567' })
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
          schema: z.array(userSchema)
        }
      },
      description: 'List of all users'
    }
  }
});

const getUsersHandler = () => {
  app.openapi(getUsersRoute, async c => {
    const users = await db.select().from(tables.user).execute();
    return c.json(users, 200);
  });
}

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
            hospitalId: z.string().nullable()
          })
        }
      },
      description: 'User info'
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          })
        }
      },
      description: 'User not found'
    }
  }
});

const getUserInfoHandler = () => {
  app.openapi(getUserInfoRoute, async c => {
    const { phoneNumber } = c.get('jwtPayload');

    const user = await db
      .select()
      .from(tables.user)
      .where(eq(tables.user.phoneNumber, phoneNumber))
      .then(res => res.at(0));

    if (!user) {
      return c.json(
        { error: `No user record exists with phone number ${phoneNumber}` },
        404
      );
    }

    return c.json(
      {
        name: user.name,
        phoneNumber: user.phoneNumber,
        hospitalId: user.hospitalId
      },
      200
    );
  });
}

const ChangePasswordRequestSchema = z.object({
  oldPassword: z.string().openapi({ example: 'oldpassword123' }),
  newPassword: z.string().openapi({ example: 'newpassword456' })
});

const ChangePasswordResponseSchema = z.object({
  message: z.string().openapi({ example: 'Password changed successfully' })
});

const ChangePasswordErrorSchema = z.object({
  error: z.string().openapi({ example: 'Old password is incorrect' })
});

const changePasswordRoute = createRoute({
  method: 'post',
  operationId: 'changePassword',
  tags: ['User'],
  path: '/user/change-password',
  summary: 'Change user password',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        'application/json': {
          schema: ChangePasswordRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ChangePasswordResponseSchema
        }
      },
      description: 'Password changed successfully'
    },
    400: {
      content: {
        'application/json': {
          schema: ChangePasswordErrorSchema
        }
      },
      description: 'Old password is incorrect'
    }
  }
});

const changePasswordHandler = () => {
  app.openapi(changePasswordRoute, async c => {
    const { oldPassword, newPassword } = c.req.valid('json');
    const { phoneNumber } = c.get('jwtPayload');
    // Fetch user
    const user = await db
      .select()
      .from(tables.user)
      .where(eq(tables.user.phoneNumber, phoneNumber))
      .then(res => res.at(0));

    if (!user) {
      return c.json({ error: 'User not found' }, 400);
    }

    // Verify old password
    const encryptedOld = (await sha256(oldPassword)) ?? '';
    if (user.encryptedPassword !== encryptedOld) {
      return c.json({ error: 'Old password is incorrect' }, 400);
    }

    // Update to new password
    const encryptedNew = (await sha256(newPassword)) ?? '';
    await db.update(tables.user)
      .set({ encryptedPassword: encryptedNew })
      .where(eq(tables.user.phoneNumber, phoneNumber))
      .execute();

    return c.json({ message: 'Password changed successfully' }, 200);
  });
};



// Send OTP route using user table fields
const SendOtpRequestSchema = z.object({
  email: z.string().email().openapi({ example: 'user@example.com' })
});
const SendOtpResponseSchema = z.object({
  message: z.string().openapi({ example: 'OTP sent to email' })
});
const SendOtpErrorSchema = z.object({
  error: z.string().openapi({ example: 'User not found' })
});

const sendOtpRoute = createRoute({
  method: 'post',
  operationId: 'sendOtp',
  tags: ['User'],
  path: '/user/send-otp',
  summary: 'Send OTP to user email',
  request: {
    body: {
      content: {
        'application/json': {
          schema: SendOtpRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SendOtpResponseSchema
        }
      },
      description: 'OTP sent'
    },
    404: {
      content: {
        'application/json': {
          schema: SendOtpErrorSchema
        }
      },
      description: 'User not found'
    }
  }
});

const sendOtpHandler = () => {
  app.openapi(sendOtpRoute, async c => {
    const { email } = c.req.valid('json');
    const user = await db.select().from(tables.user).where(eq(tables.user.email, email)).then(res => res.at(0));
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    const hash = await sha256(code);
    await db.update(tables.user)
      .set({ resetOtpHash: hash, resetOtpExpiry: expiresAt })
      .where(eq(tables.user.email, email))
      .execute();
      await sendEmail(email, user, code)

    return c.json({ message: 'OTP sent to email' }, 200);
  });
};

// Verify OTP route using user table fields
const VerifyOtpRequestSchema = z.object({
  email: z.string().email().openapi({ example: 'user@example.com' }),
  code: z.string().openapi({ example: '123456' })
});
const VerifyOtpResponseSchema = z.object({
  message: z.string().openapi({ example: 'OTP verified successfully' })
});
const VerifyOtpErrorSchema = z.object({
  error: z.string().openapi({ example: 'Invalid or expired OTP' })
});

const verifyOtpRoute = createRoute({
  method: 'post',
  operationId: 'verifyOtp',
  tags: ['User'],
  path: '/user/verify-otp',
  summary: 'Verify OTP for user email',
  request: {
    body: {
      content: {
        'application/json': {
          schema: VerifyOtpRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: VerifyOtpResponseSchema
        }
      },
      description: 'OTP verified'
    },
    400: {
      content: {
        'application/json': {
          schema: VerifyOtpErrorSchema
        }
      },
      description: 'Invalid or expired OTP'
    }
  }
});

const verifyOtpHandler = () => {
  app.openapi(verifyOtpRoute, async c => {
    const { email, code } = c.req.valid('json');
    const user = await db.select().from(tables.user).where(eq(tables.user.email, email)).then(res => res.at(0));
     console.log(user,"USERRR")
    if (!user || !user.resetOtpHash || !user.resetOtpExpiry) {
      return c.json({ error: 'Invalid or expired OTP' }, 400);
    }
    const hash = await sha256(code);
    if (user.resetOtpHash !== hash || user.resetOtpExpiry < new Date()) {
      return c.json({ error: 'Invalid or expired OTP' }, 400);
    }
    return c.json({ message: 'OTP verified successfully' }, 200);
  });
};

const ForgotPasswordRequestSchema = z.object({
  email: z.string().email().openapi({ example: 'user@example.com' }),
  code: z.string().openapi({ example: '123456' }),
  newPassword: z.string().openapi({ example: 'newpassword123' })
});
const ForgotPasswordResponseSchema = z.object({
  message: z.string().openapi({ example: 'Password updated successfully' })
});
const ForgotPasswordErrorSchema = z.object({
  error: z.string().openapi({ example: 'Invalid or expired OTP' })
});

const forgotPasswordRoute = createRoute({
  method: 'post',
  operationId: 'forgotPassword',
  tags: ['User'],
  path: '/user/forgot-password',
  summary: 'Reset password using OTP',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ForgotPasswordRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ForgotPasswordResponseSchema
        }
      },
      description: 'Password updated successfully'
    },
    400: {
      content: {
        'application/json': {
          schema: ForgotPasswordErrorSchema
        }
      },
      description: 'Invalid or expired OTP'
    }
  }
});

const forgotPasswordHandler = () => {
  app.openapi(forgotPasswordRoute, async c => {
    const { email, code, newPassword } = c.req.valid('json');
    const user = await db.select().from(tables.user).where(eq(tables.user.email, email)).then(res => res.at(0));
    if (!user || !user.resetOtpHash || !user.resetOtpExpiry) {
      return c.json({ error: 'Invalid or expired OTP' }, 400);
    }
    const hash = await sha256(code);
    if (user.resetOtpHash !== hash || user.resetOtpExpiry < new Date()) {
      return c.json({ error: 'Invalid or expired OTP' }, 400);
    }
    const encryptedPassword = (await sha256(newPassword)) ?? '';
    if (!encryptedPassword) {
      return c.json({ error: 'Failed to encrypt password' }, 500);
    }
    await db.update(tables.user)
      .set({
        encryptedPassword,
        resetOtpHash: null,
        resetOtpExpiry: null
      })
      .where(eq(tables.user.email, email))
      .execute();
    return c.json({ message: 'Password updated successfully' }, 200);
  });
};



export { getUserInfoHandler, getUsersHandler, loginHandler, registerHandler, changePasswordHandler, sendOtpHandler, verifyOtpHandler, forgotPasswordHandler };
