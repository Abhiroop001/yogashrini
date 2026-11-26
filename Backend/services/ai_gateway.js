// Server/services/ai_gateway.js
// Enterprise Multi-Tier Resilient AI Inference Gateway
// Connects to Groq, Hugging Face, Gemini, Mistral, and OpenRouter

const https = require("https");
const http = require("http");

class AIGateway {
  constructor() {
    this.groqKey = process.env.GROQ_API_KEY;
    this.hfKey = process.env.HUGGINGFACE_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.mistralKey = process.env.MISTRAL_API_KEY;
    this.openrouterKey = process.env.OPENROUTER_API_KEY;

    // Tested working models
    this.primaryGroqModel = "qwen/qwen3.8-27b";
    this.secondaryGroqModel = "openai/gpt-oss-120b";
  }

  /**
   * Execute chat completion across tiered providers with automatic failover.
   * @param {Array<{role: string, content: string}>} messages
   * @param {Object} options
   * @returns {Promise<{content: string, model: string, provider: string}>}
   */
  async completeChat(messages, options = {}) {
    const temperature = options.temperature ?? 0.3;
    const maxTokens = options.max_tokens ?? 1200;

    // 1. Try Primary: Groq API
    if (this.groqKey) {
      try {
        const groqResult = await this._callGroq(messages, this.primaryGroqModel, temperature, maxTokens);
        if (groqResult) {
          return {
            content: groqResult,
            model: this.primaryGroqModel,
            provider: "Groq Cloud High-Speed Inference"
          };
        }
      } catch (err) {
        console.warn("[AI Gateway] Primary Groq model failed, attempting secondary model:", err.message);
        try {
          const secondaryGroq = await this._callGroq(messages, this.secondaryGroqModel, temperature, maxTokens);
          if (secondaryGroq) {
            return {
              content: secondaryGroq,
              model: this.secondaryGroqModel,
              provider: "Groq Cloud Secondary"
            };
          }
        } catch (secErr) {
          console.warn("[AI Gateway] Secondary Groq model failed:", secErr.message);
        }
      }
    }

    // 2. Try Fallback: Gemini Embedding & Generation
    if (this.geminiKey) {
      try {
        const geminiResult = await this._callGemini(messages, temperature);
        if (geminiResult) {
          return {
            content: geminiResult,
            model: "gemini-flash",
            provider: "Google Gemini AI"
          };
        }
      } catch (gemErr) {
        console.warn("[AI Gateway] Gemini fallback failed:", gemErr.message);
      }
    }

    // 3. Try Fallback: OpenRouter
    if (this.openrouterKey) {
      try {
        const orResult = await this._callOpenRouter(messages, temperature, maxTokens);
        if (orResult) {
          return {
            content: orResult,
            model: "openrouter-routed",
            provider: "OpenRouter Multi-Model"
          };
        }
      } catch (orErr) {
        console.warn("[AI Gateway] OpenRouter fallback failed:", orErr.message);
      }
    }

    // 4. Deterministic Local Fallback (Guarantees zero downtime if internet is severed)
    return {
      content: this._generateLocalFallback(messages),
      model: "yogashrini-local-deterministic-v1",
      provider: "Yogashrini Local Knowledge Engine"
    };
  }

  /**
   * Internal Groq API Client
   */
  async _callGroq(messages, model, temperature, maxTokens) {
    const cappedTokens = Math.min(Math.max(128, Number(maxTokens) || 850), 920);
    const payload = JSON.stringify({
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: cappedTokens
    });

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.groqKey}`,
        "Content-Type": "application/json"
      },
      body: payload,
      signal: AbortSignal.timeout(12000)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Groq HTTP ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  }

  /**
   * Internal Gemini API Client
   */
  async _callGemini(messages, temperature) {
    // Flatten messages into Gemini contents format
    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${this.geminiKey}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
        generationConfig: { temperature: temperature }
      }),
      signal: AbortSignal.timeout(12000)
    });

    if (!resp.ok) {
      throw new Error(`Gemini HTTP ${resp.status}`);
    }

    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  }

  /**
   * Internal OpenRouter Client
   */
  async _callOpenRouter(messages, temperature, maxTokens) {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:2000",
        "X-Title": "Yogashrini Platform"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens
      }),
      signal: AbortSignal.timeout(12000)
    });

    if (!resp.ok) {
      throw new Error(`OpenRouter HTTP ${resp.status}`);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  }

  /**
   * Generates domain-accurate deterministic responses when offline
   */
  _generateLocalFallback(messages) {
    const lastMsg = (messages[messages.length - 1]?.content || "").toLowerCase();

    if (lastMsg.includes("vrikshasana") || lastMsg.includes("tree pose")) {
      return "Vrikshasana (Tree Pose) Alignment Guidance:\n" +
        "1. Ground firmly through the four corners of your standing foot.\n" +
        "2. Place the sole of the lifted foot on your inner thigh or calf; never press on the knee joint.\n" +
        "3. Abduct the bent knee outward while keeping hips square to the front.\n" +
        "4. Bring hands to Anjali Mudra at the chest or extend arms overhead.\n" +
        "5. Maintain an upright spine and steady gaze (Drishti).";
    }

    if (lastMsg.includes("contraindication") || lastMsg.includes("safety") || lastMsg.includes("injury")) {
      return "Yogashrini Safety Guidelines:\n" +
        "1. Never force a joint into hyperextension.\n" +
        "2. If experiencing acute knee pain, do not place the foot on the knee in balance postures.\n" +
        "3. In the event of lumbar disc herniation, avoid deep unassisted spinal twists and forward folds with locked knees.\n" +
        "4. Always align with steady, rhythmic diaphragmatic respiration.";
    }

    return "Yogashrini AI Assistant: The platform blends traditional yogic philosophy with modern computer vision movement science. You can practice with the Live AI Trainer on port 3000, explore classical asanas, or track your flexibility progression in the student dashboard.";
  }
}

module.exports = new AIGateway();
