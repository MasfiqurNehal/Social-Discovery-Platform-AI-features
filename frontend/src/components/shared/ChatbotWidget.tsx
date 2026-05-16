"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cookies from "js-cookie";
import { Bot, Send, X, MessageCircle, Loader2, Sparkles } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

type ChatMessage = {
  sender: "user" | "assistant";
  body: string;
};

type ChatApiResponse = {
  status?: string;
  message?: string;
  error?: string;
  data?: {
    message?: string;
    conversation_id?: number;
  };
};

const QUICK_PROMPTS = [
  "Best cafe in Dhaka?",
  "Rooftop places",
  "Events this weekend",
];

const getApiBase = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    if (
      typeof window !== "undefined" &&
      envUrl.includes("localhost") &&
      !["localhost", "127.0.0.1"].includes(window.location.hostname)
    ) {
      return envUrl
        .replace("localhost", window.location.hostname)
        .replace("127.0.0.1", window.location.hostname);
    }
    return envUrl;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }
  return "http://127.0.0.1:8000/api";
};

/** Renders Gemini markdown (bold, bullets, headings) as React nodes. */
function MessageBody({ body }: { body: string }) {
  const lines = body.split("\n");

  const renderInline = (text: string, key: number) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    if (parts.length === 1) return <span key={key}>{text}</span>;
    return (
      <span key={key}>
        {parts.map((part, i) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={i} style={{ color: "#f1f5f9", fontWeight: 600 }}>
              {part.slice(2, -2)}
            </strong>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      nodes.push(<div key={`sp-${i}`} className="h-1" />);
      i++;
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      const text = line.replace(/^#{1,3}\s/, "");
      nodes.push(
        <p key={i} style={{ fontWeight: 700, color: "#f1f5f9", marginTop: 4 }}>
          {renderInline(text, i)}
        </p>
      );
      i++;
      continue;
    }

    if (/^\*\*[^*]+\*\*:?$/.test(line.trim())) {
      nodes.push(
        <p key={i} style={{ fontWeight: 700, color: "#f1f5f9", marginTop: 4 }}>
          {renderInline(line.trim().replace(/:$/, ""), i)}
        </p>
      );
      i++;
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      const bulletText = line.replace(/^[-*]\s/, "");
      nodes.push(
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          <span style={{ color: "#38bdf8", marginTop: 2, flexShrink: 0 }}>•</span>
          <span>{renderInline(bulletText, i)}</span>
        </div>
      );
      i++;
      continue;
    }

    nodes.push(<p key={i}>{renderInline(line, i)}</p>);
    i++;
  }

  return (
    <div style={{ fontSize: 13, lineHeight: "1.6", display: "flex", flexDirection: "column", gap: 2 }}>
      {nodes}
    </div>
  );
}

export default function ChatbotWidget() {
  const { user, isLoading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "assistant",
      body: "Hi! I'm your VibeSpot AI assistant. Ask me about cafes, rooftop places, events, or anything to do in Bangladesh.",
    },
  ]);
  const [conversationId, setConversationId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("vibespot_chat_conversation_id");
    return stored && !Number.isNaN(Number(stored)) ? Number(stored) : null;
  });
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (conversationId) {
      localStorage.setItem("vibespot_chat_conversation_id", String(conversationId));
    }
  }, [conversationId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const canUse = useMemo(() => !authLoading, [authLoading]);

  async function sendMessage(text: string) {
    if (!canUse || sending) return;
    const content = text.trim();
    if (!content) return;

    setInput("");
    setError(null);
    setSending(true);
    setMessages((prev) => [...prev, { sender: "user", body: content }]);

    try {
      const token = Cookies.get("auth_token");
      const isAuthed = !!token && !!user;
      const endpoint = isAuthed
        ? `${getApiBase()}/chatbot/ask`
        : `${getApiBase()}/chatbot/ask-public`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (isAuthed && token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: content, conversation_id: conversationId }),
      });

      let json: ChatApiResponse | null = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok) {
        console.warn("Chatbot API error:", json?.message || json?.error);
        setError("Could not reach the assistant. Please try again.");
        setMessages((prev) => [
          ...prev,
          { sender: "assistant", body: "Sorry, I'm having trouble right now. Please try again in a moment." },
        ]);
        return;
      }

      const reply = json?.data?.message || "I could not generate a response.";
      const newId = json?.data?.conversation_id;
      if (newId && typeof newId === "number") setConversationId(newId);
      setMessages((prev) => [...prev, { sender: "assistant", body: reply }]);
    } catch (err) {
      console.error("Chatbot send failed", err);
      setError("Could not reach the assistant. Please check your connection.");
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", body: "Sorry, I'm having trouble right now. Please try again in a moment." },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (typeof window === "undefined" || !canUse) return null;

  const widget = (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999 }}>
      {open && (
        <div
          style={{
            width: "min(92vw, 380px)",
            height: "min(70vh, 600px)",
            display: "flex",
            flexDirection: "column",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(14,165,233,0.2)",
            backgroundColor: "#111115",
            border: "1px solid rgba(14,165,233,0.2)",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              background: "linear-gradient(135deg, #0c2a3f 0%, #0d1f2d 50%, #111115 100%)",
              borderBottom: "1px solid rgba(14,165,233,0.25)",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(14,165,233,0.4)",
                  flexShrink: 0,
                }}
              >
                <Bot size={18} color="#fff" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, margin: 0 }}>
                    AI Assistant
                  </p>
                  <Sparkles size={12} color="#38bdf8" />
                </div>
                <p style={{ color: "#38bdf8", fontSize: 11, margin: 0 }}>Gemini 2.5 Flash</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#94a3b8",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            >
              <X size={14} />
            </button>
          </div>

          {/* ── Messages ── */}
          <div
            ref={listRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 12px 4px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              backgroundColor: "#0e0e12",
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                {msg.sender === "assistant" && (
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: "rgba(2,132,199,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginRight: 7,
                      marginTop: 2,
                    }}
                  >
                    <Bot size={13} color="#38bdf8" />
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "78%",
                    padding: "9px 13px",
                    borderRadius: msg.sender === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                    ...(msg.sender === "user"
                      ? {
                          background: "linear-gradient(135deg, #0284c7, #0369a1)",
                          color: "#fff",
                          fontSize: 13,
                          lineHeight: "1.5",
                          boxShadow: "0 2px 12px rgba(2,132,199,0.35)",
                        }
                      : {
                          backgroundColor: "#1a1a22",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#cbd5e1",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }),
                  }}
                >
                  {msg.sender === "assistant" ? (
                    <MessageBody body={msg.body} />
                  ) : (
                    <span style={{ whiteSpace: "pre-wrap" }}>{msg.body}</span>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: "rgba(2,132,199,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginRight: 7,
                    marginTop: 2,
                  }}
                >
                  <Bot size={13} color="#38bdf8" />
                </div>
                <div
                  style={{
                    padding: "9px 14px",
                    borderRadius: "4px 18px 18px 18px",
                    backgroundColor: "#1a1a22",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  <Loader2 size={14} color="#38bdf8" style={{ animation: "spin 1s linear infinite" }} />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {/* ── Input area ── */}
          <div
            style={{
              backgroundColor: "#111115",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              padding: "10px 12px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {error && (
              <p style={{ color: "#f87171", fontSize: 11, margin: 0 }}>{error}</p>
            )}

            {/* Quick prompts */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={sending}
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    borderRadius: 20,
                    border: "1px solid rgba(14,165,233,0.3)",
                    background: "rgba(14,165,233,0.07)",
                    color: "#7dd3fc",
                    cursor: sending ? "not-allowed" : "pointer",
                    opacity: sending ? 0.5 : 1,
                    transition: "background 0.15s, border-color 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!sending) {
                      e.currentTarget.style.background = "rgba(14,165,233,0.15)";
                      e.currentTarget.style.borderColor = "rgba(14,165,233,0.6)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(14,165,233,0.07)";
                    e.currentTarget.style.borderColor = "rgba(14,165,233,0.3)";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Text input + send */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                rows={2}
                placeholder="Ask about places and events…"
                style={{
                  flex: 1,
                  resize: "none",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "8px 12px",
                  fontSize: 13,
                  lineHeight: "1.5",
                  outline: "none",
                  backgroundColor: "#18181c",
                  color: "#f1f5f9",
                  transition: "border-color 0.15s",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(14,165,233,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={sending || !input.trim()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: sending || !input.trim()
                    ? "rgba(2,132,199,0.3)"
                    : "linear-gradient(135deg, #0284c7, #0ea5e9)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: sending || !input.trim() ? "not-allowed" : "pointer",
                  flexShrink: 0,
                  boxShadow: sending || !input.trim() ? "none" : "0 4px 14px rgba(14,165,233,0.4)",
                  transition: "opacity 0.15s, box-shadow 0.15s",
                }}
              >
                <Send size={16} color="#fff" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toggle button ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 8px 28px rgba(14,165,233,0.5), 0 0 0 1px rgba(14,165,233,0.3)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 12px 36px rgba(14,165,233,0.6), 0 0 0 1px rgba(14,165,233,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 28px rgba(14,165,233,0.5), 0 0 0 1px rgba(14,165,233,0.3)";
          }}
        >
          <MessageCircle size={24} color="#fff" />
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return createPortal(widget, document.body);
}
