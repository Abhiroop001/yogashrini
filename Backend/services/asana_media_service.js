// Server/services/asana_media_service.js
// Resolves Asana illustrations from the 48 canonical poses library (cached locally with CORS),
// generates new visual illustrations on demand via Hugging Face models, or creates clean anatomical fallback SVGs.
const fs = require("fs");
const path = require("path");
const hfImageService = require("./hf_image_service");

const POSE_CACHE_DIR = path.join(__dirname, "..", "public", "pose_cache");
const GEN_DIR = hfImageService.CACHE_DIR;

function ensureDirs() {
  if (!fs.existsSync(POSE_CACHE_DIR)) fs.mkdirSync(POSE_CACHE_DIR, { recursive: true });
  if (!fs.existsSync(GEN_DIR)) fs.mkdirSync(GEN_DIR, { recursive: true });
}

function loadCanonicalPoses() {
  const localCatalog = path.join(__dirname, "..", "data", "poses_catalog.json");
  const frontendCatalog = path.join(__dirname, "..", "..", "Frontend", "src", "data", "Poses.json");
  const target = fs.existsSync(localCatalog) ? localCatalog : frontendCatalog;
  if (!fs.existsSync(target)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(target, "utf-8"));
    return Array.isArray(raw?.Poses) ? raw.Poses : [];
  } catch {
    return [];
  }
}

const CANONICAL_POSES = loadCanonicalPoses();

// High-recall alias mapping (Sanskrit variants & common names -> canonical search terms)
const ALIAS_MAP = {
  vrikshasana: "tree",
  vrksasana: "tree",
  "tree pose": "tree",
  savasana: "corpse",
  shavasana: "corpse",
  sivasana: "corpse",
  "corpse pose": "corpse",
  "downward dog": "downward-facing dog",
  "adho mukha svanasana": "downward-facing dog",
  "upward dog": "upward-facing dog",
  "urdhva mukha svanasana": "upward-facing dog",
  "child's pose": "child's pose",
  "child pose": "child's pose",
  balasana: "child's pose",
  "cobra pose": "sphinx",
  bhujangasana: "sphinx",
  plank: "plank",
  phalakasana: "plank",
  "chair pose": "chair",
  utkatasana: "chair",
  "boat pose": "boat",
  navasana: "boat",
  "half boat": "half-boat",
  "ardha navasana": "half-boat",
  "bridge pose": "bridge",
  "setu bandhasana": "bridge",
  "setu bandha": "bridge",
  "warrior 1": "warrior one",
  "virabhadrasana i": "warrior one",
  "warrior i": "warrior one",
  "warrior 2": "warrior two",
  "virabhadrasana ii": "warrior two",
  "warrior ii": "warrior two",
  "warrior 3": "warrior three",
  "virabhadrasana iii": "warrior three",
  "warrior iii": "warrior three",
  "half lord of the fishes": "half lord of the fishes",
  "ardha matsyendrasana": "half lord of the fishes",
  "spinal twist": "half lord of the fishes",
  "seated forward bend": "seated forward bend",
  paschimottanasana: "seated forward bend",
  "standing forward bend": "standing forward bend",
  uttanasana: "standing forward bend",
  "bow pose": "bow",
  dhanurasana: "bow",
  butterfly: "butterfly",
  "baddha konasana": "butterfly",
  camel: "camel",
  ustrasana: "camel",
  "cat pose": "cat",
  marjaryasana: "cat",
  "cow pose": "cow",
  bitilasana: "cow",
  malasana: "squat",
  "yogic squat": "squat",
  trikonasana: "triangle",
  "triangle pose": "triangle",
  padmasana: "lotus",
  "lotus pose": "lotus",
  garudasana: "eagle",
  "eagle pose": "eagle",
  bakasana: "crow",
  "crow pose": "crow",
  halasana: "plow",
  "plow pose": "plow",
  sarvangasana: "shoulder stand",
  "shoulder stand": "shoulder stand",
  vasisthasana: "side plank",
  "side plank": "side plank",
  anjaneyasana: "low lunge",
  "low lunge": "low lunge",
  "mountain pose": "crescent moon",
  tadasana: "crescent moon",
  "sun salutation": "upward-facing dog",
  "surya namaskar": "upward-facing dog",
};

