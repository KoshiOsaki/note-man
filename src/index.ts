import "dotenv/config";
import { generateWithGemini } from "./article-generator";
import { postToNote } from "./note-poster";
import { EnvConfig } from "./types";
import { generatePrompt } from "./prompt-loader";
import { fetchTrends } from "./utils/x-trend";

/**
 * 環境変数の検証
 * @returns 検証済みの環境変数
 */
const validateEnv = (): EnvConfig => {
  const { GEMINI_API_KEY, NOTE_USER, NOTE_PASSWORD } = process.env;

  if (!GEMINI_API_KEY || !NOTE_USER || !NOTE_PASSWORD) {
    console.error(
      "環境変数が設定されていません。.envファイルを確認してください。"
    );
    process.exit(1);
  }

  return { GEMINI_API_KEY, NOTE_USER, NOTE_PASSWORD };
};

/**
 * メイン実行関数
 */
const main = async (): Promise<void> => {
  console.log("Note自動投稿ツールを開始します");

  try {
    // 環境変数の検証
    const env = validateEnv();

    // Xのトレンドを取得
    const trends = await fetchTrends();
    console.log("トレンドを取得しました:", trends);

    // プロンプトの生成
    const customPrompt = generatePrompt(trends);

    // 記事の生成（最大3本）
    const article = await (async () => {
      if (process.env.NODE_ENV === "demo") {
        return {
          title: "Demo Article 1",
          content: `はーい！ももかだよ( ᐢ o̴̶̷̤ ̫ o̴̶̷̤ ᐢ )❣️ 現役女子大生のももかが、みんなが気になる旬なトレンド情報を発信していくね！ 今回は、SixTONESのサブスク解禁について徹底的に語っちゃうよ〜！ スト担（SixTONESのファン）はもちろん、最近SixTONES気になってるんだよね〜ってコにも、ぜひぜひ読んでほしいな( ⸝⸝> ̫ <⸝⸝՞ )

1. なぜ今、SixTONESのサブスク解禁がアツいのか？

SixTONESがついにサブスク解禁！✨ これはもう、音楽業界に激震が走ったと言っても過言ではないよね？！ ( ᵒ̴̶̷᷄꒳ᵒ̴̶̷᷅ ) ジャニーズ事務所の楽曲は、これまでサブスク配信に慎重な姿勢だったから、今回のSixTONESのサブスク解禁は、本当に画期的な出来事なの！ これまでCDでしか聴けなかったあの名曲たちが、いつでもどこでもスマホで聴けるようになるなんて、夢みたいじゃない？💗 しかも、SixTONESの音楽は、ロック、ポップ、ヒップホップ…って、ジャンルレスでめちゃくちゃカッコいいから、今まで聴いたことなかった人も、絶対にハマると思うんだよね(ᐢ ˙꒳˙ ˙ ᐢ) ぜひこの機会にSixTONESの世界に飛び込んでみてほしいな！

2. SixTONESサブスク解禁！注目ポイント Best5✨

・① 全アルバム＆シングルが配信スタート！: デビュー曲から最新曲まで、全部聴けるのはマジで神！・② Apple Music、Spotify、LINE MUSIC…主要サービスで配信！: 好きなサービスで聴けるのが嬉しいよね！・③ オフライン再生も可能！: 通信量を気にせず、いつでもどこでも楽しめる( ᐢ o̴̶̷̤ ̫ o̴̶̷̤ ᐢ )・④ プレイリストも充実！: SixTONES初心者さんも、おすすめプレイリストを聴けばすぐにハマれるはず！・⑤ 世界中のファンが歓喜！: グローバル展開も視野に入れた、SixTONESの新たな挑戦に期待大！

3. SixTONESサブスク解禁！How to 楽しむ？🌟

① まずは、好きな音楽配信サービスでSixTONESを検索！② アルバムやシングルをチェックして、気になる曲をプレイリストに追加！③ 通勤・通学中、家事の合間、リラックスタイム…いつでもSixTONESを聴きまくろう！④ SixTONESの公式SNSをフォローして、最新情報をゲット！⑤ 友達や家族にSixTONESの魅力を語りまくって、スト担を増やそう！(笑)`,
          tagList: ["test"],
        };
      }
      return await generateWithGemini(customPrompt, env.GEMINI_API_KEY);
    })();

    const articles = [article];

    // Noteへの投稿
    await postToNote(articles, env.NOTE_USER, env.NOTE_PASSWORD);

    console.log("処理が正常に完了しました");
  } catch (error) {
    console.error("処理中にエラーが発生しました:", error);
    process.exit(1);
  }
};

// スクリプト実行
main().catch((error) => {
  console.error("予期せぬエラーが発生しました:", error);
  process.exit(1);
});
