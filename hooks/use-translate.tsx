"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Language = "ja" | "en";

type TranslationDictionary = Record<string, string>;

type TranslationContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
};

const translations: Record<Language, TranslationDictionary> = {
  ja: {
    "header.home": "ホーム",
    "header.settings": "設定",
    "header.about": "このアプリについて",
    "header.contact": "お問い合わせ",
    "header.signedInAs": "ログイン中",
    "header.logout": "ログアウト",
    "header.login": "ログイン",
    "header.languageToggle": "Change to English",
    "header.languageToggleAria": "言語を英語に切り替える",

    "firstQuestion.allergyTitle": "アレルギーはありますか？",
    "firstQuestion.allergyDescription": "アレルゲンの有無も併せて確認できます。",
    "firstQuestion.allergyYes": "ある",
    "firstQuestion.allergyNo": "ない",
    "firstQuestion.agreementTitle": "利用規約に同意しますか？",
    "firstQuestion.agreementBody":
      "本サービスを利用することにより、以下の利用規約に同意したものとみなされます。利用規約の全文をよくお読みください。\n\n第1条 (目的): 本サービスは、ハラールおよびアレルゲンの情報提供を目的とします。\n\n第2条 (免責事項): 提供される情報は正確性を期していますが、最終的な判断は利用者の責任において行ってください。\n\n第3条 (個人情報): 利用者の個人情報は、プライバシーポリシーに基づき適切に取り扱われます。",
    "firstQuestion.agreementOk": "OK",

    "camera.notSupported": "このブラウザはカメラ機能をサポートしていません。",
    "camera.accessDenied": "カメラにアクセスできませんでした。",
    "camera.instructions.product": "商品画像を撮影してください",
    "camera.instructions.ingredients": "成分表示を撮影してください",
    "camera.step1": "（1 / 2）",
    "camera.step2": "（2 / 2）",
    "camera.preview.product": "商品画像を確認",
    "camera.preview.ingredients": "成分表示を確認",
    "camera.preview.completed": "撮影完了",
    "camera.preview.allCompleted": "✓ 両画像の撮影が完了しました",
    "camera.preview.capturedProduct": "撮影済み：商品画像",
    "camera.retake": "🔄 再撮影",
    "camera.next": "→ 次へ",
    "camera.confirm": "✓ 確認",
    "camera.analyzing": "解析中...",
    "camera.bothImagesRequired": "両方の画像が必要です",
    "camera.error": "エラーが発生しました:",

    "result.title": "判定結果",
    "result.subtitle": "詳細な分析結果",
    "result.ingredients.haram": "ハラム成分",
    "result.ingredients.suspect": "疑わしい成分",
    "result.ingredients.safe": "安全な成分",
    "result.ingredients.notDetected": "検出されていません",
    "result.allergen.title": "アレルゲン情報",
    "result.allergen.found": "含有:",
    "result.allergen.suspect": "疑わしい:",
    "result.allergen.none": "なし",
    "result.details.title": "詳細情報",
    "result.recommendations.title": "推奨アクション",
    "result.back": "← 戻る",
  },
  en: {
    "header.home": "Home",
    "header.settings": "Settings",
    "header.about": "About",
    "header.contact": "Contact",
    "header.signedInAs": "Signed in as",
    "header.logout": "Logout",
    "header.login": "Login",
    "header.languageToggle": "日本語にする",
    "header.languageToggleAria": "Switch language to Japanese",

    "firstQuestion.allergyTitle": "Do you have any allergies?",
    "firstQuestion.allergyDescription":
      "We can also check for known allergens.",
    "firstQuestion.allergyYes": "Yes",
    "firstQuestion.allergyNo": "No",
    "firstQuestion.agreementTitle": "Do you agree to the terms of use?",
    "firstQuestion.agreementBody":
      "By using this service, you are deemed to have agreed to the following terms. Please read the full terms carefully.\n\nArticle 1 (Purpose): This service aims to provide Halal and allergen information.\n\nArticle 2 (Disclaimer): While we strive for accuracy, the final decision rests with the user.\n\nArticle 3 (Personal Information): User data is handled appropriately in accordance with our privacy policy.",
    "firstQuestion.agreementOk": "Agree",

    "camera.notSupported": "This browser does not support camera functionality.",
    "camera.accessDenied": "Could not access the camera.",
    "camera.instructions.product": "Please capture the product image",
    "camera.instructions.ingredients": "Please capture the ingredients label",
    "camera.step1": "(1 / 2)",
    "camera.step2": "(2 / 2)",
    "camera.preview.product": "Confirm Product Image",
    "camera.preview.ingredients": "Confirm Ingredients Label",
    "camera.preview.completed": "Capture Complete",
    "camera.preview.allCompleted": "✓ Both images have been captured",
    "camera.preview.capturedProduct": "Captured: Product Image",
    "camera.retake": "🔄 Retake",
    "camera.next": "→ Next",
    "camera.confirm": "✓ Confirm",
    "camera.analyzing": "Analyzing...",
    "camera.bothImagesRequired": "Both images are required",
    "camera.error": "An error occurred:",

    "result.title": "Judgment Result",
    "result.subtitle": "Detailed Analysis Results",
    "result.ingredients.haram": "Haram Ingredients",
    "result.ingredients.suspect": "Suspect Ingredients",
    "result.ingredients.safe": "Safe Ingredients",
    "result.ingredients.notDetected": "Not detected",
    "result.allergen.title": "Allergen Information",
    "result.allergen.found": "Contained:",
    "result.allergen.suspect": "Suspect:",
    "result.allergen.none": "None",
    "result.details.title": "Details",
    "result.recommendations.title": "Recommended Actions",
    "result.back": "← Back",
  },
};

const TranslationContext = createContext<TranslationContextValue | null>(null);

export const TranslationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [language, setLanguageState] = useState<Language>("ja");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedLanguage = window.localStorage.getItem("language");
    if (storedLanguage === "ja" || storedLanguage === "en") {
      setLanguageState(storedLanguage);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === "ja" ? "en" : "ja"));
  }, []);

  const value = useMemo<TranslationContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t: (key: string, fallback?: string) =>
        translations[language][key] ??
        translations.ja[key] ??
        fallback ??
        key,
    }),
    [language, setLanguage, toggleLanguage]
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslate = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslate must be used within a TranslationProvider");
  }
  return context;
};
