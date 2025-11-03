"use client";

import { use, useState } from "react";
import { Button } from "@/components/ui/button";
import { FirstQuestion } from "@/components/FirstQuestion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { AuthGuard } from "@/components/auth-guard";

export default function HomePage() {
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [pendingStream, setPendingStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ★ カメラストリームをビデオ要素に接続する（useEffect で実行）
  useEffect(() => {
    if (pendingStream && videoRef.current) {
      videoRef.current.srcObject = pendingStream;
      streamRef.current = pendingStream;

      // ビデオ要素の再生準備ができたら再生を開始
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          videoRef.current.play().catch((err) => {
            console.error("Error playing video:", err);
          });
        }
      };

      // フォールバック：メタデータがすぐに読み込まれない場合
      setTimeout(() => {
        if (videoRef.current && videoRef.current.readyState >= 1) {
          videoRef.current.play().catch((err) => {
            console.error("Error playing video (timeout):", err);
          });
        }
      }, 100);
    }
  }, [pendingStream]);

  // ★ ユーザー操作イベント（ボタンクリック）からのみカメラを起動
  const startCamera = useCallback(async () => {
    try {
      // ブラウザ環境でのみ実行
      if (!navigator?.mediaDevices?.getUserMedia) {
        alert("このブラウザはカメラ機能をサポートしていません。");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      // ★ ストリームを pendingStream に設定（useEffect で自動的に接続）
      setPendingStream(stream);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("カメラにアクセスできませんでした。");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // ★ コンポーネントマウント時に自動でカメラを起動
  useEffect(() => {
    let isComponentMounted = true;

    const initCamera = async () => {
      if (isComponentMounted) {
        await startCamera();
      }
    };

    initCamera();

    // クリーンアップ：コンポーネントアンマウント時にカメラを停止
    return () => {
      isComponentMounted = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "captured-photo.jpg", {
              type: "image/jpeg",
            });
            setCapturedImage(file);
            setShowPreview(true);
            stopCamera();
          }
        }, "image/jpeg", 0.95);
      }
    }

  };
  const retakePhoto = async () => {
    setCapturedImage(null);
    setShowPreview(false);
    // ★ ユーザー操作（再撮影ボタンクリック）から再度カメラを起動
    await startCamera();
  };

  const confirmPhoto = () => {
    // ★ 確認ボタン押下時の処理（API呼び出しなど）
    console.log("Photo confirmed:", capturedImage);
    // ここで画像をサーバーに送信するなどの処理を追加
  };

  const userInfomation = null;

  return (
    <AuthGuard>
      <div className="w-full h-screen bg-black flex flex-col">
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

            {/* 下部ボタン */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 px-4">
              <Button
                onClick={capturePhoto}
                className="bg-green-600 hover:bg-green-700 rounded-full w-20 h-20"
              >
                📸
              </Button>
              <Button
                onClick={stopCamera}
                className="bg-red-600 hover:bg-red-700 rounded-full w-20 h-20"
              >
                ✕
              </Button>
            </div>
          </>
        )}        {/* プレビュー画面 */}
        {showPreview && capturedImage && (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-md h-96 bg-gray-900 rounded-lg overflow-hidden mb-6">
              <Image
                src={URL.createObjectURL(capturedImage)}
                alt="Captured Photo"
                fill
                className="object-contain"
              />
            </div>
            
            <div className="flex gap-4">
              <Button
                onClick={retakePhoto}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-2"
              >
                🔄 再撮影
              </Button>
              <Button
                onClick={confirmPhoto}
                className="bg-green-600 hover:bg-green-700 px-8 py-2"
              >
                ✓ 確認
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
