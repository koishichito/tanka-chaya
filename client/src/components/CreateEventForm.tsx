import { useState } from 'react';
import { api } from '../services/api';

interface Props {
  onSuccess: () => void;
}

export default function CreateEventForm({ onSuccess }: Props) {
  const [type, setType] = useState('night');
  const [maxRounds, setMaxRounds] = useState(6);
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [themes, setThemes] = useState<string[]>(Array(6).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleThemeChange = (index: number, value: string) => {
    const newThemes = [...themes];
    newThemes[index] = value;
    setThemes(newThemes);
  };

  const handleMaxRoundsChange = (newMax: number) => {
    setMaxRounds(newMax);
    const newThemes = Array(newMax).fill('');
    themes.slice(0, newMax).forEach((theme, i) => {
      newThemes[i] = theme;
    });
    setThemes(newThemes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (themes.some(t => !t.trim())) {
      alert('全てのお題を入力してください');
      return;
    }

    if (scheduledStart && scheduledEnd) {
      const start = new Date(scheduledStart);
      const end = new Date(scheduledEnd);

      if (start >= end) {
        alert('終了時刻は開始時刻より後にしてください');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await api.createEvent({
        type,
        maxRounds,
        scheduledStart: scheduledStart || null,
        scheduledEnd: scheduledEnd || null,
        themes
      });

      alert('イベントを作成しました！');
      onSuccess();
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('イベントの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">新規イベント作成</h3>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            イベントタイプ
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="night">夜の歌会</option>
            <option value="day">昼の歌会</option>
            <option value="seasonal">季節の歌会</option>
            <option value="daily">日めくり短歌会</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ラウンド数
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={maxRounds}
            onChange={(e) => handleMaxRoundsChange(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            開始時刻（任意）
          </label>
          <input
            type="datetime-local"
            value={scheduledStart}
            onChange={(e) => setScheduledStart(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            終了時刻（任意）
          </label>
          <input
            type="datetime-local"
            value={scheduledEnd}
            onChange={(e) => setScheduledEnd(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          各ラウンドのお題（{maxRounds}個）
        </label>
        <div className="space-y-2">
          {themes.map((theme, index) => (
            <input
              key={index}
              type="text"
              value={theme}
              onChange={(e) => handleThemeChange(index, e.target.value)}
              placeholder={`ラウンド${index + 1}のお題`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
      >
        {isSubmitting ? '作成中...' : 'イベントを作成'}
      </button>
    </form>
  );
}
