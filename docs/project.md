# プロダクト概要

本プロダクトは、Gemini API と Puppeteer を組み合わせて Note へ自動投稿を行う PoC（Proof of Concept）です。  
主な特徴は以下の通りです。

## 主要機能

- **自動投稿機能**  
  - 毎朝 8:00 に GitHub Actions からトリガーされ、3 本の記事を自動生成・投稿します。  
  - TypeScriptで実装され、モジュール化された構造で保守性を高めています。

- **コンテンツ生成エンジン**  
  - Google Gemini API を利用し、事前に用意した長文プロンプト（`default-prompt.md`）をもとに記事本文を生成します。
  - 多様なプロンプトに対応可能な柔軟な設計で、様々なジャンルの記事生成に対応できます。
  - 読者の興味を引く独自コンテンツを効率的に生成します。

- **実装スコープ**  
  - 30 時間程度で開発完了を目指す小規模 PoC として設計。
  - 最小限の機能に絞り込み、実用性を検証することを目的としています。

- **セキュリティ**  
  - API Key やログイン情報は GitHub Secrets／`.env` で安全に管理します。
  - 環境変数を使用し、コード内に機密情報を含めない設計になっています。

## 技術スタック

- **言語・フレームワーク**
  - TypeScript: 型安全性と保守性を確保
  - Node.js: サーバーサイドJavaScript実行環境

- **主要ライブラリ**
  - Puppeteer: ヘッドレスブラウザによる自動操作
  - Google Generative AI SDK: Gemini APIとの連携
  - dotenv: 環境変数管理

- **CI/CD**
  - GitHub Actions: 自動実行とワークフロー管理
  - Slack通知: 実行結果の通知

## コンテンツ戦略

- **柔軟なプロンプト管理**
  - 多様なプロンプトを簡単に追加・変更できる設計
  - ニーズや反応に応じて記事の方向性を迅速に調整可能

- **差別化ポイント**
  - AIによる効率的な記事生成と人間による編集の最適なバランス
  - 読者の関心に合わせたコンテンツ提供を実現