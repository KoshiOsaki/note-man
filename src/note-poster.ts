import puppeteer, { Browser, Page, ElementHandle } from "puppeteer";
import { Article } from "./types";
import * as fs from "fs";
import * as path from "path";
import { logPageContent } from "./utils/scraping";

/**
 * Puppeteerを使用してNoteにログインし、記事を投稿する
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
  });

  try {
    const page: Page = await browser.newPage();

    // ビューポートを設定
    await page.setViewport({ width: 1280, height: 800 });

    // Noteにログイン
    console.log("Noteにログイン中...");
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

    // 各記事を投稿
    for (const [index, article] of articles.entries()) {
      // 右上の投稿ボタンをクリック
      const postButtonSelector = "button[aria-label='投稿']";
      await page.waitForSelector(postButtonSelector);
      await page.waitForTimeout(200);
      await page.click(postButtonSelector);
      await page.waitForTimeout(200); // モーダル表示を待機

      // モーダルからテキスト投稿を選択
      const textPostSelector =
        "a.m-navbarPostings__itemLink[href='/notes/new']";
      await page.waitForSelector(textPostSelector);
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

      await page.waitForTimeout(1000); // エディターページ読み込み後3秒待機

      // タイトル入力
      await page.waitForSelector(
        "textarea.cfYOJX, textarea[placeholder='記事タイトル']",
        { timeout: 30000 }
      );
      await logPageContent(
        page,
        "textarea.cfYOJX, textarea[placeholder='記事タイトル']"
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
      await page.focus(
        "div.ProseMirror[contenteditable='true'][role='textbox']"
      );
      await page.keyboard.type(article.content);
      await page.waitForTimeout(1000);

      // 画像をギャラリーから挿入
      try {
        // 画像追加ボタンをクリック
        await page.waitForSelector('button[aria-label="画像を追加"]');
        await page.click('button[aria-label="画像を追加"]');
        await page.waitForTimeout(2000);

        // 「記事にあう画像を選ぶ」ボタンをクリック - セレクタを複数用意して試す

        // 複数のセレクタを試す
        const imageSelectButtonSelector =
          "div.sc-bbcb2b9d-6:nth-child(2) button";
        await page.waitForSelector(imageSelectButtonSelector);
        await page.click(imageSelectButtonSelector);

        // JavaScriptで直接クリックを試みる
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll("button"));
          const imageButton = buttons.find(
            (button) =>
              button.textContent &&
              button.textContent.includes("記事にあう画像を選ぶ")
          );
          if (imageButton) {
            console.log("JavaScriptでボタンを見つけました");
            imageButton.click();
            return true;
          }
          return false;
        });

        await page.waitForTimeout(2000);

        // 「世界の美術館」タブを選択
        console.log("「世界の美術館」タブを選択しています...");
        // スクリーンショットを撮影して現在の状態を確認

        try {
          // 標準的なセレクタを使用
          const museumTabSelectors = [
            // テキスト内容で検索（JavaScriptで）
            null, // JavaScriptでの検索用プレースホルダー
            // クラス名とインデックスで特定
            ".sc-54ab0e3-2:nth-child(8)",
            // data属性で特定
            'button[data-active="true"]',
            // 単純なテキスト検索（JavaScriptで）
            null, // JavaScriptでの検索用プレースホルダー
            // Recordingファイルから取得したセレクタ
            "div:nth-of-type(8) button:nth-of-type(8)",
          ];

          let tabFound = false;
          for (const selector of museumTabSelectors) {
            try {
              if (selector === null) {
                // JavaScriptでテキスト検索
                const clicked = await page.evaluate(() => {
                  const buttons = Array.from(
                    document.querySelectorAll("button")
                  );
                  const museumButton = buttons.find(
                    (button) =>
                      button.textContent &&
                      button.textContent.trim() === "世界の美術館"
                  );
                  if (museumButton) {
                    museumButton.click();
                    return true;
                  }
                  return false;
                });

                if (clicked) {
                  console.log(
                    "JavaScriptで「世界の美術館」タブをクリックしました"
                  );
                  tabFound = true;
                  break;
                }
              } else {
                console.log(`セレクタを試行: ${selector}`);
                const tab = await page.$(selector);
                if (tab) {
                  console.log(`セレクタが見つかりました: ${selector}`);
                  await tab.click();
                  tabFound = true;
                  console.log("「世界の美術館」タブをクリックしました");
                  break;
                }
              }
            } catch (err: any) {
              console.log(`セレクタ ${selector} でエラー: ${err.message}`);
            }
          }

          if (!tabFound) {
            console.log(
              "すべてのセレクタが失敗しました。直接JavaScriptでクリックを試みます"
            );
            // 最終手段：テキストを含むすべてのボタンをクリック
            await page.evaluate(() => {
              const allElements = document.querySelectorAll("*");
              for (const element of allElements) {
                if (
                  element.textContent &&
                  element.textContent.includes("世界の美術館")
                ) {
                  // クリック可能な要素を見つけた
                  (element as HTMLElement).click();
                  console.log(
                    "テキスト検索で「世界の美術館」を含む要素をクリックしました"
                  );
                  return true;
                }
              }
              return false;
            });
          }
        } catch (err: any) {
          console.error(
            "「世界の美術館」タブの選択中にエラーが発生しました:",
            err.message
          );
        }

        await page.waitForTimeout(2000);

        // 画像一覧から1つをランダムに選択（1〜10番目から）
        console.log("画像を選択しています...");
        try {
          // 標準的なセレクタを使用
          const imageItemSelectors = [
            // 単純なimg要素
            "img",
            // クラス名で特定
            ".sc-41742573-4",
            // figure > img
            "figure img",
            // Recordingファイルから取得したセレクタ
            "div:nth-of-type(3) > div:nth-of-type(1) img",
          ];

          let imagesFound = false;
          let imageItems: ElementHandle<Element>[] = [];

          for (const selector of imageItemSelectors) {
            try {
              console.log(`画像セレクタを試行: ${selector}`);
              imageItems = await page.$$(selector);
              if (imageItems.length > 0) {
                console.log(
                  `${imageItems.length}個の画像が見つかりました（セレクタ: ${selector}）`
                );
                imagesFound = true;
                break;
              }
            } catch (err: any) {
              console.log(`画像セレクタ ${selector} でエラー: ${err.message}`);
            }
          }

          if (imagesFound && imageItems.length > 0) {
            // 1〜10番目の画像からランダムに1つ選択（存在する範囲で）
            const maxIndex = Math.min(10, imageItems.length);
            const randomIndex = Math.floor(Math.random() * maxIndex);
            console.log(`${randomIndex + 1}番目の画像を選択します`);

            // 選択した画像をクリック
            await imageItems[randomIndex].click();
            await page.waitForTimeout(1000);

            // 「この画像を挿入」ボタンをクリック
            // 標準的なセレクタとJavaScriptの組み合わせ
            const insertButtonClicked = await page.evaluate(() => {
              // テキストで検索
              const buttons = Array.from(document.querySelectorAll("button"));
              const insertButton = buttons.find(
                (button) =>
                  button.textContent &&
                  button.textContent.includes("この画像を挿入")
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

            if (insertButtonClicked) {
              console.log("「この画像を挿入」ボタンをクリックしました");
            } else {
              console.log("「この画像を挿入」ボタンが見つかりませんでした");
            }

            await page.waitForTimeout(3000);

            // トリミングモーダルが表示されたら「保存」ボタンをクリック
            try {
              console.log(
                "トリミングモーダルの「保存」ボタンを探しています..."
              );

              // トリミングモーダルが表示されているか確認
              const isTrimModalVisible = await page.evaluate(() => {
                const modal = document.querySelector(
                  ".ReactModal__Content.CropModal__content"
                );
                return (
                  !!modal && window.getComputedStyle(modal).display !== "none"
                );
              });

              if (isTrimModalVisible) {
                console.log("トリミングモーダルが表示されています");

                // 保存ボタンをクリック
                const saveButtonClicked = await page.evaluate(() => {
                  // テキストで検索
                  const buttons = Array.from(
                    document.querySelectorAll("button")
                  );
                  const saveButton = buttons.find(
                    (button) =>
                      button.textContent && button.textContent.trim() === "保存"
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
                  console.log(
                    "トリミングモーダルの「保存」ボタンをクリックしました"
                  );
                } else {
                  console.log(
                    "トリミングモーダルの「保存」ボタンが見つかりませんでした"
                  );
                }

                await page.waitForTimeout(2000);
              } else {
                console.log("トリミングモーダルは表示されていません");
              }
            } catch (trimError: any) {
              console.error(
                "トリミングモーダル処理中にエラーが発生しました:",
                trimError.message
              );
            }

            console.log("ギャラリーから画像を挿入しました");
          } else {
            console.warn("利用可能な画像が見つかりませんでした");
          }
        } catch (imageError: any) {
          console.error(
            "画像選択中にエラーが発生しました:",
            imageError.message
          );
        }
      } catch (imageError) {
        console.error("画像挿入中にエラーが発生しました:", imageError);
        // エラー発生時もスクリーンショットを撮影
      }

      // タグを追加
      try {
        // 「公開に進む」ボタンをクリック
        await page.waitForTimeout(9000); // 画像の読み込みを待つ

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

          // spanで検索
          const publishSpan = document.querySelector(
            "span#\\:ra\\:, span:contains('公開に進む')"
          );
          if (publishSpan && publishSpan.parentElement) {
            (publishSpan.parentElement as HTMLElement).click();
            return true;
          }

          return false;
        });

        if (publishNextClicked) {
          console.log("「公開に進む」ボタンをクリックしました");
        } else {
          console.warn("「公開に進む」ボタンが見つかりませんでした");
        }

        await page.waitForTimeout(3000);

        // ハッシュタグ入力欄を待機
        await page.waitForSelector(
          "input[placeholder='ハッシュタグを追加する'], section:nth-of-type(1) input",
          { timeout: 30000 }
        );

        // タグを入力（article.tagListから取得）
        if (article.tagList && article.tagList.length > 0) {
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
      } catch (tagError: any) {
        console.error("タグ追加中にエラーが発生しました:", tagError.message);
      }

      // 投稿完了を待機
      console.log("投稿処理中...");
      await page.waitForNavigation({
        waitUntil: "networkidle0",
        timeout: 60000,
      }); // タイムアウトを60秒に延長
      console.log(`記事${index + 1}「${article.title}」の投稿が完了しました`);
      await page.waitForTimeout(3000); // 投稿後3秒待機

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
