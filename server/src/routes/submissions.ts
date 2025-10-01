import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Submit tanka
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { roomId, round, line1, line2, line3, line4, line5 } = req.body;

    // Validation
    if (!roomId || !round || !line1 || !line2 || !line3 || !line4 || !line5) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Upsert submission (allow editing)
    const submission = await prisma.submission.upsert({
      where: {
        userId_roomId_round: {
          userId,
          roomId,
          round
        }
      },
      update: {
        line1,
        line2,
        line3,
        line4,
        line5
      },
      create: {
        userId,
        roomId,
        round,
        line1,
        line2,
        line3,
        line4,
        line5
      }
    });

    res.json({ submission });
  } catch (error) {
    console.error('Submit tanka error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get submissions for a room/round
router.get('/room/:roomId/round/:round', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { roomId, round } = req.params;

    const submissions = await prisma.submission.findMany({
      where: {
        roomId,
        round: parseInt(round)
      },
      include: {
        votes: true
      }
    });

    // Don't reveal authors during voting
    const anonymousSubmissions = submissions.map(s => ({
      id: s.id,
      line1: s.line1,
      line2: s.line2,
      line3: s.line3,
      line4: s.line4,
      line5: s.line5,
      points: s.points,
      voteCount: s.votes.reduce((sum, v) => sum + v.voteCount, 0)
    }));

    res.json({ submissions: anonymousSubmissions });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's own submission
router.get('/mine/:roomId/:round', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { roomId, round } = req.params;

    const submission = await prisma.submission.findUnique({
      where: {
        userId_roomId_round: {
          userId,
          roomId,
          round: parseInt(round)
        }
      }
    });

    res.json({ submission });
  } catch (error) {
    console.error('Get own submission error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;