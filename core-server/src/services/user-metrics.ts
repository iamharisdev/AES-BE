/**
 * User Metrics Service - Main Orchestrator
 * 
 * This file orchestrates all metric calculations by calling:
 * - session-grouping.ts: Groups messages into logical sessions
 * - session-metrics.ts: Calculates session-level metrics
 * - user-level-metrics.ts: Calculates user-level metrics
 * - engagement-metrics.ts: Calculates engagement & retention metrics
 */

import { db } from '@/db';
import { patientChats } from '@/models/patient-chats';
import { patient } from '@/models/patient';
import { gte } from 'drizzle-orm';
import { groupIntoSessions } from './metrics/session-grouping';
import { calculateSessionMetrics, LogicalSession } from './metrics/session-metrics';
import { calculateUserMetrics } from './metrics/user-level-metrics';
import { calculateEngagementMetrics } from './metrics/engagement-metrics';

const START_DATE = new Date('2025-10-01T00:00:00Z');

/**
 * Main function to calculate all user metrics
 */
export async function calculateUserMetricsData(startDate?: Date): Promise<{
  engagementBreakdown: {
    engagedUsers: number;
    assistantOnly: number;
    totalPatients: number;
  };
  sessionMetrics: Awaited<ReturnType<typeof calculateSessionMetrics>>;
  userMetrics: ReturnType<typeof calculateUserMetrics>;
  engagementMetrics: ReturnType<typeof calculateEngagementMetrics>;
  generatedAt: string;
}> {
  const filterDate = startDate || START_DATE;

  // Get all patient chats from start date
  const allChats = await db
    .select()
    .from(patientChats)
    .where(gte(patientChats.sessionStarted, filterDate))
    .execute();

  // Get all patients from start date
  const allPatients = await db
    .select()
    .from(patient)
    .where(gte(patient.createdAt, filterDate))
    .execute();

  // Group into logical sessions (session-grouping.ts)
  const sessions = groupIntoSessions(allChats);

  // Filter sessions to only include those with user messages
  const sessionsWithUserMessages = sessions.filter(s => s.userMessages.length > 0);

  // Engagement breakdown
  const engagedPatientIds = new Set(sessionsWithUserMessages.map(s => s.patientId));
  const engagedUsers = engagedPatientIds.size;

  // Patients with messages but no user messages (assistant-only)
  const allPatientIdsWithMessages = new Set(allChats.map(c => c.patientId));
  const assistantOnly = allPatientIdsWithMessages.size - engagedUsers;

  // Calculate metrics using separate files
  // session-metrics.ts
  const sessionMetrics = await calculateSessionMetrics(sessionsWithUserMessages);
  
  // user-level-metrics.ts
  const userMetrics = calculateUserMetrics(sessionsWithUserMessages);
  
  // engagement-metrics.ts
  const engagementMetrics = calculateEngagementMetrics(sessionsWithUserMessages, filterDate);

  return {
    engagementBreakdown: {
      engagedUsers,
      assistantOnly,
      totalPatients: allPatients.length,
    },
    sessionMetrics,
    userMetrics,
    engagementMetrics,
    generatedAt: new Date().toISOString(),
  };
}
