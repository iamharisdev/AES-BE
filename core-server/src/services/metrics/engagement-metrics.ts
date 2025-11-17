/**
 * Engagement & Retention Metrics Calculator
 * 
 * Calculates engagement and retention metrics:
 * - Retention rate (Day 1, 7, 30)
 * - Churn rate
 * - Reactivation rate
 * - Session frequency distribution
 * - Average engagement time
 * - Stickiness (DAU/MAU)
 */

import { LogicalSession } from './session-metrics';

export interface EngagementMetrics {
  retentionRate: {
    day1: number;
    day7: number;
    day30: number;
  };
  churnRate: number;
  churnedUsers: number;
  reactivationRate: number;
  reactivatedUsers: number;
  sessionFrequencyDistribution: {
    one: number;
    two: number;
    threePlus: number;
  };
  avgEngagementTime: {
    perWeek: number;
    perMonth: number;
  };
  stickiness: {
    dau: number;
    mau: number;
    ratio: number;
  };
}

/**
 * Calculate engagement & retention metrics
 */
export function calculateEngagementMetrics(
  sessions: LogicalSession[],
  startDate: Date
): EngagementMetrics {
  if (sessions.length === 0) {
    return {
      retentionRate: { day1: 0, day7: 0, day30: 0 },
      churnRate: 0,
      churnedUsers: 0,
      reactivationRate: 0,
      reactivatedUsers: 0,
      sessionFrequencyDistribution: { one: 0, two: 0, threePlus: 0 },
      avgEngagementTime: { perWeek: 0, perMonth: 0 },
      stickiness: { dau: 0, mau: 0, ratio: 0 },
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

  // First session per user
  const firstSessions = new Map<string, LogicalSession>();
  for (const [userId, userSessions] of sessionsByUser) {
    const sorted = [...userSessions].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
    firstSessions.set(userId, sorted[0]);
  }

  // Retention rate (users who returned within N days)
  let returnedDay1 = 0;
  let returnedDay7 = 0;
  let returnedDay30 = 0;

  for (const [userId, userSessions] of sessionsByUser) {
    if (userSessions.length < 2) continue;

    const firstSession = firstSessions.get(userId)!;
    const sorted = [...userSessions].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    for (let i = 1; i < sorted.length; i++) {
      const daysSinceFirst = 
        (sorted[i].startTime.getTime() - firstSession.startTime.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceFirst <= 1) returnedDay1++;
      if (daysSinceFirst <= 7) returnedDay7++;
      if (daysSinceFirst <= 30) returnedDay30++;
    }
  }

  const totalUsersWithMultipleSessions = Array.from(sessionsByUser.values())
    .filter(sessions => sessions.length > 1).length;

  const retentionDay1 = totalUsersWithMultipleSessions > 0 
    ? (returnedDay1 / totalUsersWithMultipleSessions) * 100 : 0;
  const retentionDay7 = totalUsersWithMultipleSessions > 0
    ? (returnedDay7 / totalUsersWithMultipleSessions) * 100 : 0;
  const retentionDay30 = totalUsersWithMultipleSessions > 0
    ? (returnedDay30 / totalUsersWithMultipleSessions) * 100 : 0;

  // Churn rate (users with no sessions in last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let churnedUsers = 0;
  for (const [userId, userSessions] of sessionsByUser) {
    const lastSession = [...userSessions].sort(
      (a, b) => b.endTime.getTime() - a.endTime.getTime()
    )[0];

    if (lastSession.endTime < thirtyDaysAgo) {
      churnedUsers++;
    }
  }

  const churnRate = (churnedUsers / sessionsByUser.size) * 100;

  // Reactivation rate (returned after ≥14-day inactivity)
  let reactivatedUsers = 0;
  let inactiveUsers = 0;

  for (const [userId, userSessions] of sessionsByUser) {
    if (userSessions.length < 2) continue;

    const sorted = [...userSessions].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    for (let i = 1; i < sorted.length; i++) {
      const gapDays = 
        (sorted[i].startTime.getTime() - sorted[i - 1].endTime.getTime()) / (1000 * 60 * 60 * 24);

      if (gapDays >= 14) {
        inactiveUsers++;
        reactivatedUsers++;
        break; // Count once per user
      }
    }
  }

  const reactivationRate = inactiveUsers > 0 ? (reactivatedUsers / inactiveUsers) * 100 : 0;

  // Session frequency distribution
  let oneSession = 0;
  let twoSessions = 0;
  let threePlusSessions = 0;

  for (const userSessions of sessionsByUser.values()) {
    const count = userSessions.length;
    if (count === 1) oneSession++;
    else if (count === 2) twoSessions++;
    else threePlusSessions++;
  }

  // Average engagement time
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  const earliestFirstSession = Math.min(
    ...Array.from(firstSessions.values()).map(s => s.startTime.getTime())
  );
  const weeksSinceStart = (now.getTime() - earliestFirstSession) / (1000 * 60 * 60 * 24 * 7);
  const monthsSinceStart = (now.getTime() - earliestFirstSession) / (1000 * 60 * 60 * 24 * 30);

  const perWeek = weeksSinceStart > 0 ? totalMinutes / weeksSinceStart : 0;
  const perMonth = monthsSinceStart > 0 ? totalMinutes / monthsSinceStart : 0;

  // Stickiness (DAU/MAU)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgoDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const dau = new Set(
    sessions
      .filter(s => {
        const sessionDate = new Date(s.startTime.getFullYear(), s.startTime.getMonth(), s.startTime.getDate());
        return sessionDate.getTime() === today.getTime();
      })
      .map(s => s.patientId)
  ).size;

  const mau = new Set(
    sessions
      .filter(s => s.startTime >= thirtyDaysAgoDate)
      .map(s => s.patientId)
  ).size;

  const stickinessRatio = mau > 0 ? (dau / mau) * 100 : 0;

  return {
    retentionRate: {
      day1: retentionDay1,
      day7: retentionDay7,
      day30: retentionDay30,
    },
    churnRate,
    churnedUsers,
    reactivationRate,
    reactivatedUsers,
    sessionFrequencyDistribution: {
      one: oneSession,
      two: twoSessions,
      threePlus: threePlusSessions,
    },
    avgEngagementTime: {
      perWeek,
      perMonth,
    },
    stickiness: {
      dau,
      mau,
      ratio: stickinessRatio,
    },
  };
}
