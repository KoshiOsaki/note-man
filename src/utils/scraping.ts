import * as fs from "fs";
import * as path from "path";
import { Page } from "puppeteer";

// スクリーンショットを保存するディレクトリを作成
const setupScreenshotDir = (): string => {
  const dir = path.join(process.cwd(), "screenshots");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// スクリーンショットを撮影して保存
export const takeScreenshot = async (
  page: Page,
  name: string
): Promise<void> => {
  const dir = setupScreenshotDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = path.join(dir, `${timestamp}_${name}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`スクリーンショット保存: ${filename}`);
};

// 現在のページのHTMLを取得してコンソールに出力
export const logPageContent = async (
  page: Page,
  selector: string
): Promise<void> => {
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
