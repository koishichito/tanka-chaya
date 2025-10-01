import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Create new event
router.post('/events', async (req: AuthRequest, res) => {
  try {
    const {
      type,
      maxRounds,
      scheduledStart,
      scheduledEnd,
      themes
    } = req.body;

    // Validation
    if (!type || !maxRounds || !scheduledStart || !scheduledEnd) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!themes || !Array.isArray(themes) || themes.length !== maxRounds) {
      return res.status(400).json({
        error: `Must provide ${maxRounds} themes (one per round)`
      });
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        type,
        status: 'waiting',
        maxRounds,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
        rooms: {
          create: {
            roomNumber: 1,
            status: 'active'
          }
        }
      }
    });

    // Create themes
    for (let round = 1; round <= maxRounds; round++) {
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

    res.status(201).json({ event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all events (past and future)
router.get('/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
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
        scheduledStart: 'desc'
      }
    });

    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update event
router.put('/events/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { type, scheduledStart, scheduledEnd, status } = req.body;

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(scheduledStart && { scheduledStart: new Date(scheduledStart) }),
        ...(scheduledEnd && { scheduledEnd: new Date(scheduledEnd) }),
        ...(status && { status })
      }
    });

    res.json({ event });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete event
router.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.event.delete({
      where: { id }
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        totalPoints: true,
        isAdmin: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Make user admin
router.post('/users/:id/admin', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { isAdmin: true }
    });

    res.json({ user });
  } catch (error) {
    console.error('Make admin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalEvents,
      activeEvents,
      totalSubmissions,
      totalVotes
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.event.count({
        where: {
          status: { not: 'finished' }
        }
      }),
      prisma.submission.count(),
      prisma.vote.count()
    ]);

    res.json({
      stats: {
        totalUsers,
        totalEvents,
        activeEvents,
        totalSubmissions,
        totalVotes
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;