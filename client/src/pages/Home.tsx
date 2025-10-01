import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Event } from '../types';

export default function Home() {
  const { user, logout } = useAuth();
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    try {
      const data = await api.joinEvent();
      navigate(`/event/${data.eventId}?roomId=${data.roomId}`);
    } catch (error) {
      console.error('Failed to join event:', error);
      alert('イベントへの参加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">短歌茶屋</h1>
              <p className="text-gray-600 mt-1">ようこそ、{user?.displayName}さん</p>
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
                    管理画面
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

        {/* Event Info */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            イベント
          </h2>

          {currentEvent ? (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">開催中のイベント</p>
                <h3 className="text-xl font-bold text-gray-800 mt-1">
                  {currentEvent.type === 'night' && '夜の歌会'}
                  {currentEvent.type === 'day' && '昼の歌会'}
                  {currentEvent.type === 'seasonal' && '季節の歌会'}
                  {currentEvent.type === 'daily' && '日めくり短歌会'}
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  ステータス: {currentEvent.status}
                </p>
                <p className="text-sm text-gray-600">
                  ラウンド: {currentEvent.currentRound} / {currentEvent.maxRounds}
                </p>
              </div>

              <button
                onClick={handleJoinEvent}
                disabled={isLoading || currentEvent.status === 'finished'}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 text-lg font-semibold"
              >
                {isLoading ? '参加中...' : 'イベントに参加'}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">現在開催中のイベントはありません</p>
              <button
                onClick={handleJoinEvent}
                disabled={isLoading}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {isLoading ? 'イベントを作成中...' : '新しいイベントを作成'}
              </button>
            </div>
          )}
        </div>

        {/* Info Boxes */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-800 mb-2">🌙 夜の歌会</h3>
            <p className="text-sm text-gray-600">毎日22時開催</p>
            <p className="text-sm text-gray-600">6ラウンド制</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-800 mb-2">☀️ 昼の歌会</h3>
            <p className="text-sm text-gray-600">土日14時開催</p>
            <p className="text-sm text-gray-600">6ラウンド制</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-800 mb-2">📅 日めくり</h3>
            <p className="text-sm text-gray-600">24時間投稿</p>
            <p className="text-sm text-gray-600">24時間投票</p>
          </div>
        </div>
      </div>
    </div>
  );
}