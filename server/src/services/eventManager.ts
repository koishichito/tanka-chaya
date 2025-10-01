import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import { Server } from 'socket.io';

const prisma = new PrismaClient();

// Phase durations in milliseconds
const PHASE_DURATIONS = {
  waiting: 30000,      // 30 seconds after 2+ participants
  submission: 240000,  // 4 minutes
  voting: 120000,      // 2 minutes
  results: 60000       // 1 minute
};

const MIN_PARTICIPANTS = 2;

export class EventManager {
  private currentEventId: string | null = null;
  private io: Server | null = null;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private eventParticipants: Map<string, Set<string>> = new Map();

  setSocketIO(io: Server) {
    this.io = io;
  }

  async startTestEvent() {
    try {
      // Check if there's already an active event
      const existingEvent = await prisma.event.findFirst({
        where: {
          status: { not: 'finished' }
        }
      });

      if (existingEvent) {
        this.currentEventId = existingEvent.id;
        return existingEvent;
      }

      // Create a new test event
      const now = new Date();
      const scheduledEnd = new Date(now.getTime() + 45 * 60 * 1000);
      const event = await prisma.event.create({
        data: {
          type: 'night',
          status: 'waiting',
          startTime: now,
          scheduledStart: now,
          scheduledEnd: scheduledEnd,
          rooms: {
            create: {
              roomNumber: 1,
              status: 'active'
            }
          }
        },
        include: {
          rooms: true
        }
      });

      // Create themes for all rounds
      const themes = [
        '春の訪れ',
        '夏の思い出',
        '秋の夕暮れ',
        '冬の景色',
        '恋の歌',
        '旅の途中'
      ];

      for (let round = 1; round <= 6; round++) {
        const theme = await prisma.theme.create({
          data: {
            content: themes[round - 1],
            isApproved: true
          }
        });

        await prisma.eventTheme.create({
          data: {
            eventId: event.id,
            themeId: theme.id,
            round
          }
        });
      }

      this.currentEventId = event.id;
      this.eventParticipants.set(event.id, new Set());

      return event;
    } catch (error) {
      console.error('Failed to start test event:', error);
      throw error;
    }
  }

  async addParticipant(eventId: string, roomId: string, userId: string) {
    if (!this.eventParticipants.has(eventId)) {
      this.eventParticipants.set(eventId, new Set());
    }

    this.eventParticipants.get(eventId)!.add(userId);

    const participantCount = this.eventParticipants.get(eventId)!.size;

    // Broadcast participant count
    this.broadcastToRoom(roomId, 'participant-count', { count: participantCount });

    // Check if we should start the event
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (event && event.status === 'waiting' && participantCount >= MIN_PARTICIPANTS) {
      // Cancel existing timer if any
      const existingTimer = this.timers.get(`${eventId}-waiting`);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Start countdown to submission phase
      console.log(`Event ${eventId}: ${participantCount} participants. Starting in 30 seconds...`);
      this.broadcastToRoom(roomId, 'countdown-start', {
        phase: 'waiting',
        duration: PHASE_DURATIONS.waiting
      });

      const timer = setTimeout(async () => {
        await this.transitionToSubmission(eventId, roomId);
      }, PHASE_DURATIONS.waiting);

      this.timers.set(`${eventId}-waiting`, timer);
    }
  }

  async transitionToSubmission(eventId: string, roomId?: string) {
    console.log(`Event ${eventId}: Transitioning to submission phase`);

    const event = await prisma.event.update({
      where: { id: eventId },
      data: { status: 'submission' }
    });

    // Get room ID if not provided
    if (!roomId) {
      const room = await prisma.room.findFirst({
        where: { eventId }
      });
      roomId = room?.id;
    }

    if (roomId) {
      this.broadcastToRoom(roomId, 'phase-update', {
        phase: 'submission',
        duration: PHASE_DURATIONS.submission
      });

      // Schedule transition to voting
      const timer = setTimeout(async () => {
        await this.transitionToVoting(eventId, roomId!);
      }, PHASE_DURATIONS.submission);

      this.timers.set(`${eventId}-submission`, timer);
    }

    return event;
  }

