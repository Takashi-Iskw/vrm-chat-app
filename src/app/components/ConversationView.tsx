// components/ConversationView.tsx
"use client";

import type { ConversationMessage } from "./useConversation";

type Props = {
  messages: ConversationMessage[];
};

export default function ConversationView({ messages }: Props) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 640,
        maxHeight: 240,
        overflowY: "auto",
        padding: 12,
        borderRadius: 12,
        border: "1px solid #1f2937",
        background: "#020617",
      }}
    >
      {messages.length === 0 && (
        <p style={{ opacity: 0.7, fontSize: 14 }}>まだ会話はありません。</p>
      )}
      {messages.map((m) => (
        <div
          key={m.id}
          style={{
            marginBottom: 8,
            textAlign: m.role === "user" ? "right" : "left",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "6px 10px",
              borderRadius: 9999,
              fontSize: 14,
              background:
                m.role === "user"
                  ? "rgba(59,130,246,0.2)"
                  : "rgba(34,197,94,0.15)",
            }}
          >
            {m.text}
          </span>
        </div>
      ))}
    </div>
  );
}
