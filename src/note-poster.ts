import puppeteer, { Browser, Page } from 'puppeteer';
import { Article } from './types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * スクリーンショットを保存するディレクトリを作成
 */
const setupScreenshotDir = (): string => {
  const dir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

/**
 * スクリーンショットを撮影して保存
 */
const takeScreenshot = async (page: Page, name: string): Promise<void> => {
  const dir = setupScreenshotDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(dir, `${timestamp}_${name}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`スクリーンショット保存: ${filename}`);
};

/**
 * 現在のページのHTMLを取得してコンソールに出力
 */
const logPageContent = async (page: Page, selector: string): Promise<void> => {
  try {
    const element = await page.$(selector);
    if (element) {
      const html = await page.evaluate(el => el.outerHTML, element);
      console.log(`要素 ${selector} のHTML:`);
      console.log(html);
    } else {
      console.log(`要素 ${selector} が見つかりませんでした`);
    }
  } catch (error) {
    console.error(`HTML取得エラー (${selector}):`, error);
  }
};

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
  console.log("Noteへの投稿を開始します...");

  const browser: Browser = await puppeteer.launch({
    // headless: "new",
    headless: false, // ブラウザウィンドウを表示
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    slowMo: 100, // すべての操作を100ms遅くする
  });

  try {
    const page: Page = await browser.newPage();
    
    // ビューポートを設定
    await page.setViewport({ width: 1280, height: 800 });

    // Noteにログイン
    console.log("Noteにログイン中...");
    await page.goto("https://note.com/login");
    await page.waitForTimeout(2000); // ページ読み込み後2秒待機
    await takeScreenshot(page, "login-page");

    // ログイン情報入力
    console.log("メールアドレス入力中...");
    await page.waitForSelector("input#email");
    await logPageContent(page, "input#email");
    await page.waitForTimeout(1000);
    await page.focus("input#email");
    await page.waitForTimeout(500);
    await page.type("input#email", noteUser, { delay: 100 }); // 入力を遅くする
    await page.waitForTimeout(1000);
    await takeScreenshot(page, "email-input");

    console.log("パスワード入力中...");
    await page.waitForSelector("input#password");
    await logPageContent(page, "input#password");
    await page.waitForTimeout(1000);
    await page.focus("input#password");
    await page.waitForTimeout(500);
    await page.type("input#password", notePassword, { delay: 100 }); // 入力を遅くする
    await page.waitForTimeout(1000);
    await takeScreenshot(page, "password-input");

    // ログインボタンクリック
    console.log("ログインボタンクリック...");
    await page.waitForSelector("button.a-button");
    await logPageContent(page, "button.a-button");
    await page.waitForTimeout(1000);
    await takeScreenshot(page, "before-login-click");
    await page.click("button.a-button");

    // ログイン完了を待機
    console.log("ログイン処理中...");
    await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }); // タイムアウトを60秒に延長
    console.log("ログイン完了");
    await page.waitForTimeout(3000); // ログイン後3秒待機
    await takeScreenshot(page, "after-login");

    // 各記事を投稿
    for (const [index, article] of articles.entries()) {
      console.log(`記事${index + 1}「${article.title}」の投稿を開始します...`);

      // 新規投稿ページに移動
      await page.goto("https://note.com/write");
      await page.waitForTimeout(2000); // ページ読み込み後2秒待機
      await takeScreenshot(page, `article${index+1}-write-page`);

      // タイトル入力
      console.log("タイトル入力中...");
      await page.waitForSelector("textarea.p-editor__title");
      await logPageContent(page, "textarea.p-editor__title");
      await page.waitForTimeout(1000);
      await page.focus("textarea.p-editor__title");
      await page.waitForTimeout(500);
      await page.type("textarea.p-editor__title", article.title, { delay: 100 }); // 入力を遅くする
      await page.waitForTimeout(1000);
      await takeScreenshot(page, `article${index+1}-title-input`);

      // 本文入力（Markdown形式）
      console.log("本文入力中...");
      await page.waitForSelector("div.tiptap");
      await logPageContent(page, "div.tiptap");
      await page.waitForTimeout(1000);
      await page.click("div.tiptap");
      await takeScreenshot(page, `article${index+1}-editor-click`);

      // Markdownモードに切り替え
      console.log("Markdownモードに切り替え中...");
      await page.waitForSelector('button[aria-label="Markdown"]');
      await logPageContent(page, 'button[aria-label="Markdown"]');
      await page.waitForTimeout(1000);
      await page.click('button[aria-label="Markdown"]');
      await takeScreenshot(page, `article${index+1}-markdown-mode`);

      // Markdownエディタに本文を入力
      console.log("Markdown本文入力中...");
      await page.waitForSelector("textarea.p-editor__markdown");
      await logPageContent(page, "textarea.p-editor__markdown");
      await page.waitForTimeout(1000);
      await page.focus("textarea.p-editor__markdown");
      await page.waitForTimeout(500);
      await page.type("textarea.p-editor__markdown", article.content, { delay: 100 }); // 入力を遅くする
      await page.waitForTimeout(1000);
      await takeScreenshot(page, `article${index+1}-content-input`);

      // 投稿ボタンをクリック
      console.log("投稿ボタンクリック...");
      await page.waitForSelector("button.p-editor__actionPublish");
      await logPageContent(page, "button.p-editor__actionPublish");
      await page.waitForTimeout(1000);
      await page.click("button.p-editor__actionPublish");
      await takeScreenshot(page, `article${index+1}-publish-click`);

      // 公開設定ダイアログでの「公開」ボタンをクリック
      console.log("公開設定ダイアログの公開ボタンクリック...");
      await page.waitForSelector("button.o-notePublishModal__actionPublish");
      await logPageContent(page, "button.o-notePublishModal__actionPublish");
      await page.waitForTimeout(1000);
      await page.click("button.o-notePublishModal__actionPublish");
      await takeScreenshot(page, `article${index+1}-final-publish`);

      // 投稿完了を待機
      console.log("投稿処理中...");
      await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }); // タイムアウトを60秒に延長
      console.log(`記事${index + 1}「${article.title}」の投稿が完了しました`);
      await page.waitForTimeout(3000); // 投稿後3秒待機
      await takeScreenshot(page, `article${index+1}-published`);

      // 投稿間隔を空ける（API制限回避）
      if (index < articles.length - 1) {
        console.log("次の記事投稿まで10秒待機します...");
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    console.log("すべての記事の投稿が完了しました");
  } catch (error) {
    console.error("Noteへの投稿中にエラーが発生しました:", error);
    // エラー発生時もスクリーンショットを撮影
    try {
      const page = (await browser.pages())[0];
      if (page) {
        await takeScreenshot(page, "error-state");
      }
    } catch (screenshotError) {
      console.error("エラー状態のスクリーンショット撮影に失敗:", screenshotError);
    }
  } finally {
    await browser.close();
  }
};
