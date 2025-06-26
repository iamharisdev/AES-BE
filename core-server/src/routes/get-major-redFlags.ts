import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { tables } from "@/models";

import { createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";

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

const route = createRoute({
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

export const getMajorRedFlags = () => {
  app.openapi(route, async (c) => {
    // Get all EMRs with non-empty red flags
    const redFlags = await db.select().from(tables.redFlags).execute();
    const followUpQuestions = await db
      .select()
      .from(tables.followupQuestions)
      .execute();

    const mapped = redFlags.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
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
