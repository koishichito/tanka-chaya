# 短歌茶屋 (Tanka Chaya)

リアルタイムで短歌（五・七・五・七・七形式）を投稿・評価できるWebサービスです。

## 🎯 機能

- **ユーザー認証**: 登録・ログイン機能
- **短歌投稿**: 5行入力UIで短歌を作成・投稿
- **リアルタイム投票**: 参加者数に応じた持ち票で投票
- **結果発表**: ランキング形式で結果を表示
- **イベント管理**: 夜の歌会・昼の歌会など複数のイベントタイプ

## 🛠️ 技術スタック

### バックエンド
- Node.js + Express
- TypeScript
- Prisma (ORM)
- SQLite (開発用)
- Socket.IO (リアルタイム通信)
- JWT認証
- bcrypt (パスワードハッシュ化)

### フロントエンド
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand (状態管理)
- Socket.IO Client

## 📦 セットアップ

### 必要要件
- Node.js 18以上
- npm または yarn

### インストール手順

1. **リポジトリのクローン**
```bash
cd tanka-chaya
```

2. **依存関係のインストール**
```bash
# ルートディレクトリで
npm install

# サーバー
cd server
npm install

# クライアント
cd ../client
npm install
```

3. **データベースのセットアップ**
```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
```

4. **環境変数の設定**
`server/.env`ファイルが既に作成されています。必要に応じて編集してください。

## 🚀 起動方法

### 開発モード

**方法1: 両方を同時に起動（推奨）**
```bash
# ルートディレクトリで
npm run dev
```

**方法2: 個別に起動**

サーバー（ターミナル1）:
```bash
cd server
npm run dev
```

クライアント（ターミナル2）:
```bash
cd client
npm run dev
```

### アクセス

- **クライアント**: http://localhost:5173
- **サーバーAPI**: http://localhost:3000

## 📝 使い方

1. **ユーザー登録**
   - 表示名、メールアドレス、パスワードを入力して登録

2. **イベントに参加**
   - ホーム画面から「イベントに参加」をクリック
   - 自動的にルームに割り当てられます

3. **短歌を詠む**
   - お題に沿って5行（五・七・五・七・七）の短歌を入力
   - プレビューで確認して投稿
   - 締切まで何度でも編集可能

4. **投票**
   - 他の参加者の短歌を読んで投票
   - 持ち票は参加者数÷10（四捨五入）
   - 1作品に最大3票まで投票可能
   - 全ての持ち票を使い切る必要あり

5. **結果発表**
   - 得票数順にランキング表示
   - 上位3名にはメダル表示

## 🔧 開発コマンド

### サーバー
```bash
npm run dev          # 開発サーバー起動
npm run build        # TypeScriptビルド
npm start            # 本番サーバー起動
npx prisma studio    # データベースGUI
npx prisma generate  # Prisma Clientを生成
```

### クライアント
```bash
npm run dev     # 開発サーバー起動
npm run build   # 本番ビルド
npm run preview # ビルド結果のプレビュー
```

## 📂 ディレクトリ構造

```
tanka-chaya/
├── server/              # バックエンド
│   ├── src/
│   │   ├── routes/      # APIルート
│   │   ├── services/    # ビジネスロジック
│   │   ├── socket/      # Socket.IOハンドラ
│   │   ├── middleware/  # 認証ミドルウェア
│   │   └── index.ts     # エントリーポイント
│   ├── prisma/          # DBスキーマ
│   └── package.json
├── client/              # フロントエンド
│   ├── src/
│   │   ├── components/  # Reactコンポーネント
│   │   ├── pages/       # ページコンポーネント
│   │   ├── hooks/       # カスタムフック
│   │   ├── services/    # API・Socket通信
│   │   ├── types/       # TypeScript型定義
│   │   └── styles/      # スタイル
│   └── package.json
└── README.md
```

## 🎮 MVP実装済み機能

✅ ユーザー認証（登録・ログイン）
✅ 短歌投稿（5行入力UI）
✅ 投票システム（持ち票計算）
✅ 結果表示・ランキング
✅ リアルタイム通信（Socket.IO）
✅ イベント管理の基礎
✅ レスポンシブデザイン

## 🚧 今後の拡張機能

- [ ] 部屋分割（80人超過時）
- [ ] 決勝戦システム
- [ ] 日めくり短歌会
- [ ] スケジューラー（自動イベント開催）
- [ ] お題投稿機能
- [ ] 管理ダッシュボード
- [ ] 不正対策（多重投票検知）
- [ ] シーズン制・ポイントシステム
- [ ] メダル授与システム
- [ ] OGP画像生成
- [ ] SNS共有機能

## 📄 ライセンス

MIT

## 🤝 貢献

プルリクエストを歓迎します！

---

**短歌茶屋** - 短歌で遊ぶ、短歌で競う 🎴