import axios from "axios";
import * as cheerio from "cheerio";

export const fetchTrends = async (): Promise<string[]> => {
  try {
    const url = "https://twittrend.jp/";
    const response = await axios.get(url);
    const html = response.data;

    const $ = cheerio.load(html);

    // トレンドワードを取得
    const trends: string[] = [];

    // 「現在」ボックス内のトレンドワードを取得
    // 「現在」ボックスは最初の .box-solid 要素
    const currentBox = $(".box-solid").first();

    // ボックス内のリスト要素からトレンドワードを抽出
    currentBox.find(".list-unstyled li").each((index, element) => {
      if (index < 7) {
        // 上位7件のみ取得
        const trendElement = $(element).find(".trend a");
        const trendText = trendElement.text().trim();
        if (trendText) {
          trends.push(trendText);
        }
      }
    });

    return trends;
  } catch (error) {
    console.error("トレンド取得失敗:", error);
    return [];
  }
};