// Non-canonical poses that deserve dedicated visual generation (or clean anatomical card fallback)
const NON_CANONICAL_SPECIALS = [
  { key: "vajrasana", sanskrit: "Vajrasana", english: "Thunderbolt Digestive Pose", cue: "Kneel gently with spine upright for 5-10 min after meals" },
  { key: "pavanamuktasana", sanskrit: "Pavanamuktasana", english: "Wind-Relieving Pose", cue: "Draw knees softly toward chest in supine alignment" },
  { key: "prasarita padottanasana", sanskrit: "Prasarita Padottanasana", english: "Wide-Legged Forward Fold", cue: "Hinge from hip creases with wide grounded stance" },
  { key: "nadi shodhana", sanskrit: "Nadi Shodhana", english: "Alternate Nostril Pranayama", cue: "Seated upright breathing cycle balancing autonomic nervous tone" },
  { key: "kapalbhati", sanskrit: "Kapalbhati", english: "Skull-Shining Breath", cue: "Rhythmic passive inhales with brisk diaphragmatic exhales" },
  { key: "bhujangasana", sanskrit: "Bhujangasana", english: "Cobra Pose", cue: "Lift chest gently using back extensors; elbows hugged in" },
  { key: "surya namaskar", sanskrit: "Surya Namaskar", english: "Sun Salutation Flow", cue: "Synchronized breath-led 12-posture metabolic vinyasa cycle" },
];

function slug(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "asana";
}

