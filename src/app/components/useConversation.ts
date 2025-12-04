// components/useConversation.ts
"use client";

import { useCallback, useRef, useState } from "react";

export type Role = "user" | "assistant";

export type ConversationMessage = {
  id: string;
  role: Role;
  text: string;
};

export function useConversation() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [mouthOpen, setMouthOpen] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const processUserSpeech = useCallback(
    async (audioBlob: Blob) => {
      setIsProcessing(true);
      try {
        //
        // 1. STT: 音声 → テキスト
        //
        const sttForm = new FormData();
        sttForm.append("file", audioBlob, "input.webm");

        const sttRes = await fetch("/api/stt", {
          method: "POST",
          body: sttForm,
        });

        if (!sttRes.ok) {
          const errJson = await sttRes.json().catch(() => null);
          console.error("STT failed", sttRes.status, errJson);
          throw new Error("STT failed");
        }

        const { text: userText } = (await sttRes.json()) as { text: string };

        if (!userText) {
          throw new Error("Empty transcription");
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
        // 3. VOICEVOX: 返答テキスト → 音声
        //
        const ttsRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: reply, styleId: 1 }),
        });

        if (!ttsRes.ok) {
          const errJson = await ttsRes.json().catch(() => null);
          console.error("TTS failed", ttsRes.status, errJson);
          throw new Error("TTS failed");
        }

        const audioArrayBuffer = await ttsRes.arrayBuffer();
        const ttsBlob = new Blob([audioArrayBuffer], { type: "audio/wav" });
        const url = URL.createObjectURL(ttsBlob);

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        audioRef.current.src = url;
        // await audioRef.current.play();

        await playVoiceWithMouth(ttsBlob);

        
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    },
    [messages]
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

      // RMS（音量っぽい値）を出す
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
  };
}
