import { config } from "dotenv";
import { readFileSync } from "fs";
import {
  ask_gemini,
  GeminiLanguage,
  GeminiPreferences,
} from "./lib/gemini";

// .env.local から環境変数を読み込む
config({ path: ".env.local" });

type PreferenceArg = "both" | "halal" | "allergy" | "none";

const parsePreferenceArg = (value?: string): PreferenceArg => {
  if (!value) return "both";
  const normalized = value.toLowerCase() as PreferenceArg;
  if (["both", "halal", "allergy", "none"].includes(normalized)) {
    return normalized;
  }
  return "both";
};

const toPreferences = (arg: PreferenceArg): GeminiPreferences => {
  switch (arg) {
    case "halal":
      return { wantsHalal: true, wantsAllergy: false };
    case "allergy":
      return { wantsHalal: false, wantsAllergy: true };
    case "none":
      return { wantsHalal: false, wantsAllergy: false };
    case "both":
    default:
      return { wantsHalal: true, wantsAllergy: true };
  }
};

const describePreferences = (preferences: GeminiPreferences) =>
  `ハラル=${preferences.wantsHalal ? "表示" : "非表示"}, アレルギー=${
    preferences.wantsAllergy ? "表示" : "非表示"
  }`;

/**
 * 実験用スクリプト
 * 使用方法: npx tsx test-gemini.ts <画像1のパス> <画像2のパス> [ja|en] [both|halal|allergy|none]
 *
 * 例: npx tsx test-gemini.ts ./test-images/image1.jpg ./test-images/image2.jpg en allergy
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      "使用方法: npx tsx test-gemini.ts <画像1のパス> <画像2のパス> [ja|en] [both|halal|allergy|none]"
    );
    console.error(
      "例: npx tsx test-gemini.ts ./test-images/image1.jpg ./test-images/image2.jpg en allergy"
    );
    process.exit(1);
  }

  const [image1Path, image2Path, languageArg, preferenceArg] = args;
  const language: GeminiLanguage = languageArg === "en" ? "en" : "ja";
  const preferences = toPreferences(parsePreferenceArg(preferenceArg));

  // 環境変数の確認
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ エラー: GEMINI_API_KEY が環境変数に設定されていません");
    console.error(".env.local ファイルに以下を追加してください:");
    console.error("GEMINI_API_KEY=your_api_key_here");
    process.exit(1);
  }

  console.log("✅ APIキーが見つかりました");
  console.log("📸 画像を読み込んでいます...");

  try {
    // 画像ファイルを読み込んでbase64エンコード
    const image1Buffer = readFileSync(image1Path);
    const image2Buffer = readFileSync(image2Path);

    // ファイル拡張子からMIMEタイプを判定（参考情報として表示）
    const getMimeTypeFromPath = (path: string): string => {
      const ext = path.toLowerCase().split(".").pop();
      const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
      };
      return mimeTypes[ext || ""] || "image/jpeg";
    };

    const mimeType1 = getMimeTypeFromPath(image1Path);
    const mimeType2 = getMimeTypeFromPath(image2Path);

    const image1Base64 = image1Buffer.toString("base64");
    const image2Base64 = image2Buffer.toString("base64");

    console.log(`   Image1 MIME type (推定): ${mimeType1}`);
    console.log(`   Image2 MIME type (推定): ${mimeType2}`);

    console.log(
      `✅ 画像1を読み込みました: ${image1Path} (${image1Buffer.length} bytes)`
    );
    console.log(
      `✅ 画像2を読み込みました: ${image2Path} (${image2Buffer.length} bytes)`
    );
    console.log(
      `🌐 言語設定: ${language === "ja" ? "日本語" : "English"}, 🎯 フィルター: ${describePreferences(
        preferences
      )}`
    );
    console.log("");
    console.log("🚀 Gemini APIにリクエストを送信中...");
    console.log(`   Image1 base64 length: ${image1Base64.length} chars`);
    console.log(`   Image2 base64 length: ${image2Base64.length} chars`);

    // ask_gemini関数を呼び出し
    const startTime = Date.now();
    let result;
    try {
      result = await ask_gemini(image1Base64, image2Base64, {
        language,
        preferences,
      });
    } catch (error) {
      console.error("");
      console.error("❌ API呼び出し中にエラーが発生しました:");
      if (error instanceof Error) {
        console.error(error.message);
        if (error.stack) {
          console.error("");
          console.error("スタックトレース:");
          console.error(error.stack);
        }
      } else {
        console.error(error);
      }
      throw error;
    }
    const elapsedTime = Date.now() - startTime;

    console.log("");
    console.log("✨ 結果を受信しました！");
    console.log(`⏱️  レスポンス時間: ${elapsedTime}ms`);
    console.log("");
    console.log("📊 解析結果:");
    console.log(JSON.stringify(result, null, 2));
    console.log("");

    // 重要な情報を簡潔に表示
    console.log("📋 サマリー:");
    console.log(`   判定: ${result.judgment}`);
    console.log(`   信頼度: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(
      `   画像内にラベル: ${result.has_label_in_image ? "あり" : "なし"}`
    );
    console.log(
      `   認証マーク: ${
        result.certifications.length > 0
          ? result.certifications.join(", ")
          : "なし"
      }`
    );
    console.log(
      `   ハラム成分: ${
        result.ingredients_flags.haram.length > 0
          ? result.ingredients_flags.haram.join(", ")
          : "なし"
      }`
    );
    console.log(
      `   疑わしい成分: ${
        result.ingredients_flags.suspect.length > 0
          ? result.ingredients_flags.suspect.join(", ")
          : "なし"
      }`
    );
    console.log(
      `   アレルギー成分: ${
        result.allergens.found.length > 0
          ? result.allergens.found.join(", ")
          : "なし"
      }`
    );
    if (result.notes_for_user) {
      console.log(`   備考: ${result.notes_for_user}`);
    }
  } catch (error) {
    console.error("");
    console.error("❌ エラーが発生しました:");
    if (error instanceof Error) {
      console.error(error.message);
      if (error.stack) {
        console.error("");
        console.error("スタックトレース:");
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
