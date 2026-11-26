// Server/services/hf_image_service.js
// Hugging Face Inference Providers Image Generation Client + Disk Cache
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CACHE_DIR = path.join(__dirname, "..", "public", "generated_asanas");

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function slugify(text) {
  return String(text || "asana")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64) || "asana";
}

function buildHFEndpoints() {
  const endpoints = [];
  if (process.env.HF_IMAGE_MODEL) {
    const custom = process.env.HF_IMAGE_MODEL.trim();
    endpoints.push({
      model: custom,
      provider: "hf-custom",
      url: custom.startsWith("http")
        ? custom
        : `https://router.huggingface.co/hf-inference/models/${custom}`,
      bodyStyle: "inputs",
    });
  }
  endpoints.push(
    {
      model: "stabilityai/stable-diffusion-3-medium-diffusers",
      provider: "hf-inference",
      url: "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3-medium-diffusers",
      bodyStyle: "inputs",
    },
    {
      model: "black-forest-labs/FLUX.1-schnell",
      provider: "fal-ai",
      url: "https://router.huggingface.co/fal-ai/fal-ai/flux/schnell",
      bodyStyle: "prompt",
    },
    {
      model: "black-forest-labs/FLUX.1-schnell",
      provider: "wavespeed",
      url: "https://router.huggingface.co/wavespeed/api/v3/wavespeed-ai/flux-schnell",
      bodyStyle: "prompt",
    }
  );
  return endpoints;
}

let hfCooldownUntil = 0;
let hfCooldownMsg = "";

/**
 * Generates or loads cached PNG image via Hugging Face router endpoints.
 * Gracefully reports status if HF credits (402) or token limits prevent generation.
 */
async function generateAsanaImage({ poseName, sanskritName = "", customPrompt = "" }) {
  ensureCacheDir();
  const label = sanskritName ? `${sanskritName} (${poseName})` : poseName;
  const hash = crypto.createHash("md5").update(label.toLowerCase()).digest("hex").slice(0, 8);
  const filename = `${slugify(poseName)}_${hash}.png`;
  const filePath = path.join(CACHE_DIR, filename);

  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 512) {
    return {
      ok: true,
      filename,
      filePath,
      urlPath: `/generated_asanas/${filename}`,
      source: "huggingface",
      cached: true,
      model: "cached-hf",
    };
  }

  if (Date.now() < hfCooldownUntil) {
    return {
      ok: false,
      statusCode: 402,
      error: hfCooldownMsg || "Hugging Face Inference credits depleted.",
    };
  }

  const hfKey = (process.env.HUGGINGFACE_API_KEY || "").trim();
  if (!hfKey) {
    return {
      ok: false,
      statusCode: 401,
      error: "HUGGINGFACE_API_KEY is not configured in Server/.env.",
    };
  }

  const prompt =
    customPrompt ||
    `Clean anatomical yoga instruction illustration of ${label}, minimalist crisp vector art style on warm off-white yoga mat studio background, serene balanced lighting, accurate human posture alignment, no text or watermark`;

  let lastStatus = 500;
  let lastError = "Hugging Face inference failed.";

  for (const ep of buildHFEndpoints()) {
    try {
      const payload = ep.bodyStyle === "prompt" ? { prompt } : { inputs: prompt };
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);

      const resp = await fetch(ep.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const contentType = resp.headers.get("content-type") || "";
      if (resp.ok && contentType.startsWith("image/")) {
        const buf = Buffer.from(await resp.arrayBuffer());
        if (buf.length > 512) {
          fs.writeFileSync(filePath, buf);
          return {
            ok: true,
            filename,
            filePath,
            urlPath: `/generated_asanas/${filename}`,
            source: "huggingface",
            cached: false,
            model: `${ep.model} (${ep.provider})`,
          };
        }
      }

      lastStatus = resp.status;
      if (contentType.includes("application/json")) {
        const json = await resp.json().catch(() => ({}));
        // Handle WaveSpeed/Fal async or image url JSON payloads if returned
        const remoteImgUrl = json?.images?.[0]?.url || json?.data?.[0]?.url || json?.outputs?.[0];
        if (resp.ok && typeof remoteImgUrl === "string" && remoteImgUrl.startsWith("http")) {
          const imgResp = await fetch(remoteImgUrl);
          if (imgResp.ok) {
            const buf = Buffer.from(await imgResp.arrayBuffer());
            fs.writeFileSync(filePath, buf);
            return {
              ok: true,
              filename,
              filePath,
              urlPath: `/generated_asanas/${filename}`,
              source: "huggingface",
              cached: false,
              model: `${ep.model} (${ep.provider})`,
            };
          }
        }
        lastError = json.error || `HTTP ${resp.status}`;
      } else {
        lastError = `HTTP ${resp.status}`;
      }

      // If HF credits exhausted (402) or unauthorized (401), fail fast and cache cooldown cleanly
      if (lastStatus === 402 || lastStatus === 401) {
        hfCooldownUntil = Date.now() + 5 * 60 * 1000;
        hfCooldownMsg = lastError;
        break;
      }
    } catch (err) {
      lastError = err.message || "Network error contacting Hugging Face router.";
    }
  }

  return {
    ok: false,
    statusCode: lastStatus,
    error: lastError,
  };
}

module.exports = {
  generateAsanaImage,
  CACHE_DIR,
};
