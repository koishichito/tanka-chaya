import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const login = useAuth((state) => state.login);
  const logout = useAuth((state) => state.logout);
  const isLoading = useAuth((state) => state.isLoading);
  const storeError = useAuth((state) => state.error);
  const user = useAuth((state) => state.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      await login(email, password);
      const currentUser = useAuth.getState().user;

      if (currentUser?.isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        setFormError('このアカウントには管理者権限がありません。');
        logout();
      }
    } catch {
      setFormError('ログインに失敗しました。メールアドレスとパスワードをご確認ください。');
    }
  };

  const errorMessage = formError || storeError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur shadow-2xl rounded-xl overflow-hidden">
          <div className="bg-purple-800 py-6 px-8">
            <h1 className="text-2xl font-bold text-white text-center">短歌茶屋 管理画面</h1>
            <p className="text-purple-200 text-center mt-2 text-sm">WordPress 風の管理ログインポータル</p>
          </div>
          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  管理者メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              {errorMessage && (
                <div className="rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2">
                  {errorMessage}
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {isLoading ? '認証中...' : '管理者としてログイン'}
              </button>
            </form>
          </div>
          <div className="bg-gray-50 px-8 py-4 text-sm text-gray-600 flex flex-col gap-2">
            <p>
              一般ユーザとしてログインする場合は{' '}
              <Link to="/login" className="text-purple-600 hover:underline">
                通常ログインページ
              </Link>
              をご利用ください。
            </p>
            <p>
              管理権限が必要な場合はシステム管理者までお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
