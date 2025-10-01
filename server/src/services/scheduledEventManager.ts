import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';

const prisma = new PrismaClient();

export class ScheduledEventManager {
  private io: Server | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  setSocketIO(io: Server) {
    this.io = io;
  }

  // Start monitoring scheduled events
  start() {
    console.log('📅 Scheduled Event Manager started');

    // Check every 10 seconds for events that should start/progress/end
    this.checkInterval = setInterval(() => {
      this.checkAndProgressEvents();
    }, 10000);

    // Initial check
    this.checkAndProgressEvents();
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkAndProgressEvents() {
    const now = new Date();

    try {
      // Find events that should start
      await this.startScheduledEvents(now);

      // Find events that should end
      await this.endScheduledEvents(now);

      // Progress active events based on time
      await this.progressActiveEvents(now);
    } catch (error) {
      console.error('Error checking scheduled events:', error);
    }
  }

  private async startScheduledEvents(now: Date) {
    const eventsToStart = await prisma.event.findMany({
      where: {
        status: 'waiting',
        scheduledStart: {
          lte: now
        },
        startTime: null
      },
      include: {
        rooms: true
      }
    });

    for (const event of eventsToStart) {
      console.log(`🚀 Starting event ${event.id} (${event.type})`);

      await prisma.event.update({
        where: { id: event.id },
        data: {
          status: 'submission',
          startTime: now
        }
      });

      // Notify all rooms
      for (const room of event.rooms) {
        this.broadcastToRoom(room.id, 'phase-update', {
          phase: 'submission',
          eventId: event.id,
          round: event.currentRound
        });
      }
    }
  }

  private async endScheduledEvents(now: Date) {
    const eventsToEnd = await prisma.event.findMany({
      where: {
        status: {
          not: 'finished'
        },
        scheduledEnd: {
          lte: now
        }
      },
      include: {
        rooms: true
      }
    });

    for (const event of eventsToEnd) {
      console.log(`🏁 Ending event ${event.id} (${event.type})`);

      await prisma.event.update({
        where: { id: event.id },
        data: {
          status: 'finished',
          endTime: now
        }
      });

      // Notify all rooms
      for (const room of event.rooms) {
        this.broadcastToRoom(room.id, 'phase-update', {
          phase: 'finished',
          eventId: event.id
        });
      }
    }
  }

  private async progressActiveEvents(now: Date) {
    const activeEvents = await prisma.event.findMany({
      where: {
        status: {
          in: ['submission', 'voting', 'results']
        },
        startTime: {
          not: null
        },
        scheduledEnd: {
          gt: now
        }
      },
      include: {
        rooms: true
      }
    });

    for (const event of activeEvents) {
      if (!event.startTime) continue;

      const elapsed = now.getTime() - event.startTime.getTime();
      const total = event.scheduledEnd.getTime() - event.startTime.getTime();
      const progress = elapsed / total;

      // Calculate which phase we should be in based on progress
      // Total 6 rounds, each round has 3 phases: submission -> voting -> results
      const roundDuration = total / event.maxRounds;
      const currentRoundProgress = (elapsed % roundDuration) / roundDuration;
      const calculatedRound = Math.floor(elapsed / roundDuration) + 1;

      // Phase transitions within a round
      // 0-0.6: submission, 0.6-0.85: voting, 0.85-1.0: results
      let expectedPhase: string;
      if (currentRoundProgress < 0.6) {
        expectedPhase = 'submission';
      } else if (currentRoundProgress < 0.85) {
        expectedPhase = 'voting';
      } else {
        expectedPhase = 'results';
      }

      // Update if phase or round changed
      if (event.status !== expectedPhase || event.currentRound !== calculatedRound) {
        console.log(`📊 Event ${event.id}: Round ${calculatedRound}, Phase ${expectedPhase}`);

        await prisma.event.update({
          where: { id: event.id },
          data: {
            status: expectedPhase,
            currentRound: Math.min(calculatedRound, event.maxRounds)
          }
        });

        // Notify all rooms
        for (const room of event.rooms) {
          this.broadcastToRoom(room.id, 'phase-update', {
            phase: expectedPhase,
            eventId: event.id,
            round: calculatedRound
          });
        }
      }
    }
  }

  private broadcastToRoom(roomId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`room-${roomId}`).emit(event, data);
    }
  }
}

export const scheduledEventManager = new ScheduledEventManager();