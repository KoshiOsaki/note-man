import 'dotenv/config';
import { loadPrompts } from './prompt-loader';
import { generateWithGemini } from './article-generator';
import { postToNote } from './note-poster';
import { Article, EnvConfig } from './types';

/**
 * 環境変数の検証
 * @returns 検証済みの環境変数
 */
const validateEnv = (): EnvConfig => {
  const { GEMINI_API_KEY, NOTE_USER, NOTE_PASSWORD } = process.env;
  
  if (!GEMINI_API_KEY || !NOTE_USER || !NOTE_PASSWORD) {
    console.error('環境変数が設定されていません。.envファイルを確認してください。');
    process.exit(1);
  }
  
  return { GEMINI_API_KEY, NOTE_USER, NOTE_PASSWORD };
};

/**
 * メイン実行関数
 */
const main = async (): Promise<void> => {
  console.log('Note自動投稿ツールを開始します');
  
  try {
    // 環境変数の検証
    const env = validateEnv();
    
    // プロンプトの読み込み
    const prompts = loadPrompts();
    
    // 記事の生成（最大3本）
    const articlePromises = prompts.slice(0, 3).map(prompt => 
      generateWithGemini(prompt, env.GEMINI_API_KEY)
    );
    const articles: Article[] = await Promise.all(articlePromises);
    
    // Noteへの投稿
    await postToNote(articles, env.NOTE_USER, env.NOTE_PASSWORD);
    
    console.log('処理が正常に完了しました');
  } catch (error) {
    console.error('処理中にエラーが発生しました:', error);
    process.exit(1);
  }
};

// スクリプト実行
main().catch(error => {
  console.error('予期せぬエラーが発生しました:', error);
  process.exit(1);
});
