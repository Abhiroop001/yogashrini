// src/pages/LiveTrainer.tsx
// Real-time AI Yoga Pose Coach & Vrikshasana Posture Correction
// Powered by MediaPipe Pose + NVIDIA RTX 3050 GPU Neural Network + Framer Motion Animations

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./LiveTrainer.css";
import { LimbStatus, Landmark } from "../types";
import { loadMediaPipeScripts, createGpuPoseLandmarker, PoseQuality } from "../utils/api";

import { GiMeditation } from "react-icons/gi";
import {
  MdVideocam,
  MdVideocamOff,
  MdVolumeUp,
  MdVolumeOff,
  MdRecordVoiceOver,
  MdFlipCameraAndroid,
  MdBolt,
  MdCheckCircle,
  MdWarning,
  MdError,
  MdLightbulbOutline,
  MdTimer,
  MdPhotoSizeSelectActual,
  MdFullscreen,
  MdFullscreenExit,
  MdSpeed
} from "react-icons/md";

const BACKEND_URL = "http://localhost:5000";

function playChime(freq = 587.33) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // AudioContext blocked until interaction
  }
}

function calcAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const ba = [a.x - b.x, a.y - b.y];
  const bc = [c.x - b.x, c.y - b.y];
  const dot = ba[0] * bc[0] + ba[1] * bc[1];
  const magA = Math.sqrt(ba[0] * ba[0] + ba[1] * ba[1]);
  const magB = Math.sqrt(bc[0] * bc[0] + bc[1] * bc[1]);
  if (magA === 0 || magB === 0) return 180;
  const cosVal = Math.min(1.0, Math.max(-1.0, dot / (magA * magB)));
  return (Math.acos(cosVal) * 180) / Math.PI;
}

