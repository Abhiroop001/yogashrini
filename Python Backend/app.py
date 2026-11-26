# app.py — Yogashrini Python Vision Backend
# Production Engine: ONNX Runtime (tf2onnx opset 13) with optional TensorFlow RTX 3050 XLA fallback
import os, sys, socket

def _port_5000_already_active() -> bool:
    """Prevent launching duplicate server instances on port 5000."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex(("127.0.0.1", 5000)) == 0

if os.environ.get("ALLOW_MULTI_GPU_WORKER") != "1" and _port_5000_already_active():
    print("[*] Yogashirini AI Backend is ALREADY running on http://127.0.0.1:5000 — skipping duplicate startup.")
    sys.exit(0)

# ── Dynamic Environment Auto-Routing ─────────────────────────────────────────
PY310_PYTHON = r"C:\Users\ABHIROOP\anaconda3\envs\py310\python.exe"
if os.path.exists(PY310_PYTHON) and os.path.normcase(sys.executable) != os.path.normcase(PY310_PYTHON):
    import subprocess
    print(f"[*] Detected Python: {sys.executable}")
    print("[*] Auto-switching to dedicated py310 AI environment...")
    try:
        args = [PY310_PYTHON, os.path.abspath(__file__)] + [a for a in sys.argv[1:] if a != "-c"]
        sys.exit(subprocess.call(args))
    except KeyboardInterrupt:
        sys.exit(0)

import io, json, base64, tempfile, time, threading, subprocess
from pathlib import Path

os.environ["MPLCONFIGDIR"] = str(Path(tempfile.gettempdir()) / "matplotlib")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageDraw
import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

try:
    import onnxruntime as ort
except ImportError:
    ort = None

# ── Paths & Config ────────────────────────────────────────────────────────────
BASE_DIR               = Path(__file__).resolve().parent
ROOT_DIR               = BASE_DIR.parent
WEIGHTS_FILE           = ROOT_DIR / "saved_models" / "efficientnetb0_yoga.weights.h5"
EFF_ONNX_FILE          = ROOT_DIR / "saved_models" / "efficientnetb0_yoga.onnx"
CLASS_JSON             = ROOT_DIR / "saved_models" / "class_names.json"
VRIKSHASANA_MODEL_FILE = ROOT_DIR / "saved_models" / "vrikshasana_gpu_detector.h5"
VRIKSHASANA_ONNX_FILE  = ROOT_DIR / "saved_models" / "vrikshasana_gpu_detector.onnx"
BIOMECHANICS_FILE      = ROOT_DIR / "saved_models" / "vrikshasana_biomechanics.json"
REF_IMG_FILE           = ROOT_DIR / "Dataset_Vrikshasana_CV" / "reference_pose.jpg"

IMG_SIZE    = (224, 224)
NUM_CLASSES = 47
ENGINE_PREF = os.environ.get("YOGASHRINI_BACKEND_ENGINE", "auto").strip().lower()
USE_ORT_CUDA = os.environ.get("YOGASHRINI_ONNX_CUDA", "0").strip() == "1"

INFERENCE_LOCK = threading.Lock()
_VRAM_CACHE = {
    "ts": 0.0,
    "data": {
        "gpu_name": "NVIDIA GeForce RTX 3050 Laptop GPU",
        "vram_total_mb": None,
        "vram_used_mb": None,
        "vram_free_mb": None,
    },
}

def get_vram_stats(force: bool = False) -> dict:
    """Query cached RTX 3050 VRAM stats via nvidia-smi (zero TensorFlow allocation required)."""
    now = time.time()
    if not force and (now - _VRAM_CACHE["ts"] < 2.0):
        return _VRAM_CACHE["data"]
    try:
        out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name,memory.total,memory.used,memory.free", "--format=csv,noheader,nounits"],
            timeout=2.5,
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip().splitlines()[0]
        parts = [p.strip() for p in out.split(",")]
        if len(parts) == 4:
            _VRAM_CACHE["data"] = {
                "gpu_name": parts[0],
                "vram_total_mb": int(parts[1]),
                "vram_used_mb": int(parts[2]),
                "vram_free_mb": int(parts[3]),
            }
            _VRAM_CACHE["ts"] = now
    except Exception:
        pass
    return _VRAM_CACHE["data"]

# Detect GPU hardware presence immediately via nvidia-smi without allocating VRAM
_initial_vram = get_vram_stats(force=True)
HAS_RTX_HW = _initial_vram.get("vram_total_mb") is not None

# ── Load class names & biomechanics ───────────────────────────────────────────
if not CLASS_JSON.exists():
    print("ERROR: class_names.json not found"); sys.exit(1)
class_names = json.loads(CLASS_JSON.read_text(encoding="utf-8"))
print(f"Classes loaded: {len(class_names)}")

biomechanics_data = {}
if BIOMECHANICS_FILE.exists():
    try:
        biomechanics_data = json.loads(BIOMECHANICS_FILE.read_text(encoding="utf-8"))
        print("Vrikshasana biomechanics alignment rules loaded.")
    except Exception as e:
        print("[!] Warning: Could not load biomechanics JSON:", e)

# ── Model Runners (Production ONNX Primary, TensorFlow XLA Fallback) ──────────
def create_onnx_runner(onnx_path: Path, name: str, sample_value: float = 0.5):
    """Build tuned ONNX Runtime session (opset 13), auto-selecting fastest thread count."""
    sample_x = np.full((1, *IMG_SIZE, 3), sample_value, dtype=np.float32)

    if USE_ORT_CUDA and "CUDAExecutionProvider" in ort.get_available_providers():
        so = ort.SessionOptions()
        so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        sess = ort.InferenceSession(
            str(onnx_path),
            sess_options=so,
            providers=[("CUDAExecutionProvider", {"device_id": 0, "cudnn_conv_algo_search": "HEURISTIC"}), "CPUExecutionProvider"],
        )
        inp_name = sess.get_inputs()[0].name
        for _ in range(5):
            sess.run(None, {inp_name: sample_x})
        t0 = time.perf_counter()
        for _ in range(20):
            sess.run(None, {inp_name: sample_x})
        ms = round(((time.perf_counter() - t0) / 20.0) * 1000.0, 2)
        provider_label = f"ONNX Runtime {sess.get_providers()[0]} (opset 13)"
        print(f"[ONNX] {name}: {provider_label} ({ms} ms/frame, {round(1000.0/max(ms,0.01),1)} FPS)")
        return (lambda batch: sess.run(None, {inp_name: batch})[0]), provider_label, ms

    best_bundle = None
    best_ms = float("inf")
    for threads in (4, 8):
        so = ort.SessionOptions()
        so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        so.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        so.intra_op_num_threads = threads
        so.inter_op_num_threads = 1
        so.add_session_config_entry("session.intra_op.allow_spinning", "0")
        sess = ort.InferenceSession(str(onnx_path), sess_options=so, providers=["CPUExecutionProvider"])
        inp_name = sess.get_inputs()[0].name
        for _ in range(6):
            sess.run(None, {inp_name: sample_x})
        t0 = time.perf_counter()
        for _ in range(20):
            sess.run(None, {inp_name: sample_x})
        ms = ((time.perf_counter() - t0) / 20.0) * 1000.0
        if ms < best_ms:
            best_ms = ms
            best_bundle = (sess, inp_name, threads)

    sess, inp_name, win_threads = best_bundle
    ms = round(best_ms, 2)
    size_mb = round(onnx_path.stat().st_size / 1e6, 2)
    provider_label = f"ONNX Opset-13 ({win_threads}T CPU | {size_mb} MB)"
    print(f"[ONNX] {name}: {provider_label} -> {ms} ms/frame ({round(1000.0/max(ms,0.01),1)} FPS)")
    return (lambda batch, _s=sess, _k=inp_name: _s.run(None, {_k: batch})[0]), provider_label, ms


def init_models():
    """Initialize EfficientNetB0 (47-class) and Vrikshasana detector."""
    use_onnx = (
        ENGINE_PREF in ("auto", "onnx", "onnx_cpu", "onnx_cuda")
        and ort is not None
        and EFF_ONNX_FILE.exists()
        and VRIKSHASANA_ONNX_FILE.exists()
    )

    if use_onnx:
        eff_fn, eff_prov, eff_ms = create_onnx_runner(EFF_ONNX_FILE, "EfficientNetB0 (47-class)", sample_value=127.5)
        vrik_fn, vrik_prov, vrik_ms = create_onnx_runner(VRIKSHASANA_ONNX_FILE, "Vrikshasana Detector", sample_value=0.5)
        return eff_fn, eff_prov, eff_ms, vrik_fn, vrik_prov, vrik_ms, "ONNX Runtime (tf2onnx opset 13)"

    # Lazy TensorFlow fallback when ENGINE_PREF=tf_gpu or .onnx artifacts are missing
    _nvcc_dir = Path(sys.prefix) / "Lib" / "site-packages" / "nvidia" / "cuda_nvcc"
    if (_nvcc_dir / "nvvm" / "libdevice" / "libdevice.10.bc").exists():
        os.environ["XLA_FLAGS"] = f"--xla_gpu_cuda_data_dir={str(_nvcc_dir).replace(chr(92), '/')}"

    import tensorflow as tf
    from tensorflow.keras.applications import EfficientNetB0
    from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization, Input
    from tensorflow.keras.models import Model, load_model

    gpus = tf.config.list_physical_devices("GPU")
    has_tf_gpu = bool(gpus)
    if gpus:
        for g in gpus:
            try:
                tf.config.set_logical_device_configuration(g, [tf.config.LogicalDeviceConfiguration(memory_limit=1152)])
            except Exception:
                tf.config.experimental.set_memory_growth(g, True)

    def _tf_runner(model_obj, name: str, sample_value: float, use_xla: bool):
        model_obj.trainable = False
        dev = "/GPU:0" if has_tf_gpu else "/CPU:0"
        sample_np = np.full((1, *IMG_SIZE, 3), sample_value, dtype=np.float32)
        fn = tf.function(
            lambda t: model_obj(t, training=False),
            input_signature=[tf.TensorSpec(shape=(1, *IMG_SIZE, 3), dtype=tf.float32)],
            jit_compile=bool(has_tf_gpu and use_xla and _nvcc_dir.exists()),
        )
        with tf.device(dev):
            for _ in range(3):
                _ = fn(sample_np).numpy()
            t0 = time.perf_counter()
            for _ in range(5):
                _ = fn(sample_np).numpy()
            ms = round(((time.perf_counter() - t0) / 5.0) * 1000.0, 2)
        prov = ("RTX 3050 XLA GPU" if (has_tf_gpu and use_xla) else ("RTX 3050 Direct GPU" if has_tf_gpu else "TF CPU"))
        return (lambda b, _fn=fn, _d=dev: _run_tf_dev(_fn, _d, b, tf)), prov, ms

    def _run_tf_dev(fn, dev, batch, tf_mod):
        with tf_mod.device(dev):
            return fn(batch).numpy()

    inputs = Input(shape=(*IMG_SIZE, 3))
    base_model = EfficientNetB0(weights="imagenet", include_top=False, input_tensor=inputs)
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
    keras_model.load_weights(str(WEIGHTS_FILE))
    eff_fn, eff_prov, eff_ms = _tf_runner(keras_model, "EfficientNetB0", 127.5, False)

    vrik_fn, vrik_prov, vrik_ms = (None, "Unavailable", None)
    if VRIKSHASANA_MODEL_FILE.exists():
        vm = load_model(str(VRIKSHASANA_MODEL_FILE), compile=False)
        vrik_fn, vrik_prov, vrik_ms = _tf_runner(vm, "Vrikshasana Detector", 0.5, True)

    return eff_fn, eff_prov, eff_ms, vrik_fn, vrik_prov, vrik_ms, "TensorFlow 2.10 Fallback"


(
    efficientnet_runner,
    EFFICIENTNET_PROVIDER,
    EFFICIENTNET_WARMUP_MS,
    vrikshasana_runner,
    VRIKSHASANA_PROVIDER,
    VRIKSHASANA_WARMUP_MS,
    RUNTIME_ENGINE,
) = init_models()

VRIK_ARTIFACT_MB = round(
    (VRIKSHASANA_ONNX_FILE if VRIKSHASANA_ONNX_FILE.exists() else VRIKSHASANA_MODEL_FILE).stat().st_size / 1e6, 2
)
EFF_ARTIFACT_MB = round(
    (EFF_ONNX_FILE if EFF_ONNX_FILE.exists() else WEIGHTS_FILE).stat().st_size / 1e6, 2
)

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ── Helpers ───────────────────────────────────────────────────────────────────
def decode_dataurl_bytes(dataurl: str) -> bytes:
    encoded = dataurl.split(",", 1)[1] if "," in dataurl else dataurl
    return base64.b64decode(encoded)

def dataurl_to_pil(dataurl: str) -> Image.Image:
    return Image.open(io.BytesIO(decode_dataurl_bytes(dataurl))).convert("RGB")

def decode_rgb_batch(raw_bytes: bytes, size=IMG_SIZE, scale=None) -> np.ndarray:
    """Fast vectorized decode + resize (cv2 preferred) into float32 (1, H, W, 3) batch."""
    if cv2 is not None:
        buf = np.frombuffer(raw_bytes, dtype=np.uint8)
        bgr = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if bgr is not None:
            resized = cv2.resize(bgr, size, interpolation=cv2.INTER_LINEAR)
            rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
            arr = np.ascontiguousarray(rgb, dtype=np.float32)
            if scale is not None:
                arr *= np.float32(scale)
            return np.expand_dims(arr, 0)
    pil = Image.open(io.BytesIO(raw_bytes)).convert("RGB").resize(size, Image.BILINEAR)
    arr = np.asarray(pil, dtype=np.float32)
    if scale is not None:
        arr = arr * np.float32(scale)
    return np.ascontiguousarray(np.expand_dims(arr, 0))

def execute_inference(runner_fn, batch_np: np.ndarray):
    """Run thread-safe inference and return (numpy_output, latency_ms)."""
    t0 = time.perf_counter()
    with INFERENCE_LOCK:
        out = runner_fn(batch_np)
    ms = round((time.perf_counter() - t0) * 1000.0, 2)
    return out, ms

def pil_to_dataurl(img: Image.Image, quality: int = 85) -> str:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

def annotate_image(pil_img: Image.Image, label: str, score: float, top5: list) -> Image.Image:
    """Draw prediction overlay on a copy of the image."""
    img = pil_img.copy().convert("RGB")
    draw = ImageDraw.Draw(img)
    W, H = img.size

    bar_h = max(36, H // 12)
    draw.rectangle([(0, 0), (W, bar_h)], fill=(0, 0, 0, 180))
    draw.text((8, 6), f"{label}  {score*100:.1f}%", fill=(0, 255, 120))

    strip_h = max(10, H // 18)
    y0 = H - strip_h * len(top5) - 4
    draw.rectangle([(0, y0 - 4), (W, H)], fill=(0, 0, 0, 160))
    for i, (cls, prob) in enumerate(top5):
        col = (0, 255, 120) if i == 0 else (200, 200, 200)
        draw.text((8, y0 + i * strip_h), f"{i+1}. {cls}: {prob*100:.1f}%", fill=col)

    return img

# ── Prediction ────────────────────────────────────────────────────────────────
def run_predict(x_batch: np.ndarray):
    out, infer_ms = execute_inference(efficientnet_runner, x_batch)
    probs = out[0]
    top5_idx = np.argsort(probs)[-5:][::-1]
    top5 = [(class_names[i], float(probs[i])) for i in top5_idx]
    label, score = top5[0]
    return label, score, top5, probs, infer_ms

# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": "EfficientNetB0",
        "classes": NUM_CLASSES,
        "accuracy": "84.96%",
        "runtime_engine": RUNTIME_ENGINE,
        "artifact_size_mb": EFF_ARTIFACT_MB,
        "gpu_available": HAS_RTX_HW,
        "execution_provider": EFFICIENTNET_PROVIDER,
        "warmup_ms": EFFICIENTNET_WARMUP_MS,
        "vram": get_vram_stats(),
    })

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    if not data or "image" not in data:
        return jsonify({"error": "no image provided"}), 400

    try:
        raw_bytes = decode_dataurl_bytes(data["image"])
        x_batch = decode_rgb_batch(raw_bytes, size=IMG_SIZE, scale=None)
    except Exception as e:
        return jsonify({"error": "invalid image data", "detail": str(e)}), 400

    try:
        label, score, top5, _probs, infer_ms = run_predict(x_batch)
    except Exception as e:
        print("Inference error:", repr(e))
        return jsonify({"error": "inference_failed", "detail": str(e)}), 500

    try:
        pil = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        annotated_pil = annotate_image(pil, label, score, top5)
        annotated_url = pil_to_dataurl(annotated_pil, quality=82)
    except Exception:
        annotated_url = None

    return jsonify({
        "label"              : label,
        "score"              : score,
        "confidence_pct"     : round(score * 100, 2),
        "top5"               : [{"label": c, "score": round(p, 4)} for c, p in top5],
        "keypoints"          : [],
        "annotated_image"    : annotated_url,
        "inference_ms"       : infer_ms,
        "gpu_inference_ms"   : infer_ms,
        "gpu_fps"            : round(1000.0 / max(infer_ms, 0.01), 1),
        "execution_provider" : EFFICIENTNET_PROVIDER,
        "runtime_engine"     : RUNTIME_ENGINE,
    })

@app.route("/classes", methods=["GET"])
def get_classes():
    """Return all 47 class names."""
    return jsonify({"classes": class_names, "count": len(class_names)})

# ── Vrikshasana Alignment & Biomechanics Engine ───────────────────────────────
def calc_angle(a, b, c):
    """Calculate 2D angle ABC with vertex at B (in degrees)."""
    try:
        ba = np.array([a["x"] - b["x"], a["y"] - b["y"]])
        bc = np.array([c["x"] - b["x"], c["y"] - b["y"]])
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
    Evaluates MediaPipe landmarks (33 normalized points {x, y, z, visibility})
    against the verified Vrikshasana biomechanical rubric.
    """
    corrections = []
    limb_status = {}
    score = 0

    required_indices = {
        "nose": 0, "left_shoulder": 11, "right_shoulder": 12,
        "left_elbow": 13, "right_elbow": 14, "left_wrist": 15, "right_wrist": 16,
        "left_hip": 23, "right_hip": 24, "left_knee": 25, "right_knee": 26,
        "left_ankle": 27, "right_ankle": 28,
    }

    if not landmarks or len(landmarks) < 29:
        return {
            "full_body_detected": False,
            "alignment_score": 0,
            "is_perfect": False,
            "status_text": "No Skeleton Detected",
            "corrections": ["Please position yourself in front of the camera."],
            "limb_status": {},
        }

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
            "corrections": ["Step back so your entire body (head, arms, and feet) is visible in the frame."],
            "limb_status": {k: "error" for k in ["standing_leg", "bent_leg", "arms", "torso"]},
        }

    ls, rs = landmarks[11], landmarks[12]
    lw, rw = landmarks[15], landmarks[16]
    lh, rh = landmarks[23], landmarks[24]
    lk, rk = landmarks[25], landmarks[26]
    la, ra = landmarks[27], landmarks[28]

    left_knee_angle = calc_angle(lh, lk, la)
    right_knee_angle = calc_angle(rh, rk, ra)

    if left_knee_angle >= right_knee_angle:
        standing_side, standing_knee_angle = "left", left_knee_angle
        bent_side, bent_knee_angle = "right", right_knee_angle
        standing_knee, bent_knee, bent_ankle = lk, rk, ra
    else:
        standing_side, standing_knee_angle = "right", right_knee_angle
        bent_side, bent_knee_angle = "left", left_knee_angle
        standing_knee, bent_knee, bent_ankle = rk, lk, la

    # A) Standing Leg (Max 25 pts)
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

    # B) Bent Leg & Knee Abduction (Max 30 pts)
    bent_score = 0
    if 25.0 <= bent_knee_angle <= 75.0:
        bent_score += 18
    elif 75.0 < bent_knee_angle <= 100.0:
        bent_score += 10
        corrections.append(f"Bend your lifted ({bent_side}) knee higher toward your hip.")
    else:
        corrections.append(f"Lift and bend your ({bent_side}) leg into Tree Pose.")

    knee_offset = abs(bent_knee["x"] - standing_knee["x"])
    if knee_offset >= 0.09:
        bent_score += 12
    elif knee_offset >= 0.05:
        bent_score += 7
        corrections.append("Open your bent knee wider to the side (abduct the hip).")
    else:
        corrections.append("Do not point bent knee forward; open it sideways like branches of a tree.")

    score += bent_score
    limb_status["bent_leg"] = "perfect" if bent_score >= 26 else ("warning" if bent_score >= 15 else "error")

    # C) Foot Placement & Knee Joint Protection (Max 15 pts)
    foot_knee_diff = bent_ankle["y"] - standing_knee["y"]
    if abs(foot_knee_diff) < 0.04:
        limb_status["foot_placement"] = "error"
        corrections.append("CAUTION: Move your foot off your knee joint! Place it on the inner thigh or calf.")
    elif foot_knee_diff < -0.06:
        score += 15
        limb_status["foot_placement"] = "perfect"
    elif foot_knee_diff > 0.04:
        score += 12
        limb_status["foot_placement"] = "warning"
    else:
        score += 8
        limb_status["foot_placement"] = "warning"

    # D) Arms & Hands (Max 20 pts)
    shoulder_w = abs(ls["x"] - rs["x"]) + 1e-5
    wrist_dist = np.hypot(lw["x"] - rw["x"], lw["y"] - rw["y"])
    wrist_dist_ratio = wrist_dist / shoulder_w
    hands_overhead = (lw["y"] < ls["y"] - 0.06) and (rw["y"] < rs["y"] - 0.06)
    hands_at_chest = (ls["y"] <= lw["y"] <= lh["y"]) and (rs["y"] <= rw["y"] <= rh["y"])

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

    # E) Torso & Spine Verticality (Max 10 pts)
    mid_shoulder = np.array([(ls["x"] + rs["x"]) / 2.0, (ls["y"] + rs["y"]) / 2.0])
    mid_hip = np.array([(lh["x"] + rh["x"]) / 2.0, (lh["y"] + rh["y"]) / 2.0])
    dx = mid_shoulder[0] - mid_hip[0]
    dy = mid_hip[1] - mid_shoulder[1]
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

    if gpu_prob is not None and gpu_prob < 0.40 and score > 60:
        score = int(score * 0.85)

    is_perfect = score >= 85
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
        "limb_status": limb_status,
    }

