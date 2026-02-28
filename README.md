# VRM Chat App

このアプリを `git clone` して使い始めるための手順をまとめます。

## 前提

- Node.js と npm がインストール済み

## セットアップ手順

1. リポジトリを取得して移動

```bash
git clone https://github.com/Takashi-Iskw/vrm-chat-app.git
cd vrm-chat-app
```

2. 依存関係をインストール

```bash
npm install
```

3. 環境変数ファイルを作成して編集

```bash
cp .env.example .env.local
```

`.env.local` を開き、以下を必要に応じて書き換えます。

- `OPENAI_API_KEY`  
  自分の OpenAI API キーを設定してください。
- `NEXT_PUBLIC_OPENAI_TTS_VOICE`  
  OPENAI APIの音声の種類を指定します（例: `sage`）。
- `NEXT_PUBLIC_BG_IMAGE`  
  背景画像ファイル名を指定します（例: `bar.png`）。
- `OPENAI_SYSTEM_PROMPT`  
  システムプロンプトを用途に合わせて調整します。

4. アプリを起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開くとアプリが起動します。

## よくある操作

- 本番ビルド

```bash
npm run build
```

- 本番起動（ビルド後）

```bash
npm run start
```