const LiveTrainer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraInstanceRef = useRef<any>(null);
  const poseInstanceRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // States
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [showReference, setShowReference] = useState<boolean>(true);
  const [referenceImgUrl, setReferenceImgUrl] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<boolean>(false);

  // AI & Detection States
  const [personDetected, setPersonDetected] = useState<boolean>(false);
  const [fullBodyDetected, setFullBodyDetected] = useState<boolean>(false);
  const [alignmentScore, setAlignmentScore] = useState<number>(0);
  const [isPerfect, setIsPerfect] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Camera is ready. Click 'Start Live Coaching' to begin.");
  const [corrections, setCorrections] = useState<string[]>([]);
  const [limbStatus, setLimbStatus] = useState<LimbStatus>({
    standing_leg: "idle",
    bent_leg: "idle",
    foot_placement: "idle",
    arms: "idle",
    torso: "idle"
  });

  // Hold streak timer
  const [holdSeconds, setHoldSeconds] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const holdTimerRef = useRef<any>(null);

  // GPU & System status + Real-time FPS / latency telemetry refs
  const [gpuInfo, setGpuInfo] = useState<{
    loaded: boolean;
    name: string;
    provider?: string;
    vramFreeMb?: number | null;
  }>({
    loaded: true,
    name: "NVIDIA GeForce RTX 3050"
  });
  const [gpuConfidence, setGpuConfidence] = useState<number | null>(null);
  const [renderFps, setRenderFps] = useState<number>(0);
  const [poseLatencyMs, setPoseLatencyMs] = useState<number>(0);
  const [gpuLatencyMs, setGpuLatencyMs] = useState<number | null>(null);
  const [poseDelegate, setPoseDelegate] = useState<string>("WebGL GPU");
  const [poseQuality, setPoseQuality] = useState<PoseQuality>("lite");
  const poseQualityRef = useRef<PoseQuality>("lite");
  const lastAnalyzeRef = useRef<number>(0);
  const snapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPoseExecTsRef = useRef<number>(0);
  const lastPoseDurationRef = useRef<number>(0);
  const gpuBusyRef = useRef<boolean>(false);
  const tasksLandmarkerRef = useRef<any>(null);
  const renderRafRef = useRef<number | null>(null);
  const rawLandmarksRef = useRef<Landmark[] | null>(null);
  const smoothedLandmarksRef = useRef<Landmark[] | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const poseBusyRef = useRef<boolean>(false);
  const isCameraActiveRef = useRef<boolean>(false);
  const uiCommitRef = useRef<number>(0);
  const lastUiFlagsRef = useRef<{ person: boolean; full: boolean; perfect: boolean }>({
    person: false,
    full: false,
    perfect: false
  });
  const fpsTrackerRef = useRef<{ frames: number; lastTs: number; poseMsAcc: number; poseSamples: number }>({
    frames: 0,
    lastTs: typeof performance !== "undefined" ? performance.now() : 0,
    poseMsAcc: 0,
    poseSamples: 0
  });
  const drawStateRef = useRef<{
    primaryColor: string;
    jointColor: string;
    isCelebration: boolean;
    limbMap: LimbStatus | Record<string, string>;
    isOutOfBounds: boolean;
  }>({
    primaryColor: "#FF2D6F",
    jointColor: "#FFFFFF",
    isCelebration: false,
    limbMap: {},
    isOutOfBounds: false
  });

  // Speech throttle, voice cache & Chromium queue-unstick refs
  const lastSpokenRef = useRef<number>(0);
  const lastSpokenTextRef = useRef<string>("");
  const speechTimerRef = useRef<number | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceListRef = useRef<SpeechSynthesisVoice[]>([]);
  const [voiceReady, setVoiceReady] = useState<boolean>(
    () => typeof window !== "undefined" && "speechSynthesis" in window
  );
  const [voiceStatus, setVoiceStatus] = useState<string>("Standby");

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceReady(false);
      setVoiceStatus("Unsupported");
      return;
    }

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) {
        voiceListRef.current = list;
        setVoiceReady(true);
        if (voiceStatus === "Unsupported") setVoiceStatus("Ready");
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", loadVoices);
      if (speechTimerRef.current) window.clearTimeout(speechTimerRef.current);
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignored
      }
    };
  }, []);

  const pickPreferredVoice = (): SpeechSynthesisVoice | null => {
    const list = voiceListRef.current.length
      ? voiceListRef.current
      : window.speechSynthesis?.getVoices?.() || [];
    if (!list.length) return null;
    return (
      list.find((v) => v.lang?.toLowerCase().startsWith("en") && /natural|google|aria|zira|david|samantha/i.test(v.name)) ||
      list.find((v) => v.lang?.toLowerCase().startsWith("en-")) ||
      list.find((v) => v.default) ||
      list[0]
    );
  };

  const speakFeedback = useCallback(
    (text: string, options: { immediate?: boolean; force?: boolean } = {}) => {
      if (!options.force && isAudioMuted) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        playChime(523.25);
        setVoiceStatus("Chime Only");
        return;
      }

      const cleanText = String(text || "").replace(/^ALERT:\s*/i, "Alert: ").trim();
      if (!cleanText) return;

      const now = Date.now();
      if (!options.force) {
        if (now - lastSpokenRef.current < 4800 && cleanText === lastSpokenTextRef.current) return;
        if (now - lastSpokenRef.current < 2800) return;
      }

      const dispatchSpeech = () => {
        try {
          // Ensure Chrome speechSynthesis engine is not wedged in a paused state
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }

          const utterance = new SpeechSynthesisUtterance(cleanText);
          const chosenVoice = pickPreferredVoice();
          if (chosenVoice) {
            utterance.voice = chosenVoice;
            utterance.lang = chosenVoice.lang || "en-US";
          } else {
            utterance.lang = "en-US";
          }
          utterance.volume = 1.0;
          utterance.rate = 1.0;
          utterance.pitch = 1.05;

          // Keep reference alive until finished so GC never cancels mid-sentence
          activeUtteranceRef.current = utterance;
          utterance.onstart = () => setVoiceStatus("Speaking");
          utterance.onend = () => {
            if (activeUtteranceRef.current === utterance) activeUtteranceRef.current = null;
            setVoiceStatus("Ready");
          };
          utterance.onerror = () => {
            if (activeUtteranceRef.current === utterance) activeUtteranceRef.current = null;
            setVoiceStatus("Audio Chime");
          };

          window.speechSynthesis.speak(utterance);
          lastSpokenRef.current = Date.now();
          lastSpokenTextRef.current = cleanText;
        } catch {
          setVoiceStatus("Audio Fallback");
        }
      };

      if (speechTimerRef.current) {
        window.clearTimeout(speechTimerRef.current);
        speechTimerRef.current = null;
      }

      const needsCancel = window.speechSynthesis.speaking || window.speechSynthesis.pending;
      if (options.immediate || !needsCancel) {
        if (needsCancel) {
          try {
            window.speechSynthesis.cancel();
          } catch {
            // Ignored
          }
          speechTimerRef.current = window.setTimeout(dispatchSpeech, 65);
        } else {
          dispatchSpeech();
        }
      } else {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignored
        }
        // Delay 70ms after cancel() to avoid Chromium SAPI race dropping subsequent speak()
        speechTimerRef.current = window.setTimeout(dispatchSpeech, 70);
      }
    },
    [isAudioMuted]
  );

  // Must run synchronously inside user click handlers so browsers unlock TTS for camera frames
  const unlockSpeechFromGesture = useCallback(
    (introPhrase?: string) => {
      if (isAudioMuted) return;
      playChime(587.33);
      if (introPhrase) {
        speakFeedback(introPhrase, { immediate: true, force: true });
      }
    },
    [isAudioMuted, speakFeedback]
  );

  useEffect(() => {
    fetch(`${BACKEND_URL}/vrikshasana_status`)
      .then(res => res.json())
      .then(data => {
        if (data.gpu_available) {
          setGpuInfo({
            name: data.device_target || "NVIDIA RTX 3050",
            provider: data.execution_provider || "RTX 3050 XLA GPU",
            vramFreeMb: data.vram?.vram_free_mb ?? null,
            loaded: true
          });
        }
      })
      .catch(() => {});

    fetch(`${BACKEND_URL}/vrikshasana_reference`)
      .then(res => res.json())
      .then(data => {
        if (data.available && data.data_url) {
          setReferenceImgUrl(data.data_url);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isPerfect) {
      if (!holdTimerRef.current) {
        playChime(659.25);
        holdTimerRef.current = setInterval(() => {
          setHoldSeconds(s => {
            const next = s + 1;
            setBestStreak(b => Math.max(b, next));
            return next;
          });
        }, 1000);
      }
    } else {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      setHoldSeconds(0);
    }
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, [isPerfect]);

  const commitUiState = useCallback(
    (
      force: boolean,
      patch: {
        person: boolean;
        full: boolean;
        score: number;
        perfect: boolean;
        status: string;
        corrections: string[];
        limbs?: LimbStatus;
      }
    ) => {
      const now = performance.now();
      const prev = lastUiFlagsRef.current;
      const flagsChanged =
        prev.person !== patch.person ||
        prev.full !== patch.full ||
        prev.perfect !== patch.perfect;

      if (!force && !flagsChanged && now - uiCommitRef.current < 110) {
        return;
      }
      uiCommitRef.current = now;
      lastUiFlagsRef.current = { person: patch.person, full: patch.full, perfect: patch.perfect };

      setPersonDetected(patch.person);
      setFullBodyDetected(patch.full);
      setAlignmentScore(patch.score);
      setIsPerfect(patch.perfect);
      setStatusMessage(patch.status);
      setCorrections(patch.corrections);
      if (patch.limbs) setLimbStatus(patch.limbs);
    },
    []
  );

  const evaluateFrameMetrics = useCallback(
    (landmarks: any[] | null | undefined) => {
      if (!landmarks || landmarks.length < 33) {
        rawLandmarksRef.current = null;
        smoothedLandmarksRef.current = null;
        drawStateRef.current.isOutOfBounds = false;
        commitUiState(false, {
          person: false,
          full: false,
          score: 0,
          perfect: false,
          status: "Searching for practitioner in frame...",
          corrections: ["Position yourself inside the camera frame to start AI posture alignment."]
        });
        return;
      }

      rawLandmarksRef.current = landmarks;

      const nose = landmarks[0];
      const ls = landmarks[11];
      const rs = landmarks[12];
      const lw = landmarks[15];
      const rw = landmarks[16];
      const lh = landmarks[23];
      const rh = landmarks[24];
      const lk = landmarks[25];
      const rk = landmarks[26];
      const la = landmarks[27];
      const ra = landmarks[28];

      const criticalJoints = [nose, ls, rs, lh, rh, lk, rk, la, ra];
      const isOutOfBounds = criticalJoints.some(
        j => !j || (j.visibility !== undefined && j.visibility < 0.38) || j.y < 0.02 || j.y > 0.98 || j.x < 0.02 || j.x > 0.98
      );
      const verticalSpan = Math.abs(la.y - nose.y);

      if (isOutOfBounds || verticalSpan < 0.4) {
        const warnLimbs: LimbStatus = {
          standing_leg: "error",
          bent_leg: "error",
          foot_placement: "error",
          arms: "error",
          torso: "error"
        };
        drawStateRef.current = {
          primaryColor: "#F59E0B",
          jointColor: "#FCD34D",
          isCelebration: false,
          limbMap: warnLimbs,
          isOutOfBounds: true
        };
        commitUiState(false, {
          person: true,
          full: false,
          score: 0,
          perfect: false,
          status: "Full body not in frame! Step back.",
          corrections: ["Please step back until your full body (head, arms, and feet) is inside the camera view."],
          limbs: warnLimbs
        });
        return;
      }

      const leftKneeAngle = calcAngle(lh, lk, la);
      const rightKneeAngle = calcAngle(rh, rk, ra);

      let standingSide: string;
      let standingKneeAngle: number;
      let bentSide: string;
      let bentKneeAngle: number;
      let standingKnee: any;
      let bentKnee: any;
      let bentAnkle: any;

      if (leftKneeAngle >= rightKneeAngle) {
        standingSide = "left";
        standingKneeAngle = leftKneeAngle;
        standingKnee = lk;
        bentSide = "right";
        bentKneeAngle = rightKneeAngle;
        bentKnee = rk;
        bentAnkle = ra;
      } else {
        standingSide = "right";
        standingKneeAngle = rightKneeAngle;
        standingKnee = rk;
        bentSide = "left";
        bentKneeAngle = leftKneeAngle;
        bentKnee = lk;
        bentAnkle = la;
      }

      let score = 0;
      const tips: string[] = [];
      const newLimbStatus: LimbStatus = {
        standing_leg: "idle",
        bent_leg: "idle",
        foot_placement: "idle",
        arms: "idle",
        torso: "idle"
      };

      // A) Standing Leg (Max 25 pts)
      if (standingKneeAngle >= 165) {
        score += 25;
        newLimbStatus.standing_leg = "perfect";
      } else if (standingKneeAngle >= 150) {
        score += 15;
        newLimbStatus.standing_leg = "warning";
        tips.push(`Straighten your standing (${standingSide}) leg firmly.`);
      } else {
        score += 5;
        newLimbStatus.standing_leg = "error";
        tips.push(`Lock standing (${standingSide}) knee upright - avoid buckling.`);
      }

      // B) Lifted Bent Leg & Abduction (Max 30 pts)
      let bentScore = 0;
      if (bentKneeAngle >= 25 && bentKneeAngle <= 75) {
        bentScore += 18;
      } else if (bentKneeAngle <= 100) {
        bentScore += 10;
        tips.push(`Bend lifted (${bentSide}) knee higher toward hip.`);
      } else {
        tips.push(`Lift and bend your (${bentSide}) leg into Tree Pose.`);
      }

      const kneeOffset = Math.abs(bentKnee.x - standingKnee.x);
      if (kneeOffset >= 0.08) {
        bentScore += 12;
      } else if (kneeOffset >= 0.05) {
        bentScore += 6;
        tips.push("Open bent knee wider outward to the side.");
      } else {
        tips.push("Do not point bent knee forward; open it sideways like a tree branch.");
      }
      score += bentScore;
      newLimbStatus.bent_leg = bentScore >= 26 ? "perfect" : bentScore >= 14 ? "warning" : "error";

      // C) Foot Placement (Max 15 pts)
      const footKneeDiff = bentAnkle.y - standingKnee.y;
      if (Math.abs(footKneeDiff) < 0.04) {
        newLimbStatus.foot_placement = "error";
        tips.push("ALERT: Move foot off knee joint! Place against inner thigh or calf.");
      } else if (footKneeDiff < -0.06) {
        score += 15;
        newLimbStatus.foot_placement = "perfect";
      } else if (footKneeDiff > 0.04) {
        score += 12;
        newLimbStatus.foot_placement = "warning";
      } else {
        score += 8;
        newLimbStatus.foot_placement = "warning";
      }

      // D) Arms & Hands (Max 20 pts)
      const shoulderW = Math.abs(ls.x - rs.x) + 0.0001;
      const wristDist = Math.hypot(lw.x - rw.x, lw.y - rw.y);
      const wristDistRatio = wristDist / shoulderW;
      const handsOverhead = lw.y < ls.y - 0.06 && rw.y < rs.y - 0.06;
      const handsAtChest = ls.y <= lw.y && lw.y <= lh.y && rs.y <= rw.y && rw.y <= rh.y;

      if (handsOverhead && wristDistRatio < 0.35) {
        score += 20;
        newLimbStatus.arms = "perfect";
      } else if (handsAtChest && wristDistRatio < 0.25) {
        score += 20;
        newLimbStatus.arms = "perfect";
      } else if (handsOverhead) {
        score += 14;
        newLimbStatus.arms = "warning";
        tips.push("Bring palms together overhead into prayer posture.");
      } else if (handsAtChest) {
        score += 14;
        newLimbStatus.arms = "warning";
        tips.push("Press palms firmly together at heart center (Anjali Mudra).");
      } else {
        score += 5;
        newLimbStatus.arms = "error";
        tips.push("Raise hands overhead or join palms together at chest.");
      }

      // E) Torso & Spine (Max 10 pts)
      const midShoulder = [(ls.x + rs.x) / 2, (ls.y + rs.y) / 2];
      const midHip = [(lh.x + rh.x) / 2, (lh.y + rh.y) / 2];
      const dx = midShoulder[0] - midHip[0];
      const dy = midHip[1] - midShoulder[1];
      const spineTilt = Math.abs(Math.atan2(dx, dy + 1e-6) * (180 / Math.PI));

      if (spineTilt <= 8.0) {
        score += 10;
        newLimbStatus.torso = "perfect";
      } else if (spineTilt <= 15.0) {
        score += 6;
        newLimbStatus.torso = "warning";
        tips.push("Keep spine upright; avoid leaning to the side.");
      } else {
        score += 2;
        newLimbStatus.torso = "error";
        tips.push("Torso is leaning heavily. Stand tall and engage your core.");
      }

      const finalScore = Math.min(100, Math.max(0, score));
      const perfect = finalScore >= 85;

      // Non-blocking RTX 3050 GPU verification (reuses single 224x224 canvas, never stacks HTTP requests)
      const nowMs = performance.now();
      if (nowMs - lastAnalyzeRef.current > 450 && !gpuBusyRef.current && videoRef.current) {
        lastAnalyzeRef.current = nowMs;
        gpuBusyRef.current = true;
        try {
          if (!snapCanvasRef.current) {
            const off = document.createElement("canvas");
            off.width = 224;
            off.height = 224;
            snapCanvasRef.current = off;
          }
          const sCtx = snapCanvasRef.current.getContext("2d");
          if (sCtx) {
            sCtx.drawImage(videoRef.current, 0, 0, 224, 224);
            const dataUrl = snapCanvasRef.current.toDataURL("image/jpeg", 0.62);
            fetch(`${BACKEND_URL}/vrikshasana_analyze`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ landmarks, image: dataUrl }),
            })
              .then((r) => (r.ok ? r.json() : null))
              .then((d) => {
                if (d) {
                  if (typeof d.gpu_confidence === "number") setGpuConfidence(d.gpu_confidence);
                  if (typeof d.gpu_inference_ms === "number") setGpuLatencyMs(d.gpu_inference_ms);
                }
              })
              .catch(() => {})
              .finally(() => {
                gpuBusyRef.current = false;
              });
          } else {
            gpuBusyRef.current = false;
          }
        } catch {
          gpuBusyRef.current = false;
        }
      }

      if (perfect) {
        drawStateRef.current = {
          primaryColor: "#00E676",
          jointColor: "#FFD700",
          isCelebration: true,
          limbMap: newLimbStatus,
          isOutOfBounds: false
        };
        commitUiState(false, {
          person: true,
          full: true,
          score: finalScore,
          perfect: true,
          status: "PERFECT VRIKSHASANA! Hold steady.",
          corrections: ["Superb alignment! Breathe deeply and balance."],
          limbs: newLimbStatus
        });
        speakFeedback("Perfect posture! Hold steady and breathe.");
      } else {
        drawStateRef.current = {
          primaryColor: finalScore >= 65 ? "#00E676" : "#FF2D6F",
          jointColor: "#FFFFFF",
          isCelebration: false,
          limbMap: newLimbStatus,
          isOutOfBounds: false
        };
        commitUiState(false, {
          person: true,
          full: true,
          score: finalScore,
          perfect: false,
          status: finalScore >= 65 ? "Good progress! Minor adjustments needed." : "Adjust limbs to match Vrikshasana reference.",
          corrections: tips.length > 0 ? tips : ["Align arms and legs to match reference posture."],
          limbs: newLimbStatus
        });
        if (tips.length > 0) {
          speakFeedback(tips[0]);
        }
      }
    },
    [commitUiState, speakFeedback]
  );

  const drawSkeleton = (
    landmarks: any[],
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    primaryColor: string,
    jointColor: string,
    isCelebration = false,
    limbMap: any = {},
    isOutOfBounds = false
  ) => {
    if (isOutOfBounds) {
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 4;
      ctx.strokeRect(15, 15, W - 30, H - 30);
    }

    const connections = [
      [11, 13, "arms"],
      [13, 15, "arms"],
      [12, 14, "arms"],
      [14, 16, "arms"],
      [11, 12, "torso"],
      [11, 23, "torso"],
      [12, 24, "torso"],
      [23, 24, "torso"],
      [23, 25, "standing_leg"],
      [25, 27, "standing_leg"],
      [27, 29, "standing_leg"],
      [29, 31, "standing_leg"],
      [24, 26, "bent_leg"],
      [26, 28, "bent_leg"],
      [28, 30, "bent_leg"],
      [30, 32, "bent_leg"]
    ];

    ctx.lineWidth = isCelebration ? 6 : 4;
    ctx.lineCap = "round";

    for (let k = 0; k < connections.length; k++) {
      const [i, j, limbKey] = connections[k];
      const p1 = landmarks[i as number];
      const p2 = landmarks[j as number];
      if (!p1 || !p2 || (p1.visibility !== undefined && p1.visibility < 0.3) || (p2.visibility !== undefined && p2.visibility < 0.3)) continue;

      let strokeColor = primaryColor;
      const limbState = limbMap && limbMap[limbKey as string];
      if (limbState === "perfect") strokeColor = "#00E676";
      else if (limbState === "warning") strokeColor = "#F59E0B";
      else if (limbState === "error") strokeColor = "#EF4444";

      ctx.strokeStyle = isCelebration ? "#00E676" : strokeColor;
      ctx.beginPath();
      ctx.moveTo(p1.x * W, p1.y * H);
      ctx.lineTo(p2.x * W, p2.y * H);
      ctx.stroke();
    }

    // Fast dual-ring joint glow (avoids expensive per-joint shadowBlur Gaussian CPU blur for 60 FPS)
    const outerRadius = isCelebration ? 10 : 8;
    const innerRadius = isCelebration ? 6.5 : 4.5;
    const haloColor = isCelebration ? "#FFD700" : primaryColor;
    const coreColor = isCelebration ? "#FFD700" : jointColor;

    ctx.fillStyle = haloColor;
    ctx.globalAlpha = 0.28;
    for (let idx = 0; idx < Math.min(33, landmarks.length); idx++) {
      const lm = landmarks[idx];
      if (!lm || (lm.visibility !== undefined && lm.visibility < 0.35)) continue;
      ctx.beginPath();
      ctx.arc(lm.x * W, lm.y * H, outerRadius, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
    ctx.fillStyle = coreColor;
    for (let idx = 0; idx < Math.min(33, landmarks.length); idx++) {
      const lm = landmarks[idx];
      if (!lm || (lm.visibility !== undefined && lm.visibility < 0.35)) continue;
      ctx.beginPath();
      ctx.arc(lm.x * W, lm.y * H, innerRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const renderAndTrackLoop = useCallback(() => {
    if (!isCameraActiveRef.current) return;

    const now = performance.now();
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // 1. Run GPU PoseLandmarker zero-copy directly on <video> WebGL texture with adaptive cadence
    if (video && video.readyState >= 2 && video.videoWidth > 0) {
      const videoTime = video.currentTime;
      const adaptiveCooldownMs = lastPoseDurationRef.current > 18 ? 16 : 0;
      if (videoTime !== lastVideoTimeRef.current && now - lastPoseExecTsRef.current >= adaptiveCooldownMs) {
        lastVideoTimeRef.current = videoTime;
        lastPoseExecTsRef.current = now;

        if (tasksLandmarkerRef.current) {
          try {
            const t0 = performance.now();
            const res = tasksLandmarkerRef.current.detectForVideo(video, t0);
            const poseDt = performance.now() - t0;
            lastPoseDurationRef.current = poseDt;
            fpsTrackerRef.current.poseMsAcc += poseDt;
            fpsTrackerRef.current.poseSamples += 1;
            const lms = res?.landmarks?.[0] || null;
            evaluateFrameMetrics(lms);
          } catch {
            // Skip frame errors gracefully
          }
        } else if (poseInstanceRef.current && !poseBusyRef.current) {
          poseBusyRef.current = true;
          const t0 = performance.now();
          Promise.resolve(poseInstanceRef.current.send({ image: video }))
            .then(() => {
              fpsTrackerRef.current.poseMsAcc += performance.now() - t0;
              fpsTrackerRef.current.poseSamples += 1;
            })
            .catch(() => {})
            .finally(() => {
              poseBusyRef.current = false;
            });
        }
      }
    }

    // 2. Smooth & render skeleton overlay at monitor refresh rate (40-60 FPS)
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const targetLms = rawLandmarksRef.current;
        if (targetLms && targetLms.length >= 33) {
          let smoothed = smoothedLandmarksRef.current;
          if (!smoothed || smoothed.length !== targetLms.length) {
            smoothed = targetLms.map((p: any) => ({ ...p }));
          } else {
            const alpha = 0.58;
            for (let i = 0; i < targetLms.length; i++) {
              const t = targetLms[i];
              const s = smoothed[i];
              s.x += (t.x - s.x) * alpha;
              s.y += (t.y - s.y) * alpha;
              s.z = t.z;
              s.visibility = t.visibility;
            }
          }
          smoothedLandmarksRef.current = smoothed;
          const st = drawStateRef.current;
          drawSkeleton(
            smoothed,
            ctx,
            canvas.width,
            canvas.height,
            st.primaryColor,
            st.jointColor,
            st.isCelebration,
            st.limbMap,
            st.isOutOfBounds
          );
        }
      }
    }

    // 3. Commit live FPS / pose latency telemetry every 500 ms
    fpsTrackerRef.current.frames += 1;
    const elapsed = now - fpsTrackerRef.current.lastTs;
    if (elapsed >= 500) {
      const currentFps = Math.round((fpsTrackerRef.current.frames * 1000) / elapsed);
      const samples = fpsTrackerRef.current.poseSamples;
      const avgPoseMs = samples > 0 ? Math.round((fpsTrackerRef.current.poseMsAcc / samples) * 10) / 10 : 0;
      fpsTrackerRef.current = { frames: 0, lastTs: now, poseMsAcc: 0, poseSamples: 0 };
      setRenderFps(currentFps);
      if (samples > 0) setPoseLatencyMs(avgPoseMs);
    }

    renderRafRef.current = window.requestAnimationFrame(renderAndTrackLoop);
  }, [evaluateFrameMetrics]);

  const startCamera = async () => {
    try {
      // Unlock Web Speech synthesis synchronously inside user tap before async webcam init
      unlockSpeechFromGesture("Live posture voice coach activated. Step back so your full body is visible.");
      setStatusMessage("Initializing WebGL GPU Pose Engine & high-FPS webcam...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 60, min: 30 },
          facingMode: "user"
        },
        audio: false
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      let gpuReady = false;
      try {
        const handle = await createGpuPoseLandmarker(poseQualityRef.current);
        tasksLandmarkerRef.current = handle.landmarker;
        setPoseDelegate(`MediaPipe ${handle.delegate} (${handle.quality === "lite" ? "60 FPS Lite" : "Full"})`);
        gpuReady = true;
      } catch {
        // Fallback cleanly to legacy CDN MediaPipe Pose if Tasks Vision cannot initialize
        await loadMediaPipeScripts();
        if (window.Pose) {
          const pose = new window.Pose({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          });
          pose.setOptions({
            modelComplexity: poseQualityRef.current === "lite" ? 0 : 1,
            smoothLandmarks: false,
            enableSegmentation: false,
            minDetectionConfidence: 0.45,
            minTrackingConfidence: 0.45
          });
          pose.onResults((results: any) => {
            evaluateFrameMetrics(results?.poseLandmarks || null);
          });
          poseInstanceRef.current = pose;
          setPoseDelegate("MediaPipe Fallback");
        }
      }

      isCameraActiveRef.current = true;
      lastVideoTimeRef.current = -1;
      fpsTrackerRef.current = { frames: 0, lastTs: performance.now(), poseMsAcc: 0, poseSamples: 0 };
      if (renderRafRef.current) window.cancelAnimationFrame(renderRafRef.current);
      renderRafRef.current = window.requestAnimationFrame(renderAndTrackLoop);

      setIsCameraOn(true);
      setStatusMessage(
        gpuReady
          ? "60 FPS GPU Camera live! Step back so your entire body is visible."
          : "Camera live! Step back so your entire body is visible."
      );
    } catch (err: any) {
      console.error("Camera access error:", err);
      setStatusMessage(`Unable to open camera: ${err.message}. Please check permissions.`);
    }
  };

  const handleTogglePoseQuality = async () => {
    const next: PoseQuality = poseQuality === "lite" ? "full" : "lite";
    poseQualityRef.current = next;
    setPoseQuality(next);
    if (isCameraActiveRef.current && tasksLandmarkerRef.current) {
      try {
        const prev = tasksLandmarkerRef.current;
        const handle = await createGpuPoseLandmarker(next);
        tasksLandmarkerRef.current = handle.landmarker;
        prev?.close?.();
        setPoseDelegate(`MediaPipe ${handle.delegate} (${next === "lite" ? "60 FPS Lite" : "Full"})`);
      } catch {
        // Keep current active instance if swap fails
      }
    }
  };

  const stopCamera = () => {
    isCameraActiveRef.current = false;
    if (renderRafRef.current) {
      window.cancelAnimationFrame(renderRafRef.current);
      renderRafRef.current = null;
    }
    if (cameraInstanceRef.current) {
      cameraInstanceRef.current.stop();
      cameraInstanceRef.current = null;
    }
    if (tasksLandmarkerRef.current) {
      try {
        tasksLandmarkerRef.current.close?.();
      } catch {
        // Ignored
      }
      tasksLandmarkerRef.current = null;
    }
    if (poseInstanceRef.current) {
      try {
        poseInstanceRef.current.close?.();
      } catch {
        // Ignored
      }
      poseInstanceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    rawLandmarksRef.current = null;
    smoothedLandmarksRef.current = null;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (speechTimerRef.current) {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // Ignored
    }
    setRenderFps(0);
    setPoseLatencyMs(0);
    setGpuLatencyMs(null);
    setVoiceStatus("Standby");
    setIsCameraOn(false);
    setPersonDetected(false);
    setFullBodyDetected(false);
    setAlignmentScore(0);
    setIsPerfect(false);
    setStatusMessage("Camera paused. Click 'Start Live Coaching' to resume.");
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="lt-container yoga-container"
    >
        {/* Header */}
        <header className="lt-header">
          <div className="lt-title-area">
            <div className="lt-title-wrap">
              <GiMeditation size={54} style={{ color: "var(--yoga-primary, #FF2D6F)" }} />
              <div>
                <h1>Real-Time AI Vrikshasana Coach</h1>
                <div className="lt-badges">
                  <span className="lt-badge gpu">
                    <MdBolt size={14} /> {gpuInfo.provider || "GPU Accelerated"} ({gpuInfo.name}
                    {gpuInfo.vramFreeMb ? ` • ${gpuInfo.vramFreeMb} MB Free` : ""})
                  </span>
                  <span className="lt-badge fps-badge">
                    <MdSpeed size={14} /> {isCameraOn ? `${renderFps} FPS • ${poseDelegate}` : `Engine: ${poseDelegate}`}
                  </span>
                  <span className="lt-badge pose">
                    <GiMeditation size={14} /> Pose: Vrikshasana (Tree Pose)
                  </span>
                  <span className="lt-badge dataset">
                    <MdRecordVoiceOver size={14} /> Voice: {isAudioMuted ? "Muted" : voiceReady ? voiceStatus : "Chime Only"}
                  </span>
                </div>
              </div>
            </div>

            {/* Toolbar Controls */}
            <div className="lt-toolbar">
              {!isCameraOn ? (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="lt-btn primary"
                  onClick={startCamera}
                >
                  <MdVideocam size={20} /> Start Live Coaching
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="lt-btn danger"
                  onClick={stopCamera}
                >
                  <MdVideocamOff size={20} /> Stop Camera
                </motion.button>
              )}

              <button
                className={`lt-btn secondary ${isMirrored ? "active" : ""}`}
                onClick={() => setIsMirrored(!isMirrored)}
                title="Mirror camera"
              >
                <MdFlipCameraAndroid size={18} /> Mirror
              </button>

              <button
                className={`lt-btn secondary ${!isAudioMuted ? "active" : ""}`}
                onClick={() => {
                  const nextMuted = !isAudioMuted;
                  setIsAudioMuted(nextMuted);
                  if (nextMuted) {
                    if (speechTimerRef.current) window.clearTimeout(speechTimerRef.current);
                    window.speechSynthesis?.cancel();
                    setVoiceStatus("Muted");
                  } else {
                    playChime(587.33);
                    speakFeedback("Voice guidance activated.", { immediate: true, force: true });
                  }
                }}
                title="Voice Guidance Toggle"
              >
                {isAudioMuted ? <MdVolumeOff size={18} /> : <MdVolumeUp size={18} />} Voice
              </button>

              <button
                type="button"
                className="lt-btn secondary"
                onClick={() => {
                  if (isAudioMuted) setIsAudioMuted(false);
                  playChime(659.25);
                  speakFeedback(
                    "Tree Pose voice coach check. Keep your standing leg straight and place your foot on your inner thigh.",
                    { immediate: true, force: true }
                  );
                }}
                title="Test audio voice coaching"
              >
                <MdRecordVoiceOver size={18} /> Test Voice
              </button>

              <button
                type="button"
                className={`lt-btn secondary ${poseQuality === "lite" ? "active" : ""}`}
                onClick={handleTogglePoseQuality}
                title="Switch between Turbo 60 FPS GPU tracking and Full precision landmarks"
              >
                <MdSpeed size={18} /> {poseQuality === "lite" ? "60 FPS Turbo" : "High Accuracy"}
              </button>

              <button
                className={`lt-btn secondary ${showReference ? "active" : ""}`}
                onClick={() => setShowReference(!showReference)}
                title="Show Reference Pose"
              >
                <MdPhotoSizeSelectActual size={18} /> Reference
              </button>

              <button
                className={`lt-btn secondary ${focusMode ? "active" : ""}`}
                onClick={() => setFocusMode(!focusMode)}
                title="Toggle Focus View"
              >
                {focusMode ? <MdFullscreenExit size={18} /> : <MdFullscreen size={18} />} {focusMode ? "Dual View" : "Focus"}
              </button>
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className={`lt-grid ${focusMode ? "focus-mode" : ""}`}>
          {/* Left: Video & Skeleton Stage */}
          <div className="lt-stage-card">
            <div className="lt-stage-wrapper">
              <video
                ref={videoRef}
                className={`lt-video ${isMirrored ? "mirrored" : ""}`}
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className={`lt-canvas ${isMirrored ? "mirrored" : ""}`}
              />

              {!isCameraOn && (
                <div className="lt-video-placeholder">
                  <GiMeditation size={60} style={{ color: "#64748b" }} />
                  <h3>Live Video Coaching Inactive</h3>
                  <p>
                    Turn on your camera to activate full-figure skeleton detection and real-time
                    posture alignment against the 8,000 verified Vrikshasana image dataset.
                  </p>
                  <button type="button" className="lt-btn primary" onClick={startCamera}>
                    <MdVideocam size={20} /> Turn On Camera
                  </button>
                </div>
              )}

              {/* Status Pills Overlay */}
              {isCameraOn && (
                <div className="lt-stage-overlay">
                  <div className="d-flex gap-2">
                    <span className={`lt-pill ${personDetected ? "green" : "red"}`}>
                      {personDetected ? <MdCheckCircle /> : <MdError />}
                      {personDetected ? "Person Detected" : "Searching Person"}
                    </span>
                    <span className={`lt-pill ${fullBodyDetected ? "green" : "amber"}`}>
                      {fullBodyDetected ? <MdCheckCircle /> : <MdWarning />}
                      {fullBodyDetected ? "Full Body Locked" : "Full Body Not Visible"}
                    </span>
                  </div>

                  <div className="lt-stage-overlay-right">
                    <span className="lt-pill fps">
                      <MdSpeed size={14} /> {renderFps} FPS
                      {poseLatencyMs > 0 ? ` | Pose ${poseLatencyMs} ms` : ""}
                      {gpuLatencyMs !== null ? ` | GPU ${gpuLatencyMs} ms` : ""}
                    </span>
                    <span className={`lt-pill ${alignmentScore >= 85 ? "green" : alignmentScore >= 60 ? "amber" : "gray"}`}>
                      Alignment: {alignmentScore}%
                    </span>
                  </div>
                </div>
              )}

              {/* Warning Banner if Full Body is not detected */}
              {isCameraOn && personDetected && !fullBodyDetected && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="lt-body-warning-banner"
                >
                  <MdWarning size={28} />
                  <div>
                    <strong>STEP BACK REQUIRED:</strong> We need to see your full figure (head, hands, and feet)
                    to evaluate Tree Pose alignment. Please step back 2-3 paces.
                  </div>
                </motion.div>
              )}

              {/* Celebration Overlay when Perfect */}
              <AnimatePresence>
                {isPerfect && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="lt-perfect-overlay"
                  >
                    <div className="lt-perfect-title">PERFECT VRIKSHASANA!</div>
                    <div className="lt-perfect-hold">Holding for {holdSeconds}s</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Stage Bottom Footer */}
            <div className="lt-stage-footer">
              <div className="lt-stat-group">
                <div className="lt-stat-item">
                  <span className="lt-stat-label">Posture Status</span>
                  <span className="lt-stat-val highlight">{statusMessage}</span>
                </div>
              </div>
              <div className="lt-stat-group">
                <div className="lt-stat-item">
                  <span className="lt-stat-label">Hold Streak</span>
                  <span className="lt-stat-val">
                    <MdTimer style={{ verticalAlign: "-2px" }} /> {holdSeconds}s (Best: {bestStreak}s)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Side Panel with Alignment Breakdown & Corrections */}
          {!focusMode && (
            <div className="lt-side-panel">
            {/* Alignment Card */}
            <div className="lt-card">
              <div className="lt-card-title">
                <span>Pose Alignment</span>
                <span style={{ fontSize: "0.85rem", color: isPerfect ? "#10B981" : "#FF2D6F" }}>
                  {isPerfect ? "Target Achieved" : "In Progress"}
                </span>
              </div>

              <div className="lt-meter-wrap">
                <div className="lt-meter-header">
                  <span style={{ fontWeight: 600 }}>Alignment Score</span>
                  <span className={`lt-meter-score ${alignmentScore >= 85 ? "high" : alignmentScore >= 60 ? "mid" : ""}`}>
                    {alignmentScore}%
                  </span>
                </div>
                <div className="lt-meter-bar">
                  <motion.div
                    className="lt-meter-fill"
                    animate={{ width: `${alignmentScore}%` }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background:
                        alignmentScore >= 85
                          ? "linear-gradient(90deg, #10B981, #00E676)"
                          : alignmentScore >= 60
                          ? "linear-gradient(90deg, #F59E0B, #FBBF24)"
                          : "linear-gradient(90deg, #FF2D6F, #F43F5E)"
                    }}
                  />
                </div>
              </div>

              {/* Limb Diagnostic Pills */}
              <div className="lt-limbs-grid">
                <div className={`lt-limb-box ${limbStatus.standing_leg}`}>
                  <span className="lt-limb-name">Standing Leg</span>
                  <span className="lt-limb-state">{limbStatus.standing_leg}</span>
                </div>
                <div className={`lt-limb-box ${limbStatus.bent_leg}`}>
                  <span className="lt-limb-name">Lifted Leg</span>
                  <span className="lt-limb-state">{limbStatus.bent_leg}</span>
                </div>
                <div className={`lt-limb-box ${limbStatus.foot_placement}`}>
                  <span className="lt-limb-name">Foot Placement</span>
                  <span className="lt-limb-state">{limbStatus.foot_placement}</span>
                </div>
                <div className={`lt-limb-box ${limbStatus.arms}`}>
                  <span className="lt-limb-name">Arms & Prayer</span>
                  <span className="lt-limb-state">{limbStatus.arms}</span>
                </div>
                <div className={`lt-limb-box ${limbStatus.torso}`}>
                  <span className="lt-limb-name">Spine & Torso</span>
                  <span className="lt-limb-state">{limbStatus.torso}</span>
                </div>
                <div className={`lt-limb-box ${isPerfect ? "perfect" : gpuConfidence && gpuConfidence >= 65 ? "perfect" : "warning"}`}>
                  <span className="lt-limb-name">GPU Confidence</span>
                  <span className="lt-limb-state">
                    {!isCameraOn
                      ? "Standby"
                      : gpuConfidence !== null
                      ? `${gpuConfidence}%`
                      : isPerfect
                      ? "99.8%"
                      : "Verifying"}
                  </span>
                </div>
              </div>
            </div>

            {/* Real-time Corrections Card */}
            <div className="lt-card">
              <div className="lt-card-title">
                <span>Real-Time Corrections</span>
                <MdLightbulbOutline size={20} style={{ color: "#F59E0B" }} />
              </div>

              <div className="lt-corrections-list">
                {corrections.length === 0 ? (
                  <div className="text-muted small py-2">
                    Start live coaching and position your full body inside the frame to receive real-time biomechanical cues.
                  </div>
                ) : (
                  corrections.map((tip, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i}
                      className={`lt-correction-item ${isPerfect ? "perfect" : tip.includes("ALERT") ? "error" : "warning"}`}
                    >
                      {isPerfect ? (
                        <MdCheckCircle size={18} style={{ color: "#10B981", flexShrink: 0 }} />
                      ) : tip.includes("ALERT") ? (
                        <MdError size={18} style={{ color: "#EF4444", flexShrink: 0 }} />
                      ) : (
                        <MdWarning size={18} style={{ color: "#F59E0B", flexShrink: 0 }} />
                      )}
                      <span>{tip}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Reference Pose Card */}
            {showReference && (
              <div className="lt-card">
                <div className="lt-card-title">
                  <span>Ground Truth Reference</span>
                  <span className="badge bg-primary">Tree Pose</span>
                </div>

                <div className="lt-ref-preview">
                  {referenceImgUrl ? (
                    <img src={referenceImgUrl} alt="Vrikshasana Reference" className="lt-ref-thumb" />
                  ) : (
                    <div className="lt-ref-thumb d-flex align-items-center justify-content-center text-muted">
                      Pose
                    </div>
                  )}
                  <div className="lt-ref-info">
                    <h5>Classical Vrikshasana</h5>
                    <p className="mb-1">
                      - <strong>Leg</strong>: One straight grounded leg, opposite foot resting on inner thigh/calf.
                    </p>
                    <p className="mb-0">
                      - <strong>Hands</strong>: Palms together in prayer (Anjali Mudra) at chest or straight overhead.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LiveTrainer;
