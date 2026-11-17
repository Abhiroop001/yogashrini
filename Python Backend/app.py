# app.py  –  Yogashirini Python Backend
# Model: EfficientNetB0  (weights-only save, TF 2.10)
import os, sys

# ── Dynamic Environment Auto-Routing ─────────────────────────────────────────
# On Windows, native NVIDIA GeForce RTX 3050 GPU acceleration requires TensorFlow
# 2.10 running on Python 3.10. If this script is launched from the Anaconda base
# environment (Python 3.12+ with incompatible numpy 2.x ABI), automatically
# re-route execution to the dedicated 'py310' GPU environment.
PY310_PYTHON = r"C:\Users\ABHIROOP\anaconda3\envs\py310\python.exe"
if os.path.exists(PY310_PYTHON) and os.path.normcase(sys.executable) != os.path.normcase(PY310_PYTHON):
    import subprocess
    print(f"[*] Detected Python: {sys.executable}")
    print(f"[*] Auto-switching to dedicated RTX 3050 GPU Environment (py310)...")
    try:
        args = [PY310_PYTHON, os.path.abspath(__file__)] + [a for a in sys.argv[1:] if a != "-c"]
        sys.exit(subprocess.call(args))
    except KeyboardInterrupt:
        sys.exit(0)

import io, json, base64, tempfile
from pathlib import Path

os.environ["MPLCONFIGDIR"] = str(Path(tempfile.gettempdir()) / "matplotlib")

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import tensorflow as tf

# ── GPU ───────────────────────────────────────────────────────────────────────
gpus = tf.config.list_physical_devices("GPU")
if gpus:
    for gpu in gpus:
        tf.config.experimental.set_memory_growth(gpu, True)
    print(f"GPU ready ({len(gpus)} device(s))")
else:
    print("No GPU – CPU mode")

from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import (
    Dense, GlobalAveragePooling2D, Dropout, BatchNormalization, Input
)
from tensorflow.keras.models import Model, load_model

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR     = Path(__file__).resolve().parent
ROOT_DIR     = BASE_DIR.parent                         # d:\Yoga Website\
WEIGHTS_FILE = ROOT_DIR / "saved_models" / "efficientnetb0_yoga.weights.h5"
CLASS_JSON   = ROOT_DIR / "saved_models" / "class_names.json"
VRIKSHASANA_MODEL_FILE = ROOT_DIR / "saved_models" / "vrikshasana_gpu_detector.h5"
BIOMECHANICS_FILE      = ROOT_DIR / "saved_models" / "vrikshasana_biomechanics.json"
REF_IMG_FILE           = ROOT_DIR / "Dataset_Vrikshasana_CV" / "reference_pose.jpg"

IMG_SIZE     = (224, 224)
NUM_CLASSES  = 47

print("Weights file  :", WEIGHTS_FILE, "exists:", WEIGHTS_FILE.exists())
print("Class JSON    :", CLASS_JSON,   "exists:", CLASS_JSON.exists())
print("Vrikshasana GPU Model:", VRIKSHASANA_MODEL_FILE, "exists:", VRIKSHASANA_MODEL_FILE.exists())

# ── Load class names ──────────────────────────────────────────────────────────
if not CLASS_JSON.exists():
    print("ERROR: class_names.json not found"); sys.exit(1)

class_names = json.loads(CLASS_JSON.read_text(encoding="utf-8"))
print(f"Classes: {len(class_names)}")

# ── Build EfficientNetB0 model (same architecture as training) ────────────────
print("Building EfficientNetB0 model…")
inputs     = Input(shape=(*IMG_SIZE, 3))
base_model = EfficientNetB0(weights="imagenet", include_top=False,
                             input_tensor=inputs)

# Phase-2 state: unfreeze top layers (matches saved weights)
base_model.trainable = True
for layer in base_model.layers[:150]:
    layer.trainable = False

x = base_model(inputs, training=False)
x = GlobalAveragePooling2D()(x)
x = Dense(512, activation="relu")(x)
x = BatchNormalization()(x)
x = Dropout(0.5)(x)
outputs = Dense(NUM_CLASSES, activation="softmax")(x)
keras_model = Model(inputs=inputs, outputs=outputs)

# ── Load saved weights ────────────────────────────────────────────────────────
if not WEIGHTS_FILE.exists():
    print("ERROR: weights file not found"); sys.exit(1)

