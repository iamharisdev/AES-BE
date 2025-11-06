import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { proposedPlan } from "@/models/proposed-plan";
import { createdByEnum } from "@/schemas/enums";
import { createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

const ProposedPlanSchema = z.object({
  generalPlan: z.string().openapi({
    example: "Improve hemoglobin, maternal nutrition, avoid high-risk habits"
  }),
  medications: z
    .string()
    .openapi({ example: "Iron supplements, folic acid, calcium tablets" }),
  instructions: z.string().openapi({
    example: "Take medications with food, avoid alcohol and smoking"
  }),
  nextFollowUpTiming: z.string().openapi({ example: "2024-02-15" }),
  nextFollowUpPurpose: z
    .string()
    .openapi({ example: "Monitor hemoglobin levels and blood pressure" }),
  advisedLabTests: z
    .array(z.string())
    .openapi({ example: ["Urine test", "Blood test", "Glucose test"] }),
  createdBy: z.enum(createdByEnum).openapi({ example: "AI" })
});

// --- create-proposed-plan ---
const CreateProposedPlanRequestSchema = z.object({
  emrId: z.string().uuid(),
  ...ProposedPlanSchema.shape
});

const createProposedPlanRoute = createRoute({
  method: "post",
  operationId: "createProposedPlan",
  tags: ["Proposed Plan"],
  path: "/proposed-plan",
  summary: "Create a new proposed plan",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateProposedPlanRequestSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({
            id: z.string().uuid(),
            ...CreateProposedPlanRequestSchema.shape,
            createdAt: z.date(),
            updatedAt: z.date()
          })
        }
      },
      description: "Proposed plan created successfully"
    },
    500: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) }
      },
      description: "Internal server error"
    }
  }
});

const createProposedPlanHandler = () => {
  app.openapi(createProposedPlanRoute, async c => {
    const body = c.req.valid("json");

    try {
      const newProposedPlan = await db
        .insert(proposedPlan)
        .values({
          emrId: body.emrId,
          generalPlan: body.generalPlan,
          medications: body.medications,
          instructions: body.instructions,
          nextFollowUpTiming: body.nextFollowUpTiming,
          nextFollowUpPurpose: body.nextFollowUpPurpose,
          advisedLabTests: body.advisedLabTests,
          createdBy: body.createdBy
        })
        .returning();

      return c.json(newProposedPlan[0], 201);
    } catch (error) {
      return c.json({ error: "Failed to create proposed plan" }, 500);
    }
  });
};

// --- get-proposed-plans-by-emr ---
const getProposedPlansByEmrRoute = createRoute({
  method: "get",
  operationId: "getProposedPlansByEmr",
  tags: ["Proposed Plan"],
  path: "/proposed-plan/emr/{emrId}",
  summary: "Get all proposed plans for an EMR",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      emrId: z.string().uuid()
    })
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            plans: z.array(
              z.object({
                id: z.string().uuid(),
                emrId: z.string().uuid(),
                ...ProposedPlanSchema.shape,
                createdAt: z.date(),
                updatedAt: z.date()
              })
            )
          })
        }
      },
      description: "Proposed plans retrieved successfully"
    },
    500: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) }
      },
      description: "Internal server error"
    }
  }
});

const getProposedPlansByEmrHandler = () => {
  app.openapi(getProposedPlansByEmrRoute, async c => {
    const { emrId } = c.req.valid("param");

    try {
      const plans = await db
        .select()
        .from(proposedPlan)
        .where(eq(proposedPlan.emrId, emrId));
      return c.json({ plans });
    } catch (error) {
      return c.json({ error: "Failed to fetch proposed plans" }, 500);
    }
  });
};

