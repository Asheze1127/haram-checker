type GeminiResponse = {
  has_label_in_image: boolean;
  used_label_text: boolean;
  judgment: "HALAL" | "NOT_HALAL" | "UNKNOWN";
  confidence: number;
  evidence: {
    positive: string[];
    negative: string[];
  };
  certifications: string[];
  ingredients_flags: {
    haram: string[];
    suspect: string[];
    safe: string[];
  };
  allergens: {
    found: string[];
    suspect: string[];
  };
  notes_for_user: string;
  recommended_next_actions: string[];
};

type Language = "ja" | "en";

export type GeminiPreferences = {
  wantsHalal: boolean;
  wantsAllergy: boolean;
};

export type AskGeminiOptions = {
  language?: Language;
  preferences?: GeminiPreferences;
};

const PROMPTS: Record<Language, string> = {
  ja: `
    🎯 目的
    食品の写真と任意の食品表示テキストを解析し、
    ハラル該当性とアレルギー成分を厳格に判定して、根拠を返す。
    
    🧩 入力
        * image1:食品またはパッケージ写真（1枚目）
        * image2:食品またはパッケージ写真（2枚目）
    
    🧾 出力形式(JSON形式)
    \`\`\`json
    {
        "has_label_in_image": true,
        "used_label_text": true,
        "judgment": "HALAL | NOT_HALAL | UNKNOWN",
        "confidence": 0.0,
        "evidence": {
        "positive": [],
        "negative": []
        },
        "certifications": [],
        "ingredients_flags": {
            "haram": [],
            "suspect": [],
            "safe": []
        },
        "allergens": {
            "found": [],
            "suspect": []
        },
        "notes_for_user": "",
        "recommended_next_actions": []
    }
    \`\`\`
    
    ⚖️ 判定ルール（簡潔・厳格）
    * ハラル認証マーク(例:JAKIM, MUIS, MUI, IFANCA, JHF)が画像やラベルに確認できた場合のみ "HALAL"。
    * 原材料に ** 豚・アルコール・ゼラチン（不明由来）** などがあれば "NOT_HALAL"。
    * 不明確・ラベル欠如・曖昧な場合は "UNKNOWN"。
    * 原材料欄に ** 特定原材料（卵・乳・小麦・落花生・そば・えび・かになど）** が含まれていれば、allergens.found に追加。
    * 由来不明の成分（例：動物性酵素、香料）は suspect に分類。
    
    🔍 判定フロー
    * 画像解析
        → ラベルや認証マークの有無を確認。
        → "has_label_in_image" に結果を記録。
    * 食品表示解析（あれば）
        → label_text を優先解析。
        → 原材料・アレルギー・認証を抽出。
    * 包装商品の特別処理
        → 包装されている商品（おかし、菓子、加工食品など）で、ラベルや原材料表示が不十分な場合
        → 商品名、ブランド名、パッケージデザインなどを特定
        → ウェブ検索や商品データベースを活用して、その商品の一般的な原材料・成分情報を調査
        → 調査結果に基づいて推測判定を行う（推測であることを根拠に明記）
        → 信頼度は推測であることを考慮して適切に設定
    * ハラル認証チェック
        → 確実な認証があれば "HALAL"、不明なら次工程へ。
    * ハラム要素・疑わしい成分チェック
        → 明確な禁忌成分（豚・アルコール等）があれば "NOT_HALAL"。
        → 曖昧なら "UNKNOWN"。
    * アレルギー検出
        → 特定原材料・準ずる原材料を抽出して分類。
    * 出力生成
        → 信頼度(confidence)を保守的に設定。
        → 根拠(evidence)を簡潔に列挙。
    
    
    🧠 出力例（簡略）
    ** 例1:公式ハラル認証あり **
        \`\`\`json
    {
        "judgment": "HALAL",
        "confidence": 0.92,
        "evidence": { "positive": ["JAKIM Halal マーク確認"] },
        "allergens": { "found": ["乳"], "suspect": [] },
        "notes_for_user": "JAKIM認証を確認。乳成分を含む。",
        "recommended_next_actions": ["最新ラベルの確認"]
    }
    \`\`\`
    
        ** 例2:豚由来・アルコール含有 **
            \`\`\`json
    {
        "judgment": "NOT_HALAL",
        "confidence": 0.87,
        "evidence": { "negative": ["豚エキス", "酒精"] },
        "allergens": { "found": ["小麦"], "suspect": [] },
        "notes_for_user": "豚由来成分および酒精が含まれるため非ハラル。",
        "recommended_next_actions": ["別製品を検討"]
    }
    \`\`\`
    
    📘 モデルへの指示
    
    あなたはハラル・アレルギー判定アシスタントです。
    提供された画像とテキストをもとに、上記ルール・フローに従い厳格に判定してください。
    
    特に、包装されている商品（おかし、菓子、加工食品など）の場合：
    * ラベルや原材料表示が見えない、または不完全な場合は、商品名やブランド名を特定し、ウェブ検索や商品データベースを活用して一般的な原材料情報を調査してください。
    * 調査結果に基づいて推測判定を行い、推測であることを根拠(evidence)に明記してください。
    * 推測による判定である場合は、信頼度(confidence)を適切に設定し、notes_for_userに「推測による判定」である旨を記載してください。
    
    画像やラベルから明確な情報が得られる場合は、過剰な推定をせず確証に基づいて判定してください。
    確証がなければ "UNKNOWN" を返すこと。
    返す値はJsonだけにするようにしてください。
    `,
  en: `
    🎯 Objective
    Analyze the provided food photos and any optional label text to strictly determine Halal compliance and allergen risks, and return supporting evidence.

    🧩 Inputs
        * image1: Food or package photo (first image)
        * image2: Food or package photo (second image)

    🧾 Output format (JSON)
    \`\`\`json
    {
        "has_label_in_image": true,
        "used_label_text": true,
        "judgment": "HALAL | NOT_HALAL | UNKNOWN",
        "confidence": 0.0,
        "evidence": {
        "positive": [],
        "negative": []
        },
        "certifications": [],
        "ingredients_flags": {
            "haram": [],
            "suspect": [],
            "safe": []
        },
        "allergens": {
            "found": [],
            "suspect": []
        },
        "notes_for_user": "",
        "recommended_next_actions": []
    }
    \`\`\`

    ⚖️ Decision rules (concise and strict)
    * Return "HALAL" only when an official Halal certification mark (e.g., JAKIM, MUIS, MUI, IFANCA, JHF) is clearly visible in the image or label.
    * If the ingredients include pork, alcohol, gelatin of unknown origin, or any other prohibited components, return "NOT_HALAL".
    * When information is unclear, labels are missing, or the situation is ambiguous, return "UNKNOWN".
    * If the ingredient list contains major allergens (egg, milk, wheat, peanuts, buckwheat, shrimp, crab, etc.), add them to allergens.found.
    * Ingredients of uncertain origin (e.g., animal enzymes, flavorings) should be classified under suspect.

    🔍 Evaluation flow
    * Image analysis
        → Check for labels or certification marks and record the result in "has_label_in_image".
    * Label text analysis (if available)
        → Prioritize label_text.
        → Extract ingredients, allergens, and certifications.
    * Special handling for packaged products
        → When evaluating packaged items (snacks, confectionery, processed foods, etc.) with incomplete label or ingredient information:
        → Identify product name, brand, and packaging design clues.
        → Use web search or product databases to research typical ingredient information.
        → Base any inferred judgment on that research and clearly indicate in evidence that it is inferred.
        → Adjust the confidence score appropriately to reflect that the result is inferred.
    * Halal certification check
        → If a certification is confirmed, return "HALAL"; otherwise continue to the next step.
    * Haram or suspicious ingredient check
        → If clearly prohibited ingredients (pork, alcohol, etc.) are present, return "NOT_HALAL".
        → If findings remain ambiguous, return "UNKNOWN".
    * Allergen detection
        → Extract and classify major allergens and potential allergens.
    * Output generation
        → Set the confidence conservatively.
        → Summarize the rationale in evidence.


    🧠 Output examples (simplified)
    ** Example 1: Official Halal certification present **
        \`\`\`json
    {
        "judgment": "HALAL",
        "confidence": 0.92,
        "evidence": { "positive": ["Confirmed JAKIM Halal mark"] },
        "allergens": { "found": ["Milk"], "suspect": [] },
        "notes_for_user": "Halal certification verified. Contains milk.",
        "recommended_next_actions": ["Confirm the latest label"]
    }
    \`\`\`

        ** Example 2: Contains pork-derived or alcoholic ingredients **
            \`\`\`json
    {
        "judgment": "NOT_HALAL",
        "confidence": 0.87,
        "evidence": { "negative": ["Pork extract", "Alcohol"] },
        "allergens": { "found": ["Wheat"], "suspect": [] },
        "notes_for_user": "Contains pork-derived ingredients and alcohol, therefore not Halal.",
        "recommended_next_actions": ["Consider an alternative product"]
    }
    \`\`\`

    📘 Instructions for the model

    You are a Halal and allergen assessment assistant.
    Follow the rules and flow above strictly using the provided images and text.

    For packaged products (snacks, confectionery, processed foods, etc.):
    * If labels or ingredient lists are missing or incomplete, identify the product name or brand and research typical ingredient information via web search or product databases.
    * When you infer a judgment from that research, state clearly in evidence that it is inferred.
    * When the judgment is inferred, set the confidence accordingly and mention in notes_for_user that the result is an inferred assessment.

    Avoid over-assumptions and make decisions only when supported by clear evidence from the images or text.
    If you cannot confirm, respond with "UNKNOWN".
    Return only JSON and ensure the output is in English.
    `,
};