keras_model.load_weights(str(WEIGHTS_FILE))
keras_model.make_predict_function()
print("EfficientNetB0 weights loaded successfully.")

# ── Load Dedicated GPU Vrikshasana Classifier ──────────────────────────────────
vrikshasana_gpu_model = None
if VRIKSHASANA_MODEL_FILE.exists():
    try:
        vrikshasana_gpu_model = load_model(str(VRIKSHASANA_MODEL_FILE))
        vrikshasana_gpu_model.make_predict_function()
        print("Dedicated Vrikshasana GPU model loaded successfully on RTX 3050.")
    except Exception as e:
        print("[!] Warning: Could not load dedicated Vrikshasana GPU model:", e)

biomechanics_data = {}
if BIOMECHANICS_FILE.exists():
    try:
        biomechanics_data = json.loads(BIOMECHANICS_FILE.read_text(encoding="utf-8"))
        print("Vrikshasana biomechanics alignment rules loaded.")
    except Exception as e:
        print("[!] Warning: Could not load biomechanics JSON:", e)

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ── Helpers ───────────────────────────────────────────────────────────────────
def dataurl_to_pil(dataurl: str) -> Image.Image:
    _, encoded = dataurl.split(",", 1)
    return Image.open(io.BytesIO(base64.b64decode(encoded))).convert("RGB")

def pil_to_dataurl(img: Image.Image, quality: int = 85) -> str:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

def preprocess(pil_img: Image.Image) -> np.ndarray:
    """Resize and add batch dim. EfficientNet handles its own normalisation."""
    img = pil_img.resize(IMG_SIZE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32)
    return np.expand_dims(arr, 0)            # (1, 224, 224, 3)

def annotate_image(pil_img: Image.Image, label: str, score: float,
                   top5: list) -> Image.Image:
    """Draw prediction overlay on a copy of the image."""
    img   = pil_img.copy().convert("RGB")
    draw  = ImageDraw.Draw(img)
    W, H  = img.size

    # Semi-transparent header bar
    bar_h = max(36, H // 12)
    draw.rectangle([(0, 0), (W, bar_h)], fill=(0, 0, 0, 180))
    draw.text((8, 6), f"{label}  {score*100:.1f}%", fill=(0, 255, 120))

    # Top-5 list in bottom strip
    strip_h = max(10, H // 18)
    y0 = H - strip_h * len(top5) - 4
    draw.rectangle([(0, y0 - 4), (W, H)], fill=(0, 0, 0, 160))
    for i, (cls, prob) in enumerate(top5):
        col = (0, 255, 120) if i == 0 else (200, 200, 200)
        draw.text((8, y0 + i * strip_h), f"{i+1}. {cls}: {prob*100:.1f}%", fill=col)

    return img

# ── Prediction ────────────────────────────────────────────────────────────────
def run_predict(pil_img: Image.Image):
    x     = preprocess(pil_img)
    probs = keras_model.predict(x, verbose=0)[0]       # shape (47,)
    top5_idx  = np.argsort(probs)[-5:][::-1]
    top5 = [(class_names[i], float(probs[i])) for i in top5_idx]
    label, score = top5[0]
    return label, score, top5, probs

# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": "EfficientNetB0",
        "classes": NUM_CLASSES,
        "accuracy": "84.96%"
    })

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    if not data or "image" not in data:
        return jsonify({"error": "no image provided"}), 400

    # ── decode image ──────────────────────────────────────────────────────────
    try:
        pil = dataurl_to_pil(data["image"])
    except Exception as e:
        return jsonify({"error": "invalid image data", "detail": str(e)}), 400

    # ── inference ─────────────────────────────────────────────────────────────
    try:
        label, score, top5, _probs = run_predict(pil)
    except Exception as e:
        print("Inference error:", repr(e))
        return jsonify({"error": "inference_failed", "detail": str(e)}), 500

    # ── annotated image ───────────────────────────────────────────────────────
    try:
        annotated_pil  = annotate_image(pil, label, score, top5)
        annotated_url  = pil_to_dataurl(annotated_pil, quality=82)
    except Exception:
        annotated_url  = None

    return jsonify({
        "label"           : label,
        "score"           : score,
        "confidence_pct"  : round(score * 100, 2),
        "top5"            : [{"label": c, "score": round(p, 4)} for c, p in top5],
        "keypoints"       : [],          # placeholder for future pose-landmark integration
        "annotated_image" : annotated_url,
    })

