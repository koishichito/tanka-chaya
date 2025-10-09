import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
type VoteInput = {
  submissionId: string;
  voteCount: number;
};

type SubmissionWithVotes = Prisma.SubmissionGetPayload<{ include: { votes: true } }>;

const isVoteInputArray = (value: unknown): value is VoteInput[] => {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every(
    (vote) =>
      typeof vote === 'object' &&
      vote !== null &&
      typeof (vote as { submissionId?: unknown }).submissionId === 'string' &&
      typeof (vote as { voteCount?: unknown }).voteCount === 'number'
  );
};

// Submit votes
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const voterId = req.userId!;
    const { votes: rawVotes } = req.body as { votes?: unknown }; // Array of { submissionId, voteCount }

    if (!isVoteInputArray(rawVotes) || rawVotes.length === 0) {
      return res.status(400).json({ error: 'Invalid votes data' });
    }

    const votes: VoteInput[] = rawVotes;

    // Validate: max 3 votes per submission
    const invalidVotes = votes.filter((vote) => vote.voteCount > 3);
    if (invalidVotes.length > 0) {
      return res.status(400).json({ error: 'Maximum 3 votes per submission' });
    }

    // Delete existing votes for this voter in this round
    const firstSubmission = await prisma.submission.findUnique({
      where: { id: votes[0].submissionId },
      include: {
        room: {
          include: {
            event: true
          }
        }
      }
    });

    if (!firstSubmission || !firstSubmission.room) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (!firstSubmission.room.event || firstSubmission.room.event.status !== 'voting') {
      return res.status(400).json({ error: 'Event is not accepting votes' });
    }

    await prisma.vote.deleteMany({
      where: {
        voterId,
        submission: {
          roomId: firstSubmission.roomId,
          round: firstSubmission.round
        }
      }
    });

    // Create new votes
    const createdVotes = await Promise.all(
      votes.map((vote) =>
        prisma.vote.create({
          data: {
            voterId,
            submissionId: vote.submissionId,
            voteCount: vote.voteCount
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
        const submissionWithVotes = submission as SubmissionWithVotes;
        const totalVotes = submissionWithVotes.votes.reduce(
          (sum: number, storedVote) => sum + storedVote.voteCount,
          0
        );
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

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        event: true
      }
    });

    if (!room || !room.event) {
      return res.status(404).json({ error: 'Room not found' });
    }

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
      votes,
      eventStatus: room.event.status
    });
  } catch (error) {
    console.error('Check votes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
