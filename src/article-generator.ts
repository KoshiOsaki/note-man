import { GoogleGenAI } from "@google/genai";
import { Article } from "./types";

/**
 * Gemini APIを使用して記事を生成する
 * @param prompt 記事生成用プロンプト
 * @param apiKey Gemini API Key
 * @returns 生成された記事のタイトルと本文
 */
export const generateWithGemini = async (
  prompt: string,
  apiKey: string
): Promise<Article> => {
  try {
    console.log("Gemini APIで記事を生成中...");

    // モデルの設定
    const ai = new GoogleGenAI({ apiKey });

    // 記事の生成
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `以下のプロンプトに基づいて、noteに投稿する記事を作成してください。
記事のタイトルと本文を明確に分けて出力してください。

${prompt}`,
    });

    // レスポンスからテキストを取得
    const text = response.text || "";

    // タイトルと本文を分離
    const titleMatch = text.match(/^#\s+(.+?)$|^(.+?)[\n\r]/m);
    const title = titleMatch
      ? (titleMatch[1] || titleMatch[2]).trim()
      : "無題の記事";

    // タイトル行を除いた残りを本文とする
    let content = text.replace(/^#\s+.+?$|^.+?[\n\r]/m, "").trim();

    console.log(`記事「${title}」を生成しました`);
    return { title, content };
  } catch (error) {
    console.error("Gemini APIでの記事生成に失敗しました:", error);
    return {
      title: "エラー発生",
      content: "APIエラーが発生したため記事を生成できませんでした。",
    };
  }
};
