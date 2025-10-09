# 2025-10-09 終了イベント結果 & マイ投稿閲覧機能 追加記録

## サーバー側の変更
- `server/src/routes/events.ts` に `/api/events/history` を追加し、終了済みイベントと付随するテーマ・部屋情報を取得可能にした。
- `server/src/routes/submissions.ts` に `/api/submissions/mine` を追加し、ログインユーザーの投稿履歴をイベント情報付きで返却。
- `server/src/routes/rankings.ts` のイベントランキングレスポンスへ部屋番号情報を含め、前述の機能から部屋別・ラウンド別に集計できるように補強。

## フロントエンドの変更
- `client/src/components/AppLayout.tsx` のヘッダーに「イベント履歴」「マイ投稿」「管理画面(管理者のみ)」のナビゲーションを追加。
- 新規ページ
  - `client/src/pages/EventHistory.tsx`：終了イベント一覧と結果ページへの導線を表示。
  - `client/src/pages/EventResults.tsx`：部屋／ラウンドを切り替えながら投票結果を閲覧可能。
  - `client/src/pages/MySubmissions.tsx`：ユーザー自身の投稿短歌をイベントごとに表示し、結果ページへのリンクを提供。
- `client/src/App.tsx` に上記ページ用ルートを追加 (`/events/history`, `/events/:eventId/results`, `/my/submissions`)。
- `client/src/services/api.ts` にイベント履歴・マイ投稿取得メソッドを追加。

## ビルド・デプロイ
```powershell
cd client
npm run build
cd ..
railway up client --service client --path-as-root
```
Railway デプロイ ID `26b5f919-4bd6-4915-b459-27b744019cae` が SUCCESS であることを確認済み。

## 動作確認チェックリスト
1. ログイン後、ヘッダーに「イベント履歴」「マイ投稿」が表示され、いつでもホームに戻れること。
2. `/events/history` で終了したイベント一覧が表示され、各イベントの「投票結果を見る」から `/events/{id}/results` に遷移できる。
3. イベント結果ページで部屋／ラウンドを切り替えると当該条件の投票結果が表示される。未終了イベントでは閲覧不可メッセージが出る。
4. `/my/submissions` で自身の投稿短歌がイベントごとに一覧表示され、終了イベントについては結果ページへのリンクが表示される。
5. 既存機能（参加・投稿・投票・管理画面など）が影響を受けていないことを簡易動作確認。

## 補足
- イベント結果・マイ投稿ともに API は JWT を利用した認証が必要なため、ログイン済みでアクセスすること。
- 一部 UI テキストは既存スタイルに合わせ日本語表示で実装。
