import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Submit votes
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const voterId = req.userId!;
    const { votes } = req.body; // Array of { submissionId, voteCount }

    if (!Array.isArray(votes) || votes.length === 0) {
      return res.status(400).json({ error: 'Invalid votes data' });
    }

    // Validate: max 3 votes per submission
    const invalidVotes = votes.filter(v => v.voteCount > 3);
    if (invalidVotes.length > 0) {
      return res.status(400).json({ error: 'Maximum 3 votes per submission' });
    }

    // Delete existing votes for this voter in this round
    const firstSubmission = await prisma.submission.findUnique({
      where: { id: votes[0].submissionId }
    });

    if (firstSubmission) {
      await prisma.vote.deleteMany({
        where: {
          voterId,
          submission: {
            roomId: firstSubmission.roomId,
            round: firstSubmission.round
          }
        }
      });
    }

    // Create new votes
    const createdVotes = await Promise.all(
      votes.map(v =>
        prisma.vote.create({
          data: {
            voterId,
            submissionId: v.submissionId,
            voteCount: v.voteCount
          }
        })
      )
    );

    // Update submission points
    for (const vote of votes) {
      const submission = await prisma.submission.findUnique({
        where: { id: vote.submissionId },
        include: { votes: true }
      });

      if (submission) {
        const totalVotes = submission.votes.reduce((sum, v) => sum + v.voteCount, 0);
        await prisma.submission.update({
          where: { id: vote.submissionId },
          data: { points: totalVotes }
        });
      }
    }

    res.json({ votes: createdVotes });
  } catch (error) {
    console.error('Submit votes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if user has voted
router.get('/check/:roomId/:round', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const voterId = req.userId!;
    const { roomId, round } = req.params;

    const votes = await prisma.vote.findMany({
      where: {
        voterId,
        submission: {
          roomId,
          round: parseInt(round)
        }
      }
    });

    res.json({
      hasVoted: votes.length > 0,
      votes
    });
  } catch (error) {
    console.error('Check votes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;