// app/api/stt/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const lang = formData.get("lang");

    if (!(file instanceof File)) {
      console.error("file is missing or not File", file);
      return NextResponse.json(
        { error: "file (audio) is required" },
        { status: 400 }
      );
    }

    if (!file.type || !file.size) {
      console.error("file has no type or is empty", {
        type: file.type,
        size: file.size,
      });
      return NextResponse.json(
        { error: "file is empty or missing type" },
        { status: 400 }
      );
    }

    const transcription = await openai.audio.transcriptions.create({
      file,
      // model: "gpt-4o-mini-transcribe",
      model: "gpt-4o-mini-transcribe-2025-12-15",
      language: typeof lang === "string" && lang ? lang : undefined,
    });

    if (!transcription.text?.trim()) {
      return NextResponse.json(
        { error: "Empty transcription" },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      console.error("STT OpenAI error:", {
        status: err.status,
        message: err.message,
        type: err.type,
        code: err.code,
        param: err.param,
      });
      return NextResponse.json(
        {
          error: err.message,
          type: err.type,
          code: err.code,
          param: err.param,
        },
        { status: err.status ?? 500 }
      );
    }

    console.error("STT error:", err);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
