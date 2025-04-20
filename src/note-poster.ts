import puppeteer, { Browser, Page } from 'puppeteer';
import { Article } from './types';

/**
 * Puppeteerを使用してNoteにログインし、記事を投稿する
 * @param articles 投稿する記事の配列
 * @param noteUser Noteのユーザー名（メールアドレス）
 * @param notePassword Noteのパスワード
 */
export const postToNote = async (
  articles: Article[], 
  noteUser: string, 
  notePassword: string
): Promise<void> => {
  console.log('Noteへの投稿を開始します...');
  
  const browser: Browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page: Page = await browser.newPage();
    
    // Noteにログイン
    console.log('Noteにログイン中...');
    await page.goto('https://note.com/login');
    
    // メールアドレスでログイン
    await page.waitForSelector('button.o-loginForm__mailButton');
    await page.click('button.o-loginForm__mailButton');
    
    // ログイン情報入力
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', noteUser);
    await page.type('input[type="password"]', notePassword);
    
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
};
