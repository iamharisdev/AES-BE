import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { tables } from "@/models";
import { createRoute, z } from "@hono/zod-openapi";
import { eq, sql } from "drizzle-orm";

// 1. Schemas
const RedFlagsSchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  flag: z.string().nullable(),
  justification: z.string().nullable(),
  severity: z.string().nullable(),
  actionTaken: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const CreateRedFlagsSchema = z.object({
  emrId: z.string().uuid(),
  flag: z.string().nullable(),
  justification: z.string().nullable(),
  severity: z.string().nullable(),
  actionTaken: z.string().nullable(),
});

const ErrorSchema = z.object({ error: z.string() });

const SuccessResponseSchema = z.object({
  redFlags: z.array(
    z.object({
      emrId: z.string(),
      phone: z.string(),
      visit: z.number(),
      generationTime: z.string(),
      redFlags: z.array(z.any()),
      followupQuestions: z.array(z.any()),
    })
  ),
  majorRedFlags: z.array(
    z.object({
      flag: z.string(),
      count: z.number(),
      percentage: z.number(),
    })
  ),
  totalMajorFlags: z.number(),
});

const redflagRoute = createRoute({
  method: "get",
  operationId: "getMajorRedFlags",
  tags: ["Red Flags"],
  path: "/major-red-flags",
  summary: "Get all EMRs with red flags and identify major red flags",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
      description: "Red flags and major red flags retrieved successfully",
    },
  },
});

// 2. OpenAPI Routes
const createRedFlagsRoute = createRoute({
  method: "post",
  path: "/red-flags",
  tags: ["Red Flags"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateRedFlagsSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: RedFlagsSchema,
        },
      },
      description: "Red flag record created successfully",
    },
    409: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Red flag already exists",
    },
  },
});

const listRedFlagsRoute = createRoute({
  method: "get",
  path: "/red-flags",
  tags: ["Red Flags"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(RedFlagsSchema),
        },
      },
      description: "List of red flags",
    },
  },
});

const getRedFlagsByIdRoute = createRoute({
  method: "get",
  path: "/red-flags/:id",
  tags: ["Red Flags"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: RedFlagsSchema,
        },
      },
      description: "Red flag record details",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Red flag not found",
    },
  },
});

const updateRedFlagsRoute = createRoute({
  method: "put",
  path: "/red-flags/:id",
  tags: ["Red Flags"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: CreateRedFlagsSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: RedFlagsSchema,
        },
      },
      description: "Red flag updated successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Red flag not found",
    },
  },
});

const deleteRedFlagsRoute = createRoute({
  method: "delete",
  path: "/red-flags/:id",
  tags: ["Red Flags"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Red flag deleted successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Red flag not found",
    },
  },
});

// 3. Handlers
const createRedFlagsHandler = () => {
  app.openapi(createRedFlagsRoute, async (c) => {
    const details = c.req.valid("json");
    const [record] = await db
      .insert(tables.redFlags)
      .values(details)
      .returning();
    const { createdAt, updatedAt, ...rest } = record;
    return c.json(
      {
        ...rest,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      },
      201
    );
  });
};
const listRedFlagsHandler = () => {
  app.openapi(listRedFlagsRoute, async (c) => {
    const redFlags = await db.select().from(tables.redFlags).execute();
    const mapped = redFlags.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
    return c.json(mapped, 200);
  });
};

const getRedFlagsByIdHandler = () => {
  app.openapi(getRedFlagsByIdRoute, async (c) => {
    const { id } = c.req.valid("param");
    const record = await db
      .select()
      .from(tables.redFlags)
      .where(eq(tables.redFlags.id, id))
      .then((res) => res.at(0));
    if (!record) {
      return c.json({ error: "Red flag not found" }, 404);
    }
    const { createdAt, updatedAt, ...rest } = record;
    return c.json(
      {
        ...rest,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      },
      200
    );
  });
};

const updateRedFlagsHandler = () => {
  app.openapi(updateRedFlagsRoute, async (c) => {
    const { id } = c.req.valid("param");
    const details = c.req.valid("json");
    const record = await db
      .select()
      .from(tables.redFlags)
      .where(eq(tables.redFlags.id, id))
      .then((res) => res.at(0));
    if (!record) {
      return c.json({ error: "Red flag not found" }, 404);
    }
    const [updated] = await db
      .update(tables.redFlags)
      .set({ ...details, updatedAt: new Date() })
      .where(eq(tables.redFlags.id, id))
      .returning();
    const { createdAt, updatedAt, ...rest } = updated;
    return c.json(
      {
        ...rest,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      },
      200
    );
  });
};

const deleteRedFlagsHandler = () => {
  app.openapi(deleteRedFlagsRoute, async (c) => {
    const { id } = c.req.valid("param");
    const record = await db
      .select()
      .from(tables.redFlags)
      .where(eq(tables.redFlags.id, id))
      .then((res) => res.at(0));
    if (!record) {
      return c.json({ error: "Red flag not found" }, 404);
    }
    await db.delete(tables.redFlags).where(eq(tables.redFlags.id, id));
    return c.json({ message: "Red flag deleted successfully" }, 200);
  });
};

const getMajorRedFlags = () => {
  app.openapi(redflagRoute, async (c) => {
    // Get all EMRs with non-empty red flags
    const redFlags = await db.select().from(tables.redFlags).execute();
    const followUpQuestions = await db
      .select()
      .from(tables.followupQuestions)
      .execute();
    const followUpmapped = followUpQuestions.map((r) => ({
      ...r,
    }));

    // Get major red flags from SQL
    const rawMajorFlags = await db.execute(sql`
      WITH total_flags AS (
        SELECT COUNT(*) as total
        FROM red_flags
      )
      SELECT 
        flag,
        COUNT(*)::int AS count,
        ROUND((COUNT(*)::float / (SELECT total FROM total_flags) * 100)::numeric, 2) as percentage
      FROM red_flags
      GROUP BY flag
      HAVING COUNT(*) > 1
      ORDER BY count DESC;
    `);

    // // Add percentage field
    const majorRedFlags = rawMajorFlags.map((row) => ({
      flag: row.flag,
      count: row.count,
      percentage: Number(row.percentage),
    }));

    // Calculate total major flags
    const totalMajorFlags = majorRedFlags.reduce(
      (sum, flag) => sum + flag?.count,
      0
    );
    return c.json(
      {
        redFlags,
        majorRedFlags,
        totalMajorFlags,
        followupQuestions: followUpmapped?.length,
      },
      200
    );
  });
};

export {
  createRedFlagsHandler,
  listRedFlagsHandler,
  getRedFlagsByIdHandler,
  updateRedFlagsHandler,
  deleteRedFlagsHandler,
  getMajorRedFlags,
};