  async transitionToVoting(eventId: string, roomId?: string) {
    console.log(`Event ${eventId}: Transitioning to voting phase`);

    const event = await prisma.event.update({
      where: { id: eventId },
      data: { status: 'voting' }
    });

    if (!roomId) {
      const room = await prisma.room.findFirst({
        where: { eventId }
      });
      roomId = room?.id;
    }

    if (roomId) {
      this.broadcastToRoom(roomId, 'phase-update', {
        phase: 'voting',
        duration: PHASE_DURATIONS.voting
      });

      // Schedule transition to results
      const timer = setTimeout(async () => {
        await this.transitionToResults(eventId, roomId!);
      }, PHASE_DURATIONS.voting);

      this.timers.set(`${eventId}-voting`, timer);
    }

    return event;
  }

  async transitionToResults(eventId: string, roomId?: string) {
    console.log(`Event ${eventId}: Transitioning to results phase`);

    const event = await prisma.event.update({
      where: { id: eventId },
      data: { status: 'results' }
    });

    if (!roomId) {
      const room = await prisma.room.findFirst({
        where: { eventId }
      });
      roomId = room?.id;
    }

    if (roomId) {
      this.broadcastToRoom(roomId, 'phase-update', {
        phase: 'results',
        duration: PHASE_DURATIONS.results
      });

      // Schedule next round or finish
      const timer = setTimeout(async () => {
        await this.nextRound(eventId, roomId!);
      }, PHASE_DURATIONS.results);

      this.timers.set(`${eventId}-results`, timer);
    }

    return event;
  }

  async nextRound(eventId: string, roomId?: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) throw new Error('Event not found');

    if (!roomId) {
      const room = await prisma.room.findFirst({
        where: { eventId }
      });
      roomId = room?.id;
    }

    if (event.currentRound >= event.maxRounds) {
      console.log(`Event ${eventId}: Finished`);
      const finishedEvent = await prisma.event.update({
        where: { id: eventId },
        data: { status: 'finished' }
      });

      if (roomId) {
        this.broadcastToRoom(roomId, 'phase-update', {
          phase: 'finished'
        });
      }

      // Clean up
      this.eventParticipants.delete(eventId);
      this.clearEventTimers(eventId);

      return finishedEvent;
    }

    const newRound = event.currentRound + 1;
    console.log(`Event ${eventId}: Moving to round ${newRound}`);

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        currentRound: newRound,
        status: 'submission'
      }
    });

    if (roomId) {
      this.broadcastToRoom(roomId, 'phase-update', {
        phase: 'submission',
        round: newRound,
        duration: PHASE_DURATIONS.submission
      });

      // Schedule transition to voting for new round
      const timer = setTimeout(async () => {
        await this.transitionToVoting(eventId, roomId!);
      }, PHASE_DURATIONS.submission);

      this.timers.set(`${eventId}-submission-${newRound}`, timer);
    }

    return updatedEvent;
  }

  private broadcastToRoom(roomId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`room-${roomId}`).emit(event, data);
    }
  }

  private clearEventTimers(eventId: string) {
    for (const [key, timer] of this.timers.entries()) {
      if (key.startsWith(eventId)) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    }
  }

  setupScheduler() {
    console.log('Event scheduler initialized');
  }

  async createScheduledEvent(type: 'night' | 'day' | 'seasonal' | 'daily') {
    const scheduledStart = new Date();
    const durationMinutes = type === 'daily' ? 48 * 60 : 90;
    const scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * 60 * 1000);

    const event = await prisma.event.create({
      data: {
        type,
        status: 'waiting',
        startTime: scheduledStart,
        scheduledStart,
        scheduledEnd,
        rooms: {
          create: {
            roomNumber: 1,
            status: 'active'
          }
        }
      }
    });

    const themes = [
        '春の訪れ',
        '夏の思い出',
        '秋の夕暮れ',
        '冬の景色',
        '恋の歌',
        '旅の途中'
      ];

    for (let round = 1; round <= 6; round++) {
      const theme = await prisma.theme.create({
        data: {
          content: themes[round - 1],
          isApproved: true
        }
      });

      await prisma.eventTheme.create({
        data: {
          eventId: event.id,
          themeId: theme.id,
          round
        }
      });
    }

    this.eventParticipants.set(event.id, new Set());
    return event;
  }
}

export const eventManager = new EventManager();