@app.route("/classes", methods=["GET"])
def get_classes():
    """Return all 47 class names (useful for admin panel)."""
    return jsonify({"classes": class_names, "count": len(class_names)})

# ── Vrikshasana Alignment & GPU Engine ─────────────────────────────────────────
def calc_angle(a, b, c):
    """Calculate 2D angle ABC with vertex at B (in degrees)."""
    try:
        ba = np.array([a['x'] - b['x'], a['y'] - b['y']])
        bc = np.array([c['x'] - b['x'], c['y'] - b['y']])
        norm_ba = np.linalg.norm(ba)
        norm_bc = np.linalg.norm(bc)
        if norm_ba == 0 or norm_bc == 0:
            return 180.0
        cos_ang = np.dot(ba, bc) / (norm_ba * norm_bc)
        cos_ang = np.clip(cos_ang, -1.0, 1.0)
        return float(np.degrees(np.arccos(cos_ang)))
    except Exception:
        return 180.0

def evaluate_vrikshasana(landmarks, gpu_prob=1.0):
    """
    Evaluates MediaPipe landmarks (list of 33 normalized points {x, y, z, visibility})
    against the verified Vrikshasana biomechanical rules.
    """
    corrections = []
    limb_status = {}
    score = 0

    # 1. Full Body Person Visibility Check
    required_indices = {
        "nose": 0, "left_shoulder": 11, "right_shoulder": 12,
        "left_elbow": 13, "right_elbow": 14, "left_wrist": 15, "right_wrist": 16,
        "left_hip": 23, "right_hip": 24, "left_knee": 25, "right_knee": 26,
        "left_ankle": 27, "right_ankle": 28
    }

    if not landmarks or len(landmarks) < 29:
        return {
            "full_body_detected": False,
            "alignment_score": 0,
            "is_perfect": False,
            "status_text": "No Skeleton Detected",
            "corrections": ["Please position yourself in front of the camera."],
            "limb_status": {}
        }

    # Verify visibility and bounds of key joints
    missing_joints = []
    for name, idx in required_indices.items():
        lm = landmarks[idx]
        vis = lm.get("visibility", 1.0)
        y = lm.get("y", 0.0)
        x = lm.get("x", 0.0)
        if vis < 0.40 or y < 0.01 or y > 0.99 or x < 0.01 or x > 0.99:
            missing_joints.append(name)

    if missing_joints and ("left_ankle" in missing_joints or "right_ankle" in missing_joints or "nose" in missing_joints):
        return {
            "full_body_detected": False,
            "alignment_score": 0,
            "is_perfect": False,
            "status_text": "Full Body Not Visible",
            "corrections": [
                "Step back so your entire body (head, arms, and feet) is visible in the frame."
            ],
            "limb_status": {k: "error" for k in ["standing_leg", "bent_leg", "arms", "torso"]}
        }

    full_body_detected = True

    # 2. Extract Keypoint Coordinates
    ls, rs = landmarks[11], landmarks[12]
    le, re = landmarks[13], landmarks[14]
    lw, rw = landmarks[15], landmarks[16]
    lh, rh = landmarks[23], landmarks[24]
    lk, rk = landmarks[25], landmarks[26]
    la, ra = landmarks[27], landmarks[28]

    # Calculate Knee Angles
    left_knee_angle = calc_angle(lh, lk, la)
    right_knee_angle = calc_angle(rh, rk, ra)

    # Determine Standing Leg vs Bent Leg
    # Standing leg has straighter angle (~180 deg), bent leg has smaller angle (<90 deg)
    if left_knee_angle >= right_knee_angle:
        standing_side = "left"
        standing_knee_angle = left_knee_angle
        bent_side = "right"
        bent_knee_angle = right_knee_angle
        standing_hip, standing_knee, standing_ankle = lh, lk, la
        bent_hip, bent_knee, bent_ankle = rh, rk, ra
    else:
        standing_side = "right"
        standing_knee_angle = right_knee_angle
        bent_side = "left"
        bent_knee_angle = left_knee_angle
        standing_hip, standing_knee, standing_ankle = rh, rk, ra
        bent_hip, bent_knee, bent_ankle = lh, lk, la

    # ── Evaluate Standing Leg (Max 25 pts) ──
    if standing_knee_angle >= 165.0:
        score += 25
        limb_status["standing_leg"] = "perfect"
    elif standing_knee_angle >= 150.0:
        score += 15
        limb_status["standing_leg"] = "warning"
        corrections.append(f"Straighten your standing ({standing_side}) leg firmly.")
    else:
        score += 5
        limb_status["standing_leg"] = "error"
        corrections.append(f"Your standing ({standing_side}) leg is buckling. Lock your knee upright.")

    # ── Evaluate Bent Leg & Knee Abduction (Max 30 pts) ──
    bent_score = 0
    # 1. Knee flexion
    if 25.0 <= bent_knee_angle <= 75.0:
        bent_score += 18
    elif 75.0 < bent_knee_angle <= 100.0:
        bent_score += 10
        corrections.append(f"Bend your lifted ({bent_side}) knee higher toward your hip.")
    else:
        corrections.append(f"Lift and bend your ({bent_side}) leg into Tree Pose.")

    # 2. Knee abduction (opening sideways)
    knee_offset = abs(bent_knee['x'] - standing_knee['x'])
    if knee_offset >= 0.09:
        bent_score += 12
    elif knee_offset >= 0.05:
        bent_score += 7
        corrections.append("Open your bent knee wider to the side (abduct the hip).")
    else:
        corrections.append("Do not point bent knee forward; open it sideways like branches of a tree.")

    score += bent_score
    limb_status["bent_leg"] = "perfect" if bent_score >= 26 else ("warning" if bent_score >= 15 else "error")

    # ── Evaluate Foot Placement (Max 15 pts) ──
    # Foot must be placed on inner thigh (above standing knee) OR inner calf (below standing knee)
    # MUST AVOID pushing directly onto standing knee joint (within 0.04 vertical distance)
    foot_knee_diff = bent_ankle['y'] - standing_knee['y']
    if abs(foot_knee_diff) < 0.04:
        # Foot directly on knee joint
        limb_status["foot_placement"] = "error"
        corrections.append("CAUTION: Move your foot off your knee joint! Place it on the inner thigh or calf.")
    elif foot_knee_diff < -0.06:
        # High on inner thigh (Classical perfection)
        score += 15
        limb_status["foot_placement"] = "perfect"
    elif foot_knee_diff > 0.04:
        # On inner calf (Beginner variation - acceptable)
        score += 12
        limb_status["foot_placement"] = "warning"
    else:
        score += 8
        limb_status["foot_placement"] = "warning"

    # ── Evaluate Arms & Hands (Anjali Mudra / Overhead) (Max 20 pts) ──
    shoulder_w = abs(ls['x'] - rs['x']) + 1e-5
    wrist_dist = np.hypot(lw['x'] - rw['x'], lw['y'] - rw['y'])
    wrist_dist_ratio = wrist_dist / shoulder_w
    hands_overhead = (lw['y'] < ls['y'] - 0.06) and (rw['y'] < rs['y'] - 0.06)
    hands_at_chest = (ls['y'] <= lw['y'] <= lh['y']) and (rs['y'] <= rw['y'] <= rh['y'])

    if hands_overhead and wrist_dist_ratio < 0.35:
        score += 20
        limb_status["arms"] = "perfect"
    elif hands_at_chest and wrist_dist_ratio < 0.25:
        score += 20
        limb_status["arms"] = "perfect"
    elif hands_overhead:
        score += 14
        limb_status["arms"] = "warning"
        corrections.append("Bring your palms together overhead into prayer position.")
    elif hands_at_chest:
        score += 14
        limb_status["arms"] = "warning"
        corrections.append("Press your palms firmly together at heart center (Anjali Mudra).")
    else:
        score += 5
        limb_status["arms"] = "error"
        corrections.append("Raise your hands overhead or join palms together at chest.")

    # ── Evaluate Torso & Spine Verticality (Max 10 pts) ──
    mid_shoulder = np.array([(ls['x'] + rs['x']) / 2.0, (ls['y'] + rs['y']) / 2.0])
    mid_hip = np.array([(lh['x'] + rh['x']) / 2.0, (lh['y'] + rh['y']) / 2.0])
    dx = mid_shoulder[0] - mid_hip[0]
    dy = mid_hip[1] - mid_shoulder[1]  # positive downwards in screen space
    spine_tilt = abs(np.degrees(np.arctan2(dx, dy + 1e-6)))

    if spine_tilt <= 8.0:
        score += 10
        limb_status["torso"] = "perfect"
    elif spine_tilt <= 15.0:
        score += 6
        limb_status["torso"] = "warning"
        corrections.append("Align your spine vertically; avoid leaning to the side.")
    else:
        score += 2
        limb_status["torso"] = "error"
        corrections.append("Your torso is leaning heavily. Stand tall and balance your core.")

    # Scale score with GPU confidence weight if GPU model classified the frame
    if gpu_prob is not None:
        if gpu_prob < 0.40 and score > 60:
            score = int(score * 0.85)

    is_perfect = (score >= 85)
    if is_perfect:
        status_text = "PERFECT VRIKSHASANA!"
        corrections = ["Excellent posture! Hold steady and breathe deeply."]
    elif score >= 65:
        status_text = "Good — Minor Alignment Needed"
    else:
        status_text = "Adjust Posture to Match Reference"

    return {
        "full_body_detected": True,
        "alignment_score": int(min(100, max(0, score))),
        "is_perfect": is_perfect,
        "status_text": status_text,
        "standing_side": standing_side,
        "standing_knee_angle": round(standing_knee_angle, 1),
        "bent_knee_angle": round(bent_knee_angle, 1),
        "corrections": corrections,
        "limb_status": limb_status
    }

