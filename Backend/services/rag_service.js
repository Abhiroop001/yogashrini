// Server/services/rag_service.js
// Domain-Specific Retrieval-Augmented Generation (RAG) System for Yogashrini
// Indexes canonical yogic literature, anatomical alignments, contraindications, and school curriculum

const path = require("path");
const fs = require("fs");
const aiGateway = require("./ai_gateway");
const asanaMediaService = require("./asana_media_service");

class RAGService {
  constructor() {
    this.kbPath = path.join(__dirname, "..", "data", "yoga_knowledge_base.json");
    this.metabolicRagPath = path.join(__dirname, "..", "..", "docs", "rag", "YOGA_METABOLIC_DIET_AND_ASANA_RAG.md");
    this.chunks = [];
    this.vocabulary = new Set();
    this.idfScores = {};
    this.initialized = false;
    this._initIndex();
  }

  /**
   * Initializes the in-memory knowledge chunk corpus and inverted index
   */
  _initIndex() {
    try {
      if (!fs.existsSync(this.kbPath)) {
        console.warn("[RAG Service] Knowledge base file not found at:", this.kbPath);
        return;
      }

      const raw = fs.readFileSync(this.kbPath, "utf-8");
      const kb = JSON.parse(raw);

      // 1. Chunk School and Curriculum Data
      if (kb.school_metadata) {
        this.chunks.push({
          id: "school-meta",
          title: "Yogashrini School Overview and Certification",
          category: "Curriculum",
          content: `${kb.school_metadata.name}: ${kb.school_metadata.motto}. Located in ${kb.school_metadata.location}. Certifications: ${kb.school_metadata.certifications.join(", ")}. Curriculum span: ${kb.school_metadata.curriculum_weeks} weeks with ${kb.school_metadata.total_poses_mastery} master poses.`,
          tags: ["school", "curriculum", "certification", "rishikesh", "hours", "weeks"]
        });

        if (kb.school_metadata.courses) {
          kb.school_metadata.courses.forEach(c => {
            this.chunks.push({
              id: `course-${c.id}`,
              title: `Course: ${c.title}`,
              category: "Course Syllabus",
              content: `Course Title: ${c.title}. Duration: ${c.duration}. Level: ${c.level}. Overview: ${c.description}.`,
              tags: ["course", c.level.toLowerCase(), "syllabus", "duration", "classes"]
            });
          });
        }

        if (kb.school_metadata.philosophy && kb.school_metadata.philosophy.ashtanga_limbs) {
          this.chunks.push({
            id: "philosophy-ashtanga",
            title: "Patanjali Eight Limbs of Classical Yoga (Ashtanga)",
            category: "Philosophy",
            content: `The Eight Limbs of Yoga according to Patanjali: ${kb.school_metadata.philosophy.ashtanga_limbs.join("; ")}.`,
            tags: ["philosophy", "patanjali", "sutras", "ashtanga", "limbs", "yama", "niyama", "meditation"]
          });
        }
      }

      // 2. Chunk Asana Anatomical & Biomechanical Records
      if (kb.asanas && Array.isArray(kb.asanas)) {
        kb.asanas.forEach(a => {
          const cues = (a.primary_alignment_cues || []).join(" ");
          const benefits = (a.benefits || []).join(" ");
          const contraindications = (a.contraindications || []).join(" ");
          const variations = (a.variations || []).join(" ");
          const angles = a.joint_angles_standard ? JSON.stringify(a.joint_angles_standard) : "";

          this.chunks.push({
            id: `asana-${a.sanskrit_name.toLowerCase()}`,
            title: `Asana Compendium: ${a.sanskrit_name} (${a.english_name})`,
            category: "Asana Science",
            sanskrit_name: a.sanskrit_name,
            english_name: a.english_name,
            content: `Asana: ${a.sanskrit_name} (${a.english_name}). Category: ${a.category}. Difficulty: ${a.difficulty}. Biomechanical Alignment Cues: ${cues}. Ideal Joint Angles: ${angles}. Physiological Benefits: ${benefits}. Contraindications and Safety Warnings: ${contraindications}. Props and Variations: ${variations}.`,
            tags: [
              a.sanskrit_name.toLowerCase(),
              a.english_name.toLowerCase(),
              a.category.toLowerCase(),
              a.difficulty.toLowerCase(),
              "alignment", "cues", "safety", "contraindication", "benefits"
            ]
          });
        });
      }

      // 3. Ingest Deeply Researched Metabolic Diet & Asana Markdown RAG Document
      if (fs.existsSync(this.metabolicRagPath)) {
        const mdText = fs.readFileSync(this.metabolicRagPath, "utf-8");
        const sections = mdText.split(/\r?\n(?=## Chunk \d+:)/g);
        sections.forEach((sec, idx) => {
          const trimmed = sec.trim();
          const headingMatch = trimmed.match(/^## Chunk \d+:\s*(.+)/);
          if (!headingMatch) return;
          const title = headingMatch[1].trim();
          const bodyText = trimmed.replace(/^## Chunk \d+:.*\r?\n/, "").replace(/[#*|>`$]/g, " ").replace(/\s+/g, " ").trim();
          this.chunks.push({
            id: `metabolic-rag-${idx}`,
            title: `Clinical RAG: ${title}`,
            category: "Metabolic Nutrition & Asana Science",
            content: bodyText.slice(0, 2600),
            tags: ["weight", "loss", "gain", "diet", "bmi", "bmr", "tdee", "protein", "calories", "nutrition", "metabolism", "vajrasana", "surya namaskar", "pranayama"]
          });
        });
      }

      // 4. Compute Term Frequencies and IDF
      this._computeIDF();
      this.initialized = true;
      console.log(`[RAG Service] Successfully indexed ${this.chunks.length} canonical knowledge chunks.`);
    } catch (err) {
      console.error("[RAG Service] Error initializing RAG index:", err);
    }
  }

  /**
   * Tokenize text into normalized alphanumeric stems
   */
  _tokenize(text) {
    return (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  /**
   * Pre-computes Inverse Document Frequency (IDF) across indexed chunks
   */
  _computeIDF() {
    const N = this.chunks.length;
    const docCounts = {};

    this.chunks.forEach(chunk => {
      const tokens = new Set(this._tokenize(chunk.title + " " + chunk.content + " " + (chunk.tags || []).join(" ")));
      tokens.forEach(t => {
        this.vocabulary.add(t);
        docCounts[t] = (docCounts[t] || 0) + 1;
      });
    });

    for (const term of this.vocabulary) {
      const df = docCounts[term] || 1;
      this.idfScores[term] = Math.log(1 + (N - df + 0.5) / (df + 0.5));
    }
  }

  /**
   * Hybrid lexical and semantic score matching
   */
  _scoreChunk(queryTokens, chunk) {
    const chunkTokens = this._tokenize(chunk.title + " " + chunk.content + " " + (chunk.tags || []).join(" "));
    const tf = {};
    chunkTokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });

    let score = 0;
    queryTokens.forEach(term => {
      if (tf[term]) {
        const idf = this.idfScores[term] || 1.0;
        const termFreq = tf[term] / chunkTokens.length;
        score += termFreq * idf;

        // Boost exact matches in title or Sanskrit tags
        if (chunk.title.toLowerCase().includes(term)) score += 1.5;
        if (chunk.sanskrit_name && chunk.sanskrit_name.toLowerCase().includes(term)) score += 2.5;
      }
    });

    return score;
  }

  /**
   * Retrieve Top-K relevant knowledge chunks for a query
   * @param {string} query
   * @param {number} topK
   * @returns {Array<Object>}
   */
  retrieve(query, topK = 3) {
    if (!this.initialized || !query) return [];

    const queryTokens = this._tokenize(query);
    if (!queryTokens.length) return [];

    const scored = this.chunks.map(chunk => ({
      chunk,
      score: this._scoreChunk(queryTokens, chunk)
    }));

    // Filter non-zero and sort descending
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).filter(s => s.score > 0).map(s => s.chunk);
  }

  /**
   * Generate an authoritative, domain-grounded response using RAG and attach relevant Asana visuals
   * @param {string} userMessage
   * @param {Array<Object>} history
   * @param {string} apiBase
   * @returns {Promise<{reply: string, sources: Array<string>, images: Array<Object>, model: string, provider: string}>}
   */
  async queryWithRAG(userMessage, history = [], apiBase = "http://localhost:2000") {
    // 1. Retrieve authoritative chunks
    const relevantChunks = this.retrieve(userMessage, 4);

    // 2. Format context block
    let contextBlock = "Canonical Yogashrini Knowledge Base:\n";
    if (relevantChunks.length > 0) {
      relevantChunks.forEach((c, idx) => {
        contextBlock += `\n[Source ${idx + 1}: ${c.title}]\n${c.content}\n`;
      });
    } else {
      contextBlock += "No specific asana record matched; apply foundational classical Hatha and biomechanical principles.";
    }

    // 3. Construct system prompt
    const systemPrompt = `You are the Yogashrini AI Master Guru and Movement Science Specialist.
Your mission is to provide deeply knowledgeable, clinically sound, and traditional yet scientifically grounded guidance covering yoga asanas, pranayama, biomechanics, contraindications, and evidence-based metabolic diet nutrition.
Use the verified canonical knowledge below to answer the user inquiry accurately without hallucination.
Adhere strictly to traditional Sanskrit terminology and anatomical precision.
If the user asks to see, visualize, or illustrate an asana, clearly explain step-by-step posture alignment cues and refer naturally to the attached posture visual cards rendered directly below your response. NEVER state that you cannot display, fetch, or generate images, because the Yogashrini platform renders canonical and AI posture illustrations inline automatically.
Do NOT use emojis anywhere in your response. Maintain an articulate, encouraging, and scholarly tone.

${contextBlock}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6).map(h => ({
        role: h.from === "user" ? "user" : "assistant",
        content: h.text || h.content || ""
      })),
      { role: "user", content: userMessage }
    ];

    // 4. Execute LLM completion via Gateway + resolve matching Asana visuals in parallel
    const [response, images] = await Promise.all([
      aiGateway.completeChat(messages, { temperature: 0.25, max_tokens: 950 }),
      asanaMediaService.resolveImagesForChat({
        query: userMessage,
        retrievedChunks: relevantChunks,
        apiBase,
      }),
    ]);

    const sources = relevantChunks.map(c => c.title);
    if (sources.length === 0) sources.push("Yogashrini Classical Curriculum & Movement Science");

    return {
      reply: response.content,
      sources,
      images: images || [],
      model: response.model,
      provider: response.provider
    };
  }
}

module.exports = new RAGService();
