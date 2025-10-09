# 2025-10-09 デプロイ対応まとめ

## 対応内容
- フロントエンド用 Railway サービス `client` を新規作成し、`npm run start` で `vite preview` を起動できるように `client/package.json` へ `start` スクリプトを追加。併せて `client/scripts/start-preview.mjs` を新設して `PORT` 変数を解決する安全なラッパーを実装。
- `client/vite.config.ts` に `preview` 設定を追加し、Railway が付与するドメイン (`client-production-c557.up.railway.app`) を `allowedHosts` に自動登録するよう調整。`PORT`/`HOST` の自動設定にも対応。
- `railway add --service client` でサービスを登録し、`railway variables --service client --set VITE_API_URL=https://backend-production-92870.up.railway.app/api` を設定。`CLIENT_URL` は `https://client-production-c557.up.railway.app` に更新。
- `railway up client --service client --path-as-root` でフロントエンドを再デプロイし、`curl` によるヘルスチェックで 200 応答（`短歌茶屋 - Tanka Chaya` タイトル）を確認。
- バックエンドの TypeScript ビルド失敗要因を解消するため、以下を修正。
  - `server/package.json` の `build` を `prisma generate && tsc` に変更し、生成済み Prisma クライアントが確実に含まれるように調整。
  - `server/src/routes/events.ts` / `submissions.ts` / `votes.ts` / `services/eventManager.ts` に Prisma 型定義を導入し、`noImplicitAny` 警告になっていたクロージャ引数を型付け。集計ロジックでは `reduce` 引数に型を付与。
- `railway up --service backend` を実行してバックエンドを再デプロイし、デプロイメント `0500846d-ceb5-40dd-a0fd-b5cf31a50848` が `SUCCESS` で完了することを確認。

## 実行コマンド抜粋
```powershell
# ビルド確認
npm run build

# 環境変数設定
railway variables --service client --set "VITE_API_URL=https://backend-production-92870.up.railway.app/api"
railway variables --service backend --set "CLIENT_URL=https://client-production-c557.up.railway.app"

# デプロイ
railway up --service backend
railway up client --service client --path-as-root

# 公開確認
curl.exe -s -o - -w "%{http_code}" https://client-production-c557.up.railway.app
```

## 成果物
- フロントエンド公開 URL: `https://client-production-c557.up.railway.app`
- バックエンド公開 URL: `https://backend-production-92870.up.railway.app`
- ビルド結果: `npm run build`（client / server ともに成功）
- Prisma クライアント生成: `npm run build` 内で `prisma generate` が実行される構成に変更済み

## 今後の確認事項
- 鉄道本番環境での `.env` 値（特に API ベース URL や CORS 設定）が期待通りに動作しているか、ブラウザから実際の API 通信を確認する。
- Railway ダッシュボードで `client` サービスに既存のドメインを追加したい場合は、不要なドメインの解放申請が必要（`tanka-chaya-client.up.railway.app` は別サービスに割り当てられており再利用不可）。
