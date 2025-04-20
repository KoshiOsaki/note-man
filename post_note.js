require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 環境変数から認証情報を取得
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NOTE_USER = process.env.NOTE_USER;
const NOTE_PASSWORD = process.env.NOTE_PASSWORD;

// Gemini APIの初期化
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * プロンプトファイルを読み込み、記事ごとに分割する
 * @returns {Array<string>} 記事ごとのプロンプト配列
 */
function loadPrompts() {
  try {
    const promptContent = fs.readFileSync('./default-prompt.md', 'utf8');
    // ## 記事1, ## 記事2, ## 記事3 で分割
    const articlePrompts = promptContent.split(/## 記事\d+：/).slice(1);
    
    if (articlePrompts.length === 0) {
      throw new Error('プロンプトファイルから記事プロンプトを抽出できませんでした');
    }
    
    console.log(`${articlePrompts.length}個の記事プロンプトを読み込みました`);
    return articlePrompts;
  } catch (error) {
    console.error('プロンプトファイルの読み込みに失敗しました:', error);
    process.exit(1);
  }
}

/**
 * Gemini APIを使用して記事を生成する
 * @param {string} prompt 記事生成用プロンプト
 * @returns {Promise<{title: string, content: string}>} 生成された記事のタイトルと本文
 */
async function generateWithGemini(prompt) {
  try {
    console.log('Gemini APIで記事を生成中...');
    
    // モデルの設定
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // 記事の生成
    const result = await model.generateContent(`以下のプロンプトに基づいて、noteに投稿する記事を作成してください。
記事のタイトルと本文を明確に分けて出力してください。

${prompt}`);
    
    const response = result.response;
    const text = response.text();
    
    // タイトルと本文を分離
    const titleMatch = text.match(/^#\s+(.+?)$|^(.+?)[\n\r]/m);
    const title = titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : '無題の記事';
    
    // タイトル行を除いた残りを本文とする
    let content = text.replace(/^#\s+.+?$|^.+?[\n\r]/m, '').trim();
    
    console.log(`記事「${title}」を生成しました`);
    return { title, content };
  } catch (error) {
    console.error('Gemini APIでの記事生成に失敗しました:', error);
    return { title: 'エラー発生', content: 'APIエラーが発生したため記事を生成できませんでした。' };
  }
}

/**
 * Puppeteerを使用してNoteにログインし、記事を投稿する
 * @param {Array<{title: string, content: string}>} articles 投稿する記事の配列
 */
async function postToNote(articles) {
  console.log('Noteへの投稿を開始します...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Noteにログイン
    console.log('Noteにログイン中...');
    await page.goto('https://note.com/login');
    
    // メールアドレスでログイン
    await page.waitForSelector('button.o-loginForm__mailButton');
    await page.click('button.o-loginForm__mailButton');
    
    // ログイン情報入力
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', NOTE_USER);
    await page.type('input[type="password"]', NOTE_PASSWORD);
    
    // ログインボタンクリック
    await page.click('button[type="submit"]');
    
    // ログイン完了を待機
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('ログイン完了');
    
    // 各記事を投稿
    for (const [index, article] of articles.entries()) {
      console.log(`記事${index + 1}「${article.title}」の投稿を開始します...`);
      
      // 新規投稿ページに移動
      await page.goto('https://note.com/write');
      
      // タイトル入力
      await page.waitForSelector('textarea.p-editor__title');
      await page.type('textarea.p-editor__title', article.title);
      
      // 本文入力（Markdown形式）
      await page.waitForSelector('div.tiptap');
      await page.click('div.tiptap');
      
      // Markdownモードに切り替え
      await page.waitForSelector('button[aria-label="Markdown"]');
      await page.click('button[aria-label="Markdown"]');
      
      // Markdownエディタに本文を入力
      await page.waitForSelector('textarea.p-editor__markdown');
      await page.type('textarea.p-editor__markdown', article.content);
      
      // 投稿ボタンをクリック
      await page.waitForSelector('button.p-editor__actionPublish');
      await page.click('button.p-editor__actionPublish');
      
      // 公開設定ダイアログでの「公開」ボタンをクリック
      await page.waitForSelector('button.o-notePublishModal__actionPublish');
      await page.click('button.o-notePublishModal__actionPublish');
      
      // 投稿完了を待機
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      console.log(`記事${index + 1}「${article.title}」の投稿が完了しました`);
      
      // 投稿間隔を空ける（API制限回避）
      if (index < articles.length - 1) {
        console.log('次の記事投稿まで10秒待機します...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    console.log('すべての記事の投稿が完了しました');
  } catch (error) {
    console.error('Noteへの投稿中にエラーが発生しました:', error);
  } finally {
    await browser.close();
  }
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('Note自動投稿ツールを開始します');
  
  // 環境変数のチェック
  if (!GEMINI_API_KEY || !NOTE_USER || !NOTE_PASSWORD) {
    console.error('環境変数が設定されていません。.envファイルを確認してください。');
    process.exit(1);
  }
  
  try {
    // プロンプトの読み込み
    const prompts = loadPrompts();
    
    // 記事の生成（最大3本）
    const articlePromises = prompts.slice(0, 3).map(prompt => generateWithGemini(prompt));
    const articles = await Promise.all(articlePromises);
    
    // Noteへの投稿
    await postToNote(articles);
    
    console.log('処理が正常に完了しました');
  } catch (error) {
    console.error('処理中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
main();
