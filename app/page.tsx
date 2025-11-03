"use client";

import { Button } from "@/components/ui/button";
import { FirstQuestion } from "@/components/FirstQuestion";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { AuthGuard } from "@/components/auth-guard";

type CaptureStage = "product" | "ingredients" | "completed";

// ★ Gemini API レスポンスの型定義
interface HaramCheckResult {
  has_label_in_image: boolean;
  used_label_text: boolean;
  judgment: "HALAL" | "NOT_HALAL" | "UNKNOWN";
  confidence: number;
  evidence: { positive: string[]; negative: string[] };
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
}

export default function HomePage() {
  // ★ 撮影段階を管理：product（1枚目）→ ingredients（2枚目）→ completed（完了）
  const [captureStage, setCaptureStage] = useState<CaptureStage>("product");

  // ★ 保存された画像（Blob URL で管理）
  const [productImage, setProductImage] = useState<{ file: File; url: string } | null>(null);
  const [ingredientsImage, setIngredientsImage] = useState<{ file: File; url: string } | null>(null);

  const [showPreview, setShowPreview] = useState<boolean>(false);

  // ★ MediaStream を useState で保持（ストリーム停止を防ぐ）
  const [stream, setStream] = useState<MediaStream | null>(null);

  // ★ ハラル判定結果を表示するかどうか
  const [showResult, setShowResult] = useState<boolean>(false);
  const [haramCheckResult, setHaramCheckResult] = useState<HaramCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ★ モックデータ
  const mockHaramCheckResult: HaramCheckResult = {
    has_label_in_image: false,
    used_label_text: true,
    judgment: "UNKNOWN",
    confidence: 0.65,
    evidence: { positive: [], negative: [] },
    certifications: [],
    ingredients_flags: {
      haram: [],
      suspect: [
        "乳化剤（大豆由来）の製造過程",
        "香料（乳由来）の製造過程",
        "膨脹剤の成分由来",
        "カラメル色素の製造過程"
      ],
      safe: [
        "小麦粉",
        "チョコレートチップ",
        "砂糖",
        "植物油脂",
        "でん粉",
        "卵黄",
        "食塩",
        "全粉乳"
      ]
    },
    allergens: {
      found: ["卵", "乳", "小麦"],
      suspect: ["大豆"]
    },
    notes_for_user: "提供された画像（不二家カントリーマアム クリスピー バニラ）にはハラル認証マークが確認できません。原材料（検索結果に基づく）に明確なハラム成分（豚、アルコール、不明由来ゼラチンなど）は含まれていませんが、乳化剤、香料、膨脹剤などの添加物の詳細な由来（特に動物性由来やアルコール使用の可能性）が不明なため、「UNKNOWN」と判定します。アレルゲンとして、卵、乳、小麦、大豆が含まれます。",
    recommended_next_actions: [
      "製造元（不二家）に添加物（乳化剤、香料、膨脹剤など）の動物性由来・アルコール不使用について確認",
      "ハラル認証のある類似製品を検討"
    ]
  };

  // ★ ストリーム取得 & ビデオ要素へ設定
  const startCamera = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        alert("このブラウザはカメラ機能をサポートしていません。");
        return;
      }

      console.log("[startCamera] videoRef.current:", videoRef.current ? "exists" : "null");

      // 既に stream がある場合はスキップ
      if (stream) {
        console.log("[startCamera] Stream already exists, reusing");
        if (videoRef.current) {
          console.log("[startCamera] Setting srcObject");
          videoRef.current.srcObject = stream;

          // 複数回 play() を試みる
          const playVideo = () => {
            if (videoRef.current) {
              videoRef.current.play().catch((err) => {
                console.error("Error playing video:", err);
              });
            }
          };

          if (videoRef.current.readyState >= 2) {
            console.log("[startCamera] Ready state >= 2, playing immediately");
            playVideo();
          } else if (videoRef.current.readyState >= 1) {
            console.log("[startCamera] Ready state >= 1, trying to play");
            playVideo();
          } else {
            console.log("[startCamera] Ready state < 1, waiting for metadata");
            videoRef.current.onloadedmetadata = () => {
              console.log("[startCamera] Metadata loaded");
              playVideo();
            };
          }

          // フォールバック
          setTimeout(() => {
            console.log("[startCamera] Timeout fallback, forcing play");
            playVideo();
          }, 200);
        }
        return;
      }

      console.log("[startCamera] Requesting new stream");
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(newStream);
      console.log("[startCamera] Stream acquired, setting to video element");

      // ★ ビデオ要素へ直接設定
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;

        const playVideo = () => {
          if (videoRef.current) {
            videoRef.current.play().catch((err) => {
              console.error("Error playing video:", err);
            });
          }
        };

        videoRef.current.onloadedmetadata = () => {
          console.log("[startCamera] Metadata loaded (new stream)");
          playVideo();
        };

        // readyState が既に準備完了している場合
        if (videoRef.current.readyState >= 1) {
          console.log("[startCamera] Ready state >= 1 (new stream), playing immediately");
          playVideo();
        }

        // フォールバック
        setTimeout(() => {
          console.log("[startCamera] Timeout fallback (new stream), forcing play");
          playVideo();
        }, 200);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("カメラにアクセスできませんでした。");
    }
  };

  // ★ 初期化：マウント時のみカメラを起動
  useEffect(() => {
    let isComponentMounted = true;

    const doInit = async () => {
      if (isComponentMounted) {
        await startCamera();
      }
    };

    doInit();

    // クリーンアップ：アンマウント時のみストリーム停止
    return () => {
      isComponentMounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ★ 写真キャプチャ + 自動保存 + 次の段階へ進む
  const capturePhoto = () => {
    console.log(`[capturePhoto] captureStage: ${captureStage}, videoRef: ${videoRef.current ? 'exists' : 'null'}, canvasRef: ${canvasRef.current ? 'exists' : 'null'}`);
    if (videoRef.current && canvasRef.current) {
      console.log(`[capturePhoto] videoWidth=${videoRef.current.videoWidth}, videoHeight=${videoRef.current.videoHeight}, readyState=${videoRef.current.readyState}`);

      // ビデオがまだ準備完了していない場合は待つ
      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        console.warn("[capturePhoto] Video not ready yet, retrying...");
        setTimeout(() => capturePhoto(), 100);
        return;
      }

      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        console.log(`[capturePhoto] Canvas drawn`);

        canvasRef.current.toBlob(
          (blob) => {
            console.log(`[capturePhoto] toBlob callback, blob: ${blob ? 'exists' : 'null'}`);
            if (blob) {
              // ★ File オブジェクト化 + Blob URL を作成
              const fileName =
                captureStage === "product"
                  ? "product-image.jpg"
                  : "ingredients-image.jpg";
              const file = new File([blob], fileName, { type: "image/jpeg" });
              const blobUrl = URL.createObjectURL(blob);
              console.log(`[capturePhoto] File created: ${fileName}`);

              // ★ 段階に応じて画像を保存
              if (captureStage === "product") {
                console.log(`[capturePhoto] Saving product image`);
                setProductImage({ file, url: blobUrl });
                setShowPreview(true);
              } else if (captureStage === "ingredients") {
                console.log(`[capturePhoto] Saving ingredients image`);
                setIngredientsImage({ file, url: blobUrl });
                setCaptureStage("completed");
                setShowPreview(true);
              } else {
                console.log(`[capturePhoto] Unknown captureStage: ${captureStage}`);
              }
            }
          },
          "image/jpeg",
          0.95
        );
      }
    }
  };

  // ★ 次の段階へ進む（プレビューから）
  const proceedToNext = async () => {
    if (captureStage === "product") {
      // 商品画像撮影完了 → 成分表示を撮影
      console.log("[proceedToNext] Starting camera for ingredients stage");
      // ★ 重要：captureStage を先に更新してから showPreview を false にする
      setCaptureStage("ingredients");
      setShowPreview(false);
      // ★ ビデオ要素が DOM にマウントされるまで待つ
      setTimeout(async () => {
        await startCamera();
      }, 150);
    } else if (captureStage === "ingredients") {
      // 成分表示撮影完了 → 確認画面へ
      setShowPreview(false);
    }
  };

  // ★ 再撮影（現在の段階をやり直す）
  const retakePhoto = async () => {
    if (captureStage === "product") {
      setProductImage(null);
    } else if (captureStage === "ingredients") {
      setIngredientsImage(null);
    }
    setShowPreview(false);
    // ★ ビデオ要素が DOM にマウントされるまで待つ
    setTimeout(async () => {
      await startCamera();
    }, 100);
  };

  // ★ File オブジェクトを base64 に変換
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // data:image/jpeg;base64,xxx の形式から base64 部分だけを抽出
        if (result.startsWith('data:')) {
          resolve(result.split(',')[1]);
        } else {
          resolve(result);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ★ 確認ボタン（両画像が保存されている状態）
  const confirmPhotos = async () => {
    if (!productImage?.file || !ingredientsImage?.file) {
      alert("両方の画像が必要です");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Product image:", productImage?.file);
      console.log("Ingredients image:", ingredientsImage?.file);

      // 画像を base64 に変換
      const image1Base64 = await fileToBase64(productImage.file);
      const image2Base64 = await fileToBase64(ingredientsImage.file);

      console.log("Calling haram-check API...");

      // APIルート経由でGemini APIを呼び出す
      const response = await fetch("/api/haram-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image1: image1Base64,
          image2: image2Base64,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("API response:", result);

      // 結果を設定
      setHaramCheckResult(result);
      setShowResult(true);
    } catch (error) {
      console.error("Error calling API:", error);
      alert(`エラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ★ 指示テキストを取得
  const getInstructionText = (): string => {
    if (captureStage === "product") {
      return "商品画像を撮影してください";
    } else if (captureStage === "ingredients") {
      return "成分表示を撮影してください";
    }
    return "";
  };

  // ★ 結果画面から戻る
  const goBackToCapture = () => {
    setShowResult(false);
    setHaramCheckResult(null);
    setProductImage(null);
    setIngredientsImage(null);
    setCaptureStage("product");
    setShowPreview(false);
    window.location.reload();
  };

  const userInfomation = "";

  return (
    <AuthGuard>
      {userInfomation === null ? (
        <FirstQuestion />
      ) : showResult && haramCheckResult ? (
        // ★ ハラル判定結果画面（白基調 + #3EB34F）
        <div className="w-full min-h-screen bg-white p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* ヘッダー */}
            <div className="text-center mb-8 pb-6 border-b-4" style={{ borderColor: "#3EB34F" }}>
              <h1 className="text-4xl font-bold mb-2" style={{ color: "#3EB34F" }}>
                判定結果
              </h1>
              <p className="text-gray-600 text-lg">詳細な分析結果</p>
            </div>

            {/* 判定結果セクション */}
            {/* <div
              className="rounded-xl p-8 text-white shadow-lg"
              style={{ backgroundColor: "#3EB34F" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80 mb-2">ハラル判定</p>
                  <h2 className="text-4xl font-bold">
                    {haramCheckResult.judgment === "HALAL"
                      ? "✓ ハラル"
                      : haramCheckResult.judgment === "NOT_HALAL"
                        ? "✗ ハラム"
                        : "？ 不明"}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80 mb-2">信頼度</p>
                  <p className="text-4xl font-bold">{(haramCheckResult.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div> */}

            {/* 成分情報セクション */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ハラム成分 */}
              <div className="border-l-4 border-red-500 rounded-lg p-5 bg-red-50">
                <h3 className="text-red-700 font-bold mb-3 flex items-center gap-2 text-lg">
                  <span className="text-2xl">✗</span> ハラム成分
                </h3>
                {haramCheckResult.ingredients_flags.haram.length > 0 ? (
                  <ul className="space-y-2">
                    {haramCheckResult.ingredients_flags.haram.map((item, idx) => (
                      <li key={idx} className="text-red-700 text-sm">• {item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">検出されていません</p>
                )}
              </div>

              {/* 疑わしい成分 */}
              <div className="border-l-4 border-yellow-500 rounded-lg p-5 bg-yellow-50">
                <h3 className="text-yellow-700 font-bold mb-3 flex items-center gap-2 text-lg">
                  <span className="text-2xl">!</span> 疑わしい成分
                </h3>
                {haramCheckResult.ingredients_flags.suspect.length > 0 ? (
                  <ul className="space-y-2">
                    {haramCheckResult.ingredients_flags.suspect.map((item, idx) => (
                      <li key={idx} className="text-yellow-700 text-sm">• {item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">検出されていません</p>
                )}
              </div>

              {/* 安全な成分 */}
              <div
                className="border-l-4 rounded-lg p-5 text-white"
                style={{
                  borderColor: "#3EB34F",
                  backgroundColor: "rgba(62, 179, 79, 0.1)"
                }}
              >
                <h3
                  className="font-bold mb-3 flex items-center gap-2 text-lg"
                  style={{ color: "#3EB34F" }}
                >
                  <span className="text-2xl">✓</span> 安全な成分
                </h3>
                {haramCheckResult.ingredients_flags.safe.length > 0 ? (
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {haramCheckResult.ingredients_flags.safe.map((item, idx) => (
                      <li key={idx} className="text-gray-700 text-sm">• {item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">検出されていません</p>
                )}
              </div>
            </div>

            {/* アレルゲン情報セクション */}
            <div
              className="rounded-lg p-6 border-2"
              style={{
                borderColor: "#3EB34F",
                backgroundColor: "rgba(62, 179, 79, 0.05)"
              }}
            >
              <h3
                className="font-bold mb-4 text-lg"
                style={{ color: "#3EB34F" }}
              >
                アレルゲン情報
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 含有アレルゲン */}
                <div>
                  <p className="text-gray-700 font-semibold mb-3">含有:</p>
                  {haramCheckResult.allergens.found.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {haramCheckResult.allergens.found.map((allergen, idx) => (
                        <span
                          key={idx}
                          className="text-white px-4 py-2 rounded-full text-sm font-medium shadow"
                          style={{ backgroundColor: "#ff4444" }}
                        >
                          {allergen}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">なし</p>
                  )}
                </div>
                {/* 疑わしいアレルゲン */}
                <div>
                  <p className="text-gray-700 font-semibold mb-3">疑わしい:</p>
                  {haramCheckResult.allergens.suspect.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {haramCheckResult.allergens.suspect.map((allergen, idx) => (
                        <span
                          key={idx}
                          className="text-white px-4 py-2 rounded-full text-sm font-medium shadow"
                          style={{ backgroundColor: "#ffaa00" }}
                        >
                          {allergen}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">なし</p>
                  )}
                </div>
              </div>
            </div>

            {/* ユーザー向けメモ */}
            <div className="bg-gray-50 border-l-4 border-gray-400 rounded-lg p-6">
              <h3 className="text-gray-800 font-bold mb-4 text-lg"> 詳細情報</h3>
              <p className="text-gray-700 leading-relaxed">
                {haramCheckResult.notes_for_user}
              </p>
            </div>

            {/* 推奨アクション */}
            <div
              className="rounded-lg p-6 border-2"
              style={{
                borderColor: "#3EB34F",
                backgroundColor: "rgba(62, 179, 79, 0.08)"
              }}
            >
              <h3
                className="font-bold mb-4 text-lg"
                style={{ color: "#3EB34F" }}
              >
                推奨アクション
              </h3>
              <ol className="space-y-3">
                {haramCheckResult.recommended_next_actions.map((action, idx) => (
                  <li key={idx} className="text-gray-700 flex gap-4">
                    <span
                      className="font-bold text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#3EB34F" }}
                    >
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{action}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* ボタン */}
            <div className="flex gap-4 justify-center pt-6">
              <Button
                onClick={goBackToCapture}
                className="px-8 py-3 text-lg text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                style={{ backgroundColor: "#3EB34F" }}
              >
                ← 戻る
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-screen bg-black flex flex-col relative">
          {/* カメラビュー */}
          {!showPreview && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* 上部：指示テキスト */}
              <div className="absolute top-8 left-0 right-0 flex justify-center">
                <div className="bg-black bg-opacity-70 px-6 py-3 rounded-lg">
                  <p className="text-white text-lg font-semibold">
                    {getInstructionText()}
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    {captureStage === "product"
                      ? `（1 / 2）`
                      : `（2 / 2）`}
                  </p>
                </div>
              </div>

              {/* 下部ボタン */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 px-4">
                <Button
                  onClick={capturePhoto}
                  className="bg-green-600 hover:bg-green-700 rounded-full w-20 h-20"
                >
                  📸
                </Button>
              </div>
            </>
          )}

          {/* プレビュー画面 */}
          {showPreview && (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <h2 className="text-white text-2xl font-bold mb-4">
                {captureStage === "product"
                  ? "商品画像を確認"
                  : captureStage === "ingredients"
                    ? "成分表示を確認"
                    : "撮影完了"}
              </h2>

              {/* 完了メッセージ */}
              {captureStage === "completed" && (
                <div className="bg-green-600 bg-opacity-20 border-2 border-green-500 rounded-lg px-6 py-4 mb-6 text-center">
                  <p className="text-green-300 text-lg font-semibold">✓ 両画像の撮影が完了しました</p>
                </div>
              )}

              {/* 現在の画像プレビュー */}
              {captureStage === "product" && productImage ? (
                <div className="relative w-full max-w-md h-96 bg-gray-900 rounded-lg overflow-hidden mb-6">
                  <Image
                    src={productImage.url}
                    alt="Captured Photo"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : captureStage === "ingredients" && ingredientsImage ? (
                <div className="relative w-full max-w-md h-96 bg-gray-900 rounded-lg overflow-hidden mb-6">
                  <Image
                    src={ingredientsImage.url}
                    alt="Captured Photo"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : null}

              {/* 前の画像が保存されている場合、プレビュー表示 */}
              {captureStage === "ingredients" && productImage && (
                <div className="mb-6 text-center">
                  <p className="text-gray-300 text-sm mb-2">
                    撮影済み：商品画像
                  </p>
                  <div className="relative w-32 h-32 bg-gray-800 rounded overflow-hidden mx-auto">
                    <Image
                      src={productImage.url}
                      alt="Product Image"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              {/* ボタン */}
              <div className="flex gap-4">
                <Button
                  onClick={retakePhoto}
                  className="bg-blue-600 hover:bg-blue-700 px-8 py-2"
                >
                  🔄 再撮影
                </Button>
                {captureStage === "completed" ? (
                  <Button
                    onClick={confirmPhotos}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 px-8 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "解析中..." : "✓ 確認"}
                  </Button>
                ) : (
                  <Button
                    onClick={proceedToNext}
                    className="bg-yellow-600 hover:bg-yellow-700 px-8 py-2"
                  >
                    → 次へ
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </AuthGuard>
  );
}
