// app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const runtime = "nodejs";

type TtsRequestBody = {
  text: string;

  // OpenAI TTS 用
  model?: string; // 例: "gpt-4o-mini-tts", "tts-1"
  voice?: string; // 例: "coral"
  responseFormat?: "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";
  speed?: number; // 0.25〜4.0
  instructions?: string; // gpt-4o-mini-tts のときだけ有効
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TtsRequestBody;
    const {
      text,
      model = "gpt-4o-mini-tts",
      voice = "coral",
      responseFormat = "wav",
      speed,
      instructions,
    } = body;

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    // === OpenAI TTS ===
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    return await ttsWithOpenAI({
      text,
      model,
      voice,
      responseFormat,
      speed,
      instructions,
    });
  } catch (err) {
    console.error("TTS route error:", err);
    return NextResponse.json(
      { error: "Failed to synthesize speech" },
      { status: 500 }
    );
  }
}

// =========================
// OpenAI TTS 側
// =========================

type OpenAiTtsParams = {
  text: string;
  model: string;
  voice: string;
  responseFormat: "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";
  speed?: number;
  instructions?: string;
};

async function ttsWithOpenAI(params: OpenAiTtsParams) {
  const { text, model, voice, responseFormat, speed, instructions } = params;

  const payload: Record<string, unknown> = {
    model,
    input: text,
    voice,
    response_format: responseFormat,
  };

  if (typeof speed === "number") {
    payload.speed = speed;
  }

  // instructions は gpt-4o-mini-tts 用パラメータ
  if (instructions && model === "gpt-4o-mini-tts") {
    payload.instructions = instructions;
  }

  const apiRes = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!apiRes.ok) {
    const msg = await apiRes.text().catch(() => "");
    console.error("OpenAI TTS error:", apiRes.status, msg);
    return NextResponse.json(
      { error: "OpenAI TTS failed" },
      { status: 500 }
    );
  }

  const audioBuffer = await apiRes.arrayBuffer();

  const mimeType = "wav"

  return new NextResponse(audioBuffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(audioBuffer.byteLength),
    },
  });
}

