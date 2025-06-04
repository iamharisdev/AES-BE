import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { table } from "@/models";
import { createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

// Define the request body schema
const ProposedPlanSchema = z.object({
  emrId: z.string().uuid(),
  followupDate: z.string().datetime(),
  doctorNotes: z.string(),
  additionalNotes: z.string().optional(),
  advisedLabTests: z.array(z.string()).default([]),
});

const route = createRoute({
  method: "post",
  operationId: "postProposedPlan",
  tags: ["Proposed Plan"],
  path: "/emr/proposed-plan",
  summary: "Add proposed plan for an EMR",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ProposedPlanSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
      description: "Proposed plan updated successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "EMR not found",
    },
  },
});

export const postProposedPlan = () => {
  app.openapi(route, async (c) => {
    try {
      const {
        emrId,
        followupDate,
        doctorNotes,
        additionalNotes,
        advisedLabTests,
      } = await c.req.json();

      // Check if EMR exists
      const emr = await db
        .select()
        .from(table.emr)
        .where(eq(table.emr.emrId, emrId))
        .execute();

      if (!emr || emr.length === 0) {
        return c.json({ error: "EMR not found" }, 404);
      }

      // Insert the proposed plan
      await db
        .insert(table.proposedPlan)
        .values({
          emrId,
          followupDate: new Date(followupDate),
          doctorNotes,
          additionalNotes,
          advisedLabTests,
        })
        .execute();

      return c.json(
        {
          success: true,
          message: "Proposed plan added successfully",
        },
        200
      );
    } catch (error) {
      console.error("Error adding proposed plan:", error);
      return c.json(
        {
          error: "Failed to add proposed plan",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  });
};
