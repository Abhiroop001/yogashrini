"""
export_onnx.py — Production ONNX Exporter (tf2onnx, opset 13)
Exports both Yogashrini neural networks into compact opset-13 ONNX artifacts,
verifies float32 numerical parity against TensorFlow, and reports size savings.
"""

import os
import sys
import time
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

PY310_PYTHON = r"C:\Users\ABHIROOP\anaconda3\envs\py310\python.exe"
if os.path.exists(PY310_PYTHON) and os.path.normcase(sys.executable) != os.path.normcase(PY310_PYTHON):
    import subprocess
    sys.exit(subprocess.call([PY310_PYTHON, os.path.abspath(__file__)] + sys.argv[1:]))

import numpy as np
import tensorflow as tf
import tf2onnx
import onnxruntime as ort
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization, Input
from tensorflow.keras.models import Model, load_model

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
SAVED_MODELS = ROOT_DIR / "saved_models"

IMG_SIZE = (224, 224)
NUM_CLASSES = 47

VRIK_H5 = SAVED_MODELS / "vrikshasana_gpu_detector.h5"
VRIK_ONNX = SAVED_MODELS / "vrikshasana_gpu_detector.onnx"

EFF_WEIGHTS = SAVED_MODELS / "efficientnetb0_yoga.weights.h5"
EFF_ONNX = SAVED_MODELS / "efficientnetb0_yoga.onnx"


def verify_ort_parity(onnx_path: Path, sample_x: np.ndarray, tf_ref: np.ndarray, name: str):
    so = ort.SessionOptions()
    so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    so.intra_op_num_threads = 4
    so.inter_op_num_threads = 1
    so.add_session_config_entry("session.intra_op.allow_spinning", "0")

    sess = ort.InferenceSession(str(onnx_path), sess_options=so, providers=["CPUExecutionProvider"])
    inp_name = sess.get_inputs()[0].name

    for _ in range(10):
        out = sess.run(None, {inp_name: sample_x})[0]
    t0 = time.perf_counter()
    for _ in range(60):
        out = sess.run(None, {inp_name: sample_x})[0]
    dt = time.perf_counter() - t0

    max_diff = float(np.max(np.abs(out - tf_ref)))
    avg_ms = (dt / 60.0) * 1000.0
    print(f"[PARITY] {name}: max_abs_diff={max_diff:.2e} | CPU ONNX (4 threads)={avg_ms:.2f} ms ({60.0 / dt:.1f} FPS)")
    return max_diff, avg_ms


def export_vrikshasana():
    if not VRIK_H5.exists():
        print(f"[SKIP] Missing {VRIK_H5}")
        return
    print(f"[1/2] Exporting {VRIK_H5.name} -> {VRIK_ONNX.name} (opset 13)...")
    model = load_model(str(VRIK_H5), compile=False)
    model.trainable = False

    sample_x = np.random.RandomState(42).rand(1, *IMG_SIZE, 3).astype(np.float32)
    with tf.device("/CPU:0"):
        tf_ref = model(sample_x, training=False).numpy()

    @tf.function(input_signature=[tf.TensorSpec((1, *IMG_SIZE, 3), tf.float32, name="input")])
    def _serving_fn(t):
        return model(t, training=False)

    tf2onnx.convert.from_function(
        _serving_fn,
        input_signature=(tf.TensorSpec((1, *IMG_SIZE, 3), tf.float32, name="input"),),
        opset=13,
        output_path=str(VRIK_ONNX),
    )

    h5_mb = VRIK_H5.stat().st_size / 1e6
    onnx_mb = VRIK_ONNX.stat().st_size / 1e6
    pct_smaller = (1.0 - onnx_mb / h5_mb) * 100.0
    print(f"       Size: {h5_mb:.2f} MB (.h5) -> {onnx_mb:.2f} MB (.onnx) [{pct_smaller:.1f}% smaller]")
    verify_ort_parity(VRIK_ONNX, sample_x, tf_ref, "Vrikshasana Detector")


def export_efficientnet():
    if not EFF_WEIGHTS.exists():
        print(f"[SKIP] Missing {EFF_WEIGHTS}")
        return
    print(f"[2/2] Exporting EfficientNetB0 + {EFF_WEIGHTS.name} -> {EFF_ONNX.name} (opset 13)...")
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
    model = Model(inputs=inputs, outputs=outputs)
    model.load_weights(str(EFF_WEIGHTS))
    model.trainable = False

    sample_x = np.random.RandomState(7).uniform(0.0, 255.0, (1, *IMG_SIZE, 3)).astype(np.float32)
    with tf.device("/CPU:0"):
        tf_ref = model(sample_x, training=False).numpy()

    tf2onnx.convert.from_keras(
        model,
        input_signature=(tf.TensorSpec((1, *IMG_SIZE, 3), tf.float32, name="input_1"),),
        opset=13,
        output_path=str(EFF_ONNX),
    )

    w_mb = EFF_WEIGHTS.stat().st_size / 1e6
    onnx_mb = EFF_ONNX.stat().st_size / 1e6
    print(f"       Size: {w_mb:.2f} MB (weights.h5) -> {onnx_mb:.2f} MB (self-contained .onnx)")
    verify_ort_parity(EFF_ONNX, sample_x, tf_ref, "EfficientNetB0 (47-class)")


if __name__ == "__main__":
    for g in tf.config.list_physical_devices("GPU"):
        tf.config.experimental.set_memory_growth(g, True)
    export_vrikshasana()
    export_efficientnet()
    print("\n[DONE] Production ONNX opset-13 artifacts ready in saved_models/.")
