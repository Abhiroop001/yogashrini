// Frontend/src/utils/api.ts
// Authenticated Fetch Wrapper, Token Storage Helpers, and On-Demand Razorpay Script Loader

export const API_BASE = "http://localhost:2000";
export const TOKEN_KEY = "yoga_token";
export const USER_KEY = "yoga_user";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...authHeaders(),
    ...((options.headers as Record<string, string>) || {}),
  };

  const resp = await fetch(url, { ...options, headers });
  if (resp.status === 401 && getAuthToken()) {
    window.dispatchEvent(new CustomEvent("yoga:auth-expired"));
  }
  return resp;
}

let razorpayPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window !== "undefined" && (window as any).Razorpay) {
    return Promise.resolve(true);
  }
  if (razorpayPromise) return razorpayPromise;

  razorpayPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      razorpayPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayPromise;
}

let mediaPipePromise: Promise<boolean> | null = null;
let visionFilesetPromise: Promise<any> | null = null;

export type PoseQuality = "lite" | "full";

export interface GpuPoseLandmarkerHandle {
  landmarker: any;
  delegate: "GPU" | "CPU";
  quality: PoseQuality;
}

export async function createGpuPoseLandmarker(
  quality: PoseQuality = "lite"
): Promise<GpuPoseLandmarkerHandle> {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");

  if (!visionFilesetPromise) {
    visionFilesetPromise = FilesetResolver.forVisionTasks("/mediapipe/wasm").catch(() =>
      FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm"
      )
    );
  }
  const vision = await visionFilesetPromise;
  const modelFile = quality === "full" ? "pose_landmarker_full.task" : "pose_landmarker_lite.task";
  const localModelUrl = `/mediapipe/models/${modelFile}`;
  const cdnModelUrl = `https://storage.googleapis.com/mediapipe-models/pose_landmarker/${
    quality === "full" ? "pose_landmarker_full" : "pose_landmarker_lite"
  }/float16/latest/${modelFile}`;

  const tryCreate = async (delegate: "GPU" | "CPU", modelAssetPath: string) => {
    const landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath, delegate },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.45,
      minPosePresenceConfidence: 0.45,
      minTrackingConfidence: 0.45,
    });
    return { landmarker, delegate, quality };
  };

  try {
    return await tryCreate("GPU", localModelUrl);
  } catch {
    try {
      return await tryCreate("CPU", localModelUrl);
    } catch {
      return await tryCreate("GPU", cdnModelUrl);
    }
  }
}

function loadSingleScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export function loadMediaPipeScripts(): Promise<boolean> {
  if (typeof window !== "undefined" && (window as any).Pose && (window as any).Camera) {
    return Promise.resolve(true);
  }
  if (mediaPipePromise) return mediaPipePromise;

  mediaPipePromise = Promise.all([
    loadSingleScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"),
    loadSingleScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js"),
  ])
    .then(() => true)
    .catch(() => {
      mediaPipePromise = null;
      return false;
    });

  return mediaPipePromise;
}
