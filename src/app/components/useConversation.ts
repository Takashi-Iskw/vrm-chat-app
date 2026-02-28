// components/useConversation.ts
"use client";

import { useCallback, useRef, useState } from "react";

export type Role = "user" | "assistant";

export type ConversationMessage = {
  id: string;
  role: Role;
  text: string;
};

// OpenAI TTS のデフォ設定（英語モードのときに使う）
const OPENAI_TTS_CONFIG = {
  model: "gpt-4o-mini-tts",
  // voice: "coral",
  voice: "sage",
  // voice: "shimmer",
  responseFormat: "wav" as const,
  speed: 1.0,
  // 英語喋らせるときにスタイル指定したければここ
  instructions:
    "Speak in natural, friendly, calmly like anime girls.",
};

export function useConversation() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [mouthOpen, setMouthOpen] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 日本語/英語 切り替え
  const [ttsLang, setTtsLang] = useState<"ja" | "en">("en");

  const processUserSpeech = useCallback(
    async (audioBlob: Blob) => {
      setIsProcessing(true);
      setError(null);
      try {
        //
        // 1. STT: 音声 → テキスト
        //
        const sttForm = new FormData();
        sttForm.append("file", audioBlob, "input.webm");
        sttForm.append("lang", ttsLang);

        const sttRes = await fetch("/api/stt", {
          method: "POST",
          body: sttForm,
        });

        if (!sttRes.ok) {
          const errJson = await sttRes.json().catch(() => null);
          console.error("STT failed", sttRes.status, errJson);
          setError(
            errJson?.error ??
              "STT failed（音声が短すぎるか、聞き取りできなかった）"
          );
          return;
        }

        const { text: userText } = (await sttRes.json()) as { text: string };

        if (!userText?.trim()) {
          setError("聞き取れなかった。もう一度話してみて。");
          return;
        }

        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", text: userText },
        ]);

        //
        // 2. ChatGPT: ユーザー発話 + 履歴 → 返答テキスト
        //
        const historyForApi = [
          ...messages,
          { id: "tmp", role: "user" as const, text: userText },
        ].map((m) => ({
          role: m.role,
          content: m.text,
        }));

        const chatRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userText,
            history: historyForApi,
            // もし /api/chat 側で言語切り替えしたければここで lang も送れる
            // lang: ttsLang,
          }),
        });

        if (!chatRes.ok) {
          const errJson = await chatRes.json().catch(() => null);
          console.error("Chat failed", chatRes.status, errJson);
          throw new Error("Chat failed");
        }

        const { reply } = (await chatRes.json()) as { reply: string };
        if (!reply) throw new Error("Empty reply from ChatGPT");

        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", text: reply },
        ]);

        //
        // 3. TTS: 返答テキスト → 音声
        //
        const body: any = {
          text: reply,
          lang: ttsLang, // "ja" → VOICEVOX, "en" → OpenAI
        };

        if (ttsLang === "ja") {
          // VOICEVOX 側のスピーカー ID
          body.speakerId = 66; // 好きな声に変えろ
        } else {
          // OpenAI TTS 側のオプション
          body.model = OPENAI_TTS_CONFIG.model;
          body.voice = OPENAI_TTS_CONFIG.voice;
          body.responseFormat = OPENAI_TTS_CONFIG.responseFormat;
          body.speed = OPENAI_TTS_CONFIG.speed;
          if ((OPENAI_TTS_CONFIG as any).instructions) {
            body.instructions = (OPENAI_TTS_CONFIG as any).instructions;
          }
        }

        const ttsRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!ttsRes.ok) {
          const errJson = await ttsRes.json().catch(() => null);
          console.error("TTS failed", ttsRes.status, errJson);
          throw new Error("TTS failed");
        }

        const audioArrayBuffer = await ttsRes.arrayBuffer();

        // 出力フォーマット
        const mimeType = "audio/wav"

        const ttsBlob = new Blob([audioArrayBuffer], { type: mimeType });
        const url = URL.createObjectURL(ttsBlob);

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        audioRef.current.src = url;

        // 再生 + 口パク同期
        await playVoiceWithMouth(ttsBlob);
      } catch (e) {
        console.error(e);
        setError("処理中にエラーが起きた");
      } finally {
        setIsProcessing(false);
      }
    },
    [messages, ttsLang]
  );

  async function playVoiceWithMouth(audioBlob: Blob) {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const audioContext = audioContextRef.current;

    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    source.start();

    let rafId: number;
    const update = () => {
      analyser.getByteTimeDomainData(dataArray);

      // RMS（音量）を出す
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128; // -1..1
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataArray.length); // 0〜1 くらい
      const mouth = Math.min(1, rms * 8); // 強めにスケール

      setMouthOpen(mouth);

      rafId = requestAnimationFrame(update);
    };

    update();

    source.onended = () => {
      cancelAnimationFrame(rafId);
      setMouthOpen(0);
    };
  }

  return {
    messages,
    isProcessing,
    processUserSpeech,
    mouthOpen,
    ttsLang,
    setTtsLang,
    error,
  };
}
