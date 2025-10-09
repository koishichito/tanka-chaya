import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Event } from '../types';

interface RankedSubmission {
  id: string;
  line1: string;
  line2: string;
  line3: string;
  line4: string;
  line5: string;
  points: number;
  round: number;
  room?: {
    id: string;
    roomNumber: number;
  };
  user: {
    id: string;
    displayName: string;
  };
}

export default function EventResults() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [rankings, setRankings] = useState<RankedSubmission[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [eventResponse, rankingsResponse] = await Promise.all([
          api.getEvent(eventId),
          api.getEventRankings(eventId)
        ]);

        setEvent(eventResponse.event);
        const rankingData: RankedSubmission[] = rankingsResponse.rankings ?? [];
        setRankings(rankingData);

        if (rankingData.length > 0) {
          const first = rankingData[0];
          setSelectedRoomId(first.room?.id ?? null);
          setSelectedRound(first.round);
        }
      } catch (err) {
        console.error('Failed to load event results:', err);
        setError('投票結果の取得に失敗しました。時間をおいて再度お試しください。');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [eventId]);

  const uniqueRooms = useMemo(() => {
    const map = new Map<string, number>();
    rankings.forEach((submission) => {
      if (submission.room) {
        map.set(submission.room.id, submission.room.roomNumber);
      }
    });
    return Array.from(map.entries())
      .map(([id, roomNumber]) => ({ id, roomNumber }))
      .sort((a, b) => a.roomNumber - b.roomNumber);
  }, [rankings]);

  const uniqueRounds = useMemo(() => {
    const set = new Set<number>();
    rankings.forEach((submission) => set.add(submission.round));
    return Array.from(set).sort((a, b) => a - b);
  }, [rankings]);

  const filteredRankings = useMemo(() => {
    return rankings
      .filter((submission) => {
        if (selectedRoomId && submission.room?.id !== selectedRoomId) return false;
        if (selectedRound !== null && submission.round !== selectedRound) return false;
        return true;
      })
      .sort((a, b) => b.points - a.points);
  }, [rankings, selectedRoomId, selectedRound]);

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

  if (!eventId) {
    return <div className="text-white/80">イベントIDが指定されていません。</div>;
  }

  if (isLoading) {
    return <div className="text-white/80">投票結果を読み込み中です...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50/80 p-6 text-center text-red-700">
        <p className="font-medium">{error}</p>
        <Link
          to="/events/history"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700"
        >
          イベント履歴へ戻る
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="rounded-lg bg-white/10 p-6 text-center text-white/80">
        イベント情報が見つかりませんでした。
      </div>
    );
  }

  if (event.status !== 'finished') {
    return (
      <div className="rounded-lg bg-yellow-500/20 p-6 text-center text-yellow-100">
        このイベントはまだ終了していないため、投票結果は公開されていません。
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">イベント結果</h1>
          <p className="mt-2 text-sm text-white/70">
            イベント終了日時: {formatDateTime(event.endTime || event.scheduledEnd)}
          </p>
        </div>
        <Link
          to="/events/history"
          className="inline-flex items-center justify-center rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
        >
          ← イベント履歴へ戻る
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white/10 p-4">
          <p className="text-xs uppercase tracking-widest text-white/60">イベントタイプ</p>
          <p className="mt-2 text-lg font-semibold text-white">{event.type}</p>
        </div>
        <div className="rounded-lg bg-white/10 p-4">
          <p className="text-xs uppercase tracking-widest text-white/60">開催ラウンド</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {event.currentRound} / {event.maxRounds}
          </p>
        </div>
        <div className="rounded-lg bg-white/10 p-4">
          <p className="text-xs uppercase tracking-widest text-white/60">お題一覧</p>
          <p className="mt-2 text-sm text-white/80">
            {event.themes.map((theme) => theme.theme?.content).join(' / ') || '未設定'}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white/10 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-white/70">部屋:</label>
            <select
              value={selectedRoomId ?? ''}
              onChange={(e) => setSelectedRoomId(e.target.value || null)}
              className="rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-purple-400 focus:outline-none"
            >
              <option value="">すべて</option>
              {uniqueRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  第{room.roomNumber}室
                </option>
              ))}
            </select>
            <label className="text-sm text-white/70">ラウンド:</label>
            <select
              value={selectedRound ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedRound(value ? Number.parseInt(value, 10) : null);
              }}
              className="rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-white focus:border-purple-400 focus:outline-none"
            >
              <option value="">すべて</option>
              {uniqueRounds.map((round) => (
                <option key={round} value={round}>
                  ラウンド {round}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-white/60">
            表示件数: <span className="font-semibold text-white">{filteredRankings.length}</span>
          </div>
        </div>
      </div>

      {filteredRankings.length === 0 ? (
        <div className="rounded-lg bg-white/10 p-8 text-center text-white/80">
          条件に一致する投稿がありません。
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRankings.map((submission, index) => (
            <div
              key={submission.id}
              className={`rounded-xl border border-white/10 bg-white/95 p-6 text-gray-900 shadow-lg ${
                index < 3 ? 'ring-2 ring-purple-400' : ''
              }`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-extrabold text-purple-700">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-purple-700">
                      {submission.user.displayName}
                    </p>
                    <p className="text-xs text-gray-500">
                      ラウンド {submission.round}
                      {submission.room?.roomNumber ? ` ／ 第${submission.room.roomNumber}室` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-gray-400">得票数</p>
                  <p className="text-2xl font-bold text-purple-700">{submission.points} 票</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-white/70 p-4 text-center shadow-inner">
                <p className="text-lg text-gray-900">{submission.line1}</p>
                <p className="text-lg text-gray-900">{submission.line2}</p>
                <p className="text-lg text-gray-900">{submission.line3}</p>
                <p className="text-lg text-gray-900">{submission.line4}</p>
                <p className="text-lg text-gray-900">{submission.line5}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
