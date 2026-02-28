// app/page.tsx
"use client";

import VRMAvatar from "./components/VRMAvatar";
import RecorderButton from "./components/RecorderButton";
import ConversationView from "./components/ConversationView";
import { useConversation, SystemPromptKey } from "./components/useConversation";

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
      {/* STT 言語トグル */}
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
          日本語（OpenAI）
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

      {/* システムプロンプト切り替え */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 12px",
          borderRadius: 12,
          background: "rgba(15,23,42,0.8)",
        }}
      >
        <span style={{ fontSize: 12, color: "#cbd5f5" }}>
          System Prompt
        </span>
        <select
          value={conversation.systemPromptKey}
          onChange={(e) =>
            conversation.setSystemPromptKey(
              e.target.value as SystemPromptKey
            )
          }
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.4)",
            background: "#0b1220",
            color: "#e5e7eb",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          <option value="friend_male">親しい友人(男性)</option>
          <option value="friend_female">親しい友人(女性)</option>
          <option value="coach_male">英会話のコーチ (男性)</option>
          <option value="coach_female">英会話のコーチ (女性)</option>
          <option value="custom">カスタムプロンプト</option>
        </select>
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
