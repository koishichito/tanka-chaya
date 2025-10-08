import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import CreateEventForm from '../components/CreateEventForm';
import { Event } from '../types';

const typeLabelMap: Record<string, string> = {
  night: '夜の歌会',
  day: '昼の歌会',
  seasonal: '季節の歌会',
  daily: '日めくり短歌会'
};

const statusLabelMap: Record<string, string> = {
  scheduled: 'スケジュール済み',
  submission: '投稿受付中',
  voting: '投票受付中',
  finished: '終了'
};

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [eventsData, statsData] = await Promise.all([
        api.getAdminEvents(),
        api.getAdminStats()
      ]);

      setEvents(eventsData.events);
      setStats(statsData.stats);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      alert('管理データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('このイベントを削除してもよろしいですか？')) {
      return;
    }

    try {
      await api.deleteEvent(eventId);
      alert('イベントを削除しました');
      loadData();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('イベントの削除に失敗しました');
    }
  };

  const handleStartEvent = async (eventId: string) => {
    try {
      await api.startEvent(eventId);
      alert('イベントを投稿受付中にしました');
      loadData();
    } catch (error) {
      console.error('Failed to start event:', error);
      alert('イベントの開始に失敗しました');
    }
  };

  const handleOpenVoting = async (eventId: string) => {
    try {
      await api.openVoting(eventId);
      alert('投票フェーズへ移行しました');
      loadData();
    } catch (error) {
      console.error('Failed to open voting:', error);
      alert('投票フェーズへの移行に失敗しました');
    }
  };

  const handleFinishEvent = async (eventId: string) => {
    if (!confirm('イベントを終了し結果を確定しますか？')) {
      return;
    }

    try {
      await api.finishEvent(eventId);
      alert('イベントを終了しました');
      loadData();
    } catch (error) {
      console.error('Failed to finish event:', error);
      alert('イベントの終了に失敗しました');
    }
  };

  const handleEventCreated = () => {
    setShowCreateForm(false);
    loadData();
  };

  const renderTypeLabel = (type: string) => typeLabelMap[type] || type;
  const renderStatusLabel = (status: string) => statusLabelMap[status] || status;

  const formatDateTime = (value: string | Date) => {
    try {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return '-';
      return date.toLocaleString('ja-JP');
    } catch {
      return '-';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">管理ダッシュボード</h1>
              <p className="text-gray-600 mt-1">{user?.displayName} さん、ようこそ</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                ホームへ
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>

        {stats && (
          <div className="grid md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">総ユーザー数</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalUsers}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">総イベント数</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalEvents}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">進行中のイベント</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeEvents}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">総投稿数</p>
              <p className="text-3xl font-bold text-orange-600">{stats.totalSubmissions}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">総投票数</p>
              <p className="text-3xl font-bold text-red-600">{stats.totalVotes}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">イベント管理</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              {showCreateForm ? '閉じる' : '新規イベント作成'}
            </button>
          </div>

          {showCreateForm && (
            <div className="mb-6">
              <CreateEventForm onSuccess={handleEventCreated} />
            </div>
          )}

          <div className="space-y-4">
            {events.map((event) => {
              const participantCount = event.rooms?.reduce(
                (sum, room) => sum + (room.participants?.length || 0),
                0
              ) || 0;

              const canDelete = event.status === 'scheduled' || event.status === 'finished';
              const canStart = event.status === 'scheduled';
              const canOpenVoting = event.status === 'submission';
              const canFinish = event.status === 'submission' || event.status === 'voting';

              return (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-800">
                          {renderTypeLabel(event.type)}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            event.status === 'scheduled'
                              ? 'bg-yellow-100 text-yellow-800'
                              : event.status === 'submission'
                              ? 'bg-blue-100 text-blue-800'
                              : event.status === 'voting'
                              ? 'bg-green-100 text-green-800'
                              : event.status === 'finished'
                              ? 'bg-gray-200 text-gray-700'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {renderStatusLabel(event.status)}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">開始予定</span>{' '}
                          {formatDateTime(event.scheduledStart)}
                        </p>
                        <p>
                          <span className="font-medium">終了予定</span>{' '}
                          {formatDateTime(event.scheduledEnd)}
                        </p>
                        <p>
                          <span className="font-medium">ラウンド</span> {event.currentRound} / {event.maxRounds}
                        </p>
                        <p>
                          <span className="font-medium">参加者</span> {participantCount}人
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleStartEvent(event.id)}
                        disabled={!canStart}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-40"
                      >
                        投稿開始
                      </button>
                      <button
                        onClick={() => handleOpenVoting(event.id)}
                        disabled={!canOpenVoting}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-40"
                      >
                        投票開始
                      </button>
                      <button
                        onClick={() => handleFinishEvent(event.id)}
                        disabled={!canFinish}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-40"
                      >
                        終了・結果確定
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        disabled={!canDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-40"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {events.length === 0 && (
              <p className="text-center text-gray-500 py-8">イベントがありません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
