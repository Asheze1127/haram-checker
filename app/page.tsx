"use client";

import { Button } from "@/components/ui/button";
import { FirstQuestion } from "@/components/FirstQuestion";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { AuthGuard } from "@/components/auth-guard";

type CaptureStage = "product" | "ingredients" | "completed";

export default function HomePage() {
  // ★ 撮影段階を管理：product（1枚目）→ ingredients（2枚目）→ completed（完了）
  const [captureStage, setCaptureStage] = useState<CaptureStage>("product");
  
  // ★ 保存された画像（Blob URL で管理）
  const [productImage, setProductImage] = useState<{ file: File; url: string } | null>(null);
  const [ingredientsImage, setIngredientsImage] = useState<{ file: File; url: string } | null>(null);
  
  const [showPreview, setShowPreview] = useState<boolean>(false);
  
  // ★ MediaStream を useState で保持（ストリーム停止を防ぐ）
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // ★ 確認ボタン（両画像が保存されている状態）
  const confirmPhotos = () => {
    console.log("Product image:", productImage?.file);
    console.log("Ingredients image:", ingredientsImage?.file);
    // ここで API にアップロードするなどの処理を追加可能
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

  const userInfomation = "";

  return (
    <AuthGuard>
      {userInfomation === null ? (
        <FirstQuestion />
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
                    className="bg-green-600 hover:bg-green-700 px-8 py-2"
                  >
                    ✓ 確認
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
