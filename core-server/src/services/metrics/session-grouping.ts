/**
 * Session Grouping Utility
 * 
 * Groups messages into logical sessions based on 24-hour gaps between user messages.
 */

import { Message, LogicalSession } from './session-metrics';

const SESSION_GAP_HOURS = 24;

/**
 * Group messages into logical sessions (24h gap between user messages)
 */
export function groupIntoSessions(
  chats: Array<{
    patientId: string;
    sessionStarted: Date;
    lastMessageAt: Date | null;
    messages: Message[] | null;
  }>
): LogicalSession[] {
  const sessions: LogicalSession[] = [];

  // Group chats by patientId
  const chatsByPatient = new Map<string, typeof chats>();
  for (const chat of chats) {
    if (!chatsByPatient.has(chat.patientId)) {
      chatsByPatient.set(chat.patientId, []);
    }
    chatsByPatient.get(chat.patientId)!.push(chat);
  }

  // Process each patient's chats
  for (const [patientId, patientChats] of chatsByPatient) {
    // Collect all messages with their timestamps
    const allMessages: Array<Message & { chatId: string }> = [];
    for (const chat of patientChats) {
      if (chat.messages && Array.isArray(chat.messages)) {
        for (const msg of chat.messages) {
          allMessages.push({
            ...msg,
            chatId: chat.patientId,
          });
        }
      }
    }

    // Sort by timestamp
    allMessages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Filter only user messages (sender === 'user')
    const userMessages = allMessages.filter(msg => msg.sender === 'user');

    if (userMessages.length === 0) continue;

    // Group into logical sessions (24h gap)
    let currentSession: LogicalSession | null = null;

    for (const msg of userMessages) {
      const msgTime = new Date(msg.timestamp);

      if (!currentSession) {
        // Start new session
        currentSession = {
          patientId,
          startTime: msgTime,
          endTime: msgTime,
          userMessages: [msg],
          assistantMessages: [],
          duration: 0,
        };
      } else {
        const timeSinceLastUserMsg = 
          (msgTime.getTime() - currentSession.endTime.getTime()) / (1000 * 60 * 60);

        if (timeSinceLastUserMsg >= SESSION_GAP_HOURS) {
          // Save current session and start new one
          currentSession.duration = 
            (currentSession.endTime.getTime() - currentSession.startTime.getTime()) / (1000 * 60);
          sessions.push(currentSession);

          currentSession = {
            patientId,
            startTime: msgTime,
            endTime: msgTime,
            userMessages: [msg],
            assistantMessages: [],
            duration: 0,
          };
        } else {
          // Continue current session
          currentSession.userMessages.push(msg);
          currentSession.endTime = msgTime;
        }
      }
    }

    // Add assistant messages to current session
    if (currentSession) {
      const sessionStart = currentSession.startTime.getTime();
      const sessionEnd = currentSession.endTime.getTime();

      for (const msg of allMessages) {
        if (msg.sender === 'assistant') {
          const msgTime = new Date(msg.timestamp).getTime();
          if (msgTime >= sessionStart && msgTime <= sessionEnd + 24 * 60 * 60 * 1000) {
            currentSession.assistantMessages.push(msg);
          }
        }
      }

      currentSession.duration = 
        (currentSession.endTime.getTime() - currentSession.startTime.getTime()) / (1000 * 60);
      sessions.push(currentSession);
    }
  }

  return sessions;
}
