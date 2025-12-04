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
      {/* <h1 style={{ fontSize: 28, fontWeight: 700 }}>VRM Chat</h1>
      <p style={{ opacity: 0.8, marginBottom: 8 }}>
        録音 → STT → ChatGPT → VOICEVOX まで一通りつないだ版。
      </p> */}

      <VRMAvatar mouthOpen={conversation.mouthOpen}/>

      <ConversationView messages={conversation.messages} />

      <div style={{ marginTop: 24 }}>
        <RecorderButton conversation={conversation} />
      </div>
    </main>
  );
}
