import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { notifyVoteComplete } from '../services/socket';
import { Submission } from '../types';

interface Props {
  roomId: string;
  round: number;
  participantCount: number;
  onComplete: () => void;
}

export default function VotingPanel({ roomId, round, participantCount, onComplete }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [votes, setVotes] = useState<{ [key: string]: number }>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [maxVotes, setMaxVotes] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    loadSubmissions();
    checkIfVoted();
    // Calculate max votes: participantCount / 10 (rounded)
    const calculated = Math.round(participantCount / 10);
    setMaxVotes(calculated > 0 ? calculated : 1);
  }, [roomId, round, participantCount]);

  const loadSubmissions = async () => {
    try {
      const data = await api.getSubmissions(roomId, round);
      setSubmissions(data.submissions);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  const checkIfVoted = async () => {
    try {
      const data = await api.checkVoted(roomId, round);
      setHasVoted(data.hasVoted);
    } catch (error) {
      console.error('Failed to check vote status:', error);
    }
  };

  const handleVoteChange = (submissionId: string, delta: number) => {
    const currentVote = votes[submissionId] || 0;
    const newVote = Math.max(0, Math.min(3, currentVote + delta)); // Max 3 per submission

    const newVotes = { ...votes, [submissionId]: newVote };
    if (newVote === 0) {
      delete newVotes[submissionId];
    }

    const newTotal = Object.values(newVotes).reduce((sum, v) => sum + v, 0);

    if (newTotal <= maxVotes) {
      setVotes(newVotes);
      setTotalVotes(newTotal);
    }
  };

  const handleSubmit = async () => {
    if (totalVotes !== maxVotes) {
      alert(`持ち票${maxVotes}票を全て使い切ってください（現在: ${totalVotes}票）`);
      return;
    }

    const voteArray = Object.entries(votes).map(([submissionId, voteCount]) => ({
      submissionId,
      voteCount
    }));

    if (voteArray.length === 0) {
      alert('最低1つの作品に投票してください');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitVotes(voteArray);
      notifyVoteComplete(roomId);
      setHasVoted(true);
      alert('投票が完了しました！');
      onComplete();
    } catch (error) {
      console.error('Failed to submit votes:', error);
      alert('投票に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasVoted) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">投票完了</h2>
        <p className="text-gray-600">他の参加者の投票をお待ちください...</p>
        <div className="mt-6">
          <div className="animate-pulse inline-block w-16 h-16 bg-green-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">投票</h2>
        <div className="flex justify-center items-center gap-4 text-lg">
          <span className="text-gray-600">
            持ち票: <span className="font-bold text-purple-600">{maxVotes}</span>票
          </span>
          <span className="text-gray-600">
            残り: <span className={`font-bold ${totalVotes === maxVotes ? 'text-green-600' : 'text-orange-600'}`}>
              {maxVotes - totalVotes}
            </span>票
          </span>
        </div>
        <p className="text-center text-sm text-gray-500 mt-2">
          ※1作品につき最大3票まで投票可能
        </p>
      </div>

      <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
        {submissions.map((submission, index) => (
          <div
            key={submission.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-medium text-gray-500">作品 #{index + 1}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVoteChange(submission.id, -1)}
                  disabled={!votes[submission.id]}
                  className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-30 transition"
                >
                  −
                </button>
                <span className="w-8 text-center font-bold text-lg">
                  {votes[submission.id] || 0}
                </span>
                <button
                  onClick={() => handleVoteChange(submission.id, 1)}
                  disabled={totalVotes >= maxVotes || (votes[submission.id] || 0) >= 3}
                  className="w-8 h-8 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-30 transition"
                >
                  +
                </button>
              </div>
            </div>

            <div className="text-center space-y-1 bg-gray-50 p-4 rounded">
              <p className="text-gray-800">{submission.line1}</p>
              <p className="text-gray-800">{submission.line2}</p>
              <p className="text-gray-800">{submission.line3}</p>
              <p className="text-gray-800">{submission.line4}</p>
              <p className="text-gray-800">{submission.line5}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || totalVotes !== maxVotes}
        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-semibold text-lg"
      >
        {isSubmitting ? '投票中...' : `投票する (${totalVotes}/${maxVotes})`}
      </button>
    </div>
  );
}