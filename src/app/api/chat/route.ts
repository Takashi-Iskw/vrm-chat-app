// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatRequestBody = {
  userText: string;
  history?: ChatMessage[];
};

const SYSTEM_PROMPT = process.env.OPENAI_YUI_SYSTEM_PROMPT ?? `
You friendly talk to user.
`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const { userText, history = [] } = body;

    if (!userText) {
      return NextResponse.json(
        { error: "userText is required" },
        { status: 400 }
      );
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT      
      },
      ...history,
      { role: "user", content: userText },
    ];

    const completion = await openai.chat.completions.create({
      // model: "gpt-4.1-mini",
      model: "gpt-5.1",
      messages,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: "Failed to generate reply" },
      { status: 500 }
    );
  }
}
