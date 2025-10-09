import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { eventManager } from '../services/eventManager';

const router = Router();
const prisma = new PrismaClient();

const roomInclude = {
  participants: true
} satisfies Prisma.RoomInclude;

const eventIncludeWithThemes = {
  rooms: {
    include: roomInclude
  },
  themes: {
    include: {
      theme: true
    }
  }
} satisfies Prisma.EventInclude;

const eventIncludeWithSubmissions = {
  rooms: {
    include: {
      participants: true,
      submissions: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true
            }
          },
          votes: true
        }
      }
    }
  },
  themes: {
    include: {
      theme: true
    }
  }
} satisfies Prisma.EventInclude;

type RoomWithParticipants = Prisma.RoomGetPayload<{ include: typeof roomInclude }>;
type EventWithThemes = Prisma.EventGetPayload<{ include: typeof eventIncludeWithThemes }>;
type EventWithSubmissions = Prisma.EventGetPayload<{ include: typeof eventIncludeWithSubmissions }>;
type EventWithRoomsOnly = Prisma.EventGetPayload<{ include: { rooms: { include: typeof roomInclude } } }>;

// Get current active event
router.get('/current', async (req, res) => {
  try {
    let event: EventWithThemes | null = await prisma.event.findFirst({
      where: {
        status: {
          in: ['submission', 'voting']
        }
      },
      include: {
        ...eventIncludeWithThemes
      },
      orderBy: [
        {
          updatedAt: 'desc'
        }
      ]
    });

    if (!event) {
      event = await prisma.event.findFirst({
        where: {
          status: 'scheduled'
        },
        include: eventIncludeWithThemes,
        orderBy: [
          {
            scheduledStart: 'asc'
          }
        ]
      });
    }

    res.json({ event });
  } catch (error) {
    console.error('Get current event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get finished events history
router.get('/history', async (_req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: 'finished'
      },
      include: {
        themes: {
          include: {
            theme: true
          }
        },
        rooms: {
          select: {
            id: true,
            roomNumber: true
          }
        }
      },
      orderBy: [
        {
          scheduledEnd: 'desc'
        }
      ]
    });

    res.json({ events });
  } catch (error) {
    console.error('Get event history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const event: EventWithSubmissions | null = await prisma.event.findUnique({
      where: { id },
      include: eventIncludeWithSubmissions
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join event (create a test event for now)
router.post('/join', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Find an active event
    const event: EventWithRoomsOnly | null = await prisma.event.findFirst({
      where: {
        status: {
          in: ['submission', 'voting']
        }
      },
      include: {
        rooms: {
          include: roomInclude
        }
      },
      orderBy: [
        {
          updatedAt: 'desc'
        }
      ]
    });

    if (!event) {
      return res.status(404).json({ error: 'No active event' });
    }

    // Find a room with space (less than 80 participants)
    let room = event.rooms.find((candidate: RoomWithParticipants) => candidate.participants.length < 80);

    if (!room) {
      // Create new room if all are full
      room = await prisma.room.create({
        data: {
          eventId: event.id,
          roomNumber: event.rooms.length + 1,
          status: 'active'
        },
        include: roomInclude
      });
    }

    // Check if user already joined
    const existingParticipant = await prisma.roomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId
        }
      }
    });

    if (!existingParticipant) {
      await prisma.roomParticipant.create({
        data: {
          roomId: room.id,
          userId
        }
      });

      // Notify event manager of new participant
      await eventManager.addParticipant(event.id, room.id);
    }

    res.json({
      eventId: event.id,
      roomId: room.id,
      roomNumber: room.roomNumber
    });
  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
