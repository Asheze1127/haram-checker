import { NextRequest, NextResponse } from "next/server";
import { ask_gemini } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image1, image2 } = body;

    if (!image1 || !image2) {
      return NextResponse.json(
        { error: "Both image1 and image2 are required" },
        { status: 400 }
      );
    }

    // Gemini API を呼び出す
    const result = await ask_gemini(image1, image2);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in haram-check API:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

