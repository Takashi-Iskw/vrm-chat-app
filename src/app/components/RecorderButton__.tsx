"use client";

import { useState, useEffect } from "react";
import { useRecorder } from "./useRecorder";

export default function RecorderButton() {
  const { isRecording, startRecording, stopRecording, status, error } =
    useRecorder();

  const [transcript, setTranscript] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lastBlobInfo, setLastBlobInfo] = useState<{
    size: number;
    type: string;
  } | null>(null);

  // audioUrl が変わるたびに、古い URL を解放
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleClick = async () => {
    setApiError(null);

    if (!isRecording) {
      // 録音開始
      setTranscript("");
      setLastBlobInfo(null);
      setAudioUrl(null);
      await startRecording();
      return;
    }

    // 録音停止 → Blob を確認 → STT へ送信
    const blob = await stopRecording();
    if (!blob) return;

    // ここで録音結果の情報を保持＆再生用URL作成
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    setLastBlobInfo({
      size: blob.size,
      type: blob.type,
    });

    // ===== ここから STT 呼び出し =====
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const res = await fetch("/api/stt", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "STT API error");
      }

      const data = (await res.json()) as { text?: string };
      setTranscript(data.text ?? "");
    } catch (e) {
      console.error(e);
      setApiError("文字起こしに失敗した");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "center",
      }}
    >
      <button
        onClick={handleClick}
        disabled={status === "error" || loading}
        style={{
          padding: "10px 20px",
          borderRadius: 9999,
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
          background: isRecording ? "#ef4444" : "#22c55e",
          color: "white",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {isRecording ? "録音停止" : "録音開始"}
      </button>

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        {status === "recording" && "録音中…"}
        {status === "idle" && !loading && "待機中"}
        {loading && "OpenAI に送信中…"}
      </div>

      {(error || apiError) && (
        <div style={{ color: "#fca5a5", fontSize: 12 }}>
          {error ?? apiError}
        </div>
      )}

      {/* 録音された音声のメタ情報 */}
      {lastBlobInfo && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            opacity: 0.8,
          }}
        >
          <div>録音サイズ: {Math.round(lastBlobInfo.size / 1024)} KB</div>
          <div>MIME Type: {lastBlobInfo.type || "(unknown)"}</div>
        </div>
      )}

      {/* 録音音声の再生用プレイヤー */}
      {audioUrl && (
        <div style={{ marginTop: 8 }}>
          <audio controls src={audioUrl} />
        </div>
      )}

      {/* STT 結果表示 */}
      {transcript && (
        <div
          style={{
            marginTop: 8,
            maxWidth: 480,
            padding: 12,
            borderRadius: 12,
            background: "rgba(15,23,42,0.7)",
            fontSize: 14,
          }}
        >
          <div style={{ opacity: 0.7, marginBottom: 4 }}>認識結果</div>
          <div>{transcript}</div>
        </div>
      )}
    </div>
  );
}
