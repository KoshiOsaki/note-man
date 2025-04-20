import puppeteer, { Browser, Page, ElementHandle } from "puppeteer";
import { Article } from "./types";
import * as fs from "fs";
import * as path from "path";

/**
 * スクリーンショットを保存するディレクトリを作成
 */
const setupScreenshotDir = (): string => {
  const dir = path.join(process.cwd(), "screenshots");
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
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
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
      const html = await page.evaluate((el) => el.outerHTML, element);
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

    // ログイン情報入力
    await page.waitForSelector("input#email");
    await logPageContent(page, "input#email");
    await page.waitForTimeout(500);
    await page.focus("input#email");
    await page.waitForTimeout(500);
    await page.type("input#email", noteUser);
    await page.waitForTimeout(500);

    await page.waitForSelector("input#password");
    await logPageContent(page, "input#password");
    await page.waitForTimeout(500);
    await page.focus("input#password");
    await page.waitForTimeout(500);
    await page.type("input#password", notePassword);
    await page.waitForTimeout(500);

    // ログインボタンクリック
    await page.waitForSelector("div.o-login__mail button.a-button");
    await logPageContent(page, "div.o-login__mail button.a-button");
    await page.waitForTimeout(500);
    await page.click("div.o-login__mail button.a-button");

    // ログイン完了を待機
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    console.log("ログイン完了");
    await page.waitForTimeout(1000); // ログイン後2秒待機

    // 各記事を投稿
    for (const [index, article] of articles.entries()) {
      // 右上の投稿ボタンをクリック
      const postButtonSelector = "button[aria-label='投稿']";
      await page.waitForSelector(postButtonSelector);
      await logPageContent(page, postButtonSelector);
      await page.waitForTimeout(500);
      await page.click(postButtonSelector);
      await page.waitForTimeout(500); // モーダル表示を待機

      // モーダルからテキスト投稿を選択
      const textPostSelector =
        "a.m-navbarPostings__itemLink[href='/notes/new']";
      await page.waitForSelector(textPostSelector);
      await logPageContent(page, textPostSelector);
      await page.waitForTimeout(500);
      await page.click(textPostSelector);

      // エディターページへの遷移を待機
      console.log("エディターページへ遷移中...");
      await page.waitForNavigation({
        waitUntil: "networkidle0",
        timeout: 60000,
      });

      // URLがエディターページかどうか確認
      const currentUrl = page.url();
      console.log(`現在のURL: ${currentUrl}`);

      // エディターページのURLパターンを確認
      const isEditorPage =
        currentUrl.includes("editor.note.com/notes/") &&
        currentUrl.includes("/edit");
      if (isEditorPage) {
        console.log("エディターページに正常に遷移しました");
      } else {
        console.log("エディターページへの遷移に失敗した可能性があります");
        // 追加の処理が必要な場合はここに記述
      }

      await page.waitForTimeout(3000); // エディターページ読み込み後3秒待機

      // タイトル入力
      await page.waitForSelector(
        "textarea.cfYOJX, textarea[placeholder='記事タイトル']",
        { timeout: 30000 }
      );
      await logPageContent(
        page,
        "textarea.cfYOJX, textarea[placeholder='記事タイトル']"
      );
      await page.waitForTimeout(1000);
      await page.focus("textarea.cfYOJX, textarea[placeholder='記事タイトル']");
      await page.waitForTimeout(500);
      await page.type(
        "textarea.cfYOJX, textarea[placeholder='記事タイトル']",
        article.title
      );
      await page.waitForTimeout(1000);
      await takeScreenshot(page, `article${index + 1}-title-input`);

      // 本文入力
      await page.waitForSelector(
        "div.ProseMirror[contenteditable='true'][role='textbox']",
        { timeout: 30000 }
      );
      await logPageContent(
        page,
        "div.ProseMirror[contenteditable='true'][role='textbox']"
      );
      await page.waitForTimeout(1000);
      await page.click(
        "div.ProseMirror[contenteditable='true'][role='textbox']"
      );

      // 本文を直接入力（Markdownモードを使用しない）
      console.log("本文入力中...");
      await page.waitForSelector(
        "div.ProseMirror[contenteditable='true'][role='textbox']"
      );
      await page.focus(
        "div.ProseMirror[contenteditable='true'][role='textbox']"
      );
      await page.keyboard.type(article.content);
      await page.waitForTimeout(1000);

      // 画像を挿入
      console.log("画像を挿入中...");
      const imagePath = path.resolve(__dirname, "../tmp/demo-image.png");

      // 画像ファイルが存在するか確認
      if (fs.existsSync(imagePath)) {
        console.log(`画像ファイルが見つかりました: ${imagePath}`);

        try {
          // 画像追加ボタンをクリック
          console.log("画像追加ボタンをクリック...");
          await page.waitForSelector('button[aria-label="画像を追加"]');
          await page.click('button[aria-label="画像を追加"]');
          await page.waitForTimeout(2000);
          await takeScreenshot(
            page,
            `article${index + 1}-add-image-button-click`
          );

          // 隠れたinput[type="file"]要素を直接操作
          console.log("隠れたinput[type='file']要素を探しています...");
          await page.waitForSelector("#note-editor-image-upload-input", {
            hidden: true,
          });

          // ファイルをアップロード
          console.log("ファイルをアップロードしています...");
          const fileInput = await page.$("#note-editor-image-upload-input");
          if (fileInput) {
            await (fileInput as ElementHandle<HTMLInputElement>).uploadFile(
              imagePath
            );
            console.log("ファイルをアップロードしました");

            // アップロード完了を待つ
            console.log("画像アップロード中...");
            await page.waitForTimeout(5000); // アップロード処理のための待機時間
            await takeScreenshot(
              page,
              `article${index + 1}-image-upload-attempt`
            );

            // 画像が表示されているか確認を試みる
            try {
              await page.waitForSelector(
                'figure img, img[src*="st-note.com"]',
                { timeout: 10000 }
              );
              console.log("画像アップロード完了");
              await takeScreenshot(page, `article${index + 1}-image-inserted`);
            } catch (imgError) {
              console.log(
                "画像の表示を確認できませんでしたが、処理を続行します"
              );
            }
          } else {
            console.log("input[type='file']要素が見つかりませんでした");
          }
        } catch (imageError) {
          console.error("画像挿入中にエラーが発生しました:", imageError);
          // エラー発生時もスクリーンショットを撮影
          await takeScreenshot(page, `article${index + 1}-image-error`);
        }
      } else {
        console.warn(`画像ファイルが見つかりません: ${imagePath}`);
      }

      // 投稿ボタンをクリック
      console.log("投稿ボタンクリック...");
      await page.waitForSelector("button:has-text('公開に進む')");
      await logPageContent(page, "button:has-text('公開に進む')");
      await page.waitForTimeout(1000);
      await page.click("button:has-text('公開に進む')");
      await takeScreenshot(page, `article${index + 1}-publish-click`);

      // 公開設定ダイアログでの「公開」ボタンをクリック
      console.log("公開設定ダイアログの公開ボタンクリック...");
      await page.waitForSelector("button:has-text('公開する')");
      await logPageContent(page, "button:has-text('公開する')");
      await page.waitForTimeout(1000);
      await page.click("button:has-text('公開する')");
      await takeScreenshot(page, `article${index + 1}-final-publish`);

      // 投稿完了を待機
      console.log("投稿処理中...");
      await page.waitForNavigation({
        waitUntil: "networkidle0",
        timeout: 60000,
      }); // タイムアウトを60秒に延長
      console.log(`記事${index + 1}「${article.title}」の投稿が完了しました`);
      await page.waitForTimeout(3000); // 投稿後3秒待機
      await takeScreenshot(page, `article${index + 1}-published`);

      // 投稿間隔を空ける（API制限回避）
      if (index < articles.length - 1) {
        console.log("次の記事投稿まで10秒待機します...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
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
      console.error(
        "エラー状態のスクリーンショット撮影に失敗:",
        screenshotError
      );
    }
    throw error;
  } finally {
    await browser.close();
  }
};
