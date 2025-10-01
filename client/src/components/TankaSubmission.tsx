import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { notifySubmissionComplete } from '../services/socket';
import { Submission } from '../types';

interface Props {
  roomId: string;
  round: number;
  existingSubmission: Submission | null;
  onComplete: () => void;
}

const LINE_LENGTHS = [5, 7, 5, 7, 7];
const LINE_LABELS = ['上の句 (5)', '(7)', '中の句 (5)', '(7)', '下の句 (7)'];

export default function TankaSubmission({ roomId, round, existingSubmission, onComplete }: Props) {
  const [lines, setLines] = useState<string[]>(['', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warnings, setWarnings] = useState<boolean[]>([false, false, false, false, false]);

  useEffect(() => {
    if (existingSubmission) {
      setLines([
        existingSubmission.line1,
        existingSubmission.line2,
        existingSubmission.line3,
        existingSubmission.line4,
        existingSubmission.line5
      ]);
    }
  }, [existingSubmission]);

  const handleLineChange = (index: number, value: string) => {
    const newLines = [...lines];
    newLines[index] = value;
    setLines(newLines);

    // Check length warning (not strict)
    const newWarnings = [...warnings];
    const expectedLength = LINE_LENGTHS[index];
    const actualLength = value.length;
    newWarnings[index] = actualLength > 0 && Math.abs(actualLength - expectedLength) > 2;
    setWarnings(newWarnings);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lines.some(line => !line.trim())) {
      alert('全ての行を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitTanka(roomId, round, lines);
      notifySubmissionComplete(roomId);
      alert('短歌を投稿しました！');
      onComplete();
    } catch (error) {
      console.error('Failed to submit tanka:', error);
      alert('投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        短歌を詠む
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {lines.map((line, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {LINE_LABELS[index]}
            </label>
            <input
              type="text"
              value={line}
              onChange={(e) => handleLineChange(index, e.target.value)}
              placeholder={`${LINE_LENGTHS[index]}文字程度`}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg ${
                warnings[index] ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
              }`}
              maxLength={20}
            />
            {warnings[index] && (
              <p className="text-xs text-yellow-600 mt-1">
                推奨文字数は{LINE_LENGTHS[index]}文字です（現在: {line.length}文字）
              </p>
            )}
          </div>
        ))}

        <div className="pt-4">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">プレビュー:</p>
            <div className="text-center space-y-1">
              {lines.map((line, index) => (
                <p key={index} className="text-lg text-gray-800">
                  {line || '　'}
                </p>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || lines.some(line => !line.trim())}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-semibold text-lg"
          >
            {isSubmitting ? '投稿中...' : existingSubmission ? '更新する' : '投稿する'}
          </button>

          <p className="text-xs text-gray-500 text-center mt-2">
            ※投稿後も締切まで何度でも編集できます
          </p>
        </div>
      </form>
    </div>
  );
}