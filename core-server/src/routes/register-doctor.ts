import app from '@/app'
import { createRoute, z } from '@hono/zod-openapi'
import { sign } from 'hono/jwt'
import { sha256 } from 'hono/utils/crypto'
import { db } from '@/db'
import { schema } from '@/models'
import { eq } from 'drizzle-orm'

const RequestBodySchema = z
    .object({
        name: z.string().openapi({
            example: 'Nazia',
        }),
        phoneNumber: z.string().openapi({
            example: '03001234567',
        }),
        password: z.string().openapi({
            example: 'xxxxxxxxx',
        }),
        maternityHomeName: z.string().openapi({
            example: 'Zacha Bacha',
        }),
    })
    // This would create the object
    .openapi('ExampleBody')

const SuccessResponseSchema = z.object({
    message: z.string().openapi({
        example: 'Record Created',
    }),
    token: z.string().describe('JWT Token for Authentication'),
})

const ConflictSchema = z.object({
    error: z.string().openapi({
        example: 'Doctor with the ID is already Created',
    }),
})

const route = createRoute({
    method: 'post',
    operationId: 'registerDoctor',
    tags: ['Auth'],
    path: '/doctor/register',
    summary: 'Register the Health Practitioner in the system',
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
            description: 'Register The User',
        },
        409: {
            content: {
                'application/json': {
                    schema: ConflictSchema,
                },
            },
            description: 'User Already Exists',
        },
    },
})

const handler = app.openapi(route, async (c) => {
    const details = c.req.valid('json')

    // check if the user exists in the database
    const user = await db
        .select()
        .from(schema.doctor)
        .where(eq(schema.doctor.phone, details.phoneNumber))
        .then((user) => user.at(0))

    if (user) {
        return c.json(
            {
                error: `Record With Phone Number ${details.phoneNumber} already exists`,
            },
            409
        )
    }

    await db.insert(schema.doctor).values({
        name: details.name,
        phone: details.phoneNumber,
        encryptedPassword: (await sha256(details.password)) ?? '',
        maternityHomeName: details.maternityHomeName,
    })

    const token = await sign({ phone: details.phoneNumber }, process.env.JWT_SECRET!, 'HS256')

    return c.json(
        {
            message: 'Account Created',
            token,
        },
        200
    )
})

export type RegisterDoctorRoute = typeof handler

export default route
