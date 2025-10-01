import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { eventManager } from '../services/eventManager';

const router = Router();
const prisma = new PrismaClient();

// Get current active event
router.get('/current', async (req, res) => {
  try {
    const event = await prisma.event.findFirst({
      where: {
        status: {
          not: 'finished'
        }
      },
      include: {
        rooms: {
          include: {
            participants: true
          }
        },
        themes: {
          include: {
            theme: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    res.json({ event });
  } catch (error) {
    console.error('Get current event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
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
      }
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

    // Find or create an active event
    let event = await prisma.event.findFirst({
      where: {
        status: 'waiting'
      },
      include: {
        rooms: {
          include: {
            participants: true
          }
        }
      }
    });

    // Create a new event if none exists
    if (!event) {
      event = await eventManager.startTestEvent();
      event = await prisma.event.findUnique({
        where: { id: event.id },
        include: {
          rooms: {
            include: {
              participants: true
            }
          }
        }
      }) as any;
    }

    // Find a room with space (less than 80 participants)
    let room = event.rooms.find(r => r.participants.length < 80);

    if (!room) {
      // Create new room if all are full
      room = await prisma.room.create({
        data: {
          eventId: event.id,
          roomNumber: event.rooms.length + 1,
          status: 'active'
        },
        include: {
          participants: true
        }
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
      await eventManager.addParticipant(event.id, room.id, userId);
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