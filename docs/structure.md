# 全体構成とディレクトリ構成

```
├── .github
│   └── workflows
│       └── auto-post.yml    # GitHub Actions スケジュール定義
├── docs
│   ├── project.md           # プロダクト概要
│   ├── structure.md         # 本ファイル：構成説明
├── src
│   ├── index.ts             # エントリーポイント
│   ├── types.ts             # 型定義
│   ├── prompt-loader.ts     # プロンプト読み込みモジュール
│   ├── article-generator.ts # 記事生成モジュール
│   └── note-poster.ts       # Note投稿モジュール
├── dist                     # ビルド出力ディレクトリ（gitignore対象）
├── default-prompt.md        # 記事生成用プロンプト集
├── .env.example             # 環境変数テンプレート
├── .gitignore               # Git除外設定
├── tsconfig.json            # TypeScript設定
├── package.json             # 依存パッケージ定義
└── README.md                # 環境構築／実行手順

## 各ディレクトリ・ファイルの解説

### コア機能

- **src/index.ts**
  アプリケーションのエントリーポイント。環境変数の検証、各モジュールの呼び出し、エラーハンドリングを行います。

- **src/types.ts**
  プロジェクト全体で使用する型定義を集約。`Article`インターフェースや環境変数の型などを定義しています。

- **src/prompt-loader.ts**
  プロンプトファイルを読み込み、記事ごとに分割する機能を提供します。

- **src/article-generator.ts**
  Gemini APIを使用して記事を生成するモジュール。プロンプトを受け取り、タイトルと本文を含む記事オブジェクトを返します。

- **src/note-poster.ts**
  Puppeteerを使用してNoteにログインし、記事を投稿する機能を提供します。

### 設定ファイル

- **.github/workflows/auto-post.yml**
  GitHub Actions の `schedule` トリガーと実行手順を定義。毎朝 8:00 JST（UTC23:00）に自動実行します。

- **tsconfig.json**
  TypeScriptのコンパイル設定。ES2020をターゲットとし、厳格な型チェックを有効にしています。

- **.env / .env.example**
  環境変数の管理。API KeyやNoteのログイン情報を安全に保存します。

### コンテンツ

- **default-prompt.md**
  3 本分の記事生成用プロンプトをまとめたファイル。長文のプロンプトを構造化して管理しています。

### ドキュメント

- **docs/**
  ドキュメント格納用フォルダ。PoCの要件やタスクを整理し、チーム共有をスムーズにします。

- **README.md**
  プロジェクトの概要、セットアップ手順、実行方法などを記載したメインドキュメント。
```
