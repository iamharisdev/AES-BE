/**
 * User-Level Metrics Calculator
 * 
 * Calculates metrics per unique user:
 * - Total sessions per user
 * - Average session duration per user
 * - Average messages per session per user
 * - Re-engagement metrics
 */

import { LogicalSession } from './session-metrics';

export interface UserMetrics {
  totalUsers: number;
  avgSessionsPerUser: number;
  usersBySessionCount: {
    one: number;
    two: number;
    threePlus: number;
  };
  avgSessionDurationPerUser: number;
  avgMessagesPerSessionPerUser: number;
  reengagedUsers: number;
  avgReengagementCount: number;
  avgReengagementInterval: number;
}

/**
 * Calculate user-level metrics
 */
export function calculateUserMetrics(sessions: LogicalSession[]): UserMetrics {
  if (sessions.length === 0) {
    return {
      totalUsers: 0,
      avgSessionsPerUser: 0,
      usersBySessionCount: { one: 0, two: 0, threePlus: 0 },
      avgSessionDurationPerUser: 0,
      avgMessagesPerSessionPerUser: 0,
      reengagedUsers: 0,
      avgReengagementCount: 0,
      avgReengagementInterval: 0,
    };
  }

  // Group sessions by user
  const sessionsByUser = new Map<string, LogicalSession[]>();
  for (const session of sessions) {
    if (!sessionsByUser.has(session.patientId)) {
      sessionsByUser.set(session.patientId, []);
    }
    sessionsByUser.get(session.patientId)!.push(session);
  }

  const totalUsers = sessionsByUser.size;
  const avgSessionsPerUser = sessions.length / totalUsers;

  // Users by session count
  let oneSession = 0;
  let twoSessions = 0;
  let threePlusSessions = 0;

  // Average session duration per user
  const userAvgDurations: number[] = [];
  const userAvgMessages: number[] = [];

  // Re-engagement metrics
  const reengagedUsers: string[] = [];
  const reengagementCounts: number[] = [];
  const reengagementIntervals: number[] = [];

  for (const [userId, userSessions] of sessionsByUser) {
    const sessionCount = userSessions.length;
    if (sessionCount === 1) oneSession++;
    else if (sessionCount === 2) twoSessions++;
    else threePlusSessions++;

    // Average duration for this user
    const avgDuration = 
      userSessions.reduce((sum, s) => sum + s.duration, 0) / sessionCount;
    userAvgDurations.push(avgDuration);

    // Average messages for this user
    const avgMessages = 
      userSessions.reduce((sum, s) => sum + s.userMessages.length, 0) / sessionCount;
    userAvgMessages.push(avgMessages);

    // Re-engagement
    if (sessionCount > 1) {
      reengagedUsers.push(userId);
      reengagementCounts.push(sessionCount - 1); // additional sessions

      // Calculate intervals between sessions
      const sortedSessions = [...userSessions].sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      );

      for (let i = 1; i < sortedSessions.length; i++) {
        const prevEnd = sortedSessions[i - 1].endTime.getTime();
        const currStart = sortedSessions[i].startTime.getTime();
        const days = (currStart - prevEnd) / (1000 * 60 * 60 * 24);
        reengagementIntervals.push(days);
      }
    }
  }

  const avgSessionDurationPerUser = 
    userAvgDurations.reduce((a, b) => a + b, 0) / userAvgDurations.length;

  const avgMessagesPerSessionPerUser = 
    userAvgMessages.reduce((a, b) => a + b, 0) / userAvgMessages.length;

  const avgReengagementCount = 
    reengagementCounts.length > 0
      ? reengagementCounts.reduce((a, b) => a + b, 0) / reengagementCounts.length
      : 0;

  const avgReengagementInterval = 
    reengagementIntervals.length > 0
      ? reengagementIntervals.reduce((a, b) => a + b, 0) / reengagementIntervals.length
      : 0;

  return {
    totalUsers,
    avgSessionsPerUser,
    usersBySessionCount: {
      one: oneSession,
      two: twoSessions,
      threePlus: threePlusSessions,
    },
    avgSessionDurationPerUser,
    avgMessagesPerSessionPerUser,
    reengagedUsers: reengagedUsers.length,
    avgReengagementCount,
    avgReengagementInterval,
  };
}