const buildPrompt = (language: Language, preferences: GeminiPreferences) => {
  const base = PROMPTS[language] ?? PROMPTS.ja;

  const preferenceSection =
    language === "ja"
      ? `
    🙋‍♀️ ユーザー設定
    * ハラル情報: ${preferences.wantsHalal ? "必要" : "不要"}
    * アレルギー情報: ${preferences.wantsAllergy ? "必要" : "不要"}

    指示:
    * ユーザーが不要と設定している分野は余計な推測を加えず、関連セクション（judgment / certifications / ingredients_flags / allergens など）の値は空配列または中立的な値で返す。
    * 必要な分野では詳細な根拠と説明を提供する。
    * 応答はJSONのみを返し、文章は指定言語（日本語）で短くまとめる。
    `
      : `
    🙋‍♀️ User preferences
    * Halal focus: ${preferences.wantsHalal ? "requested" : "not requested"}
    * Allergen focus: ${preferences.wantsAllergy ? "requested" : "not requested"}

    Guidance:
    * For any area the user did not request, keep the related JSON fields (judgment, certifications, ingredients_flags, allergens) structurally valid but leave them as empty arrays or neutral values without speculative commentary.
    * Provide clear evidence and explanations for the requested areas.
    * Respond in JSON only and keep any textual content concise in English.
    `;

  return `${base}\n${preferenceSection}`;
};

