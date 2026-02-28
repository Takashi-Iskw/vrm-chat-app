// app/page.tsx
"use client";

import VRMAvatar from "./components/VRMAvatar";
import RecorderButton from "./components/RecorderButton";
import ConversationView from "./components/ConversationView";
import { useConversation } from "./components/useConversation";

export default function Page() {
  const conversation = useConversation();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #020617, #0f172a)",
        color: "#e5e7eb",
        padding: "24px",
      }}
    >
      {/* TTS 言語トグル */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: 8,
          borderRadius: 9999,
          background: "rgba(15,23,42,0.8)",
        }}
      >
        <button
          onClick={() => conversation.setTtsLang("ja")}
          style={{
            padding: "6px 14px",
            borderRadius: 9999,
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            background:
              conversation.ttsLang === "ja" ? "#e5e7eb" : "transparent",
            color: conversation.ttsLang === "ja" ? "#020617" : "#e5e7eb",
          }}
        >
          日本語（VOICEVOX）
        </button>
        <button
          onClick={() => conversation.setTtsLang("en")}
          style={{
            padding: "6px 14px",
            borderRadius: 9999,
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            background:
              conversation.ttsLang === "en" ? "#e5e7eb" : "transparent",
            color: conversation.ttsLang === "en" ? "#020617" : "#e5e7eb",
          }}
        >
          English（OpenAI）
        </button>
      </div>

      <VRMAvatar mouthOpen={conversation.mouthOpen}>
        <RecorderButton conversation={conversation} />
      </VRMAvatar>

      <ConversationView messages={conversation.messages} />

      {/* <div style={{ marginTop: 24 }}>
        <RecorderButton conversation={conversation} />
      </div> */}
    </main>
  );
}
