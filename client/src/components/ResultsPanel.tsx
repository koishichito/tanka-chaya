import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Props {
  eventId: string;
  roomId: string;
  round: number;
}

interface RankedSubmission {
  id: string;
  line1: string;
  line2: string;
  line3: string;
  line4: string;
  line5: string;
  points: number;
  user: {
    id: string;
    displayName: string;
  };
}

export default function ResultsPanel({ eventId, roomId, round }: Props) {
  const [rankings, setRankings] = useState<RankedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [eventId]);

  const loadResults = async () => {
    try {
      const data = await api.getEventRankings(eventId);
      // Filter by current round and room, then sort by points
      const filtered = data.rankings
        .filter((r: any) => r.room.id === roomId && r.round === round)
        .sort((a: any, b: any) => b.points - a.points);
      setRankings(filtered);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return '';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-600">結果を集計中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        ラウンド {round} 結果発表
      </h2>

      <div className="space-y-4">
        {rankings.map((submission, index) => (
          <div
            key={submission.id}
            className={`border rounded-lg p-6 ${
              index < 3 ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-700">
                  #{index + 1}
                </span>
                {index < 3 && (
                  <span className="text-3xl">{getMedalEmoji(index)}</span>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">得票数</p>
                <p className="text-2xl font-bold text-purple-600">
                  {submission.points}票
                </p>
              </div>
            </div>

            <div className="text-center space-y-1 bg-white p-4 rounded mb-3">
              <p className="text-gray-800 text-lg">{submission.line1}</p>
              <p className="text-gray-800 text-lg">{submission.line2}</p>
              <p className="text-gray-800 text-lg">{submission.line3}</p>
              <p className="text-gray-800 text-lg">{submission.line4}</p>
              <p className="text-gray-800 text-lg">{submission.line5}</p>
            </div>

            <p className="text-center text-sm text-gray-600">
              詠み人: <span className="font-medium">{submission.user.displayName}</span>
            </p>
          </div>
        ))}

        {rankings.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            まだ投稿がありません
          </p>
        )}
      </div>
    </div>
  );
}