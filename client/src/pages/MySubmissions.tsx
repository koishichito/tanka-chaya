import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { SubmissionWithContext } from '../types';

interface GroupedSubmissions {
  eventId: string;
  eventType: string;
  eventStatus: string;
  submissions: SubmissionWithContext[];
}

const typeLabelMap: Record<string, string> = {
  night: '夜の歌会',
  day: '昼の歌会',
  seasonal: '季節の歌会',
  daily: '日めくり短歌会'
};

const statusLabelMap: Record<string, string> = {
  scheduled: '開催予定',
  submission: '投稿受付中',
  voting: '投票受付中',
  finished: '終了'
};

export default function MySubmissions() {
  const [submissions, setSubmissions] = useState<SubmissionWithContext[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await api.getMySubmissionsList();
        setSubmissions(data.submissions);
      } catch (err) {
        console.error('Failed to load submissions:', err);
        setError('短歌投稿の取得に失敗しました。時間をおいて再度お試しください。');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, GroupedSubmissions>();

    submissions.forEach((submission) => {
      const event = submission.room?.event;
      if (!event) return;

      const key = event.id;
      if (!map.has(key)) {
        map.set(key, {
          eventId: event.id,
          eventType: event.type,
          eventStatus: event.status,
          submissions: []
        });
      }

      map.get(key)!.submissions.push(submission);
    });

    const result = Array.from(map.values());
    result.forEach((group) => {
      group.submissions.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    });

    return result.sort((a, b) => {
      const dateA = a.submissions[0]?.createdAt ?? '';
      const dateB = b.submissions[0]?.createdAt ?? '';
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [submissions]);

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
    return <div className="text-white/80">投稿履歴を読み込み中です...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50/80 p-6 text-center text-red-700">
        <p className="font-medium">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="rounded-lg bg-white/10 p-8 text-center text-white/80">
        投稿済みの短歌はまだありません。
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold text-white">マイ投稿一覧</h1>
        <p className="mt-2 text-sm text-white/70">
          これまでに投稿した短歌をイベントごとに確認できます。得票数は投稿時点のポイントを表示します。
        </p>
      </div>

      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.eventId} className="rounded-2xl bg-white/95 p-6 text-gray-900 shadow-lg">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-purple-700">
                  {typeLabelMap[group.eventType] ?? group.eventType}
                </h2>
                <p className="text-sm text-gray-600">
                  ステータス: {statusLabelMap[group.eventStatus] ?? group.eventStatus}
                </p>
                <p className="text-xs text-gray-500">
                  最新投稿: {formatDateTime(group.submissions[0]?.createdAt)}
                </p>
              </div>
              {group.eventStatus === 'finished' && (
                <Link
                  to={`/events/${group.eventId}/results`}
                  className="inline-flex items-center justify-center rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-200"
                >
                  このイベントの結果を見る
                </Link>
              )}
            </div>

            <div className="mt-4 space-y-4">
              {group.submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                    <span>投稿日時: {formatDateTime(submission.createdAt)}</span>
                    <span>
                      ラウンド {submission.round}
                      {submission.room?.roomNumber ? ` ／ 第${submission.room.roomNumber}室` : ''}
                    </span>
                    <span>得票数: {submission.points ?? 0} 票</span>
                  </div>
                  <div className="mt-3 rounded-lg bg-purple-50 p-4 text-center text-gray-900">
                    <p className="text-lg">{submission.line1}</p>
                    <p className="text-lg">{submission.line2}</p>
                    <p className="text-lg">{submission.line3}</p>
                    <p className="text-lg">{submission.line4}</p>
                    <p className="text-lg">{submission.line5}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
