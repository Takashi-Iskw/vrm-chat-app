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
  systemPromptKey?: SystemPromptKey;
};

type SystemPromptKey =
  | "friend_male"
  | "friend_female"
  | "coach_male"
  | "coach_female"
  | "custom";

const DEFAULT_SYSTEM_PROMPT = `
あなたはユーザーとフレンドリーに会話をします。
`;

const CUSTOM_SYSTEM_PROMPT =
  process.env.OPENAI_SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT;

const SYSTEM_PROMPTS: Record<SystemPromptKey, string> = {
  friend_male: `
あなたは親しい男性の友人として話します。
親しみのあるフランクな口調で、適度にカジュアルな日本語で返答してください。
`,
  friend_female: `
あなたは親しい女性の友人として話します。
明るく親しみのある口調で、やわらかい日本語で返答してください。
`,
  coach_male: `
あなたは男性の英会話コーチです。
英語で会話し、ユーザーの英語の練習を促します。
`,
  coach_female: `
あなたは女性の英会話コーチです。
英語で会話し、ユーザーの英語の練習を促します。
`,
  custom: CUSTOM_SYSTEM_PROMPT,
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const { userText, history = [], systemPromptKey = "friend_male" } = body;

    if (!userText) {
      return NextResponse.json(
        { error: "userText is required" },
        { status: 400 }
      );
    }

    const systemPrompt =
      SYSTEM_PROMPTS[systemPromptKey] ?? CUSTOM_SYSTEM_PROMPT;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompt,
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
