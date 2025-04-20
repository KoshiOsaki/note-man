# 🚀 Note 自動投稿ツール (PoC)

## 概要
- Gemini API を使って記事を自動生成し、Puppeteer 経由で Note へ投稿する PoC ツールです。  
- GitHub Actions で毎朝 8:00 JST に自動実行します。

---

## 前提条件
- Node.js v16 以上がインストールされていること
- GitHub リポジトリ／GCP 環境は既に作成済み
- Gemini API Key と Note の認証情報を発行済み

---

## セットアップ

1. リポジトリをクローン  
   ```bash
   git clone git@github.com:your-org/your-repo.git
   cd your-repo
   ```

2. 環境変数ファイルを準備
   ```bash
   cp .env.example .env
   # .env に以下を設定
   # GEMINI_API_KEY=your_gemini_api_key
   # NOTE_USER=あなたのnoteユーザー名
   # NOTE_PASSWORD=あなたのnoteパスワード
   ```

3. 依存パッケージをインストール
   ```bash
   npm ci
   ```

## 実行方法
### ローカル実行
```bash
node post_note.js
```

### GitHub Actions
`.github/workflows/auto-post.yml` により、毎朝 8:00 JST（UTC23:00）に自動実行されます。

必要な Secrets（GEMINI_API_KEY、NOTE_USER、NOTE_PASSWORD）を GitHub リポジトリに登録してください。

## Folder Structure
- `docs/`：仕様書・構成図・タスク管理
- `default-prompt.md`：記事生成用プロンプト
- `post_note.js`：自動投稿スクリプト本体
- `.github/workflows/auto-post.yml`：スケジュール定義

## 運用・トラブルシュート
### 投稿に失敗した場合
- Actions のログを確認し、認証エラーやセレクタの変更箇所を修正してください。

### Gemini API の制限超過
- 適宜プロンプトや投稿本数を調整／待機時間を挿入してください。