// --- get-proposed-plan-by-id ---
const getProposedPlanByIdRoute = createRoute({
  method: "get",
  operationId: "getProposedPlanById",
  tags: ["Proposed Plan"],
  path: "/proposed-plan/{id}",
  summary: "Get a specific proposed plan by ID",
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
        "application/json": {
          schema: z.object({
            id: z.string().uuid(),
            emrId: z.string().uuid(),
            ...ProposedPlanSchema.shape,
            createdAt: z.date(),
            updatedAt: z.date()
          })
        }
      },
      description: "Proposed plan retrieved successfully"
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) }
      },
      description: "Proposed plan not found"
    },
    500: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) }
      },
      description: "Internal server error"
    }
  }
});

const getProposedPlanByIdHandler = () => {
  app.openapi(getProposedPlanByIdRoute, async c => {
    const { id } = c.req.valid("param");

    try {
      const plan = await db
        .select()
        .from(proposedPlan)
        .where(eq(proposedPlan.id, id));

      if (plan.length === 0) {
        return c.json({ error: "Proposed plan not found" }, 404);
      }

      return c.json(plan[0]);
    } catch (error) {
      return c.json({ error: "Failed to fetch proposed plan" }, 500);
    }
  });
};

// --- update-proposed-plan ---
const updateProposedPlanRoute = createRoute({
  method: "put",
  operationId: "updateProposedPlan",
  tags: ["Proposed Plan"],
  path: "/proposed-plan/{id}",
  summary: "Update a proposed plan",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid()
    }),
    body: {
      content: {
        "application/json": {
          schema: ProposedPlanSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            id: z.string().uuid(),
            emrId: z.string().uuid(),
            ...ProposedPlanSchema.shape,
            createdAt: z.date(),
            updatedAt: z.date()
          })
        }
      },
      description: "Proposed plan updated successfully"
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) }
      },
      description: "Proposed plan not found"
    },
    500: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) }
      },
      description: "Internal server error"
    }
  }
});

const updateProposedPlanHandler = () => {
  app.openapi(updateProposedPlanRoute, async c => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    try {
      const updatedPlan = await db
        .update(proposedPlan)
        .set({
          generalPlan: body.generalPlan,
          medications: body.medications,
          instructions: body.instructions,
          nextFollowUpTiming: body.nextFollowUpTiming,
          nextFollowUpPurpose: body.nextFollowUpPurpose,
          advisedLabTests: body.advisedLabTests,
          createdBy: body.createdBy,
          updatedAt: new Date()
        })
        .where(eq(proposedPlan.id, id))
        .returning();

      if (updatedPlan.length === 0) {
        return c.json({ error: "Proposed plan not found" }, 404);
      }

      return c.json(updatedPlan[0]);
    } catch (error) {
      return c.json({ error: "Failed to update proposed plan" }, 500);
    }
  });
};

// --- delete-proposed-plan ---
const deleteProposedPlanRoute = createRoute({
  method: "delete",
  operationId: "deleteProposedPlan",
  tags: ["Proposed Plan"],
  path: "/proposed-plan/{id}",
  summary: "Delete a proposed plan",
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
        "application/json": { schema: z.object({ message: z.string() }) }
      },
      description: "Proposed plan deleted successfully"
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) }
      },
      description: "Proposed plan not found"
    },
    500: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) }
      },
      description: "Internal server error"
    }
  }
});

const deleteProposedPlanHandler = () => {
  app.openapi(deleteProposedPlanRoute, async c => {
    const { id } = c.req.valid("param");

    try {
      const deletedPlan = await db
        .delete(proposedPlan)
        .where(eq(proposedPlan.id, id))
        .returning();

      if (deletedPlan.length === 0) {
        return c.json({ error: "Proposed plan not found" }, 404);
      }

      return c.json({ message: "Proposed plan deleted successfully" });
    } catch (error) {
      return c.json({ error: "Failed to delete proposed plan" }, 500);
    }
  });
};

export {
  createProposedPlanHandler,
  getProposedPlansByEmrHandler,
  getProposedPlanByIdHandler,
  updateProposedPlanHandler,
  deleteProposedPlanHandler
};
