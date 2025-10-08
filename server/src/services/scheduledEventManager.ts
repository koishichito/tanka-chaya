import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { eventManager } from './eventManager';

const prisma = new PrismaClient();

export class ScheduledEventManager {
  private io: Server | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  setSocketIO(io: Server) {
    this.io = io;
  }

  start() {
    console.log('📅 Scheduled Event Manager started');

    this.checkInterval = setInterval(() => {
      this.checkSchedules();
    }, 10000);

    this.checkSchedules();
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkSchedules() {
    const now = new Date();

    try {
      await this.startDueEvents(now);
      await this.finishDueEvents(now);
    } catch (error) {
      console.error('Error processing scheduled events:', error);
    }
  }

  private async startDueEvents(now: Date) {
    const eventsToStart = await prisma.event.findMany({
      where: {
        status: 'scheduled',
        scheduledStart: {
          lte: now
        }
      }
    });

    for (const event of eventsToStart) {
      console.log(`🚀 Starting scheduled event ${event.id} (${event.type})`);
      await eventManager.startEvent(event.id);
    }
  }

  private async finishDueEvents(now: Date) {
    const eventsToFinish = await prisma.event.findMany({
      where: {
        status: {
          in: ['submission', 'voting']
        },
        scheduledEnd: {
          lte: now
        }
      }
    });

    for (const event of eventsToFinish) {
      console.log(`🏁 Finishing scheduled event ${event.id} (${event.type})`);
      await eventManager.finishEvent(event.id);
    }
  }
}

export const scheduledEventManager = new ScheduledEventManager();