@app.route("/vrikshasana_status", methods=["GET"])
def vrikshasana_status():
    """Return status of GPU Vrikshasana models and system capabilities."""
    gpu_devices = tf.config.list_physical_devices("GPU")
    return jsonify({
        "status": "ready",
        "gpu_available": len(gpu_devices) > 0,
        "gpu_name": gpu_devices[0].name if gpu_devices else "CPU",
        "device_target": "NVIDIA GeForce RTX 3050",
        "vrikshasana_gpu_model_loaded": vrikshasana_gpu_model is not None,
        "biomechanics_loaded": bool(biomechanics_data),
        "dataset_verified_images": 8000,
        "target_pose": "Vrikshasana (Tree Pose)"
    })

@app.route("/vrikshasana_reference", methods=["GET"])
def vrikshasana_reference():
    """Return the base64 reference pose image."""
    if REF_IMG_FILE.exists():
        try:
            img = Image.open(REF_IMG_FILE).convert("RGB")
            return jsonify({
                "available": True,
                "data_url": pil_to_dataurl(img, quality=90)
            })
        except Exception as e:
            return jsonify({"available": False, "error": str(e)}), 500
    return jsonify({"available": False, "error": "reference image missing"}), 404

@app.route("/vrikshasana_analyze", methods=["POST"])
def vrikshasana_analyze():
    """
    Main real-time video coaching endpoint.
    Accepts JSON with:
      - 'landmarks': 33 MediaPipe pose landmarks (x, y, z, visibility)
      - 'image' (optional): base64 video frame for RTX 3050 GPU classification
    """
    data = request.get_json(silent=True) or {}
    landmarks = data.get("landmarks", [])
    data_url = data.get("image", None)

    gpu_prob = None
    if data_url and vrikshasana_gpu_model:
        try:
            pil = dataurl_to_pil(data_url).resize(IMG_SIZE, Image.BILINEAR)
            arr = np.expand_dims(np.array(pil, dtype=np.float32) / 255.0, 0)
            pred = vrikshasana_gpu_model.predict(arr, verbose=0)
            gpu_prob = float(pred[0][0])
        except Exception as e:
            print("GPU frame prediction error:", e)

    # Evaluate biomechanics + GPU prediction
    result = evaluate_vrikshasana(landmarks, gpu_prob=gpu_prob)
    if gpu_prob is not None:
        result["gpu_confidence"] = round(gpu_prob * 100, 1)

    return jsonify(result)

if __name__ == "__main__":
    print(f"\nYogashirini Python Backend — EfficientNetB0 ({NUM_CLASSES} classes)")
    print("Starting on http://0.0.0.0:5000\n")
    app.run(host="0.0.0.0", port=5000, debug=False)