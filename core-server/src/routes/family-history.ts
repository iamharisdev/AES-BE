import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { tables } from "@/models";
import { createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

// Schema for family history
const FamilyHistorySchema = z.object({
  id: z.string().uuid(),
  emrId: z.string().uuid(),
  familyMedicalConditions: z.string().nullable(),
  //  twinsFamilyHistory: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Create schema
const CreateFamilyHistorySchema = z.object({
  emrId: z.string().uuid(),
  familyMedicalConditions: z.string().nullable(),
  // twinsFamilyHistory: z.string().nullable()
});

// Update schema
const UpdateFamilyHistorySchema = CreateFamilyHistorySchema.partial();

// Create route
const createFamilyHistoryRoute = createRoute({
  method: "post",
  path: "/family-history",
  tags: ["Family History"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateFamilyHistorySchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: FamilyHistorySchema,
        },
      },
      description: "Family history record created successfully",
    },
  },
});

// Get route
const getFamilyHistoryRoute = createRoute({
  method: "get",
  path: "/family-history/:id",
  tags: ["Family History"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FamilyHistorySchema,
        },
      },
      description: "Family history record retrieved successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Family history record not found",
    },
  },
});

// Update route
const updateFamilyHistoryRoute = createRoute({
  method: "put",
  path: "/family-history/:id",
  tags: ["Family History"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateFamilyHistorySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FamilyHistorySchema,
        },
      },
      description: "Family history record updated successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Family history record not found",
    },
  },
});

// Delete route
const deleteFamilyHistoryRoute = createRoute({
  method: "delete",
  path: "/family-history/:id",
  tags: ["Family History"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    204: {
      description: "Family history record deleted successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Family history record not found",
    },
  },
});

const createFamilyHistoryHandler = () => {
  app.openapi(createFamilyHistoryRoute, async (c) => {
    const data = c.req.valid("json");
    const [record] = await db
      .insert(tables.familyHistory)
      .values(data)
      .returning();
    return c.json(record, 201);
  });
};

const getFamilyHistoryHandler = () => {
  app.openapi(getFamilyHistoryRoute, async (c) => {
    const { id } = c.req.valid("param");
    const [record] = await db
      .select()
      .from(tables.familyHistory)
      .where(eq(tables.familyHistory.id, id))
      .execute();

    if (!record) {
      return c.json({ error: "Family history record not found" }, 404);
    }

    return c.json(record);
  });
};

const updateFamilyHistoryHandler = () => {
  app.openapi(updateFamilyHistoryRoute, async (c) => {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");

    const [record] = await db
      .update(tables.familyHistory)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tables.familyHistory.id, id))
      .returning();

    if (!record) {
      return c.json({ error: "Family history record not found" }, 404);
    }

    return c.json(record);
  });
};

const deleteFamilyHistoryHandler = () => {
  app.openapi(deleteFamilyHistoryRoute, async (c) => {
    const { id } = c.req.valid("param");
    const [record] = await db
      .delete(tables.familyHistory)
      .where(eq(tables.familyHistory.id, id))
      .returning();

    if (!record) {
      return c.json({ error: "Family history record not found" }, 404);
    }

    return c.body(null, 204);
  });
};

export {
  createFamilyHistoryHandler,
  getFamilyHistoryHandler,
  updateFamilyHistoryHandler,
  deleteFamilyHistoryHandler,
};
