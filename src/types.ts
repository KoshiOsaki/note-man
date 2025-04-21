/**
 * 生成された記事の型定義
 */
export interface Article {
  title: string;
  content: string;
  tagList: string[];
}

/**
 * 環境変数の型定義
 */
export interface EnvConfig {
  GEMINI_API_KEY: string;
  NOTE_USER: string;
  NOTE_PASSWORD: string;
}
