// src/inc/Chatbot.tsx
// RAG-Augmented Intelligent Yoga Assistant for Yogashrini
// Strictly zero emojis - powered by react-icons, Framer Motion, and Groq RAG Engine

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Chatbot.css";
import {
  MdChat,
  MdClose,
  MdSend,
  MdSmartToy,
  MdPerson,
  MdAutoAwesome,
  MdMenuBook,
  MdRefresh
} from "react-icons/md";

interface ChatMessage {
  from: "user" | "bot";
  text: string;
  sources?: string[];
  engine?: string;
}

const QUICK_PROMPTS = [
  "Vrikshasana alignment cues",
  "Downward-Facing Dog benefits",
  "Child's Pose contraindications",
  "Yogashrini 6-week syllabus"
];

const Chatbot: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>("" );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: "bot",
      text: "Greetings. I am the Yogashrini AI Assistant, grounded in classical Hatha yoga philosophy and modern movement biomechanics. How may I guide your practice today?",
      sources: ["Yogashrini Canonical Knowledge Base"]
    }
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessage = { from: "user", text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map(m => ({
        from: m.from,
        text: m.text
      }));

      const resp = await fetch("http://localhost:2000/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload
        })
      });

      if (!resp.ok) {
        throw new Error(`Server returned status ${resp.status}`);
      }

      const data = await resp.json();
      const botReply = data.data?.reply || data.reply || "I could not retrieve an authoritative response at this moment.";
      const sources = data.data?.sources?.map((s: any) => s.title || s) || data.sources || ["Yogashrini Knowledge Base"];

      setMessages(prev => [
        ...prev,
        {
          from: "bot",
          text: botReply,
          sources: sources,
          engine: data.data?.provider || "Groq RAG"
        }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          from: "bot",
          text: "An error occurred while connecting to the AI knowledge gateway. Please ensure the server is online.",
          sources: ["System Network Alert"]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        from: "bot",
        text: "Conversation cleared. Ready for your next inquiry regarding classical asana biomechanics, alignment, or course syllabi.",
        sources: ["Yogashrini Knowledge Base"]
      }
    ]);
  };

  const renderMessageText = (text: string) => {
    return text.split("\n").map((line, idx) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={idx} style={{ display: "block", minHeight: line.trim() === "" ? "8px" : "auto" }}>
          {parts.map((p, pIdx) => {
            if (p.startsWith("**") && p.endsWith("**")) {
              return <strong key={pIdx}>{p.slice(2, -2)}</strong>;
            }
            return p;
          })}
        </span>
      );
    });
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="chatbot-floating-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Toggle AI Assistant"
        title="Open Yogashrini AI Assistant"
      >
        {open ? <MdClose size={24} /> : <MdChat size={24} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="chatbot-window-container"
          >
            {/* Header */}
            <div className="chatbot-header">
              <div className="chatbot-header-info">
                <div className="chatbot-header-avatar">
                  <MdAutoAwesome size={18} />
                </div>
                <div>
                  <h4 className="chatbot-header-title">Yogashrini AI Guru</h4>
                  <div className="chatbot-header-subtitle">Domain-Grounded RAG Assistant</div>
                </div>
              </div>
              <div className="chatbot-header-actions">
                <button
                  className="chatbot-icon-btn"
                  onClick={handleReset}
                  title="Reset Conversation"
                  aria-label="Reset Conversation"
                >
                  <MdRefresh size={18} />
                </button>
                <button
                  className="chatbot-icon-btn"
                  onClick={() => setOpen(false)}
                  title="Close"
                  aria-label="Close"
                >
                  <MdClose size={18} />
                </button>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="chatbot-chips-bar">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  className="chatbot-chip"
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="chatbot-messages-body">
              {messages.map((msg, index) => (
                <div key={index} className={`chatbot-msg-row ${msg.from}`}>
                  <div className="chatbot-msg-avatar">
                    {msg.from === "bot" ? <MdSmartToy size={16} /> : <MdPerson size={16} />}
                  </div>
                  <div className="chatbot-msg-bubble">
                    <div className="chatbot-msg-content">
                      {renderMessageText(msg.text)}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="chatbot-msg-sources">
                        <MdMenuBook size={12} />
                        <span>Sources: {msg.sources.join(" | ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="chatbot-msg-row bot">
                  <div className="chatbot-msg-avatar">
                    <MdSmartToy size={16} />
                  </div>
                  <div className="chatbot-msg-bubble loading">
                    <span className="chatbot-typing-dot"></span>
                    <span className="chatbot-typing-dot"></span>
                    <span className="chatbot-typing-dot"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="chatbot-input-bar">
              <input
                type="text"
                className="chatbot-text-input"
                placeholder="Ask about poses, alignment, injuries, or courses..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                className="chatbot-send-action-btn"
                disabled={!input.trim() || loading}
                aria-label="Send message"
              >
                <MdSend size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
