// app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";

const VOICEVOX_BASE_URL =
  process.env.VOICEVOX_BASE_URL ?? "http://127.0.0.1:50021";

type TtsRequestBody = {
  text: string;
  // 旧styleIdって名前のままでもいいけど、意味的には speakerId
  speakerId?: number;
};

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TtsRequestBody;
    const { text, speakerId = 66 } = body;

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    // 1. audio_query
    const queryRes = await fetch(
      `${VOICEVOX_BASE_URL}/audio_query?text=${encodeURIComponent(
        text
      )}&speaker=${speakerId}`,
      {
        method: "POST",
      }
    );

    if (!queryRes.ok) {
      const msg = await queryRes.text();
      console.error("VOICEVOX audio_query error:", msg);
      return NextResponse.json(
        { error: "VOICEVOX audio_query failed" },
        { status: 500 }
      );
    }

    const queryJson = await queryRes.json();

    // 2. synthesis
    const synthRes = await fetch(
      `${VOICEVOX_BASE_URL}/synthesis?speaker=${speakerId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queryJson),
      }
    );

    if (!synthRes.ok) {
      const msg = await synthRes.text();
      console.error("VOICEVOX synthesis error:", msg);
      return NextResponse.json(
        { error: "VOICEVOX synthesis failed" },
        { status: 500 }
      );
    }

    const audioBuffer = await synthRes.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(audioBuffer.byteLength),
      },
    });
  } catch (err) {
    console.error("TTS route error:", err);
    return NextResponse.json(
      { error: "Failed to synthesize speech" },
      { status: 500 }
    );
  }
}
