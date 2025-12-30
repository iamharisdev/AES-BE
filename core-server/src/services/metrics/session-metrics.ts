/**
 * Session-Level Metrics Calculator
 * 
 * Calculates metrics per conversation/session:
 * - Session duration (first user msg to last user msg)
 * - Number of messages exchanged
 * - Time between messages
 * - Completion rate
 */

import { db } from '@/db';
import { patient } from '@/models/patient';
import { qrCode } from '@/models/qr-code';
import { emr } from '@/models/emr';
import { emrSectionProgress } from '@/models/section-progress';
import { eq, inArray } from 'drizzle-orm';

export interface Message {
  sender: string;
  message: string;
  timestamp: string;
}

export interface LogicalSession {
  patientId: string;
  startTime: Date;
  endTime: Date;
  userMessages: Message[];
  assistantMessages: Message[];
  duration: number; // minutes
}

export interface SessionMetrics {
  sessionDuration: number;
  messagesPerSession: number;
  messageLength: number;
  userResponseTime: number;
  systemResponseTime: number;
  completionRate: number;
  sampleSessions: Array<{
    start: string;
    end: string;
    duration: number;
  }>;
}

/**
 * Calculate session-level metrics
 */
export async function calculateSessionMetrics(
  sessions: LogicalSession[]
): Promise<SessionMetrics> {
  if (sessions.length === 0) {
    return {
      sessionDuration: 0,
      messagesPerSession: 0,
      messageLength: 0,
      userResponseTime: 0,
      systemResponseTime: 0,
      completionRate: 0,
      sampleSessions: [],
    };
  }

  // Session duration (first user msg to last user msg)
  const durations = sessions.map(s => s.duration);
  const avgSessionDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

  // Messages per session (user messages only)
  const messagesPerSession = sessions.map(s => s.userMessages.length);
  const avgMessagesPerSession = 
    messagesPerSession.reduce((a, b) => a + b, 0) / messagesPerSession.length;

  // Message length
  let totalChars = 0;
  let totalUserMessages = 0;
  for (const session of sessions) {
    for (const msg of session.userMessages) {
      totalChars += msg.message.length;
      totalUserMessages++;
    }
  }
  const avgMessageLength = totalUserMessages > 0 ? totalChars / totalUserMessages : 0;

  // User response time (between consecutive user messages)
  const userResponseTimes: number[] = [];
  for (const session of sessions) {
    for (let i = 1; i < session.userMessages.length; i++) {
      const prevTime = new Date(session.userMessages[i - 1].timestamp).getTime();
      const currTime = new Date(session.userMessages[i].timestamp).getTime();
      const minutes = (currTime - prevTime) / (1000 * 60);
      userResponseTimes.push(minutes);
    }
  }
  const avgUserResponseTime = 
    userResponseTimes.length > 0 
      ? userResponseTimes.reduce((a, b) => a + b, 0) / userResponseTimes.length 
      : 0;

  // System response time (assistant reply delay after user message)
  const systemResponseTimes: number[] = [];
  for (const session of sessions) {
    const allMessages = [
      ...session.userMessages.map(m => ({ ...m, type: 'user' as const })),
      ...session.assistantMessages.map(m => ({ ...m, type: 'assistant' as const })),
    ].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 0; i < allMessages.length - 1; i++) {
      if (allMessages[i].type === 'user' && allMessages[i + 1].type === 'assistant') {
        const userTime = new Date(allMessages[i].timestamp).getTime();
        const assistantTime = new Date(allMessages[i + 1].timestamp).getTime();
        const minutes = (assistantTime - userTime) / (1000 * 60);
        systemResponseTimes.push(minutes);
      }
    }
  }
  const avgSystemResponseTime = 
    systemResponseTimes.length > 0
      ? systemResponseTimes.reduce((a, b) => a + b, 0) / systemResponseTimes.length
      : 0;

  // Completion rate - batch patient lookups for efficiency
  const uniquePatientIds = [...new Set(sessions.map(s => s.patientId))];
  
  // Build patient ID mapping (text -> UUID)
  const patientIdMap = new Map<string, string>();
  for (const pid of uniquePatientIds) {
    try {
      const patientsById = await db
        .select()
        .from(patient)
        .where(eq(patient.id, pid))
        .limit(1);
      
      if (patientsById.length > 0) {
        patientIdMap.set(pid, patientsById[0].id);
        continue;
      }
    } catch {
      // Not a valid UUID
    }

    // Try phone number match
    const patientsByPhone = await db
      .select()
      .from(patient)
      .where(eq(patient.phoneNumber, pid))
      .limit(1);
    
    if (patientsByPhone.length > 0) {
      patientIdMap.set(pid, patientsByPhone[0].id);
    }
  }

  // Batch fetch QR codes for all patients
  const patientUuids = Array.from(patientIdMap.values());
  const allQRCodes = patientUuids.length > 0
    ? await db
        .select()
        .from(qrCode)
        .where(inArray(qrCode.patientId, patientUuids))
        .execute()
    : [];

  const qrCodeByPatientId = new Map<string, Date>();
  for (const qr of allQRCodes) {
    qrCodeByPatientId.set(qr.patientId, new Date(qr.createdAt));
  }

  // Batch fetch EMRs
  const allEmrs = patientUuids.length > 0
    ? await db
        .select()
        .from(emr)
        .where(inArray(emr.patientId, patientUuids))
        .execute()
    : [];

  const emrsByPatientId = new Map<string, typeof allEmrs>();
  for (const emrRecord of allEmrs) {
    if (!emrsByPatientId.has(emrRecord.patientId)) {
      emrsByPatientId.set(emrRecord.patientId, []);
    }
    emrsByPatientId.get(emrRecord.patientId)!.push(emrRecord);
  }

  // Batch fetch section progress for all EMRs
  const emrIds = allEmrs.map(e => e.id);
  const allSections = emrIds.length > 0
    ? await db
        .select()
        .from(emrSectionProgress)
        .where(inArray(emrSectionProgress.emrId, emrIds))
        .execute()
    : [];

  const sectionsByEmrId = new Map<string, typeof allSections>();
  for (const section of allSections) {
    if (!sectionsByEmrId.has(section.emrId)) {
      sectionsByEmrId.set(section.emrId, []);
    }
    sectionsByEmrId.get(section.emrId)!.push(section);
  }

  // Check completion for each session
  let completedSessions = 0;
  for (const session of sessions) {
    const patientUuid = patientIdMap.get(session.patientId);
    if (!patientUuid) continue;

    // Check QR code
    const qrCreatedAt = qrCodeByPatientId.get(patientUuid);
    if (qrCreatedAt && qrCreatedAt <= session.endTime) {
      completedSessions++;
      continue;
    }

    // Check EMR completion
    const patientEmrs = emrsByPatientId.get(patientUuid) || [];
    for (const patientEmr of patientEmrs) {
      const sections = sectionsByEmrId.get(patientEmr.id) || [];
      if (sections.length === 0) continue;

      let totalQuestions = 0;
      let answeredQuestions = 0;

      for (const section of sections) {
        const answered = (section.answeredIds as string[] || []).length;
        const skipped = (section.skippedIds as string[] || []).length;
        totalQuestions += answered + skipped;
        answeredQuestions += answered;
      }

      if (totalQuestions > 0) {
        const completionPercentage = (answeredQuestions / totalQuestions) * 100;
        if (completionPercentage >= 90) {
          completedSessions++;
          break; // Found completion, move to next session
        }
      }
    }
  }
  const completionRate = sessions.length > 0 ? (completedSessions / sessions.length) * 100 : 0;

  // Sample sessions (first 3)
  const sampleSessions = sessions.slice(0, 3).map(s => ({
    start: s.startTime.toISOString(),
    end: s.endTime.toISOString(),
    duration: s.duration,
  }));

  return {
    sessionDuration: avgSessionDuration,
    messagesPerSession: avgMessagesPerSession,
    messageLength: avgMessageLength,
    userResponseTime: avgUserResponseTime,
    systemResponseTime: avgSystemResponseTime,
    completionRate,
    sampleSessions,
  };
}
