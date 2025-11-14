import app from '@/app';
import { jwtMiddleware } from '@/middleware/jwt';
import { requireHealthWorker } from '@/middleware/role';
import { calculateUserMetricsData } from '@/services/user-metrics';
import { createRoute, z } from '@hono/zod-openapi';

// Response schemas
const EngagementBreakdownSchema = z.object({
  engagedUsers: z.number(),
  assistantOnly: z.number(),
  totalPatients: z.number(),
});

const SessionMetricsSchema = z.object({
  sessionDuration: z.number(),
  messagesPerSession: z.number(),
  messageLength: z.number(),
  userResponseTime: z.number(),
  systemResponseTime: z.number(),
  completionRate: z.number(),
  sampleSessions: z.array(
    z.object({
      start: z.string(),
      end: z.string(),
      duration: z.number(),
    })
  ),
});

const UserMetricsSchema = z.object({
  totalUsers: z.number(),
  avgSessionsPerUser: z.number(),
  usersBySessionCount: z.object({
    one: z.number(),
    two: z.number(),
    threePlus: z.number(),
  }),
  avgSessionDurationPerUser: z.number(),
  avgMessagesPerSessionPerUser: z.number(),
  reengagedUsers: z.number(),
  avgReengagementCount: z.number(),
  avgReengagementInterval: z.number(),
});

const EngagementMetricsSchema = z.object({
  retentionRate: z.object({
    day1: z.number(),
    day7: z.number(),
    day30: z.number(),
  }),
  churnRate: z.number(),
  churnedUsers: z.number(),
  reactivationRate: z.number(),
  reactivatedUsers: z.number(),
  sessionFrequencyDistribution: z.object({
    one: z.number(),
    two: z.number(),
    threePlus: z.number(),
  }),
  avgEngagementTime: z.object({
    perWeek: z.number(),
    perMonth: z.number(),
  }),
  stickiness: z.object({
    dau: z.number(),
    mau: z.number(),
    ratio: z.number(),
  }),
});

const UserMetricsResponseSchema = z.object({
  engagementBreakdown: EngagementBreakdownSchema,
  sessionMetrics: SessionMetricsSchema,
  userMetrics: UserMetricsSchema,
  engagementMetrics: EngagementMetricsSchema,
  generatedAt: z.string(),
});

const ErrorSchema = z.object({
  error: z.string(),
});

// OpenAPI Route
const getUserMetricsRoute = createRoute({
  method: 'get',
  operationId: 'getUserMetrics',
  tags: ['User Metrics'],
  path: '/user-metrics',
  summary: 'Get comprehensive user metrics and analytics',
  description: 'Returns session-level, user-level, and engagement metrics for patients from the start date onwards',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware, requireHealthWorker],
  request: {
    query: z.object({
      startDate: z.string().datetime().optional().describe('Start date filter (ISO 8601). Defaults to 2025-10-01'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserMetricsResponseSchema,
        },
      },
      description: 'User metrics retrieved successfully',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Internal server error',
    },
  },
});

export const getUserMetricsHandler = () => {
  app.openapi(getUserMetricsRoute, async (c) => {
    try {
      const { startDate } = c.req.valid('query');

      const startDateObj = startDate ? new Date(startDate) : undefined;

      const metrics = await calculateUserMetricsData(startDateObj);

      return c.json(metrics, 200);
    } catch (error) {
      console.error('Error calculating user metrics:', error);
      return c.json(
        { error: 'Failed to calculate user metrics' },
        500
      );
    }
  });
};