function normalizeText(text) {
  return String(text || "").toLowerCase().replace(/['’-]/g, " ").replace(/\s+/g, " ").trim();
}

const SORTED_ALIAS_ENTRIES = Object.entries(ALIAS_MAP).sort(
  (a, b) => b[0].length - a[0].length
);

function findCanonicalPose(query) {
  const norm = normalizeText(query);
  if (!norm) return null;

  // 1. Exact alias or catalog match first
  for (const [alias, target] of SORTED_ALIAS_ENTRIES) {
    const aliasNorm = normalizeText(alias);
    if (norm === aliasNorm) {
      const match = CANONICAL_POSES.find(
        (p) =>
          normalizeText(p.english_name) === normalizeText(target) ||
          normalizeText(p.sanskrit_name) === normalizeText(target)
      );
      if (match) return match;
    }
  }

  const exactCatalog = CANONICAL_POSES.find(
    (p) => normalizeText(p.english_name) === norm || normalizeText(p.sanskrit_name) === norm
  );
  if (exactCatalog) return exactCatalog;

  // 2. Longest-alias substring match (prevents "warrior i" matching "warrior ii")
  for (const [alias, target] of SORTED_ALIAS_ENTRIES) {
    const aliasNorm = normalizeText(alias);
    if (norm.includes(aliasNorm)) {
      const match = CANONICAL_POSES.find(
        (p) =>
          normalizeText(p.english_name) === normalizeText(target) ||
          normalizeText(p.sanskrit_name) === normalizeText(target)
      );
      if (match) return match;
    }
  }

  // 3. Longest-name catalog substring match
  const byLen = [...CANONICAL_POSES].sort(
    (a, b) => (b.sanskrit_name?.length || 0) - (a.sanskrit_name?.length || 0)
  );
  return (
    byLen.find((p) => {
      const en = normalizeText(p.english_name);
      const sk = normalizeText(p.sanskrit_name);
      return (en.length >= 3 && norm.includes(en)) || (sk.length >= 4 && norm.includes(sk));
    }) || null
  );
}

async function cacheCanonicalSvg(pose) {
  ensureDirs();
  const filename = `pose_${pose.id}_${slug(pose.sanskrit_name)}.svg`;
  const filePath = path.join(POSE_CACHE_DIR, filename);

  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 100) {
    return `/pose_cache/${filename}`;
  }

  try {
    const resp = await fetch(pose.img_url);
    if (resp.ok) {
      const svgText = await resp.text();
      if (svgText.includes("<svg")) {
        fs.writeFileSync(filePath, svgText, "utf-8");
        return `/pose_cache/${filename}`;
      }
    }
  } catch {
    // Fall back to direct URL if remote download temporarily fails
  }
  return pose.img_url;
}

function escapeXml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateLocalDiagramSvg({ sanskritName, englishName, cue }) {
  ensureDirs();
  const filename = `${slug(sanskritName || englishName)}_card.svg`;
  const filePath = path.join(GEN_DIR, filename);
  if (!fs.existsSync(filePath)) {
    const title = escapeXml(sanskritName || englishName);
    const sub = escapeXml(englishName || "Yogashrini Alignment Reference");
    const cueLine = escapeXml((cue || "Align breath with steady posture and spinal elongation.").slice(0, 72));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="320" viewBox="0 0 520 320">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF5F8"/>
      <stop offset="100%" stop-color="#F3EEFF"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF2D6F"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
  </defs>
  <rect width="520" height="320" rx="18" fill="url(#bg)"/>
  <rect x="0" y="0" width="520" height="8" fill="url(#accent)"/>
  <circle cx="260" cy="118" r="56" fill="#FF2D6F" fill-opacity="0.12" stroke="#7C3AED" stroke-opacity="0.35" stroke-width="2"/>
  <circle cx="260" cy="86" r="13" fill="#1E1E2E"/>
  <path d="M260 100 L260 144 M230 120 L260 108 L290 120 M240 168 L260 144 L280 168" stroke="#FF2D6F" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <line x1="175" y1="176" x2="345" y2="176" stroke="#7C3AED" stroke-width="3" stroke-linecap="round" stroke-opacity="0.45"/>
  <text x="260" y="218" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#1E1E2E">${title}</text>
  <text x="260" y="242" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#7C3AED">${sub}</text>
  <text x="260" y="274" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#475569">${cueLine}</text>
  <text x="260" y="302" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#94A3B8">YOGASHRINI ANATOMICAL ALIGNMENT GUIDE</text>
</svg>`;
    fs.writeFileSync(filePath, svg, "utf-8");
  }
  return `/generated_asanas/${filename}`;
}

/**
 * Resolves a single asana illustration URL (always CORS-safe and non-broken).
 * Checks canonical 48 library first unless forceHF is true; otherwise generates via Hugging Face
 * with graceful fallback to canonical alias or generated vector card if HF credits return 402/error.
 */
async function resolveAsanaImage({ poseName, sanskritName = "", forceHF = false, apiBase = "http://localhost:2000" }) {
  const combined = `${poseName || ""} ${sanskritName || ""}`.trim();
  const special = NON_CANONICAL_SPECIALS.find(
    (s) => normalizeText(combined).includes(s.key) || normalizeText(combined).includes(normalizeText(s.english))
  );

  if (!forceHF) {
    // Check if canonical exists first (instant, exact silhouette)
    const canonical = findCanonicalPose(combined);
    if (canonical && !special) {
      const localPath = await cacheCanonicalSvg(canonical);
      const imageUrl = localPath.startsWith("http") ? localPath : `${apiBase}${localPath}`;
      return {
        englishName: canonical.english_name,
        sanskritName: canonical.sanskrit_name,
        title: `${canonical.sanskrit_name} (${canonical.english_name})`,
        imageUrl,
        source: "canonical",
        caption: `Canonical Posture #${canonical.id}: ${canonical.english_name}`,
      };
    }

    // Special pose (like Vajrasana, Surya Namaskar, Bhujangasana, Pavanamuktasana) OR custom pose:
    // Try Hugging Face model if key available, else fall back cleanly to canonical alias / vector diagram
    const hf = await hfImageService.generateAsanaImage({
      poseName: special ? special.english : poseName || combined,
      sanskritName: special ? special.sanskrit : sanskritName,
    });
    if (hf.ok) {
      return {
        englishName: special ? special.english : poseName,
        sanskritName: special ? special.sanskrit : sanskritName || poseName,
        title: special ? `${special.sanskrit} (${special.english})` : combined,
        imageUrl: `${apiBase}${hf.urlPath}`,
        source: "huggingface",
        model: hf.model,
        caption: `Generated via Hugging Face (${hf.model})`,
      };
    }

    // Graceful fallback when HF returns 402/credits needed or unavailable
    if (canonical) {
      const localPath = await cacheCanonicalSvg(canonical);
      const imageUrl = localPath.startsWith("http") ? localPath : `${apiBase}${localPath}`;
      return {
        englishName: special ? special.english : canonical.english_name,
        sanskritName: special ? special.sanskrit : canonical.sanskrit_name,
        title: special ? `${special.sanskrit} (${special.english})` : `${canonical.sanskrit_name} (${canonical.english_name})`,
        imageUrl,
        source: "canonical",
        hfNote: hf.error,
        caption: `${canonical.sanskrit_name} (${canonical.english_name}) alignment reference`,
      };
    }

    const diagramPath = generateLocalDiagramSvg({
      sanskritName: special ? special.sanskrit : sanskritName || poseName,
      englishName: special ? special.english : poseName,
      cue: special?.cue,
    });
    return {
      englishName: special ? special.english : poseName,
      sanskritName: special ? special.sanskrit : sanskritName || poseName,
      title: special ? `${special.sanskrit} (${special.english})` : combined,
      imageUrl: `${apiBase}${diagramPath}`,
      source: "anatomical-diagram",
      hfNote: hf.error,
      caption: special?.cue || "Classical anatomical posture reference card",
    };
  }

  // Explicit image-generation request -> try Hugging Face first
  const hf = await hfImageService.generateAsanaImage({
    poseName: poseName || sanskritName,
    sanskritName,
  });
  if (hf.ok) {
    return {
      englishName: poseName || sanskritName,
      sanskritName: sanskritName || poseName,
      title: sanskritName ? `${sanskritName} (${poseName})` : poseName,
      imageUrl: `${apiBase}${hf.urlPath}`,
      source: "huggingface",
      model: hf.model,
      caption: `Generated via Hugging Face (${hf.model})`,
    };
  }

  const canonical = findCanonicalPose(combined);
  if (canonical) {
    const localPath = await cacheCanonicalSvg(canonical);
    return {
      englishName: canonical.english_name,
      sanskritName: canonical.sanskrit_name,
      title: `${canonical.sanskrit_name} (${canonical.english_name})`,
      imageUrl: localPath.startsWith("http") ? localPath : `${apiBase}${localPath}`,
      source: "canonical",
      hfNote: hf.error,
      caption: `Canonical reference (${canonical.sanskrit_name}); Hugging Face generation note: ${hf.error}`,
    };
  }

  const diagramPath = generateLocalDiagramSvg({
    sanskritName: sanskritName || poseName,
    englishName: poseName || "Yoga Posture",
  });
  return {
    englishName: poseName || sanskritName,
    sanskritName: sanskritName || poseName,
    title: combined,
    imageUrl: `${apiBase}${diagramPath}`,
    source: "anatomical-diagram",
    hfNote: hf.error,
    caption: `Anatomical reference card (Hugging Face note: ${hf.error})`,
  };
}

