import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Event, Submission } from '../types';
import { api } from '../services/api';
import { getSocket, joinRoom } from '../services/socket';
import TankaSubmission from '../components/TankaSubmission';
import VotingPanel from '../components/VotingPanel';
import ResultsPanel from '../components/ResultsPanel';

const typeLabelMap: Record<string, string> = {
  night: '夜の歌会',
  day: '昼の歌会',
  seasonal: '季節の歌会',
  daily: '日めくり短歌会'
};

const statusDescriptionMap: Record<string, string> = {
  scheduled: '開始までお待ちください',
  submission: 'お題に沿って短歌を投稿しましょう',
  voting: 'お気に入りの短歌に投票してください',
  finished: 'イベントは終了しました'
};

export default function EventRoom() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');

  const [event, setEvent] = useState<Event | null>(null);
  const [currentTheme, setCurrentTheme] = useState<string>('');
  const [participantCount, setParticipantCount] = useState(0);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);

  useEffect(() => {
    if (eventId) {
      loadEvent(eventId);
    }

    if (roomId) {
      joinRoom(roomId);
      setupSocketListeners();
    }

    return () => {
      const socket = getSocket();
      socket?.off('participant-count');
      socket?.off('phase-update');
    };
  }, [eventId, roomId]);

  const loadEvent = async (id: string) => {
    try {
      const data = await api.getEvent(id);
      const eventData: Event = data.event;
      setEvent(eventData);

      if (eventData) {
        const totalParticipants = eventData.rooms?.reduce(
          (sum, room) => sum + (room.participants?.length || 0),
          0
        ) || 0;
        setParticipantCount(totalParticipants);

        const currentRound = eventData.currentRound;
        const themeData = eventData.themes?.find((t: any) => t.round === currentRound);
        setCurrentTheme(themeData?.theme?.content || '');

        if (roomId) {
          const submissionData = await api.getMySubmission(roomId, currentRound);
          setMySubmission(submissionData.submission);
        }
      }
    } catch (error) {
      console.error('Failed to load event:', error);
    }
  };

  const setupSocketListeners = () => {
    const socket = getSocket();

    socket?.on('participant-count', (data) => {
      setParticipantCount(data.count);
    });

    socket?.on('phase-update', () => {
      if (eventId) {
        loadEvent(eventId);
      }
    });
  };

  const handleSubmissionComplete = () => {
    if (eventId) {
      loadEvent(eventId);
    }
  };

  const handleVoteComplete = () => {
    if (eventId) {
      loadEvent(eventId);
    }
  };

  const eventTypeLabel = useMemo(() => {
    if (!event) return '';
    return typeLabelMap[event.type] || event.type;
  }, [event]);

  const statusDescription = useMemo(() => {
    if (!event) return '';
    return statusDescriptionMap[event.status] || '';
  }, [event]);

  if (!event || !roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{eventTypeLabel}</h1>
              <p className="text-gray-600 mt-1">
                ラウンド {event.currentRound} / {event.maxRounds}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">参加者</p>
              <p className="text-2xl font-bold text-purple-600">{participantCount}</p>
            </div>
          </div>

          {currentTheme && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">お題</p>
              <p className="text-xl font-bold text-gray-800">{currentTheme}</p>
            </div>
          )}

          {statusDescription && (
            <p className="text-sm text-gray-500 mt-4">{statusDescription}</p>
          )}
        </div>

        {event.status === 'scheduled' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              イベント開始をお待ちください
            </h2>
            <p className="text-gray-600">
              主催者が開始すると投稿が可能になります。
            </p>
            <div className="mt-6">
              <div className="animate-pulse inline-block w-16 h-16 bg-purple-200 rounded-full" />
            </div>
          </div>
        )}

        {event.status === 'submission' && (
          <TankaSubmission
            roomId={roomId}
            round={event.currentRound}
            existingSubmission={mySubmission}
            onComplete={handleSubmissionComplete}
          />
        )}

        {event.status === 'voting' && (
          <VotingPanel
            roomId={roomId}
            round={event.currentRound}
            participantCount={participantCount}
            onComplete={handleVoteComplete}
          />
        )}

        {event.status === 'finished' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">結果発表</h2>
            <ResultsPanel eventId={eventId!} roomId={roomId} round={event.currentRound} />
          </div>
        )}
      </div>
    </div>
  );
}
