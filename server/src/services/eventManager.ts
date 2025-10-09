import { PrismaClient, Prisma } from '@prisma/client';
import { Server } from 'socket.io';

const prisma = new PrismaClient();

type EventWithRooms = Prisma.EventGetPayload<{ include: { rooms: true } }>;
type EventRoom = EventWithRooms['rooms'][number];

export class EventManager {
  private io: Server | null = null;

  setSocketIO(io: Server) {
    this.io = io;
  }

  async startEvent(eventId: string) {
    const existing: EventWithRooms | null = await prisma.event.findUnique({
      where: { id: eventId },
      include: { rooms: true }
    });

    if (!existing) {
      throw new Error('Event not found');
    }

    if (existing.status === 'submission' || existing.status === 'voting') {
      return existing;
    }

    if (existing.rooms.length === 0) {
      await prisma.room.create({
        data: {
          eventId,
          roomNumber: 1,
          status: 'active'
        }
      });
    }

      const updateData: {
        status: string;
        currentRound: number;
        startTime?: Date;
      } = {
        status: 'submission',
        currentRound: existing.currentRound > 0 ? existing.currentRound : 1
      };

    if (!existing.startTime) {
      updateData.startTime = new Date();
    }

    const event: EventWithRooms = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        rooms: true
      }
    });

    this.broadcastPhase(event, 'submission');
    return event;
  }

  async openVoting(eventId: string) {
    const existing: EventWithRooms | null = await prisma.event.findUnique({
      where: { id: eventId },
      include: { rooms: true }
    });

    if (!existing) {
      throw new Error('Event not found');
    }

    if (existing.status === 'voting') {
      return existing;
    }

    if (existing.status !== 'submission') {
      throw new Error('Event is not accepting submissions');
    }

    const event: EventWithRooms = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: 'voting'
      },
      include: {
        rooms: true
      }
    });

    this.broadcastPhase(event, 'voting');
    return event;
  }

  async finishEvent(eventId: string) {
    const existing: EventWithRooms | null = await prisma.event.findUnique({
      where: { id: eventId },
      include: { rooms: true }
    });

    if (!existing) {
      throw new Error('Event not found');
    }

    if (existing.status === 'finished') {
      return existing;
    }

    if (existing.rooms.length === 0) {
      await prisma.room.create({
        data: {
          eventId,
          roomNumber: 1,
          status: 'active'
        }
      });
    }

    const event: EventWithRooms = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: 'finished',
        endTime: existing.endTime ?? new Date()
      },
      include: {
        rooms: true
      }
    });

    this.broadcastPhase(event, 'finished');
    return event;
  }

  async addParticipant(eventId: string, roomId: string) {
    const count = await prisma.roomParticipant.count({
      where: { roomId }
    });

    this.broadcastToRoom(roomId, 'participant-count', { count });

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return;

    if (event.status === 'submission' || event.status === 'voting') {
      this.broadcastToRoom(roomId, 'phase-update', {
        phase: event.status,
        eventId: event.id,
        round: event.currentRound
      });
    }
  }

  private broadcastPhase(event: EventWithRooms, phase: string) {
    if (!event) return;

    const rooms = event.rooms ?? [];
    rooms.forEach((room: EventRoom) => {
      this.broadcastToRoom(room.id, 'phase-update', {
        phase,
        eventId: event.id,
        round: event.currentRound
      });
    });
  }

  private broadcastToRoom(roomId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`room-${roomId}`).emit(event, data);
    }
  }
}

export const eventManager = new EventManager();
