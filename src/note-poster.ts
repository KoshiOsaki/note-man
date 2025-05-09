import puppeteer, { Browser, Page, ElementHandle } from "puppeteer";
import { Article } from "./types";

/**
 * Puppeteerを使用してNoteにログインし、記事を投稿する
 */
export const postToNote = async (
  articles: Article[],
  noteUser: string,
  notePassword: string
): Promise<void> => {
  console.log("Noteへの投稿を開始します...");

  const isLocal =
    process.env.NODE_ENV === "local" || process.env.NODE_ENV === "demo";

  const browser: Browser = await puppeteer.launch({
    // localの場合はブラウザを開く
    headless: isLocal ? false : "new",
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page: Page = await browser.newPage();

    // ビューポートを設定
    await page.setViewport({ width: 1280, height: 800 });

    // Noteにログイン
    await page.goto("https://note.com/login");
    await page.waitForTimeout(1000); // ページ読み込み後1秒待機

    // ログイン情報入力
    await page.waitForSelector("input#email");
    await page.waitForTimeout(200);
    await page.focus("input#email");
    await page.waitForTimeout(200);
    await page.type("input#email", noteUser);
    await page.waitForTimeout(200);

    await page.waitForSelector("input#password");
    await page.waitForTimeout(200);
    await page.focus("input#password");
    await page.waitForTimeout(200);
    await page.type("input#password", notePassword);
    await page.waitForTimeout(200);

    // ログインボタンクリック
    await page.waitForSelector("div.o-login__mail button.a-button");
    await page.waitForTimeout(200);
    await page.click("div.o-login__mail button.a-button");

    // ログイン完了を待機
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    console.log("ログイン完了");
    await page.waitForTimeout(1000); // ログイン後1秒待機

    const article = articles[0];
    // 右上の投稿ボタンをクリック
    const postButtonSelector = "button[aria-label='投稿']";
    await page.waitForSelector(postButtonSelector);
    await page.waitForTimeout(200);
    await page.click(postButtonSelector);
    await page.waitForTimeout(200); // モーダル表示を待機

    // モーダルからテキスト投稿を選択
    const textPostSelector = "a.m-navbarPostings__itemLink[href='/notes/new']";
    await page.waitForSelector(textPostSelector);
    await page.waitForTimeout(500);
    await page.click(textPostSelector);

    // エディターページへの遷移を待機
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

    await page.waitForTimeout(1000); // エディターページ読み込み後3秒待機

    // タイトル入力
    await page.waitForSelector(
      "textarea.cfYOJX, textarea[placeholder='記事タイトル']",
      { timeout: 30000 }
    );
    await page.waitForTimeout(300);
    await page.focus("textarea.cfYOJX, textarea[placeholder='記事タイトル']");
    await page.waitForTimeout(300);
    await page.type(
      "textarea.cfYOJX, textarea[placeholder='記事タイトル']",
      article.title
    );
    await page.waitForTimeout(1000);

    // 本文を直接入力（Markdownモードを使用しない）
    await page.waitForSelector(
      "div.ProseMirror[contenteditable='true'][role='textbox']"
    );
    await page.focus("div.ProseMirror[contenteditable='true'][role='textbox']");
    await page.keyboard.type(article.content);
    await page.waitForTimeout(1000);

    // 画像をギャラリーから挿入
    // 画像追加ボタンをクリック
    await page.waitForSelector('button[aria-label="画像を追加"]');
    await page.click('button[aria-label="画像を追加"]');
    await page.waitForTimeout(2000);

    // 「記事にあう画像を選ぶ」ボタンをクリック
    const imageSelectButtonSelector = "div.sc-bbcb2b9d-6:nth-child(2) button";
    await page.waitForSelector(imageSelectButtonSelector);
    await page.click(imageSelectButtonSelector);

    await page.waitForTimeout(2000);

    // 「食べ物」タブを選択
    const foodTabSelectors = [
      // クラス名とインデックスで特定
      ".sc-54ab0e3-2:nth-child(6)",
      // data属性で特定
      'button[data-active="true"]',
      // Recordingファイルから取得したセレクタ
      "div:nth-of-type(6) button:nth-of-type(6)",
    ];
    for (const selector of foodTabSelectors) {
      const tab = await page.$(selector);
      if (tab) {
        console.log(`セレクタが見つかりました: ${selector}`);
        await tab.click();
        console.log("「食べ物」タブをクリックしました");
        break;
      }
    }

    await page.waitForTimeout(2000);

    // 画像一覧から1つをランダムに選択（1〜10番目から）
    const imageItems: ElementHandle<Element>[] = await page.$$("img");
    if (imageItems.length > 0) {
      console.log(
        `${imageItems.length}個の画像が見つかりました（セレクタ: img）`
      );
    }

    if (imageItems.length > 0) {
      // 1〜10番目の画像からランダムに1つ選択（存在する範囲で）
      const maxIndex = Math.min(10, imageItems.length);
      const randomIndex = Math.floor(Math.random() * maxIndex);

      // 選択した画像をクリック
      await imageItems[randomIndex].click();
      await page.waitForTimeout(1000);

      // 「この画像を挿入」ボタンをクリック
      // 標準的なセレクタとJavaScriptの組み合わせ
      await page.evaluate(() => {
        // テキストで検索
        const buttons = Array.from(document.querySelectorAll("button"));
        const insertButton = buttons.find(
          (button) =>
            button.textContent && button.textContent.includes("この画像を挿入")
        );

        if (insertButton) {
          insertButton.click();
          return true;
        }

        // IDで検索（Recordingファイルから）
        const idButton = document.querySelector("#\\:rk\\:");
        if (idButton) {
          (idButton as HTMLElement).click();
          return true;
        }

        return false;
      });
      await page.waitForTimeout(3000);

      // トリミングモーダルが表示されたら「保存」ボタンをクリック
      // トリミングモーダルが表示されているか確認
      await page.evaluate(() => {
        const modal = document.querySelector(
          ".ReactModal__Content.CropModal__content"
        );
        return !!modal && window.getComputedStyle(modal).display !== "none";
      });

      // 保存ボタンをクリック
      const saveButtonClicked = await page.evaluate(() => {
        // テキストで検索
        const buttons = Array.from(document.querySelectorAll("button"));
        const saveButton = buttons.find(
          (button) => button.textContent && button.textContent.trim() === "保存"
        );

        if (saveButton) {
          saveButton.click();
          return true;
        }

        // IDで検索
        const idButton = document.querySelector("#\\:rj\\:");
        if (idButton) {
          (idButton as HTMLElement).click();
          return true;
        }

        // spanで検索
        const saveSpan = document.querySelector("span#\\:rk\\:");
        if (saveSpan && saveSpan.parentElement) {
          (saveSpan.parentElement as HTMLElement).click();
          return true;
        }

        return false;
      });

      if (saveButtonClicked) {
        console.log("トリミングモーダルの「保存」ボタンをクリックしました");
      } else {
        console.log("トリミングモーダルの「保存」ボタンが見つかりませんでした");
      }

      await page.waitForTimeout(2000);
    } else {
      console.log("トリミングモーダルは表示されていません");
    }

    // 「公開に進む」ボタンをクリック
    await page.waitForTimeout(15000); // 画像の読み込みを待つ

    const publishNextClicked = await page.evaluate(() => {
      // テキストで検索
      const buttons = Array.from(document.querySelectorAll("button"));
      const publishButton = buttons.find(
        (button) =>
          button.textContent && button.textContent.includes("公開に進む")
      );

      if (publishButton) {
        publishButton.click();
        return true;
      }

      // 新しいセレクタで検索（ヘッダーの投稿するボタン）
      const headerPublishButton = document.querySelector(
        "button#\\:r19\\:, span#\\:r1a\\:"
      );
      if (headerPublishButton) {
        if (
          headerPublishButton.tagName === "SPAN" &&
          headerPublishButton.parentElement
        ) {
          (headerPublishButton.parentElement as HTMLElement).click();
        } else {
          (headerPublishButton as HTMLElement).click();
        }
        return true;
      }

      // テキスト内容で検索する別の方法
      const allButtons = Array.from(document.querySelectorAll("button"));
      const publishBtn = allButtons.find((button) => {
        const buttonText = button.textContent || "";
        return buttonText.includes("公開に進む");
      });

      if (publishBtn) {
        publishBtn.click();
        return true;
      }

      return false;
    });

    await page.waitForTimeout(3000);

    // ハッシュタグ入力欄を待機
    await page.waitForSelector(
      "input[placeholder='ハッシュタグを追加する'], section:nth-of-type(1) input",
      { timeout: 30000 }
    );

    // タグボタンのセレクタ
    const tagButtonSelector = "button.sc-136c6acc-2";

    // タグボタンが存在するか確認
    const hasTagButtons = await page.$(tagButtonSelector);

    if (hasTagButtons) {
      // 画面上のタグボタンを取得して最大3つクリック
      const tagButtons = await page.$$(tagButtonSelector);
      console.log(`タグボタン数: ${tagButtons.length}`);

      // 最大3つのタグをクリック
      const maxTags = Math.min(3, tagButtons.length);
      for (let i = 0; i < maxTags; i++) {
        // ボタンのテキストを取得してログ出力
        const buttonText = await page.evaluate(
          (el) => el.textContent,
          tagButtons[i]
        );
        console.log(`タグ「${buttonText}」をクリックします`);

        // ボタンをクリック
        await tagButtons[i].click();
        await page.waitForTimeout(1000);
      }
    } else if (article.tagList && article.tagList.length > 0) {
      // タグボタンがない場合は従来の方法でタグを入力
      console.log(`タグリストからタグを入力: ${article.tagList.join(", ")}`);
      for (const tag of article.tagList) {
        await page.focus(
          "input[placeholder='ハッシュタグを追加する'], section:nth-of-type(1) input"
        );
        await page.keyboard.type(tag);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(1000);
      }
    }

    // 「投稿する」ボタンをクリック
    const publishButtonClicked = await page.evaluate(() => {
      // テキストで検索
      const buttons = Array.from(document.querySelectorAll("button"));
      const publishButton = buttons.find(
        (button) =>
          button.textContent && button.textContent.includes("投稿する")
      );

      if (publishButton) {
        publishButton.click();
        return true;
      }

      // 新しいセレクタで検索（ヘッダーの投稿するボタン）
      const headerPublishButton = document.querySelector(
        "button#\\:r19\\:, span#\\:r1a\\:"
      );
      if (headerPublishButton) {
        if (
          headerPublishButton.tagName === "SPAN" &&
          headerPublishButton.parentElement
        ) {
          (headerPublishButton.parentElement as HTMLElement).click();
        } else {
          (headerPublishButton as HTMLElement).click();
        }
        return true;
      }

      // テキスト内容で検索する別の方法
      const allButtons = Array.from(document.querySelectorAll("button"));
      const publishBtn = allButtons.find((button) => {
        const buttonText = button.textContent || "";
        return buttonText.includes("投稿する");
      });

      if (publishBtn) {
        publishBtn.click();
        return true;
      }

      return false;
    });

    await page.waitForTimeout(5000);

    // 投稿完了を待機
    // 「記事をシェアしてみましょう」というテキストが表示されるのを待つ
    await page.waitForFunction(
      () => {
        const elements = document.querySelectorAll("*");
        for (const el of elements) {
          if (
            el.textContent &&
            el.textContent.includes("記事をシェアしてみましょう")
          ) {
            return true;
          }
        }
        return false;
      },
      { timeout: 60000 } // 60秒のタイムアウト
    );

    console.log("すべての記事の投稿が完了しました");
  } catch (error) {
    console.error("Noteへの投稿中にエラーが発生しました:", error);
    // エラー発生時もスクリーンショットを撮影
  } finally {
    await browser.close();
  }
};
