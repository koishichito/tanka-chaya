import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { EventHistoryItem } from '../types';

const typeLabelMap: Record<string, string> = {
  night: '夜の歌会',
  day: '昼の歌会',
  seasonal: '季節の歌会',
  daily: '日めくり短歌会'
};

export default function EventHistory() {
  const [events, setEvents] = useState<EventHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getEventHistory();
      setEvents(data.events);
    } catch (err) {
      console.error('Failed to load event history:', err);
      setError('イベント履歴の取得に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const formattedEvents = useMemo(() => {
    return events.map((event) => ({
      ...event,
      typeLabel: typeLabelMap[event.type] || event.type,
      endAt: event.endTime || event.scheduledEnd,
      startAt: event.startTime || event.scheduledStart
    }));
  }, [events]);

  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="text-center text-white/80">イベント履歴を読み込み中です...</div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50/80 p-6 text-center text-red-700">
        <p className="font-medium">{error}</p>
        <button
          type="button"
          onClick={loadHistory}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 transition"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (formattedEvents.length === 0) {
    return (
      <div className="rounded-lg bg-white/10 p-8 text-center text-white/80">
        終了したイベントはまだありません。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">イベント履歴</h1>
        <p className="mt-2 text-sm text-white/70">
          終了済みのイベントを一覧できます。各イベントの「投票結果を見る」から詳細な順位・得票数を確認できます。
        </p>
      </div>

      <div className="space-y-4">
        {formattedEvents.map((event) => (
          <div
            key={event.id}
            className="rounded-xl bg-white/95 p-6 shadow-lg ring-1 ring-black/5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">{event.typeLabel}</h2>
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                    ラウンド {event.maxRounds}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  開始: {formatDateTime(event.startAt)} ／ 終了: {formatDateTime(event.endAt)}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  使用お題: {event.themes.map((theme) => theme.theme?.content).join(' / ') || '未設定'}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  部屋数: {event.rooms.length}　最大ラウンド: {event.maxRounds}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to={`/events/${event.id}/results`}
                  className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white transition hover:bg-purple-700"
                >
                  投票結果を見る
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
