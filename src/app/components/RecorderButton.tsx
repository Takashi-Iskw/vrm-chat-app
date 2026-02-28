// components/RecorderButton.tsx
"use client";

import { useState } from "react";
import { useRecorder } from "./useRecorder";
import type { useConversation } from "./useConversation";

type Props = {
  conversation: ReturnType<typeof useConversation>;
};

export default function RecorderButton({ conversation }: Props) {
  const { isRecording, startRecording, stopRecording, status, error } =
    useRecorder();
  const { processUserSpeech, isProcessing, error: convoError } = conversation;
  const [localError, setLocalError] = useState<string | null>(null);

  const handleClick = async () => {
    setLocalError(null);

    if (isRecording) {
      // 停止 → Blob 取得 → 会話処理
      const blob = await stopRecording();
      if (!blob) {
        setLocalError("録音データが取れなかった");
        return;
      }
      if (blob.size < 1024) {
        setLocalError("録音が短すぎるか無音だった");
        return;
      }
      await processUserSpeech(blob);
    } else {
      await startRecording();
    }
  };

  const buttonLabel = isProcessing
    ? "処理中…"
    : isRecording
    ? "録音停止"
    : "話しかける（録音開始）";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        onClick={handleClick}
        disabled={isProcessing || status === "error"}
        style={{
          padding: "12px 24px",
          borderRadius: 9999,
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
          background: isRecording ? "#ef4444" : "#22c55e",
          color: "#0f172a",
          opacity: isProcessing ? 0.6 : 1,
        }}
      >
        {buttonLabel}
      </button>

      {(error || localError || convoError) && (
        <p style={{ color: "#fca5a5", fontSize: 12 }}>
          {error || localError || convoError}
        </p>
      )}
    </div>
  );
}
