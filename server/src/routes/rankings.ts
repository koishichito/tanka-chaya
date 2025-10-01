import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get rankings for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const submissions = await prisma.submission.findMany({
      where: {
        room: {
          eventId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true
          }
        },
        votes: true
      },
      orderBy: {
        points: 'desc'
      }
    });

    res.json({ rankings: submissions });
  } catch (error) {
    console.error('Get rankings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get global rankings
router.get('/global', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        totalPoints: true,
        medals: true
      },
      orderBy: {
        totalPoints: 'desc'
      },
      take: 100
    });

    res.json({ rankings: users });
  } catch (error) {
    console.error('Get global rankings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;