@app.route("/vrikshasana_status", methods=["GET"])
def vrikshasana_status():
    """Return status of Vrikshasana ONNX / GPU models and system capabilities."""
    vram = get_vram_stats(force=True)
    return jsonify({
        "status": "ready",
        "runtime_engine": RUNTIME_ENGINE,
        "artifact_format": "ONNX opset 13" if "ONNX" in RUNTIME_ENGINE else "Keras HDF5",
        "artifact_size_mb": VRIK_ARTIFACT_MB,
        "gpu_available": HAS_RTX_HW,
        "gpu_name": vram.get("gpu_name") or "CPU",
        "device_target": "NVIDIA GeForce RTX 3050",
        "execution_provider": VRIKSHASANA_PROVIDER,
        "warmup_ms": VRIKSHASANA_WARMUP_MS,
        "target_fps_capable": round(1000.0 / max(VRIKSHASANA_WARMUP_MS or 20.0, 0.01), 1),
        "vram": vram,
        "vrikshasana_gpu_model_loaded": vrikshasana_runner is not None,
        "biomechanics_loaded": bool(biomechanics_data),
        "dataset_verified_images": 8000,
        "target_pose": "Vrikshasana (Tree Pose)",
    })

@app.route("/vrikshasana_reference", methods=["GET"])
def vrikshasana_reference():
    """Return the base64 reference pose image."""
    if REF_IMG_FILE.exists():
        try:
            img = Image.open(REF_IMG_FILE).convert("RGB")
            return jsonify({"available": True, "data_url": pil_to_dataurl(img, quality=90)})
        except Exception as e:
            return jsonify({"available": False, "error": str(e)}), 500
    return jsonify({"available": False, "error": "reference image missing"}), 404