const formatImageData = (image: string): string => {
  if (image.startsWith("data:")) {
    return image.split(",")[1];
  }
  return image;
};

const getMimeType = (base64Data: string): string => {
  if (base64Data.startsWith("/9j/") || base64Data.startsWith("/9j/4AAQ")) {
    return "image/jpeg";
  } else if (base64Data.startsWith("iVBORw0KGgo")) {
    return "image/png";
  } else if (base64Data.startsWith("R0lGODlh") || base64Data.startsWith("R0lGODdh")) {
    return "image/gif";
  } else if (base64Data.startsWith("UklGR")) {
    return "image/webp";
  }
  return "image/jpeg";
};

export const ask_gemini = async (
  image1: string,
  image2: string,
  options: AskGeminiOptions = {}
): Promise<GeminiResponse> => {
  const language = options.language ?? "ja";
  const preferences: GeminiPreferences = {
    wantsHalal: options.preferences?.wantsHalal ?? true,
    wantsAllergy: options.preferences?.wantsAllergy ?? true,
  };

  const prompt = buildPrompt(language, preferences);

  const image1Data = formatImageData(image1);
  const image2Data = formatImageData(image2);

  if (process.env.NODE_ENV === "development") {
    console.log(`[Gemini] Image1 data length: ${image1Data.length} chars`);
    console.log(`[Gemini] Image2 data length: ${image2Data.length} chars`);
  }

  const mimeType1 = getMimeType(image1Data);
  const mimeType2 = getMimeType(image2Data);

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: mimeType1,
              data: image1Data,
            },
          },
          {
            inlineData: {
              mimeType: mimeType2,
              data: image2Data,
            },
          },
        ],
      },
    ],
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorData = await response.json();
      errorDetail = JSON.stringify(errorData, null, 2);
    } catch (e) {
      errorDetail = await response.text();
    }
    throw new Error(
      `Gemini API error: ${response.status} ${response.statusText}\nResponse: ${errorDetail}`
    );
  }

  const data = await response.json();

  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error("No text content in Gemini response");
  }

  const jsonMatch =
    textContent.match(/```json\s*([\s\S]*?)\s*```/) ||
    textContent.match(/```\s*([\s\S]*?)\s*```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : textContent.trim();

  try {
    const parsedJson = JSON.parse(jsonString);
    return parsedJson as GeminiResponse;
  } catch (parseError) {
    throw new Error(
      `Failed to parse JSON response: ${parseError}. Raw response: ${textContent}`
    );
  }
};

export type GeminiLanguage = Language;
