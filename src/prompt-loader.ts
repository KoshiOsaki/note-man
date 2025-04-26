import { readFileSync } from "fs";
import path from "path";

// 複数の場合
// export const loadPrompts = (): string[] => {
//   try {
//     const promptPath = path.join(process.cwd(), 'default-prompt.md');
//     const promptContent = readFileSync(promptPath, 'utf8');

//     // ## 記事1, ## 記事2, ## 記事3 で分割
//     const articlePrompts = promptContent.split(/## 記事\d+：/).slice(1);

//     if (articlePrompts.length === 0) {
//       throw new Error('プロンプトファイルから記事プロンプトを抽出できませんでした');
//     }

//     console.log(`${articlePrompts.length}個の記事プロンプトを読み込みました`);
//     return articlePrompts;
//   } catch (error) {
//     console.error('プロンプトファイルの読み込みに失敗しました:', error);
//     process.exit(1);
//     return []; // TypeScriptのreturn型エラー回避のため追加
//   }
// };

export const loadPrompt = (): string => {
  const promptPath = path.join(process.cwd(), "default-prompt.md");
  const promptContent = readFileSync(promptPath, "utf8");

  return promptContent;
};