@app.route("/vrikshasana_analyze", methods=["POST"])
def vrikshasana_analyze():
    """Real-time video coaching endpoint evaluating MediaPipe landmarks + ONNX CNN score."""
    t_req0 = time.perf_counter()
    data = request.get_json(silent=True) or {}
    landmarks = data.get("landmarks", [])
    data_url = data.get("image", None)

    gpu_prob = None
    infer_ms = None
    if data_url and vrikshasana_runner:
        try:
            raw_bytes = decode_dataurl_bytes(data_url)
            arr = decode_rgb_batch(raw_bytes, size=IMG_SIZE, scale=1.0 / 255.0)
            pred, infer_ms = execute_inference(vrikshasana_runner, arr)
            gpu_prob = float(pred[0][0])
        except Exception as e:
            print("Frame inference error:", e)

    result = evaluate_vrikshasana(landmarks, gpu_prob=gpu_prob)
    if gpu_prob is not None:
        result["gpu_confidence"] = round(gpu_prob * 100, 1)
    if infer_ms is not None:
        result["inference_ms"] = infer_ms
        result["gpu_inference_ms"] = infer_ms
        result["gpu_fps"] = round(1000.0 / max(infer_ms, 0.01), 1)
    result["server_total_ms"] = round((time.perf_counter() - t_req0) * 1000.0, 2)
    result["execution_provider"] = VRIKSHASANA_PROVIDER
    result["runtime_engine"] = RUNTIME_ENGINE
    result["vram"] = _VRAM_CACHE["data"]

    return jsonify(result)

if __name__ == "__main__":
    print(f"\nYogashirini Python Backend — {RUNTIME_ENGINE} ({NUM_CLASSES} classes)")
    print(f"EfficientNetB0: {EFFICIENTNET_PROVIDER} | Vrikshasana: {VRIKSHASANA_PROVIDER}")
    print("Starting on http://0.0.0.0:5000 (Threaded=True)\n", flush=True)
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True, use_reloader=False)
