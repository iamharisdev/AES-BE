import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { table } from "@/models";
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
  path: "/emr/redflags",
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
    const records = await db
      .select({
        emrId: table.emr.emrId,
        phone: table.emr.phone,
        visit: table.emr.visit,
        generationTime: table.emr.generationTime,
        redFlags: table.emr.redFlags,
        followupQuestions: table.emr.followups,
      })
      .from(table.emr)
      .where(
        sql`
          jsonb_typeof(${table.emr.redFlags}) = 'array' AND
          jsonb_array_length(${table.emr.redFlags}) > 0
        `
      )
      .execute();

    // Get major red flags from SQL
    const rawMajorFlags = await db.execute(sql`
      WITH total_emrs AS (
        SELECT COUNT(*) as total
        FROM ${table.emr}
        WHERE 
          jsonb_typeof(${table.emr.redFlags}) = 'array'
          AND COALESCE(jsonb_array_length(${table.emr.redFlags}), 0) > 0
      )
      SELECT 
        redflag->>'flag' AS flag,
        COUNT(*)::int AS count,
        ROUND((COUNT(*)::float / (SELECT total FROM total_emrs) * 100)::numeric, 2) as percentage
      FROM (
        SELECT 
          jsonb_array_elements(${table.emr.redFlags}) AS redflag
        FROM ${table.emr}
        WHERE 
          jsonb_typeof(${table.emr.redFlags}) = 'array'
          AND COALESCE(jsonb_array_length(${table.emr.redFlags}), 0) > 0
      ) AS redflag_table
      GROUP BY redflag->>'flag'
      HAVING COUNT(*) > 1
      ORDER BY count DESC;
    `);

    // Add percentage field
    const majorRedFlags = rawMajorFlags.map((row) => ({
      flag: row.flag,
      count: row.count,
      percentage: Number(row.percentage),
    }));

    // Calculate total major flags
    const totalMajorFlags = majorRedFlags.reduce(
      (sum, flag) => sum + flag.count,
      0
    );
    return c.json(
      {
        redFlags: records,
        majorRedFlags,
        totalMajorFlags,
      },
      200
    );
  });
};
