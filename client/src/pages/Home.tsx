import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Event } from '../types';

const typeLabelMap: Record<string, string> = {
  night: '夜の歌会',
  day: '昼の歌会',
  seasonal: '季節の歌会',
  daily: '日めくり短歌会'
};

const statusLabelMap: Record<string, string> = {
  scheduled: '開始待ち',
  submission: '投稿受付中',
  voting: '投票受付中',
  finished: '終了'
};

export default function Home() {
  const { user, logout } = useAuth();
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCurrentEvent();
  }, []);

  const loadCurrentEvent = async () => {
    try {
      const data = await api.getCurrentEvent();
      setCurrentEvent(data.event);
    } catch (error) {
      console.error('Failed to load event:', error);
    }
  };

  const handleJoinEvent = async () => {
    setIsJoining(true);
    try {
      const data = await api.joinEvent();
      navigate(`/event/${data.eventId}?roomId=${data.roomId}`);
    } catch (error) {
      console.error('Failed to join event:', error);
      alert('イベントへの参加に失敗しました');
    } finally {
      setIsJoining(false);
    }
  };

  const eventTypeLabel = useMemo(() => {
    if (!currentEvent) return '';
    return typeLabelMap[currentEvent.type] || currentEvent.type;
  }, [currentEvent]);

  const eventStatusLabel = useMemo(() => {
    if (!currentEvent) return '';
    return statusLabelMap[currentEvent.status] || currentEvent.status;
  }, [currentEvent]);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">短歌茶屋</h1>
              <p className="text-gray-600 mt-1">ようこそ、{user?.displayName} さん</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">累計ポイント</p>
              <p className="text-2xl font-bold text-purple-600">{user?.totalPoints || 0}</p>
              <div className="mt-2 flex gap-2 justify-end">
                {user?.isAdmin && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    管理画面へ
                  </button>
                )}
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">イベント</h2>

          {currentEvent ? (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">開催中のイベント</p>
                <h3 className="text-xl font-bold text-gray-800 mt-1">{eventTypeLabel}</h3>
                <p className="text-sm text-gray-600 mt-2">ステータス: {eventStatusLabel}</p>
                <p className="text-sm text-gray-600">
                  ラウンド {currentEvent.currentRound} / {currentEvent.maxRounds}
                </p>
              </div>

              <button
                onClick={handleJoinEvent}
                disabled={
                  isJoining ||
                  currentEvent.status === 'finished' ||
                  currentEvent.status === 'scheduled'
                }
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 text-lg font-semibold"
              >
                {isJoining
                  ? '参加中...'
                  : currentEvent.status === 'scheduled'
                  ? '開始を待つ'
                  : 'イベントに参加'}
              </button>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <p className="text-gray-600">現在参加できるイベントはありません</p>
              <button
                onClick={handleJoinEvent}
                disabled={isJoining}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {isJoining ? 'イベントを検索中...' : 'イベントに備える'}
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-800 mb-2">🌙 夜の歌会</h3>
            <p className="text-sm text-gray-600">毎日22時開催（スケジュールに応じて開始）</p>
            <p className="text-sm text-gray-600">6ラウンド制</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-800 mb-2">☀️ 昼の歌会</h3>
            <p className="text-sm text-gray-600">週末14時を中心に開催</p>
            <p className="text-sm text-gray-600">6ラウンド制</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-800 mb-2">📅 日めくり</h3>
            <p className="text-sm text-gray-600">毎日11時にお題更新</p>
            <p className="text-sm text-gray-600">投稿と投票で創作を楽しもう</p>
          </div>
        </div>
      </div>
    </div>
  );
}