/**
 * Extracts mentioned asanas from a chatbot query or retrieved chunks and resolves images when appropriate.
 */
async function resolveImagesForChat({ query, replyText = "", retrievedChunks = [], apiBase = "http://localhost:2000" }) {
  const normQuery = normalizeText(query);
  const asksVisual =
    /\b(image|images|photo|picture|pic|diagram|illustration|show|visualize|draw|generate|look like|how to do)\b/.test(normQuery);
  const explicitGenerate = /\b(generate|create image|draw|render)\b/.test(normQuery);

  const matchedNames = new Map();

  // 1. Direct scan of query against canonical poses & aliases & specials
  for (const [alias] of Object.entries(ALIAS_MAP)) {
    if (normQuery.includes(normalizeText(alias))) {
      matchedNames.set(normalizeText(alias), { poseName: alias });
    }
  }
  for (const p of CANONICAL_POSES) {
    const en = normalizeText(p.english_name);
    const sk = normalizeText(p.sanskrit_name);
    if ((en.length >= 4 && normQuery.includes(en)) || (sk.length >= 5 && normQuery.includes(sk))) {
      matchedNames.set(sk, { poseName: p.english_name, sanskritName: p.sanskrit_name });
    }
  }
  for (const sp of NON_CANONICAL_SPECIALS) {
    if (normQuery.includes(sp.key) || normQuery.includes(normalizeText(sp.english))) {
      matchedNames.set(sp.key, { poseName: sp.english, sanskritName: sp.sanskrit });
    }
  }

  // 2. If user asked visually or we retrieved Asana chunks, include up to 2 relevant pose visuals
  if (matchedNames.size === 0 && (asksVisual || retrievedChunks.some((c) => c.sanskrit_name))) {
    for (const c of retrievedChunks) {
      if (c.sanskrit_name) {
        matchedNames.set(normalizeText(c.sanskrit_name), {
          poseName: c.english_name || c.sanskrit_name,
          sanskritName: c.sanskrit_name,
        });
      }
    }
  }

  // 3. Also scan metabolic/diet reply for named asanas if user asked for poses/visuals
  if (matchedNames.size === 0 && asksVisual && replyText) {
    const normReply = normalizeText(replyText);
    for (const p of CANONICAL_POSES) {
      if (normReply.includes(normalizeText(p.sanskrit_name))) {
        matchedNames.set(normalizeText(p.sanskrit_name), {
          poseName: p.english_name,
          sanskritName: p.sanskrit_name,
        });
        if (matchedNames.size >= 2) break;
      }
    }
  }

  const targets = Array.from(matchedNames.values()).slice(0, 3);
  if (targets.length === 0) return [];

  const resolved = await Promise.all(
    targets.map((t) =>
      resolveAsanaImage({
        poseName: t.poseName,
        sanskritName: t.sanskritName || "",
        forceHF: explicitGenerate,
        apiBase,
      })
    )
  );

  // Deduplicate by resolved imageUrl
  const seen = new Set();
  return resolved.filter((item) => {
    if (!item || !item.imageUrl || seen.has(item.imageUrl)) return false;
    seen.add(item.imageUrl);
    return true;
  });
}

module.exports = {
  CANONICAL_POSES,
  resolveAsanaImage,
  resolveImagesForChat,
  findCanonicalPose,
};
